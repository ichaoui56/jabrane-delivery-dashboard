import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    if (!Number.isFinite(orderId)) return jsonError("Not found", 404)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, sku: true },
            },
          },
        },
        city: true,
        // Include delivery notes (non-private or private notes created by this delivery man)
        deliveryNotes: {
          where: {
            OR: [
              { isPrivate: false },
              { 
                isPrivate: true,
                deliveryManId: deliveryMan.id 
              }
            ]
          },
          include: {
            deliveryMan: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
    })

    if (!order) return jsonError("Not found", 404)

    // Also need to fetch deliveryMan with city to compare
    const deliveryManWithCity = await prisma.deliveryMan.findUnique({
      where: { id: deliveryMan.id },
      include: { city: true }
    })

    if (!deliveryManWithCity) return jsonError("Unauthorized", 401)

    // Now compare city IDs instead of city objects
    const sameCity = (deliveryManWithCity.cityId || null) === order.cityId
    const assignedToMe = order.deliveryManId === deliveryMan.id

    if (!sameCity && !assignedToMe) {
      return jsonError("Forbidden", 403)
    }

    return jsonOk({ order })
  } catch {
    return jsonError("Unauthorized", 401)
  }
}