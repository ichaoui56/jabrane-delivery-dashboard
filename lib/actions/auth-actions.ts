"use server"
import { signInSchema } from "@/lib/zod"
import { auth, signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { headers } from "next/headers"
import db from "../db"

export type FormState = {
  errors?: {
    email?: string[]
    password?: string[]
  }
  message?: string
  values?: {
    email?: string
    password?: string
  }
  success?: boolean
  redirectUrl?: string
}

const rateLimitStore = new Map()

function getClientIP(): string {
  try {
    const headersList = headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const realIP = headersList.get("x-real-ip")

    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim()
    }

    if (realIP) {
      return realIP
    }

    return "unknown"
  } catch (error) {
    console.error("Error getting client IP:", error)
    return "unknown"
  }
}

function checkRateLimit(identifier: string, limit = 10, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  const attempts = rateLimitStore.get(identifier) || []
  const recentAttempts = attempts.filter((timestamp: number) => timestamp > windowStart)

  if (recentAttempts.length >= limit) {
    return false
  }

  recentAttempts.push(now)
  rateLimitStore.set(identifier, recentAttempts)
  return true
}

export async function signInAction(prevState: FormState | null, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const ip = getClientIP()

  const submittedValues = {
    email,
    password,
  }

  try {
    if (!checkRateLimit(ip, 10, 15 * 60 * 1000)) {
      return {
        message: "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة",
        values: submittedValues,
      }
    }

    if (!checkRateLimit(email, 10, 15 * 60 * 1000)) {
      return {
        message: "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة",
        values: submittedValues,
      }
    }

    const validatedFields = signInSchema.safeParse({
      email,
      password,
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        values: submittedValues,
      }
    }

    const userForRoleCheck = await db.user.findUnique({
      where: { email: validatedFields.data.email.toLowerCase().trim() },
      select: { role: true },
    })

    if (userForRoleCheck?.role === "DELIVERYMAN") {
      return {
        message: "لا يمكن لمندوب التوصيل تسجيل الدخول من هذه الصفحة",
        values: submittedValues,
      }
    }

    const result = await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    })

    if (result?.error) {
      return {
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        values: submittedValues,
      }
    }

    const user = await db.user.findUnique({
      where: { email: validatedFields.data.email },
      select: { role: true },
    })

    const userRole = user?.role

    let redirectUrl = "/dashboard"
    if (userRole === "ADMIN") {
      redirectUrl = "/admin/dashboard"
    } else if (userRole === "DELIVERYMAN") {
      redirectUrl = "/delivery/dashboard"
    } else if (userRole === "MERCHANT") {
      redirectUrl = "/merchant/dashboard"
    }
    
    console.log("[v0] redirectUrl", redirectUrl)
    console.log("[v0] userRole", userRole)
    
    return {
      success: true,
      message: "تم تسجيل الدخول بنجاح!",
      redirectUrl,
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
            values: submittedValues,
          }
        default:
          return {
            message: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
            values: submittedValues,
          }
      }
    }

    console.error("Sign in error:", error)
    return {
      message: "حدث خطأ ما. يرجى المحاولة مرة أخرى",
      values: submittedValues,
    }
  }
}

export async function getCurrentUser() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return null
    }

    const userId = Number.parseInt(session.user.id);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: false, 
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        merchant: session.user.role === 'MERCHANT',
        admin: session.user.role === 'ADMIN',
        deliveryMan: session.user.role === 'DELIVERYMAN',
      },
    });

    
    if (!user) {
      return null
    }

    return user
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
