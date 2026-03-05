import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)

    const url = new URL(request.url)
    const takeParam = url.searchParams.get("take")
    const take = takeParam ? Number.parseInt(takeParam, 10) : 100
    const limitedTake = Number.isFinite(take) ? Math.min(Math.max(take, 1), 100) : 100

    // Only show orders assigned to this delivery man
    const orders = await prisma.order.findMany({
      where: {
        deliveryManId: deliveryMan.id,
        // Exclude PENDING status (only show orders that admin has accepted)
        status: {
          in: ["ACCEPTED", "ASSIGNED_TO_DELIVERY", "DELIVERED", "DELAYED", "REJECTED", "CANCELLED"],
        },
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
      },
      orderBy: { createdAt: "desc" },
      take: limitedTake,
    })

    return jsonOk({ orders })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}