import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { verifyPassword } from "./lib/password"
import { getUserFromDb } from "./lib/auth-db"
import { CredentialsSignin } from "next-auth"
import { signInSchema } from "./lib/zod"

const loginAttempts = new Map()

function getClientIP(request?: Request): string {
  try {
    if (!request) return "unknown"

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      authorize: async (credentials, request) => {
        const ip = getClientIP(request)
        const now = Date.now()
        const windowTime = 15 * 60 * 1000
        const maxAttempts = 10

        try {
          const validatedFields = signInSchema.safeParse(credentials)

          if (!validatedFields.success) {
            throw new CredentialsSignin("تنسيق الإدخال غير صالح")
          }

          const { email, password } = validatedFields.data

          const sanitizedEmail = email.toLowerCase().trim()

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(sanitizedEmail)) {
            throw new CredentialsSignin("تنسيق البريد الإلكتروني غير صالح")
          }

          const userAttempts = loginAttempts.get(sanitizedEmail) || { count: 0, lastAttempt: 0 }

          if (now - userAttempts.lastAttempt > windowTime) {
            userAttempts.count = 0
          }

          if (userAttempts.count >= maxAttempts) {
            throw new CredentialsSignin("تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة")
          }

          const user = (await Promise.race([
            getUserFromDb(sanitizedEmail),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
          ])) as Awaited<ReturnType<typeof getUserFromDb>>

          if (!user) {
            userAttempts.count += 1
            userAttempts.lastAttempt = now
            loginAttempts.set(sanitizedEmail, userAttempts)

            throw new CredentialsSignin("بيانات الاعتماد غير صالحة")
          }

          const isValidPassword = verifyPassword(password, user.password)
          if (!isValidPassword) {
            userAttempts.count += 1
            userAttempts.lastAttempt = now
            loginAttempts.set(sanitizedEmail, userAttempts)

            throw new CredentialsSignin("بيانات الاعتماد غير صالحة")
          }

          if (user.role === "DELIVERYMAN") {
            throw new CredentialsSignin("لا يمكن لمندوب التوصيل تسجيل الدخول من هذه الصفحة")
          }

          loginAttempts.delete(sanitizedEmail)

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) {
            throw error
          }
          if (error instanceof Error && error.message === "Timeout") {
            throw new CredentialsSignin("انتهت مهلة الخادم. يرجى المحاولة مرة أخرى")
          }
          console.error("Auth error:", error)
          throw new CredentialsSignin("فشل المصادقة")
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role || 'user' // Default role if not provided
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
