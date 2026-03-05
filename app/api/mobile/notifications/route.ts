import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"
import { prisma } from "@/lib/db"

export async function PUT(request: Request) {
  try {
    const ctx = await requireDeliveryManAuth(request)
    const { enabled } = await request.json()

    if (typeof enabled !== 'boolean') {
      return jsonError("Invalid notification preference", 400)
    }

    const user = await prisma.user.update({
      where: { id: ctx.user.id },
      data: { notificationEnabled: enabled },
      select: {
        id: true,
        notificationEnabled: true
      }
    })

    return jsonOk({ 
      success: true,
      notificationEnabled: user.notificationEnabled
    })
  } catch (error) {
    console.error("Error updating notification preference:", error)
    return jsonError("Failed to update notification preference", 500)
  }
}

export async function GET(request: Request) {
  try {
    const ctx = await requireDeliveryManAuth(request)
    
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        notificationEnabled: true
      }
    })

    if (!user) {
      return jsonError("User not found", 404)
    }

    return jsonOk({ 
      notificationEnabled: user.notificationEnabled ?? true
    })
  } catch (error) {
    console.error("Error fetching notification preference:", error)
    return jsonError("Failed to fetch notification preference", 500)
  }
}
