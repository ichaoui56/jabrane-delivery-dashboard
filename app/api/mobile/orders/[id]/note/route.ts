import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

// GET all notes for an order
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    
    if (!Number.isFinite(orderId)) {
      return jsonError("Invalid order ID", 400)
    }

    // Check if delivery man has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        deliveryManId: true,
        cityId: true,
      },
    })

    if (!order) {
      return jsonError("Order not found", 404)
    }

    // Check access: same city or assigned to me
    const deliveryManWithCity = await prisma.deliveryMan.findUnique({
      where: { id: deliveryMan.id },
      include: { city: true }
    })

    if (!deliveryManWithCity) {
      return jsonError("Unauthorized", 401)
    }

    const sameCity = (deliveryManWithCity.cityId || null) === order.cityId
    const assignedToMe = order.deliveryManId === deliveryMan.id

    if (!sameCity && !assignedToMe) {
      return jsonError("Forbidden", 403)
    }

    // Get notes (include private notes only if created by this delivery man)
    const notes = await prisma.deliveryNote.findMany({
      where: {
        orderId,
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
    })

    return jsonOk({ notes })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return jsonError("Internal server error", 500)
  }
}

// POST - Create a new note
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    
    if (!Number.isFinite(orderId)) {
      return jsonError("Invalid order ID", 400)
    }

    const body = await request.json()
    const { content, isPrivate = false } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return jsonError("Note content is required", 400)
    }

    if (content.trim().length > 1000) {
      return jsonError("Note content is too long (max 1000 characters)", 400)
    }

    // Check if delivery man has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        deliveryManId: true,
        cityId: true,
      },
    })

    if (!order) {
      return jsonError("Order not found", 404)
    }

    // Check access: same city or assigned to me
    const deliveryManWithCity = await prisma.deliveryMan.findUnique({
      where: { id: deliveryMan.id },
      include: { city: true }
    })

    if (!deliveryManWithCity) {
      return jsonError("Unauthorized", 401)
    }

    const sameCity = (deliveryManWithCity.cityId || null) === order.cityId
    const assignedToMe = order.deliveryManId === deliveryMan.id

    if (!sameCity && !assignedToMe) {
      return jsonError("Forbidden", 403)
    }

    // Create the note
    const note = await prisma.deliveryNote.create({
      data: {
        orderId,
        deliveryManId: deliveryMan.id,
        content: content.trim(),
        isPrivate
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
      }
    })

    return jsonOk({ 
      success: true,
      message: "Note added successfully",
      note 
    })
  } catch (error) {
    console.error("Error creating note:", error)
    return jsonError("Internal server error", 500)
  }
}