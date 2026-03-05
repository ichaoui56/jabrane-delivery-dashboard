import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    
    // Get current delivery man data
    const deliveryManData = await prisma.deliveryMan.findUnique({
      where: { id: deliveryMan.id },
      select: {
        id: true,
        totalEarned: true,
        pendingEarnings: true,
        collectedCOD: true,
        pendingCOD: true,
        baseFee: true,
        totalDeliveries: true,
        successfulDeliveries: true,
      }
    })

    if (!deliveryManData) {
      return jsonError("Delivery man not found", 404)
    }

    // Get detailed COD orders data
    const codOrders = await prisma.order.findMany({
      where: {
        deliveryManId: deliveryMan.id,
        status: "DELIVERED",
        paymentMethod: "COD"
      },
      select: {
        id: true,
        orderCode: true,
        totalPrice: true,
        deliveredAt: true,
        customerName: true,
        customerPhone: true,
        address: true,
        merchant: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { deliveredAt: 'desc' },
      take: 50 // Limit to recent 50 orders for performance
    })

    // Get recent delivered orders (all payment methods) for earnings calculation
    const deliveredOrders = await prisma.order.findMany({
      where: {
        deliveryManId: deliveryMan.id,
        status: "DELIVERED"
      },
      select: {
        id: true,
        orderCode: true,
        totalPrice: true,
        paymentMethod: true,
        deliveredAt: true,
        merchantEarning: true
      },
      orderBy: { deliveredAt: 'desc' },
      take: 50
    })

    // Calculate statistics
    const totalCODAmount = codOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const totalEarningsFromOrders = deliveredOrders.length * deliveryManData.baseFee
    const codOrdersCount = codOrders.length

    // Get money transfers history
    const moneyTransfers = await prisma.moneyTransfer.findMany({
      where: {
        deliveryManId: deliveryMan.id
      },
      select: {
        id: true,
        amount: true,
        transferDate: true,
        note: true,
        reference: true
      },
      orderBy: { transferDate: 'desc' },
      take: 20
    })

    const totalTransferred = moneyTransfers.reduce((sum, transfer) => sum + transfer.amount, 0)

    // Calculate available balance (pending earnings - transferred)
    const availableBalance = deliveryManData.pendingEarnings - totalTransferred

    const financeData = {
      // Current financial status
      currentStatus: {
        totalEarned: deliveryManData.totalEarned,
        pendingEarnings: deliveryManData.pendingEarnings,
        collectedCOD: deliveryManData.collectedCOD,
        pendingCOD: deliveryManData.pendingCOD,
        availableBalance: Math.max(0, availableBalance),
        baseFee: deliveryManData.baseFee
      },

      // Delivery statistics
      statistics: {
        totalDeliveries: deliveryManData.totalDeliveries,
        successfulDeliveries: deliveryManData.successfulDeliveries,
        codOrdersCount: codOrdersCount,
        totalCODAmount: totalCODAmount,
        totalEarningsFromOrders: totalEarningsFromOrders,
        totalTransferred: totalTransferred
      },

      // Recent COD orders
      recentCODOrders: codOrders.map(order => ({
        id: order.id,
        orderCode: order.orderCode,
        totalPrice: order.totalPrice,
        deliveredAt: order.deliveredAt,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        merchantName: order.merchant.user.name
      })),

      // Recent delivered orders
      recentDeliveredOrders: deliveredOrders.map(order => ({
        id: order.id,
        orderCode: order.orderCode,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        deliveredAt: order.deliveredAt,
        merchantEarning: order.merchantEarning
      })),

      // Money transfers history
      moneyTransfers: moneyTransfers.map(transfer => ({
        id: transfer.id,
        amount: transfer.amount,
        transferDate: transfer.transferDate,
        note: transfer.note,
        reference: transfer.reference
      }))
    }

    return jsonOk({
      success: true,
      data: financeData
    })

  } catch (error) {
    console.error("[Mobile API] Error fetching finance data:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return jsonError("Unauthorized", 401)
    }
    return jsonError("Internal server error", 500)
  }
}
