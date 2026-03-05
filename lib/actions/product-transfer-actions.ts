"use server"

import { prisma } from "@/lib/db"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { cache } from "react"


export type ProductTransferItem = {
  productId: number
  quantity: number
  name: string
  image?: string
}

export type CreateProductTransferInput = {
  deliveryCompany: string
  trackingNumber?: string
  note?: string
  items: ProductTransferItem[]
}

async function generateTransferCode(): Promise<string> {
  const latestTransfer = await prisma.productTransfer.findFirst({
    orderBy: { id: "desc" },
    select: { transferCode: true },
  })

  let nextNumber = 1

  if (latestTransfer?.transferCode) {
    const match = latestTransfer.transferCode.match(/PT(\d+)/)
    if (match) {
      nextNumber = Number.parseInt(match[1]) + 1
    }
  }

  return `PT${nextNumber.toString().padStart(5, "0")}`
}

export async function createProductTransfer(input: CreateProductTransferInput) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "يجب إضافة منتج واحد على الأقل" }
    }

    const transferCode = await generateTransferCode()

    const transfer = await prisma.productTransfer.create({
      data: {
        transferCode,
        merchantId: merchant.id,
        deliveryCompany: input.deliveryCompany,
        trackingNumber: input.trackingNumber || null,
        note: input.note || null,
        status: "PENDING",
        transferItems: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        transferItems: {
          include: {
            product: true,
          },
        },
      },
    })

    revalidateTag(`merchant-transfers-${merchant.id}`)
    revalidateTag(`merchant-products-${merchant.id}`)

    return {
      success: true,
      data: transfer,
      message: `تم إنشاء الشحنة بنجاح - رقم التتبع: ${transferCode}`,
    }
  } catch (error) {
    console.error("Error creating product transfer:", error)
    return { success: false, error: "فشل في إنشاء الشحنة" }
  }
}

export async function createProduct(data: {
  name: string
  description?: string
  image?: string
  sku?: string
  stockQuantity: number
}) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const product = await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        description: data.description || null,
        image: data.image || null,
        sku: data.sku || null,
        stockQuantity: 0,
        isActive: true,
      },
    })

    revalidateTag(`merchant-products-${merchant.id}`)

    return { success: true, data: product }
  } catch (error) {
    console.error("Error creating product:", error)
    return { success: false, error: "فشل في إنشاء المنتج" }
  }
}

export const getMerchantProducts = cache(async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'غير مصرح' };

    const userId = parseInt(session.user.id);
    
    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!merchant) return { success: false, error: 'التاجر غير موجود' };

    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        stockQuantity: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        image: true,
        sku: true,
        stockQuantity: true,
        lowStockAlert: true,
      },
      orderBy: { name: 'asc' },
      take: 100,
    });

    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'فشل في جلب المنتجات' };
  }
});

export const getMerchantTransfers = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
      select: { id: true },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const transfers = await prisma.productTransfer.findMany({
      where: { merchantId: merchant.id },
      select: {
        id: true,
        transferCode: true,
        deliveryCompany: true,
        trackingNumber: true,
        note: true,
        status: true,
        shippedAt: true,
        deliveredToWarehouseAt: true,
        createdAt: true,
        updatedAt: true,
        transferItems: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return { success: true, data: transfers }
  } catch (error) {
    console.error("Error fetching transfers:", error)
    return { success: false, error: "فشل في جلب الشحنات" }
  }
})

export async function updateTransferStatus(
  transferId: number,
  newStatus: "PENDING" | "IN_TRANSIT" | "DELIVERED_TO_WAREHOUSE" | "CANCELLED",
) {
  try {
    console.log("[v0] Starting updateTransferStatus:", { transferId, newStatus })

    const session = await auth()

    if (!session?.user) {
      console.log("[v0] No session found")
      return { success: false, error: "غير مصرح" }
    }

    console.log("[v0] User session:", { userId: session.user.id, role: session.user.role })

    // Get transfer with items and merchant
    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        transferItems: {
          include: {
            product: true,
          },
        },
        merchant: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!transfer) {
      console.log("[v0] Transfer not found")
      return { success: false, error: "الشحنة غير موجودة" }
    }

    console.log("[v0] Transfer found:", {
      transferCode: transfer.transferCode,
      currentStatus: transfer.status,
      merchantId: transfer.merchantId,
      merchantUserId: transfer.merchant.userId,
      itemsCount: transfer.transferItems.length,
    })

    // Check authorization
    const isAdmin = session.user.role === "ADMIN"
    const isMerchantOwner =
      session.user.role === "MERCHANT" && transfer.merchant.userId === Number.parseInt(session.user.id)

    console.log("[v0] Authorization check:", { isAdmin, isMerchantOwner })

    if (!isAdmin && !isMerchantOwner) {
      console.log("[v0] User not authorized")
      return { success: false, error: "غير مصرح بتحديث هذه الشحنة" }
    }

    // Prevent updating from final states
    if (transfer.status === "DELIVERED_TO_WAREHOUSE" || transfer.status === "CANCELLED") {
      console.log("[v0] Transfer already in final state")
      return { success: false, error: "لا يمكن تحديث شحنة تم تسليمها أو إلغاؤه" }
    }

    // Start transaction
    console.log("[v0] Starting transaction...")
    const result = await prisma.$transaction(async (tx) => {
      // Update transfer status
      const updatedTransfer = await tx.productTransfer.update({
        where: { id: transferId },
        data: {
          status: newStatus,
          shippedAt: newStatus === "IN_TRANSIT" ? new Date() : transfer.shippedAt,
          deliveredToWarehouseAt: newStatus === "DELIVERED_TO_WAREHOUSE" ? new Date() : transfer.deliveredToWarehouseAt,
          updatedAt: new Date(),
        },
        include: {
          transferItems: {
            include: {
              product: true,
            },
          },
        },
      })

      console.log("[v0] Transfer status updated successfully to:", newStatus)

      // Update stock if delivered
      if (newStatus === "DELIVERED_TO_WAREHOUSE") {
        console.log("[v0] Updating stock for", transfer.transferItems.length, "items...")

        for (const item of transfer.transferItems) {
          console.log("[v0] Processing item:", {
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            currentStock: item.product.stockQuantity,
            currentDelivered: item.product.deliveredCount,
          })

          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
              deliveredCount: {
                increment: item.quantity,
              },
            },
          })

          console.log("[v0] Product updated successfully:", {
            productId: item.productId,
            productName: item.product.name,
            addedQuantity: item.quantity,
            newStockQuantity: updatedProduct.stockQuantity,
            newDeliveredCount: updatedProduct.deliveredCount,
          })
        }

        console.log("[v0] All products updated successfully")
      }

      return updatedTransfer
    })

    console.log("[v0] Transaction completed successfully")

    // Revalidate caches
    revalidateTag(`merchant-transfers-${transfer.merchantId}`)
    revalidateTag(`merchant-products-${transfer.merchantId}`)
    console.log("[v0] Cache revalidated")

    const statusMessages = {
      PENDING: "معلق",
      IN_TRANSIT: "قيد الشحن",
      DELIVERED_TO_WAREHOUSE: "تم التسليم للمستودع",
      CANCELLED: "ملغي",
    }

    return {
      success: true,
      data: result,
      message: `تم تحديث حالة الشحنة إلى: ${statusMessages[newStatus]}${newStatus === "DELIVERED_TO_WAREHOUSE" ? " وتم تحديث المخزون تلقائياً" : ""}`,
    }
  } catch (error) {
    console.error("[v0] Error in updateTransferStatus:", error)
    console.error("[v0] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { success: false, error: "فشل في تحديث حالة الشحنة" }
  }
}

export async function getProductDetails(productId: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        merchantId: merchant.id,
      },
      include: {
        TransferItem: {
          include: {
            transfer: true,
          },
          orderBy: {
            transfer: {
              createdAt: "desc",
            },
          },
        },
        orderItems: {
          include: {
            order: true,
          },
          orderBy: {
            order: {
              createdAt: "desc",
            },
          },
        },
      },
    })

    if (!product) {
      return { success: false, error: "المنتج غير موجود" }
    }

    return { success: true, data: product }
  } catch (error) {
    console.error("Error fetching product details:", error)
    return { success: false, error: "فشل في جلب تفاصيل المنتج" }
  }
}

export const getInventoryStats = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "غير مصرح" }

    const userId = Number.parseInt(session.user.id)

    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    // Calculate actual delivered items from orders
    const deliveredItemsStats = await prisma.$queryRaw<Array<{ totalDelivered: number }>>`
      SELECT COALESCE(SUM(oi.quantity), 0) as "totalDelivered"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."merchantId" = ${merchant.id} AND o.status = 'DELIVERED'
    `

    const [stats] = await prisma.$queryRaw<
      Array<{
        totalProducts: number
        activeProducts: number
        totalStockQuantity: number
        lowStockProducts: number
        outOfStockProducts: number
      }>
    >`
      SELECT 
        COUNT(*) as "totalProducts",
        COUNT(CASE WHEN "isActive" = true THEN 1 END) as "activeProducts",
        COALESCE(SUM("stockQuantity"), 0) as "totalStockQuantity",
        COUNT(CASE WHEN "stockQuantity" > 0 AND "stockQuantity" <= "lowStockAlert" THEN 1 END) as "lowStockProducts",
        COUNT(CASE WHEN "stockQuantity" = 0 THEN 1 END) as "outOfStockProducts"
      FROM "Product"
      WHERE "merchantId" = ${merchant.id}
    `

    return {
      success: true,
      data: {
        totalProducts: Number(stats.totalProducts),
        activeProducts: Number(stats.activeProducts),
        totalStockQuantity: Number(stats.totalStockQuantity),
        totalDeliveredItems: Number(deliveredItemsStats[0]?.totalDelivered || 0),
        lowStockProducts: Number(stats.lowStockProducts),
        outOfStockProducts: Number(stats.outOfStockProducts),
        totalInventoryValue: 0,
      },
    }
  } catch (error) {
    console.error("Error fetching inventory stats:", error)
    return { success: false, error: "فشل في جلب إحصائيات المخزون" }
  }
})

export async function updateProductInfo(
  productId: number,
  data: {
    name?: string
    description?: string
    image?: string
    sku?: string
    stockQuantity?: number
    lowStockAlert?: number
  },
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "غير مصرح" }
    }

    // Check if user is ADMIN or MERCHANT who owns the product
    const isAdmin = session.user.role === "ADMIN"
    const isMerchant = session.user.role === "MERCHANT"

    if (!isAdmin && !isMerchant) {
      return { success: false, error: "غير مصرح" }
    }

    // Get the product with its merchant information
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        merchant: {
          include: {
            user: true
          }
        }
      },
    })

    if (!product) {
      return { success: false, error: "المنتج غير موجود" }
    }

    // Authorization check:
    // - Admin can update any product
    // - Merchant can only update their own products
    if (isMerchant) {
      const merchant = await prisma.merchant.findUnique({
        where: { userId: Number.parseInt(session.user.id) },
      })

      if (!merchant) {
        return { success: false, error: "التاجر غير موجود" }
      }

      if (product.merchantId !== merchant.id) {
        return { success: false, error: "غير مصرح بتحديث منتجات التاجر الآخر" }
      }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.image !== undefined) updateData.image = data.image
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.lowStockAlert !== undefined) updateData.lowStockAlert = data.lowStockAlert
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    })

    // Revalidate caches for both admin and merchant
    if (isAdmin) {
      // Admin can see all products, so revalidate admin product cache
      revalidateTag('admin-products')
      revalidateTag(`merchant-products-${product.merchantId}`)
    } else {
      // Merchant can only see their own products
      revalidateTag(`merchant-products-${product.merchantId}`)
    }

    // Also revalidate garage/inventory pages
    revalidateTag('warehouse-inventory')

    return { 
      success: true, 
      data: updatedProduct, 
      message: "تم تحديث المنتج بنجاح" 
    }
  } catch (error) {
    console.error("Error updating product:", error)
    return { success: false, error: "فشل في تحديث المنتج" }
  }
}

export async function deleteProductTransfer(transferId: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        merchant: true,
        transferItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!transfer) {
      return { success: false, error: "الشحنة غير موجودة" }
    }

    // Check if transfer belongs to merchant
    if (transfer.merchantId !== merchant.id) {
      return { success: false, error: "غير مصرح بحذف هذه الشحنة" }
    }

    // Only allow deletion of PENDING transfers
    if (transfer.status !== "PENDING") {
      return { success: false, error: "لا يمكن حذف شحنة تم شحنها أو تسليمها" }
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // First, delete all transfer items
      await tx.transferItem.deleteMany({
        where: { transferId },
      })

      // Then delete the transfer itself
      await tx.productTransfer.delete({
        where: { id: transferId },
      })
    })

    // Revalidate caches
    revalidateTag(`merchant-transfers-${merchant.id}`)
    revalidateTag(`merchant-products-${merchant.id}`)

    return {
      success: true,
      message: "تم حذف الشحنة بنجاح",
    }
  } catch (error) {
    console.error("Error deleting product transfer:", error)
    return { success: false, error: "فشل في حذف الشحنة" }
  }
}

export async function updateProductTransfer(
  transferId: number,
  data: {
    deliveryCompany?: string
    trackingNumber?: string
    note?: string
    items?: ProductTransferItem[]
  },
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "MERCHANT") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: Number.parseInt(session.user.id) },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    // Get transfer to verify ownership and status
    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        merchant: true,
        transferItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!transfer) {
      return { success: false, error: "الشحنة غير موجودة" }
    }

    // Check if transfer belongs to merchant
    if (transfer.merchantId !== merchant.id) {
      return { success: false, error: "غير مصرح بتحديث هذه الشحنة" }
    }

    // Only allow updating PENDING transfers
    if (transfer.status !== "PENDING") {
      return { success: false, error: "لا يمكن تحديث شحنة تم شحنها أو تسليمها" }
    }

    // If items are provided, validate they exist
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        })

        if (!product) {
          return { success: false, error: `المنتج #${item.productId} غير موجود` }
        }

        if (product.merchantId !== merchant.id) {
          return { success: false, error: `المنتج #${item.productId} لا ينتمي للتاجر` }
        }
      }
    }

    // Update transfer in transaction
    const updatedTransfer = await prisma.$transaction(async (tx) => {
      // Update basic transfer info
      const updated = await tx.productTransfer.update({
        where: { id: transferId },
        data: {
          deliveryCompany: data.deliveryCompany !== undefined ? data.deliveryCompany : transfer.deliveryCompany,
          trackingNumber: data.trackingNumber !== undefined ? data.trackingNumber : transfer.trackingNumber,
          note: data.note !== undefined ? data.note : transfer.note,
          updatedAt: new Date(),
        },
        include: {
          transferItems: true,
        },
      })

      // If items are provided, update them
      if (data.items && data.items.length > 0) {
        // Delete existing items
        await tx.transferItem.deleteMany({
          where: { transferId },
        })

        // Create new items
        await tx.transferItem.createMany({
          data: data.items.map((item) => ({
            transferId,
            productId: item.productId,
            quantity: item.quantity,
          })),
        })
      }

      return updated
    })

    revalidateTag(`merchant-transfers-${merchant.id}`)
    revalidateTag(`merchant-products-${merchant.id}`)

    return {
      success: true,
      data: updatedTransfer,
      message: "تم تحديث الشحنة بنجاح",
    }
  } catch (error) {
    console.error("Error updating product transfer:", error)
    return { success: false, error: "فشل في تحديث الشحنة" }
  }
}

// Add this new function in your server actions
export const getMerchantProductsForTransfer = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "غير مصرح" }

    const userId = Number.parseInt(session.user.id)

    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
        stockQuantity: { gt: 0 },
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
    console.error("Error fetching products:", error)
    return { success: false, error: "فشل في جلب المنتجات" }
  }
})

// Debug function to check actual product stock quantities
export const debugProductStock = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "غير مصرح" }

    const userId = Number.parseInt(session.user.id)

    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    // Get all products with their stock details
    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        lowStockAlert: true,
        isActive: true,
        sku: true
      },
      orderBy: { id: 'asc' }
    })

    // Count out of stock products manually
    const outOfStockCount = products.filter(p => p.stockQuantity === 0).length
    const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert).length
    const activeCount = products.filter(p => p.isActive).length

    return {
      success: true,
      data: {
        totalProducts: products.length,
        outOfStockProducts: outOfStockCount,
        lowStockProducts: lowStockCount,
        activeProducts: activeCount,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stockQuantity: p.stockQuantity,
          lowStockAlert: p.lowStockAlert,
          isActive: p.isActive,
          isOutOfStock: p.stockQuantity === 0,
          isLowStock: p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert
        }))
      }
    }
  } catch (error) {
    console.error("Error debugging product stock:", error)
    return { success: false, error: "فشل في فحص المخزون" }
  }
})

// New function to fetch detailed delivered orders information
export const getDeliveredOrdersDetails = cache(async () => {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "غير مصرح" }

    const userId = Number.parseInt(session.user.id)

    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    // Get all delivered orders with their items
    const deliveredOrders = await prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        status: 'DELIVERED'
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: {
        deliveredAt: 'desc'
      }
    })

    // Calculate statistics
    const totalDeliveredOrders = deliveredOrders.length
    const totalDeliveredItems = deliveredOrders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )
    
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0)

    // Group by product to see which products are most delivered
    const productDeliveries = deliveredOrders.flatMap(order => 
      order.orderItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        price: item.price,
        orderCode: order.orderCode,
        deliveredAt: order.deliveredAt
      }))
    )

    // Group by product and sum quantities
    const productStats = productDeliveries.reduce((acc, item) => {
      const key = item.productId
      if (!acc[key]) {
        acc[key] = {
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0
        }
      }
      acc[key].totalQuantity += item.quantity
      acc[key].totalRevenue += (item.quantity * item.price)
      acc[key].orderCount += 1
      return acc
    }, {} as Record<number, any>)

    return {
      success: true,
      data: {
        summary: {
          totalDeliveredOrders,
          totalDeliveredItems,
          totalRevenue
        },
        orders: deliveredOrders,
        productBreakdown: Object.values(productStats),
        recentDeliveries: productDeliveries.slice(0, 50) // Last 50 delivered items
      }
    }
  } catch (error) {
    console.error("Error fetching delivered orders details:", error)
    return { success: false, error: "فشل في جلب تفاصيل الطلبات المسلمة" }
  }
})