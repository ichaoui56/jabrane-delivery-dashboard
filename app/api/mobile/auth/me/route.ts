import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const ctx = await requireDeliveryManAuth(request)
    
    // Fetch the complete user data including notification preferences
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        notificationEnabled: true,
        deliveryMan: {
          select: {
            id: true,
            city: true,
            vehicleType: true,
            active: true,
            baseFee: true
          }
        }
      }
    })

    if (!user) {
      return jsonError("User not found", 404)
    }

    return jsonOk({ user })
  } catch (error) {
    console.error("Error in /api/mobile/auth/me:", error)
    return jsonError("Unauthorized", 401)
  }
}
