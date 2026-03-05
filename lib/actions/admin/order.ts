"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getOrderById(id: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        merchant: {
          include: {
            user: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        deliveryAttemptHistory: {
          include: {
            deliveryMan: {
              include: {
                user: true,
              },
            },
          },
        },
        deliveryNotes: {  // Add this section
          include: {
            deliveryMan: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!order) {
      return { success: false, error: "الطلب غير موجود" }
    }

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Get the current order with all necessary data
    const currentOrder = await prisma.order.findUnique({
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
        }
      }
    })

    if (!currentOrder) {
      return { success: false, error: "الطلب غير موجود" }
    }

    const previousStatus = currentOrder.status
    const newStatus = status as any
    const now = new Date()

    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: newStatus,
        deliveredAt: newStatus === "DELIVERED" ? now : undefined,
        updatedAt: now,
      },
    })

    // Handle DELIVERED status changes
    if (newStatus === "DELIVERED" && previousStatus !== "DELIVERED") {
      await handleDeliveredOrder(currentOrder)
    }

    // Handle status reversal from DELIVERED to other statuses
    if (previousStatus === "DELIVERED" && newStatus !== "DELIVERED") {
      await handleDeliveredOrderReversal(currentOrder)
    }

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error updating order status:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث حالة الطلب" }
  }
}

// Handle delivered order updates
async function handleDeliveredOrder(order: any) {
  // Get merchant and delivery man data
  const [merchant, deliveryMan] = await Promise.all([
    prisma.merchant.findUnique({
      where: { id: order.merchantId },
      select: { baseFee: true, userId: true }
    }),
    order.deliveryManId ? prisma.deliveryMan.findUnique({
      where: { id: order.deliveryManId },
      select: { baseFee: true, userId: true }
    }) : null
  ])

  const merchantBaseFee = merchant?.baseFee ?? 0
  const deliveryManBaseFee = deliveryMan?.baseFee ?? 0
  const merchantEarning = order.totalPrice - merchantBaseFee

  // Update product stock (skip free items)
  const productsToUpdate = order.orderItems
    .filter((item: any) => !item.isFree)
    .map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity
    }))

  if (productsToUpdate.length > 0) {
    await prisma.$transaction(
      productsToUpdate.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            },
            deliveredCount: {
              increment: item.quantity
            }
          }
        })
      )
    )
  }

  // Update merchant balance
  if (order.paymentMethod === "COD") {
    await prisma.merchant.update({
      where: { id: order.merchantId },
      data: {
        balance: { increment: merchantEarning },
        totalEarned: { increment: order.totalPrice }
      }
    })

    // Create notification for merchant
    if (merchant?.userId) {
      await prisma.notification.create({
        data: {
          title: "طلب تم تسليمه",
          message: `تم تسليم الطلب #${order.orderCode} وتمت إضافة ${merchantEarning} د.م إلى رصيدك`,
          type: "ORDER_DELIVERED",
          userId: merchant.userId,
          orderId: order.id,
        },
      })
    }
  } else {
    await prisma.merchant.update({
      where: { id: order.merchantId },
      data: {
        balance: { decrement: merchantBaseFee },
        totalEarned: { increment: order.totalPrice }
      }
    })
  }

  // Update delivery man stats and financial tracking - only update pending fields
  if (order.deliveryManId && deliveryMan) {
    await prisma.deliveryMan.update({
      where: { id: order.deliveryManId },
      data: {
        totalDeliveries: { increment: 1 },
        successfulDeliveries: { increment: 1 },
        // Only update pending fields - main fields updated during payment
        pendingEarnings: { increment: deliveryManBaseFee },
        ...(order.paymentMethod === "COD" && {
          pendingCOD: { increment: order.totalPrice }
        })
      }
    })

    // Create notification for delivery man
    if (deliveryMan.userId) {
      await prisma.notification.create({
        data: {
          title: "توصيل ناجح",
          message: `تم تسليم الطلب #${order.orderCode} بنجاح، رصيدك: ${deliveryManBaseFee} د.م${order.paymentMethod === "COD" ? `، تم تحصيل ${order.totalPrice} د.م` : ""}`,
          type: "DELIVERY_SUCCESS",
          userId: deliveryMan.userId,
          orderId: order.id,
        },
      })
    }
  }
}

// Handle order status reversal from DELIVERED to other statuses
async function handleDeliveredOrderReversal(order: any) {
  // Get merchant and delivery man data
  const [merchant, deliveryMan] = await Promise.all([
    prisma.merchant.findUnique({
      where: { id: order.merchantId },
      select: { baseFee: true, userId: true }
    }),
    order.deliveryManId ? prisma.deliveryMan.findUnique({
      where: { id: order.deliveryManId },
      select: { baseFee: true, userId: true }
    }) : null
  ])

  const merchantBaseFee = merchant?.baseFee ?? 0
  const deliveryManBaseFee = deliveryMan?.baseFee ?? 0
  const merchantEarning = order.totalPrice - merchantBaseFee

  // Restore product stock (skip free items)
  const productsToRestore = order.orderItems
    .filter((item: any) => !item.isFree)
    .map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity
    }))

  if (productsToRestore.length > 0) {
    await prisma.$transaction(
      productsToRestore.map((item: any) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity
            },
            deliveredCount: {
              decrement: item.quantity
            }
          }
        })
      )
    )
  }

  // Reverse merchant balance changes
  if (order.paymentMethod === "COD") {
    await prisma.merchant.update({
      where: { id: order.merchantId },
      data: {
        balance: { decrement: merchantEarning },
        totalEarned: { decrement: order.totalPrice }
      }
    })
  } else {
    await prisma.merchant.update({
      where: { id: order.merchantId },
      data: {
        balance: { increment: merchantBaseFee },
        totalEarned: { decrement: order.totalPrice }
      }
    })
  }

  // Reverse delivery man stats and financial tracking
  if (order.deliveryManId && deliveryMan) {
    await prisma.deliveryMan.update({
      where: { id: order.deliveryManId },
      data: {
        totalDeliveries: { decrement: 1 },
        successfulDeliveries: { decrement: 1 },
        // Reverse pending fields only
        pendingEarnings: { decrement: deliveryManBaseFee },
        ...(order.paymentMethod === "COD" && {
          pendingCOD: { decrement: order.totalPrice }
        })
      }
    })
  }
}

export async function getOrderDetails(orderId: number) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          include: {
            user: true,
          },
        },
        deliveryMan: {
          include: {
            user: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        deliveryAttemptHistory: {
          include: {
            deliveryMan: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            attemptedAt: "desc",
          },
        },
        deliveryNotes: {
          include: {
            deliveryMan: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!order) {
      return { success: false, error: "الطلب غير موجود" }
    }

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error fetching order details:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getActiveDeliveryMen() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const deliveryMen = await prisma.deliveryMan.findMany({
      where: {
        active: true,
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        city: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { city: { name: "asc" } },
        { rating: "desc" },
        { successfulDeliveries: "desc" },
      ],
    })

    // Transform the data to match the expected DeliveryMan type
    const transformedDeliveryMen = deliveryMen.map(dm => ({
      id: dm.id,
      createdAt: dm.createdAt,
      cityId: dm.cityId,
      userId: dm.userId,
      vehicleType: dm.vehicleType,
      active: dm.active,
      totalDeliveries: dm.totalDeliveries,
      successfulDeliveries: dm.successfulDeliveries,
      totalEarned: dm.totalEarned,
      pendingEarnings: dm.pendingEarnings,
      collectedCOD: dm.collectedCOD,
      pendingCOD: dm.pendingCOD,
      baseFee: dm.baseFee,
      rating: dm.rating,
      user: dm.user,
      city: dm.city?.name || null,
    }))

    return { success: true, data: transformedDeliveryMen }
  } catch (error) {
    console.error("[v0] Error fetching delivery men:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}


export async function getAllOrders(filters?: {
  // Delivery date filters
  deliveryDateSpecific?: string;
  deliveryStartDate?: string;
  deliveryEndDate?: string;
  
  // Creation date filters
  creationDateSpecific?: string;
  creationStartDate?: string;
  creationEndDate?: string;
  
  // Other filters
  city?: string;
  status?: string;
  paymentMethod?: string;
  searchTerm?: string;
}) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Build where clause for filtering
    const whereClause: any = {}
    
    // Search term filtering (search in multiple fields)
    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      whereClause.OR = [
        { orderCode: { contains: searchTerm, mode: 'insensitive' } },
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { customerPhone: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        {
          merchant: {
            user: {
              name: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        },
        {
          deliveryMan: {
            user: {
              name: { contains: searchTerm, mode: 'insensitive' }
            }
          }
        }
      ]
    }
    
    // Delivery date filtering
    if (filters?.deliveryDateSpecific) {
      const specificDate = new Date(filters.deliveryDateSpecific)
      const nextDay = new Date(specificDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      if (whereClause.AND) {
        whereClause.AND.push({ delivery_date: {
          gte: specificDate,
          lt: nextDay
        }})
      } else {
        whereClause.delivery_date = {
          gte: specificDate,
          lt: nextDay
        }
      }
    } else if (filters?.deliveryStartDate || filters?.deliveryEndDate) {
      const deliveryDateFilter: any = {}
      
      if (filters.deliveryStartDate) {
        deliveryDateFilter.gte = new Date(filters.deliveryStartDate)
      }
      
      if (filters.deliveryEndDate) {
        const endDate = new Date(filters.deliveryEndDate)
        endDate.setDate(endDate.getDate() + 1)
        deliveryDateFilter.lt = endDate
      }
      
      if (whereClause.AND) {
        whereClause.AND.push({ delivery_date: deliveryDateFilter })
      } else {
        whereClause.delivery_date = deliveryDateFilter
      }
    }

    // Creation date filtering
    if (filters?.creationDateSpecific) {
      const specificDate = new Date(filters.creationDateSpecific)
      const nextDay = new Date(specificDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      if (whereClause.AND) {
        whereClause.AND.push({ createdAt: {
          gte: specificDate,
          lt: nextDay
        }})
      } else {
        whereClause.createdAt = {
          gte: specificDate,
          lt: nextDay
        }
      }
    } else if (filters?.creationStartDate || filters?.creationEndDate) {
      const createdAtFilter: any = {}
      
      if (filters.creationStartDate) {
        createdAtFilter.gte = new Date(filters.creationStartDate)
      }
      
      if (filters.creationEndDate) {
        const endDate = new Date(filters.creationEndDate)
        endDate.setDate(endDate.getDate() + 1)
        createdAtFilter.lt = endDate
      }
      
      if (whereClause.AND) {
        whereClause.AND.push({ createdAt: createdAtFilter })
      } else {
        whereClause.createdAt = createdAtFilter
      }
    }

    // City filtering
    if (filters?.city && filters.city !== "all") {
      if (whereClause.AND) {
        whereClause.AND.push({ city: { name: filters.city } })
      } else {
        whereClause.city = { name: filters.city }
      }
    }

    // Status filtering
    if (filters?.status && filters.status !== "all") {
      if (whereClause.AND) {
        whereClause.AND.push({ status: filters.status })
      } else {
        whereClause.status = filters.status
      }
    }

    // Payment method filtering
    if (filters?.paymentMethod && filters.paymentMethod !== "all") {
      if (whereClause.AND) {
        whereClause.AND.push({ paymentMethod: filters.paymentMethod })
      } else {
        whereClause.paymentMethod = filters.paymentMethod
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        merchant: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        city: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: orders }
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

// Add this new function for updating delivery date
export async function updateOrderDeliveryDate(orderId: number, deliveryDate: Date, reason?: string) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Get current order to save previous date
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!currentOrder) {
      return { success: false, error: "الطلب غير موجود" }
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        previous_delivery_date: currentOrder.delivery_date,
        delivery_date: deliveryDate,
        delay_reason: reason || null,
        updatedAt: new Date(),
      },
    })

    return { success: true, data: order }
  } catch (error) {
    console.error("[v0] Error updating delivery date:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث تاريخ التوصيل" }
  }
}

// Update assignDeliveryMan to set delivery_date
export async function assignDeliveryMan(orderId: number, deliveryManId: number, deliveryDate?: Date) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Check if delivery man exists and is active
    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id: deliveryManId },
      include: {
        user: true,
      },
    })

    if (!deliveryMan) {
      return { success: false, error: "الموصل غير موجود" }
    }

    if (!deliveryMan.active) {
      return { success: false, error: "الموصل غير نشط" }
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return { success: false, error: "الطلب غير موجود" }
    }

    // Use provided date or default to tomorrow
    const defaultDeliveryDate = new Date()
    defaultDeliveryDate.setDate(defaultDeliveryDate.getDate())
    const finalDeliveryDate = deliveryDate || defaultDeliveryDate

    // Update order with delivery man, date, and change status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryManId: deliveryManId,
        delivery_date: finalDeliveryDate,
        status: "ASSIGNED_TO_DELIVERY",
      },
      include: {
        deliveryMan: {
          include: {
            user: true,
          },
        },
      },
    })

    // Create notification for the delivery man
    await prisma.notification.create({
      data: {
        userId: deliveryMan.userId,
        title: "طلب جديد مسند إليك",
        message: `تم تعيين الطلب #${order.orderCode} لك. تاريخ التوصيل: ${finalDeliveryDate.toLocaleDateString()}`,
        type: "ORDER_ASSIGNED",
        orderId: orderId,
      },
    })

    return { success: true, data: updatedOrder }
  } catch (error) {
    console.error("[v0] Error assigning delivery man:", error)
    return { success: false, error: "حدث خطأ أثناء تعيين الموصل" }
  }
}