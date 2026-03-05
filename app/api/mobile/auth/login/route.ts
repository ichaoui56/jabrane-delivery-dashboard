import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { mobileSignInSchema } from "@/lib/zod"
import { signMobileJwt } from "@/lib/mobile/jwt"
import { checkRateLimit } from "@/lib/mobile/rate-limit"
import { getClientIpFromRequest, jsonError, jsonOk } from "@/lib/mobile/http"
import { Phone } from "lucide-react"

export async function POST(request: Request) {
  try {
    const ip = getClientIpFromRequest(request)
    const body = await request.json().catch(() => null)

    const parsed = mobileSignInSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError("Invalid input", 400, { errors: parsed.error.flatten().fieldErrors })
    }

    const { email, password } = parsed.data

    if (!checkRateLimit(ip, 10, 15 * 60 * 1000) || !checkRateLimit(email, 10, 15 * 60 * 1000)) {
      return jsonError("Too many attempts", 429)
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        phone: true,
        role: true,
        deliveryMan: {
          select: {
            id: true,
            city: true,
            vehicleType: true,
            active: true,
          },
        },
      },
    })

    if (!user || user.role !== "DELIVERYMAN" || !user.deliveryMan) {
      return jsonError("Invalid credentials", 401)
    }

    if (!user.deliveryMan.active) {
      return jsonError("Delivery man inactive", 403)
    }

    const valid = verifyPassword(password, user.password)
    if (!valid) {
      return jsonError("Invalid credentials", 401)
    }

    const token = await signMobileJwt({ userId: user.id, role: "DELIVERYMAN" })

    return jsonOk({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "DELIVERYMAN",
        deliveryMan: user.deliveryMan,
      },
    })
  } catch (e) {
    console.error("/api/mobile/auth/login error", e)

    const message = e instanceof Error ? e.message : ""
    if (message.includes("Missing MOBILE_JWT_SECRET") || message.includes("Missing JWT_SECRET")) {
      return jsonError("Server misconfigured", 500)
    }

    return jsonError("Internal Server Error", 500)
  }
}
