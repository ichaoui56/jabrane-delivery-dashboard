"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getFinancialData() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const [orders, merchants, deliveryMen, moneyTransfers] = await Promise.all([
      prisma.order.findMany({
        where: { status: "DELIVERED" },
        include: {
          merchant: {
            include: {
              user: true
            }
          }
        }
      }),
      prisma.merchant.findMany({
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.deliveryMan.findMany({
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }),
      // Update this query to include deliveryMan and user info
      prisma.moneyTransfer.findMany({
        include: {
          merchant: {
            include: {
              user: true
            }
          },
          deliveryMan: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
    const totalMerchantBalance = merchants.reduce((sum, merchant) => sum + merchant.balance, 0)
    const totalDeliveryManEarnings = deliveryMen.reduce((sum, dm) => sum + dm.totalEarned, 0)
    const totalPaid = moneyTransfers.reduce((sum, transfer) => sum + transfer.amount, 0)
    const companyProfit = totalRevenue - totalMerchantBalance - totalDeliveryManEarnings

    // Create transactions for ALL money transfers
    const transactions = [
      // Money transfers - BOTH merchant AND delivery man payments
      ...moneyTransfers.map(transfer => {
        // Determine if it's a merchant payment or delivery man payment
        if (transfer.merchantId && transfer.merchant) {
          return {
            id: transfer.id,
            type: "MERCHANT_PAYMENT" as const,
            amount: transfer.amount,
            reference: transfer.reference,
            note: transfer.note,
            createdAt: transfer.transferDate.toISOString(),
            relatedUser: {
              name: transfer.merchant.user.name,
              type: "تاجر"
            }
          }
        } else if (transfer.deliveryManId && transfer.deliveryMan) {
          return {
            id: transfer.id,
            type: "DELIVERY_PAYMENT" as const,
            amount: transfer.amount,
            reference: transfer.reference,
            note: transfer.note,
            createdAt: transfer.transferDate.toISOString(),
            relatedUser: {
              name: transfer.deliveryMan.user.name,
              type: "موظف توصيل"
            }
          }
        }
        // Fallback for any edge cases
        return {
          id: transfer.id,
          type: "MERCHANT_PAYMENT" as const,
          amount: transfer.amount,
          reference: transfer.reference,
          note: transfer.note,
          createdAt: transfer.transferDate.toISOString(),
          relatedUser: {
            name: "غير معروف",
            type: "مستخدم"
          }
        }
      }),
      // Order revenues
      ...orders.map(order => ({
        id: order.id,
        type: "ORDER_REVENUE" as const,
        amount: order.totalPrice,
        reference: order.orderCode,
        note: `طلب من ${order.merchant.user.name}`,
        createdAt: order.createdAt.toISOString(),
        relatedUser: {
          name: order.customerName,
          type: "عميل"
        }
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      success: true,
      data: {
        totalRevenue,
        totalMerchantBalance,
        totalDeliveryManEarnings,
        companyProfit,
        totalPaid,
        merchantBalances: merchants.map((m) => ({
          merchant: {
            id: m.id,
            user: { name: m.user.name },
            companyName: m.companyName,
          },
          balance: m.balance,
          totalEarned: m.totalEarned
        })),
        deliveryMenBalances: deliveryMen.map((dm) => ({
          deliveryMan: {
            id: dm.id,
            user: { name: dm.user.name }
          },
          totalEarned: dm.totalEarned
        })),
        transactions
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching financial data:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}
