"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { cache } from "react"

type OrderStatus = "PENDING" | "ACCEPTED" | "ASSIGNED_TO_DELIVERY" | "DELIVERED" | "DELAYED" | "REJECTED" | "CANCELLED"


// Add this new function to get merchant base fee
export const getMerchantBaseFee = cache(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "غير مصرح", baseFee: 0 }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { baseFee: true }
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود", baseFee: 0 }

    return { success: true, baseFee: merchant.baseFee }
  } catch (error) {
    console.error("[v0] Error in getMerchantBaseFee:", error)
    return { success: false, error: "فشل في جلب رسوم المنصة", baseFee: 0 }
  }
})

// Create order with products (products created on the fly)
export async function createOrderWithProducts(data: {
  customerName: string
  customerPhone: string
  address: string
  cityId: number
  note?: string
  paymentMethod: "COD" | "PREPAID"
  totalPrice: number
  products: {
    name: string
    description?: string
    quantity: number
    image?: string | null
    sku?: string | null
  }[]
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    // Verify city exists and is active
    const city = await prisma.city.findUnique({
      where: {
        id: data.cityId,
        isActive: true
      }
    })

    if (!city) {
      return { success: false, message: "المدينة غير متاحة" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    const cityCode = city.code

    // Find the latest order in this city
    const latestOrder = await prisma.order.findFirst({
      where: {
        cityId: data.cityId,
      },
      orderBy: { id: "desc" },
      select: { orderCode: true },
    })

    let nextOrderNumber = 1
    if (latestOrder?.orderCode) {
      const match = latestOrder.orderCode.match(new RegExp(`OR-${cityCode}-(\\d+)`))
      if (match) {
        nextOrderNumber = Number.parseInt(match[1]) + 1
      }
    }

    const orderCode = `OR-${cityCode}-${nextOrderNumber.toString().padStart(6, "0")}`
    const merchantBaseFee = merchant.baseFee || 0
    const merchantEarning = data.totalPrice - merchantBaseFee

    // Create order with products in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, create all products
      const createdProducts = await Promise.all(
        data.products.map(async (productData) => {
          const product = await tx.product.create({
            data: {
              name: productData.name,
              description: productData.description || null,
              image: productData.image || null,
              sku: productData.sku || null,
              stockQuantity: productData.quantity, // Initial stock is the ordered quantity
              merchantId: merchant.id,
              isActive: true,
            },
          })
          return product
        })
      )

      // Create the order
      const order = await tx.order.create({
        data: {
          orderCode,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          address: data.address,
          cityId: data.cityId,
          note: data.note,
          totalPrice: data.totalPrice,
          paymentMethod: data.paymentMethod,
          merchantEarning,
          merchantId: merchant.id,
          orderItems: {
            create: data.products.map((productData, index) => ({
              productId: createdProducts[index].id,
              quantity: productData.quantity,
              price: 0, // Price is set at order level
              originalPrice: 0,
              isFree: false,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          city: true,
        },
      })

      return order
    })

    // Update city order count
    await prisma.city.update({
      where: { id: data.cityId },
      data: {
        orderCount: { increment: 1 }
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        title: "طلب جديد",
        message: `طلب جديد #${orderCode} من ${data.customerName}`,
        type: "ORDER_CREATED",
        userId: user.id,
        orderId: result.id,
      },
    })

    revalidatePath("/merchant/orders")
    return { success: true, message: "تم إنشاء الطلب بنجاح", orderCode }
  } catch (error) {
    console.error("[v0] Error in createOrderWithProducts:", error)
    return { success: false, message: "فشل في إنشاء الطلب" }
  }
}

// Update getMerchantOrders to include baseFee
export const getMerchantOrders = cache(async (
  page: number = 1,
  limit: number = 20,
  statusFilter: string = 'ALL',
  searchQuery: string = ''
) => {
  try {
    const user = await getCurrentUser()
    if (!user) return {
      success: false,
      error: "غير مصرح",
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
      limit,
      baseFee: 0
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { id: true, baseFee: true }
    })

    if (!merchant) return {
      success: false,
      error: "التاجر غير موجود",
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
      limit,
      baseFee: 0
    }

    const skip = (page - 1) * limit

    let whereClause: any = { merchantId: merchant.id }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_PROGRESS') {
        whereClause.status = {
          in: ['ACCEPTED', 'ASSIGNED_TO_DELIVERY']
        }
      } else if (statusFilter === 'CANCELLED') {
        whereClause.status = {
          in: ['REJECTED', 'CANCELLED']
        }
      } else {
        whereClause.status = statusFilter
      }
    }

    if (searchQuery) {
      whereClause.OR = [
        { orderCode: { contains: searchQuery, mode: 'insensitive' } },
        { customerName: { contains: searchQuery, mode: 'insensitive' } },
        { customerPhone: { contains: searchQuery } }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  sku: true
                }
              }
            }
          },
          city: {
            select: {
              name: true,
              code: true
            }
          },
          deliveryMan: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true
                }
              }
            }
          },
          deliveryAttemptHistory: {
            include: {
              deliveryMan: {
                include: {
                  user: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { attemptedAt: 'desc' },
            take: 1 // Only get the latest attempt for list view
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      prisma.order.count({ where: whereClause }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: orders,
      total,
      page,
      totalPages,
      limit,
      baseFee: merchant.baseFee
    }
  } catch (error) {
    console.error("[v0] Error in getMerchantOrders:", error)
    return {
      success: false,
      error: "فشل في جلب الطلبات",
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
      limit: 20,
      baseFee: 0
    }
  }
})

// Update getMerchantOrderById to include baseFee in calculation
export const getMerchantOrderById = cache(async (orderId: number) => {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "غير مصرح" }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { id: true, baseFee: true }
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        merchantId: merchant.id
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                sku: true
              }
            }
          }
        },
        city: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        deliveryMan: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                image: true
              }
            }
          }
        },
        deliveryAttemptHistory: {
          include: {
            deliveryMan: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { attemptedAt: 'asc' }
        },
        deliveryNotes: {
          include: {
            deliveryMan: {
              include: {
                user: {
                  select: {
                    name: true,
                    image: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!order) {
      return { success: false, error: "الطلب غير موجود" }
    }

    // Add baseFee to the returned data
    return {
      success: true,
      data: {
        ...order,
        baseFee: merchant.baseFee
      }
    }
  } catch (error) {
    console.error("[v0] Error in getMerchantOrderById:", error)
    return { success: false, error: "فشل في جلب تفاصيل الطلب" }
  }
})

// Update createOrder to use merchant's baseFee from database
export async function createOrder(data: {
  customerName: string
  customerPhone: string
  address: string
  cityId: number
  note?: string
  paymentMethod: "COD" | "PREPAID"
  items: {
    productId: number
    quantity: number
  }[]
  totalPrice: number
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "غير مصرح" }
    }

    // Verify city exists and is active
    const city = await prisma.city.findUnique({
      where: {
        id: data.cityId,
        isActive: true
      }
    })

    if (!city) {
      return { success: false, message: "المدينة غير متاحة" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    const cityCode = city.code

    // Find the latest order in this city
    const latestOrder = await prisma.order.findFirst({
      where: {
        cityId: data.cityId,
      },
      orderBy: { id: "desc" },
      select: { orderCode: true },
    })

    let nextOrderNumber = 1
    if (latestOrder?.orderCode) {
      const match = latestOrder.orderCode.match(new RegExp(`OR-${cityCode}-(\\d+)`))
      if (match) {
        nextOrderNumber = Number.parseInt(match[1]) + 1
      }
    }

    const orderCode = `OR-${cityCode}-${nextOrderNumber.toString().padStart(6, "0")}`
    const merchantBaseFee = merchant.baseFee || 0
    const merchantEarning = data.totalPrice - merchantBaseFee

    // Validate products and stock
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return { success: false, message: `المنتج غير موجود` }
      }

      if (product.stockQuantity < item.quantity) {
        return { success: false, message: `المخزون غير كافٍ للمنتج: ${product.name}` }
      }
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderCode,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        cityId: data.cityId,
        note: data.note,
        totalPrice: data.totalPrice,
        paymentMethod: data.paymentMethod,
        merchantEarning,
        merchantId: merchant.id,
        orderItems: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: 0,
            originalPrice: 0,
            isFree: false,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        city: true,
      },
    })

    // Update city order count
    await prisma.city.update({
      where: { id: data.cityId },
      data: {
        orderCount: { increment: 1 }
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        title: "طلب جديد",
        message: `طلب جديد #${orderCode} من ${data.customerName}`,
        type: "ORDER_CREATED",
        userId: user.id,
        orderId: order.id,
      },
    })

    revalidatePath("/merchant/orders")
    return { success: true, message: "تم إنشاء الطلب بنجاح", orderCode }
  } catch (error) {
    console.error("[v0] Error in createOrder:", error)
    return { success: false, message: "فشل في إنشاء الطلب" }
  }
}


// Get merchant products for order creation
export const getMerchantProducts = cache(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "غير مصرح", data: [] }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود", data: [] }

    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        stockQuantity: { gt: 0 },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        sku: true,
        stockQuantity: true,
      },
      orderBy: { name: "asc" },
      take: 100,
    })

    return { success: true, data: products }
  } catch (error) {
    console.error("[v0] Error in getMerchantProducts:", error)
    return { success: false, error: "فشل في جلب المنتجات", data: [] }
  }
})

// Update merchant order (only when PENDING)
export async function updateMerchantOrder(
  orderId: number,
  data: {
    customerName: string
    customerPhone: string
    address: string
    cityId: number
    note?: string | null
    paymentMethod: "COD" | "PREPAID"
    totalPrice: number
  },
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "MERCHANT") {
      return { success: false, message: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { id: true, baseFee: true },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    const existing = await prisma.order.findFirst({
      where: { id: orderId, merchantId: merchant.id },
      select: { id: true, status: true },
    })

    if (!existing) {
      return { success: false, message: "الطلب غير موجود" }
    }

    if (existing.status !== "PENDING") {
      return { success: false, message: "لا يمكن تعديل الطلب بعد تغيير حالته" }
    }

    // Verify new city exists and is active
    const city = await prisma.city.findUnique({
      where: {
        id: data.cityId,
        isActive: true
      }
    })

    if (!city) {
      return { success: false, message: "المدينة غير متاحة" }
    }

    const merchantBaseFee = merchant.baseFee || 0
    const merchantEarning = data.totalPrice - merchantBaseFee

    await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
        cityId: data.cityId,
        note: data.note ?? null,
        paymentMethod: data.paymentMethod,
        totalPrice: data.totalPrice,
        merchantEarning,
      },
    })

    revalidatePath("/merchant/orders")
    return { success: true, message: "تم تعديل الطلب بنجاح" }
  } catch (error) {
    console.error("[v0] Error in updateMerchantOrder:", error)
    return { success: false, message: "فشل في تعديل الطلب" }
  }
}

// Delete merchant order (only when PENDING)
export async function deleteMerchantOrder(orderId: number) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "MERCHANT") {
      return { success: false, message: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    const existing = await prisma.order.findFirst({
      where: { id: orderId, merchantId: merchant.id },
      select: { id: true, status: true, cityId: true },
    })

    if (!existing) {
      return { success: false, message: "الطلب غير موجود" }
    }

    if (existing.status !== "PENDING") {
      return { success: false, message: "لا يمكن حذف الطلب بعد تغيير حالته" }
    }

    await prisma.$transaction(async (tx) => {
      // Delete related records
      await tx.orderItem.deleteMany({ where: { orderId } })
      await tx.notification.deleteMany({ where: { orderId } })
      await tx.deliveryAttempt.deleteMany({ where: { orderId } })
      await tx.deliveryNote.deleteMany({ where: { orderId } })

      // Delete the order
      await tx.order.delete({ where: { id: orderId } })

      // Decrement city order count if city exists
      if (existing.cityId) {
        await tx.city.update({
          where: { id: existing.cityId },
          data: {
            orderCount: { decrement: 1 }
          }
        })
      }
    })

    revalidatePath("/merchant/orders")
    return { success: true, message: "تم حذف الطلب بنجاح" }
  } catch (error) {
    console.error("[v0] Error in deleteMerchantOrder:", error)
    return { success: false, message: "فشل في حذف الطلب" }
  }
}

// Get available cities for merchant
export async function getAvailableCitiesForMerchant() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "MERCHANT") {
      return []
    }

    const cities = await prisma.city.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: "asc" }
    })

    return cities
  } catch (error) {
    console.error("[v0] Error in getAvailableCitiesForMerchant:", error)
    return []
  }
}

// Get merchant dashboard data
export const getMerchantDashboardData = cache(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        orders: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            orderItems: {
              include: {
                product: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!merchant) return null

    // Calculate stats
    const totalOrders = await prisma.order.count({
      where: { merchantId: merchant.id }
    })

    const pendingOrders = await prisma.order.count({
      where: {
        merchantId: merchant.id,
        status: 'PENDING'
      }
    })

    const deliveredOrders = await prisma.order.count({
      where: {
        merchantId: merchant.id,
        status: 'DELIVERED'
      }
    })

    const cancelledOrders = await prisma.order.count({
      where: {
        merchantId: merchant.id,
        status: { in: ['CANCELLED', 'REJECTED'] }
      }
    })

    const totalRevenue = await prisma.order.aggregate({
      where: {
        merchantId: merchant.id,
        status: 'DELIVERED'
      },
      _sum: {
        totalPrice: true,
        merchantEarning: true
      }
    })

    const pendingRevenue = await prisma.order.aggregate({
      where: {
        merchantId: merchant.id,
        status: { in: ['PENDING', 'ACCEPTED', 'ASSIGNED_TO_DELIVERY'] }
      },
      _sum: {
        totalPrice: true
      }
    })

    const totalProducts = await prisma.product.count({
      where: { merchantId: merchant.id }
    })

    const totalStock = await prisma.product.aggregate({
      where: { merchantId: merchant.id },
      _sum: {
        stockQuantity: true
      }
    })

    const lowStockProducts = await prisma.product.count({
      where: {
        merchantId: merchant.id,
        stockQuantity: { lte: prisma.product.fields.lowStockAlert }
      }
    })

    // Get last 7 days sales data
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const dayOrders = await prisma.order.findMany({
        where: {
          merchantId: merchant.id,
          createdAt: {
            gte: date,
            lt: nextDay
          }
        }
      })

      const revenue = dayOrders.reduce((sum, order) => sum + order.totalPrice, 0)

      last7Days.push({
        date: date.toLocaleDateString('ar-MA', { weekday: 'short', day: 'numeric' }),
        orders: dayOrders.length,
        revenue
      })
    }

    // Get best selling products
    const bestSellingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          merchantId: merchant.id,
          status: 'DELIVERED'
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    })

    const bestSellingProductsWithDetails = await Promise.all(
      bestSellingProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, image: true }
        })
        return {
          product,
          quantity: item._sum.quantity || 0,
          revenue: 0 // Calculate if needed
        }
      })
    )

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { merchantId: merchant.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return {
      merchant: {
        id: merchant.id,
        user: merchant.user,
        companyName: merchant.companyName,
        balance: merchant.balance,
        totalEarned: merchant.totalEarned,
        baseFee: merchant.baseFee
      },
      stats: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        revenue: {
          total: totalRevenue._sum.totalPrice || 0,
          pending: pendingRevenue._sum.totalPrice || 0,
          merchantEarnings: totalRevenue._sum.merchantEarning || 0
        },
        products: {
          total: totalProducts,
          totalStock: totalStock._sum.stockQuantity || 0,
          lowStock: lowStockProducts
        },
        payments: {
          currentBalance: merchant.balance,
          totalPaid: merchant.totalEarned - merchant.balance
        }
      },
      last7Days,
      bestSellingProducts: bestSellingProductsWithDetails,
      recentOrders
    }
  } catch (error) {
    console.error("[v0] Error in getMerchantDashboardData:", error)
    return null
  }
})