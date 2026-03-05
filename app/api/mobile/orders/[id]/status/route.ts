import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

type OrderStatus = "DELAYED" | "REJECTED" | "CANCELLED" | "DELIVERED"
type AttemptStatus = "ATTEMPTED" | "FAILED" | "SUCCESSFUL" | "CUSTOMER_NOT_AVAILABLE" | "WRONG_ADDRESS" | "REFUSED" | "OTHER"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryMan, user } = await requireDeliveryManAuth(request)
    const orderId = Number.parseInt(params.id, 10)
    
    if (!Number.isFinite(orderId)) {
      return jsonError("Invalid order ID", 400)
    }

    const body = await request.json().catch(() => ({}))
    const { status, reason, notes, location, new_delivery_date } = body // Added new_delivery_date

    // Validate status - now includes DELAYED
    const allowedStatuses: OrderStatus[] = ["DELAYED", "REJECTED", "CANCELLED", "DELIVERED"]
    if (!status || !allowedStatuses.includes(status as OrderStatus)) {
      return jsonError(
        `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
        400
      )
    }

    // Type assertion after validation
    const validatedStatus: OrderStatus = status as OrderStatus

    // Fetch the order with all necessary relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            userId: true,
            baseFee: true,
          },
        },
        deliveryMan: {
          select: {
            id: true,
            baseFee: true,
            userId: true,
          },
        },
        orderItems: {
          select: {
            productId: true,
            quantity: true,
            isFree: true,
          },
        },
        deliveryAttemptHistory: {
          orderBy: { attemptNumber: "desc" },
          take: 1,
        },
        city: {
          select: {
            name: true
          }
        }
      },
    })

    if (!order) {
      return jsonError("Order not found", 404)
    }

    // Validate delivery man assignment
    if (order.deliveryManId !== deliveryMan.id) {
      return jsonError("You are not assigned to this order", 403)
    }

    // Check if order is already in a final state
    const finalStatuses: OrderStatus[] = ["REJECTED", "CANCELLED", "DELIVERED"]
    if (finalStatuses.includes(order.status as OrderStatus)) {
      return jsonError(
        `Cannot update order status. Order is already ${order.status}`,
        400
      )
    }

    // For DELAYED status: validate new delivery date and reason
    if (validatedStatus === "DELAYED") {
      if (!new_delivery_date) {
        return jsonError("New delivery date is required for delayed orders", 400)
      }
      
      if (!reason || reason.trim().length === 0) {
        return jsonError("Delay reason is required", 400)
      }
      
      const newDate = new Date(new_delivery_date)
      if (isNaN(newDate.getTime())) {
        return jsonError("Invalid delivery date format", 400)
      }
      
      // Ensure new date is in the future
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (newDate < today) {
        return jsonError("New delivery date must be in the future", 400)
      }
    }

    // Get the last attempt to determine next attempt number
    const lastAttempt = order.deliveryAttemptHistory[0]
    const currentAttemptNumber = lastAttempt?.attemptNumber || 0

    // Determine attempt management based on status
    let nextAttemptNumber: number
    let attemptStatus: AttemptStatus
    let attemptNotes: string
    let shouldUpdateOrderStatus: boolean = false
    let newOrderStatus: string = order.status

    switch (validatedStatus) {
      case "DELAYED":
        nextAttemptNumber = currentAttemptNumber + 1
        attemptStatus = "CUSTOMER_NOT_AVAILABLE"
        attemptNotes = `Delivery delayed - customer not available${reason ? `: ${reason}` : ""}`
        shouldUpdateOrderStatus = false
        break

      case "REJECTED":
        nextAttemptNumber = currentAttemptNumber + 1
        attemptStatus = "REFUSED"
        attemptNotes = `Order rejected${reason ? ` - ${reason}` : ""}`
        shouldUpdateOrderStatus = true
        newOrderStatus = "REJECTED"
        break

      case "CANCELLED":
        nextAttemptNumber = currentAttemptNumber + 1
        attemptStatus = "REFUSED"
        attemptNotes = `Order cancelled${reason ? ` - ${reason}` : ""}`
        shouldUpdateOrderStatus = true
        newOrderStatus = "CANCELLED"
        break

      case "DELIVERED":
        nextAttemptNumber = currentAttemptNumber + 1
        attemptStatus = "SUCCESSFUL"
        attemptNotes = "Order delivered successfully to customer"
        shouldUpdateOrderStatus = true
        newOrderStatus = "DELIVERED"
        break

      default:
        return jsonError("Invalid status", 400)
    }

    // Add custom notes if provided
    if (notes) {
      attemptNotes += ` | ${notes}`
    }

    const now = new Date()

    // Handle DELAYED status with date update
    if (validatedStatus === "DELAYED") {
      const newDeliveryDate = new Date(new_delivery_date)
      
      await prisma.$transaction(async (tx) => {
        // Update order with new delivery date and reason
        await tx.order.update({
          where: { id: orderId },
          data: {
            previous_delivery_date: order.delivery_date, // Save previous date
            delivery_date: newDeliveryDate, // Set new date
            delay_reason: reason, // Save delay reason
            updatedAt: now,
          },
        })

        // Create delivery attempt record for delay
        await tx.deliveryAttempt.create({
          data: {
            orderId: orderId,
            attemptNumber: nextAttemptNumber,
            deliveryManId: deliveryMan.id,
            status: attemptStatus,
            reason: reason || null,
            notes: attemptNotes,
            location: location || null,
            attemptedAt: now,
          },
        })
      })

      // Create notification for merchant
      await prisma.notification.create({
        data: {
          title: "Delivery Delayed",
          message: `Delivery for order #${order.orderCode} delayed to ${newDeliveryDate.toLocaleDateString()}. Reason: ${reason}`,
          type: "DELIVERY_DELAYED",
          userId: order.merchant.userId,
          orderId: orderId,
        },
      })

      return jsonOk({
        success: true,
        message: `Delivery delayed. New delivery date: ${newDeliveryDate.toLocaleDateString()}`,
        order: {
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          delivery_date: newDeliveryDate.toISOString(),
          previous_delivery_date: order.delivery_date?.toISOString(),
          attemptNumber: nextAttemptNumber,
        },
      })
    }

    // Handle DELIVERED status
    if (validatedStatus === "DELIVERED") {
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "DELIVERED",
            deliveredAt: now,
            updatedAt: now,
          },
        })

        // Create delivery attempt record
        await tx.deliveryAttempt.create({
          data: {
            orderId: orderId,
            attemptNumber: nextAttemptNumber,
            deliveryManId: deliveryMan.id,
            status: attemptStatus,
            notes: attemptNotes,
            location: location || null,
            attemptedAt: now,
          },
        })

        // Handle delivered order business logic
        const merchantBaseFee = order.merchant.baseFee ?? 0
        const deliveryManBaseFee = order.deliveryMan?.baseFee ?? 0
        const merchantEarning = order.totalPrice - merchantBaseFee

        // Update product stock (skip free items)
        const productsToUpdate = order.orderItems
          .filter((item) => !item.isFree)
          .map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))

        if (productsToUpdate.length > 0) {
          await Promise.all(
            productsToUpdate.map((item) =>
              tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: { decrement: item.quantity },
                  deliveredCount: { increment: item.quantity },
                },
              })
            )
          )
        }

        // Update merchant balance
        if (order.paymentMethod === "COD") {
          await tx.merchant.update({
            where: { id: order.merchantId },
            data: {
              balance: { increment: merchantEarning },
              totalEarned: { increment: order.totalPrice },
            },
          })
        } else {
          await tx.merchant.update({
            where: { id: order.merchantId },
            data: {
              balance: { decrement: merchantBaseFee },
              totalEarned: { increment: order.totalPrice },
            },
          })
        }

        // Update delivery man stats - only update pending fields
        if (order.deliveryMan) {
          await tx.deliveryMan.update({
            where: { id: order.deliveryMan.id },
            data: {
              totalDeliveries: { increment: 1 },
              successfulDeliveries: { increment: 1 },
              // Only update pending fields - main fields updated during payment
              pendingEarnings: { increment: deliveryManBaseFee },
              ...(order.paymentMethod === "COD" && {
                pendingCOD: { increment: order.totalPrice }
              })
            },
          })
        }
      })

      // Create notifications
      await Promise.all([
        // Notify merchant
        prisma.notification.create({
          data: {
            title: "Order Delivered",
            message: `Order #${order.orderCode} has been delivered successfully`,
            type: "ORDER_DELIVERED",
            userId: order.merchant.userId,
            orderId: orderId,
          },
        }),
        // Notify delivery man
        order.deliveryMan?.userId
          ? prisma.notification.create({
              data: {
                title: "Delivery Successful",
                message: `Order #${order.orderCode} delivered successfully. Earnings: ${order.deliveryMan.baseFee} MAD${order.paymentMethod === "COD" ? `, COD collected: ${order.totalPrice} MAD` : ""}`,
                type: "DELIVERY_SUCCESS",
                userId: order.deliveryMan.userId,
                orderId: orderId,
              },
            })
          : Promise.resolve(),
      ])
    } else {
      // Handle other final statuses (REJECTED, CANCELLED)
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: validatedStatus,
            updatedAt: now,
          },
        })

        // Create delivery attempt record
        await tx.deliveryAttempt.create({
          data: {
            orderId: orderId,
            attemptNumber: nextAttemptNumber,
            deliveryManId: deliveryMan.id,
            status: attemptStatus,
            reason: reason || null,
            notes: attemptNotes,
            location: location || null,
            attemptedAt: now,
          },
        })
      })

      // Create notification for merchant
      const statusMessages: Record<OrderStatus, string> = {
        DELAYED: "Delivery Delayed",
        REJECTED: "Order Rejected",
        CANCELLED: "Order Cancelled",
        DELIVERED: "Order Delivered",
      }

      await prisma.notification.create({
        data: {
          title: statusMessages[validatedStatus],
          message: `Order #${order.orderCode} status updated to ${validatedStatus}${reason ? `: ${reason}` : ""}`,
          type: `ORDER_${validatedStatus}`,
          userId: order.merchant.userId,
          orderId: orderId,
        },
      })
    }

    return jsonOk({
      success: true,
      message: `Order status updated to ${validatedStatus}`,
      order: {
        id: order.id,
        orderCode: order.orderCode,
        status: validatedStatus,
        attemptNumber: nextAttemptNumber,
      },
    })
  } catch (error) {
    console.error("[Mobile API] Error updating order status:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return jsonError("Unauthorized", 401)
    }
    return jsonError("Internal server error", 500)
  }
}