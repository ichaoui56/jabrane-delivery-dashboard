import { SignJWT, jwtVerify } from "jose"

export type MobileJwtPayload = {
  userId: number
  role: "DELIVERYMAN"
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error("Missing MOBILE_JWT_SECRET (or JWT_SECRET) env var")
  }
  return new TextEncoder().encode(secret)
}

export async function signMobileJwt(payload: MobileJwtPayload, expiresIn: string = "30d") {
  const secret = getJwtSecret()

  return await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function verifyMobileJwt(token: string): Promise<MobileJwtPayload> {
  const secret = getJwtSecret()
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  })

  const sub = payload.sub
  const role = payload.role

  const userId = typeof sub === "string" ? Number.parseInt(sub, 10) : NaN
  if (!Number.isFinite(userId)) {
    throw new Error("Invalid token subject")
  }

  if (role !== "DELIVERYMAN") {
    throw new Error("Invalid token role")
  }

  return { userId, role }
}
