"use server"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { cache } from "react"

export const getMerchantPaymentData = cache(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const [merchant, deliveredOrders] = await Promise.all([
      prisma.merchant.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          companyName: true,
          balance: true,
          totalEarned: true,
          baseFee: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.findMany({
        where: {
          merchant: { userId: user.id },
          status: 'DELIVERED',
        },
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          customerPhone: true,
          totalPrice: true,
          merchantEarning: true,
          paymentMethod: true,
          deliveredAt: true,
          orderItems: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            take: 5,
          },
        },
        orderBy: { deliveredAt: 'desc' },
        take: 20,
      }),
    ])

    if (!merchant) return null

    const [ordersAgg, codAgg, prepaidAgg, transfersAgg] = await Promise.all([
      prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          status: 'DELIVERED',
        },
        _sum: {
          totalPrice: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          status: 'DELIVERED',
          paymentMethod: 'COD',
        },
        _sum: {
          merchantEarning: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          status: 'DELIVERED',
          paymentMethod: 'PREPAID',
        },
        _sum: {
          merchantEarning: true,
        },
      }),
      prisma.moneyTransfer.aggregate({
        where: {
          merchantId: merchant.id,
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    const paymentHistory = await prisma.moneyTransfer.findMany({
      where: { merchantId: merchant.id },
      orderBy: { transferDate: 'desc' },
      take: 20,
    })

    return {
      success: true,
      data: {
        totalRevenue: Number(ordersAgg._sum.totalPrice ?? 0),
        currentBalance: merchant.balance,
        totalPaidByAdmin: Number(transfersAgg._sum.amount ?? 0),
        merchantBaseFee: merchant.baseFee,
        totalAmountOwedByAdmin: Number(codAgg._sum.merchantEarning ?? 0),
        totalAmountOwedToCompany: Math.abs(Number(prepaidAgg._sum.merchantEarning ?? 0)),
        paymentHistory,
        deliveredOrders,
      }
    }
  } catch (error) {
    console.error("[v0] Error in getMerchantPaymentData:", error)
    return { success: false, error: "فشل في جلب بيانات المدفوعات" }
  }
})