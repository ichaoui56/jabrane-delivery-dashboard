"use server"

import { prisma } from "@/lib/db"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"

export async function updateTransferStatus(
  transferId: number, 
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED_TO_WAREHOUSE" | "CANCELLED"
) {
  try {
    const session = await auth()


    // Start a transaction to update transfer status and product stock
    const result = await prisma.$transaction(async (tx) => {
      // Update the transfer status
      const updatedTransfer = await tx.productTransfer.update({
        where: { id: transferId },
        data: { 
          status,
          ...(status === "DELIVERED_TO_WAREHOUSE" && {
            deliveredToWarehouseAt: new Date()
          }),
          ...(status === "IN_TRANSIT" && {
            shippedAt: new Date()
          })
        },
        include: {
          transferItems: {
            include: {
              product: true
            }
          },
          merchant: true
        }
      })

      // If status is DELIVERED_TO_WAREHOUSE, update product stock
      if (status === "DELIVERED_TO_WAREHOUSE") {
        for (const item of updatedTransfer.transferItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity
              }
            }
          })
        }

        // Revalidate cache for merchant products
        revalidateTag(`merchant-products-${updatedTransfer.merchantId}`)
        revalidateTag(`merchant-transfers-${updatedTransfer.merchantId}`)
      }

      // If status is CANCELLED and was previously DELIVERED_TO_WAREHOUSE, revert stock
      if (status === "CANCELLED") {
        const previousTransfer = await tx.productTransfer.findUnique({
          where: { id: transferId },
          include: { transferItems: true }
        })

        if (previousTransfer?.status === "DELIVERED_TO_WAREHOUSE") {
          for (const item of previousTransfer.transferItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity
                }
              }
            })
          }

          revalidateTag(`merchant-products-${updatedTransfer.merchantId}`)
          revalidateTag(`merchant-transfers-${updatedTransfer.merchantId}`)
        }
      }

      return updatedTransfer
    })

    return {
      success: true,
      data: result,
      message: `تم تحديث حالة الشحنة إلى ${getStatusText(status)}`
    }
  } catch (error) {
    console.error("Error updating transfer status:", error)
    return { success: false, error: "فشل في تحديث حالة الشحنة" }
  }
}

function getStatusText(status: string): string {
  const statusMap = {
    PENDING: "قيد الانتظار",
    IN_TRANSIT: "في الطريق", 
    DELIVERED_TO_WAREHOUSE: "تم التسليم للمستودع",
    CANCELLED: "ملغي"
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// Get all transfers for admin
export async function getAllTransfers() {
  try {
    const session = await auth()



    const transfers = await prisma.productTransfer.findMany({
      include: {
        transferItems: {
          include: {
            product: true
          }
        },
        merchant: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    
    return { success: true, data: transfers }
  } catch (error) {
    console.error("Error fetching all transfers:", error)
    return { success: false, error: "فشل في جلب الشحنات" }
  }
}