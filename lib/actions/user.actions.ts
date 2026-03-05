"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { cache } from "react"

export const getCurrentUserData = cache(async () => {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "غير مصرح. يرجى تسجيل الدخول." }
    }

    const userId = Number.parseInt(session.user.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
      },
    })

    if (!user) {
      return { success: false, error: "المستخدم غير موجود" }
    }

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error("[v0] Error fetching user data:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
})
