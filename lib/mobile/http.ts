import { NextResponse } from "next/server"

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init })
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status })
}

export function getClientIpFromRequest(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwardedFor) return forwardedFor.split(",")[0].trim()
  if (realIP) return realIP.trim()
  return "unknown"
}

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null

  const [type, token] = authHeader.split(" ")
  if (type?.toLowerCase() !== "bearer" || !token) return null
  return token
}
