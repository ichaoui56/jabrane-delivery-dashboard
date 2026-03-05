import { prisma } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"

export async function GET(request: Request) {
  try {
    const { deliveryMan } = await requireDeliveryManAuth(request)

    // Get current month range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Total statistics - only for orders assigned to this delivery man
    const totalOrders = await prisma.order.count({
      where: {
        deliveryManId: deliveryMan.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const deliveredOrders = await prisma.order.count({
      where: {
        deliveryManId: deliveryMan.id,
        status: "DELIVERED",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const cancelledOrders = await prisma.order.count({
      where: {
        deliveryManId: deliveryMan.id,
        status: { in: ["CANCELLED", "REJECTED"] },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const DELAYOrders = await prisma.order.count({
      where: {
        deliveryManId: deliveryMan.id,
        status: "DELAYED",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Total earnings - only from orders assigned to this delivery man
    const earningsResult = await prisma.order.aggregate({
      where: {
        deliveryManId: deliveryMan.id,
        status: "DELIVERED",
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        totalPrice: true
      }
    })

    // Average delivery time (simplified - in minutes)
    const deliveredOrdersWithTime = await prisma.order.findMany({
      where: {
        deliveryManId: deliveryMan.id,
        status: "DELIVERED",
        deliveredAt: { not: null },
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        createdAt: true,
        deliveredAt: true
      }
    })

    let avgDeliveryTime = "N/A"
    if (deliveredOrdersWithTime.length > 0) {
      const totalMinutes = deliveredOrdersWithTime.reduce((sum, order) => {
        if (order.deliveredAt) {
          const diff = order.deliveredAt.getTime() - order.createdAt.getTime()
          return sum + Math.round(diff / (1000 * 60)) // Convert to minutes
        }
        return sum
      }, 0)
      
      const average = Math.round(totalMinutes / deliveredOrdersWithTime.length)
      avgDeliveryTime = `${average}min`
    }

    // Success rate
    const successRate = totalOrders > 0 
      ? Math.round((deliveredOrders / totalOrders) * 100)
      : 0

    // Current streak (consecutive days with deliveries)
    const streakData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        deliveryManId: deliveryMan.id,
        status: "DELIVERED",
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30) // Last 30 days
        }
      },
      _count: true
    })

    let currentStreak = 0
    let currentDate = new Date(now.setHours(0, 0, 0, 0))
    
    for (let i = 0; i < 30; i++) {
      const hasDelivery = streakData.some(order => {
        const orderDate = new Date(order.createdAt).setHours(0, 0, 0, 0)
        return orderDate === currentDate.getTime()
      })
      
      if (hasDelivery) {
        currentStreak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return jsonOk({
      stats: {
        totalOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        DELAYED: DELAYOrders,
        totalEarnings: earningsResult._sum.totalPrice || 0,
        avgDeliveryTime,
        successRate,
        currentStreak,
        month: now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
      }
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return jsonError("Failed to fetch statistics", 500)
  }
}