import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"
import { OrderStatus } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)

    const url = new URL(request.url)
    const takeParam = url.searchParams.get("take")
    const skipParam = url.searchParams.get("skip")
    const statusFilter = url.searchParams.get("status")
    
    const take = takeParam ? Number.parseInt(takeParam, 10) : 50
    const skip = skipParam ? Number.parseInt(skipParam, 10) : 0
    const limitedTake = Number.isFinite(take) ? Math.min(Math.max(take, 1), 100) : 50

    // Define status mapping for frontend
    const statusMap: Record<string, OrderStatus[]> = {
      "all": ["ACCEPTED", "ASSIGNED_TO_DELIVERY", "DELIVERED", "DELAYED", "REJECTED", "CANCELLED"],
      "delivered": ["DELIVERED"],
      "DELAYED": ["DELAYED"],
      "cancelled": ["CANCELLED", "REJECTED"]
    }

    const statuses = statusFilter && statusMap[statusFilter] 
      ? statusMap[statusFilter] 
      : ["DELIVERED", "DELAYED", "CANCELLED", "REJECTED"] as OrderStatus[]

    // Only show orders assigned to this delivery man
    const orders = await prisma.order.findMany({
      where: {
        deliveryManId: deliveryMan.id,
        status: { in: statuses }
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                sku: true,
              },
            },
          },
        },
        merchant: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        deliveryMan: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        deliveryAttemptHistory: {
          orderBy: { attemptedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limitedTake,
      skip: skip,
    })

    const formattedOrders = orders.map(order => {
      const itemsCount = order.orderItems.reduce((sum: number, item) => sum + item.quantity, 0)
      const deliveryTime = order.deliveryAttemptHistory[0]?.attemptedAt?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      
      return {
        id: order.id,
        orderId: order.id,
        orderCode: order.orderCode,
        customerName: order.customerName,
        deliveryAddress: order.address,
        city: order.city,
        status: getFrontendStatus(order.status),
        date: order.createdAt.toISOString().split('T')[0],
        amount: `$${order.totalPrice.toFixed(2)}`,
        totalPrice: order.totalPrice,
        itemsCount: itemsCount,
        deliveryTime: deliveryTime,
        note: order.note || '',
        customerPhone: order.customerPhone,
        paymentMethod: order.paymentMethod,
        merchant: order.merchant,
        orderItems: order.orderItems,
        createdAt: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString() || null,
      }
    })

    return jsonOk({ 
      orders: formattedOrders,
      hasMore: orders.length === limitedTake,
      totalCount: formattedOrders.length
    })
  } catch (error) {
    console.error("Error fetching order history:", error)
    return jsonError("Failed to fetch order history", 500)
  }
}

function getFrontendStatus(backendStatus: OrderStatus): string {
  switch (backendStatus) {
    case "DELIVERED": return "Delivered"
    case "DELAYED": return "Delayed"
    case "CANCELLED":
    case "REJECTED": return "Cancelled"
    case "ACCEPTED":
    case "ASSIGNED_TO_DELIVERY": return "In Progress"
    default: return "Pending"
  }
}