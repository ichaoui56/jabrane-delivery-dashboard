"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getAdminDashboardStats() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    // Fetch all stats in parallel
    const [merchants, deliveryMen, orders, products] = await Promise.all([
      prisma.merchant.findMany({
        include: { user: true },
      }),
      prisma.deliveryMan.findMany({
        include: { user: true },
      }),
      prisma.order.findMany(),
      prisma.product.findMany(),
    ])

    const totalRevenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, order) => sum + order.totalPrice, 0)

    return {
      success: true,
      data: {
        stats: {
          totalMerchants: merchants.length,
          activeMerchants: merchants.length, // Add your logic for active merchants
          totalDeliveryMen: deliveryMen.length,
          activeDeliveryMen: deliveryMen.filter((d) => d.active).length,
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => o.status === "PENDING").length,
          deliveredOrders: orders.filter((o) => o.status === "DELIVERED").length,
          totalRevenue,
          totalProducts: products.length,
        },
        recentActivity: [],
      },
    }
  } catch (error) {
    console.error("[v0] Error fetching admin dashboard stats:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}
