"use server"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "./auth-actions"
import { cache } from "react"

export type PaymentData = {
  totalRevenue: number
  currentBalance: number
  totalPaidByAdmin: number
  merchantBaseFee: number
  totalAmountOwedByAdmin: number
  totalAmountOwedToCompany: number
  paymentHistory: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    transferDate: Date
    invoiceImage: string | null
    createdAt: Date
  }>
  deliveredOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    customerPhone: string
    totalPrice: number
    merchantEarning: number
    paymentMethod: "COD" | "PREPAID"
    deliveredAt: Date | null
    orderItems: Array<{
      id: number
      quantity: number
      price: number
      product: {
        id: number
        name: string
        image: string | null
      }
    }>
  }>
  pendingOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    merchantEarning: number
    paymentMethod: "COD" | "PREPAID"
    createdAt: Date
    status: string
  }>
  monthlyEarnings: Array<{
    month: string
    amount: number
    count: number
  }>
}

export const getMerchantPaymentData = cache(async (): Promise<{ success: boolean; data?: PaymentData; error?: string }> => {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: "غير مصرح" }

    const merchant = await prisma.merchant.findUnique({
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
    })

    if (!merchant) return { success: false, error: "التاجر غير موجود" }

    // Get delivered orders with full details
    const deliveredOrders = await prisma.order.findMany({
      where: {
        merchantId: merchant.id,
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
        createdAt: true,
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
        },
      },
      orderBy: { deliveredAt: 'desc' },
    })

    // Get pending orders (not yet delivered)
    const pendingOrders = await prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        status: { not: 'DELIVERED' },
      },
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        totalPrice: true,
        merchantEarning: true,
        paymentMethod: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get payment history
    const paymentHistory = await prisma.moneyTransfer.findMany({
      where: { merchantId: merchant.id },
      orderBy: { transferDate: 'desc' },
      take: 20,
    })

    // Calculate aggregates
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

    // Calculate monthly earnings for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyOrders = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        merchantId: merchant.id,
        status: 'DELIVERED',
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _sum: {
        totalPrice: true,
        merchantEarning: true,
      },
      _count: true,
    })

    // Group by month
    const monthlyMap = new Map<string, { amount: number; count: number }>()
    monthlyOrders.forEach(item => {
      const month = item.createdAt.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' })
      const current = monthlyMap.get(month) || { amount: 0, count: 0 }
      monthlyMap.set(month, {
        amount: current.amount + (item._sum.merchantEarning || 0),
        count: current.count + (item._count || 0)
      })
    })

    const monthlyEarnings = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count
    }))

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
        pendingOrders,
        monthlyEarnings,
      }
    }
  } catch (error) {
    console.error("[v0] Error in getMerchantPaymentData:", error)
    return { success: false, error: "فشل في جلب بيانات المدفوعات" }
  }
})