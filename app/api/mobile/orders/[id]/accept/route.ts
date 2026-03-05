import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

/**
 * POST /api/mobile/orders/[id]/accept
 * 
 * Allows a delivery man to accept an order.
 * 
 * Requirements:
 * - Order must be in ACCEPTED status (accepted by admin first)
 * - Delivery man must be in the same city as the order
 * - Order must not be already assigned to another delivery man
 * 
 * Updates:
 * - Order status: ACCEPTED -> ASSIGNED_TO_DELIVERY
 * - Sets deliveryManId to the accepting delivery man
 * - Creates a delivery attempt record with attemptNumber = 1
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan, user } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    
    if (!Number.isFinite(orderId)) {
      return jsonError("Invalid order ID", 400)
    }

    // Fetch the order with merchant info for notifications
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!order) {
      return jsonError("Order not found", 404)
    }

    // Validate order status - must be ACCEPTED
    if (order.status !== "ACCEPTED") {
      return jsonError(
        "Order must be accepted by admin first",
        400
      )
    }

    // Validate city match
    if (deliveryMan.city && order.city !== deliveryMan.city) {
      return jsonError(
        `Cannot accept orders from ${order.city}. You are assigned to ${deliveryMan.city}`,
        403
      )
    }

    // Check if order is already assigned to another delivery man
    if (order.deliveryManId && order.deliveryManId !== deliveryMan.id) {
      return jsonError("Order already assigned to another delivery man", 409)
    }

    const now = new Date()

    // Get the last attempt to determine next attempt number
    const lastAttempt = await prisma.deliveryAttempt.findFirst({
      where: { orderId },
      orderBy: { attemptNumber: "desc" },
    })

    const nextAttemptNumber = (lastAttempt?.attemptNumber || 0) + 1

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update order status and assign delivery man
      await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryManId: deliveryMan.id,
          status: "ASSIGNED_TO_DELIVERY",
          updatedAt: now,
        },
      })

      // Create delivery attempt record for acceptance
      await tx.deliveryAttempt.create({
        data: {
          orderId: orderId,
          attemptNumber: nextAttemptNumber,
          deliveryManId: deliveryMan.id,
          status: "ATTEMPTED",
          notes: "Order accepted by delivery man",
          attemptedAt: now,
        },
      })
    })

    // Create notification for merchant
    await prisma.notification.create({
      data: {
        title: "Order Assigned",
        message: `Order #${order.orderCode} has been assigned to delivery man ${user.name}`,
        type: "ORDER_ASSIGNED",
        userId: order.merchant.userId,
        orderId: orderId,
      },
    })

    return jsonOk({
      success: true,
      message: "Order accepted successfully",
      order: {
        id: order.id,
        orderCode: order.orderCode,
        status: "ASSIGNED_TO_DELIVERY",
        deliveryManId: deliveryMan.id,
      },
    })
  } catch (error) {
    console.error("[Mobile API] Error accepting order:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return jsonError("Unauthorized", 401)
    }
    return jsonError("Internal server error", 500)
  }
}

