import { prisma } from "@/lib/db"
import { getBearerToken } from "@/lib/mobile/http"
import { verifyMobileJwt } from "@/lib/mobile/jwt"

export type DeliveryManAuthContext = {
  user: {
    id: number
    name: string
    email: string
    role: "DELIVERYMAN"
  }
  deliveryMan: {
    id: number
    city: string | null
    vehicleType: string | null
    active: boolean
    baseFee: number
  }
}

export async function requireDeliveryManAuth(request: Request): Promise<DeliveryManAuthContext> {
  const token = getBearerToken(request)
  if (!token) {
    throw new Error("Missing bearer token")
  }

  const payload = await verifyMobileJwt(token)
  if (payload.role !== "DELIVERYMAN") {
    throw new Error("Forbidden")
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      deliveryMan: {
        select: {
          id: true,
          city: true,
          vehicleType: true,
          active: true,
          baseFee: true,
        },
      },
    },
  })

  if (!user || user.role !== "DELIVERYMAN" || !user.deliveryMan) {
    throw new Error("Unauthorized")
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "DELIVERYMAN",
    },
    deliveryMan: user.deliveryMan,
  }
}
