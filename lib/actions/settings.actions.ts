"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getMerchantSettings() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "غير مصرح. يرجى تسجيل الدخول." }
    }

    const userId = Number.parseInt(session.user.id)

    // Fetch user and merchant data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
      },
    })

    if (!user) {
      return { success: false, error: "المستخدم غير موجود" }
    }

    if (!user.merchant) {
      return { success: false, error: "حساب التاجر غير موجود" }
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
        },
        merchant: {
          id: user.merchant.id,
          companyName: user.merchant.companyName,
          rib: user.merchant.rib,
          bankName: user.merchant.bankName,
          balance: user.merchant.balance,
          totalEarned: user.merchant.totalEarned,
          baseFee: user.merchant.baseFee,
        },
      },
    }
  } catch (error) {

    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function updateUserProfile(data: {
  name: string
  phone: string | null
  profileImage: string | null
}) {
  try {

    
    const session = await auth()

    if (!session?.user?.id) {

      return { success: false, error: "غير مصرح. يرجى تسجيل الدخول." }
    }

    const userId = Number.parseInt(session.user.id)


    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        image: data.profileImage,
      },
    })

    return {
      success: true,
      data: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        image: updatedUser.image,
      },
    }
  } catch (error) {


    return { success: false, error: "حدث خطأ أثناء تحديث البيانات" }
  }
}

export async function updateMerchantProfile(data: {
  companyName: string | null
  rib: string | null
  bankName: string | null
}) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "غير مصرح. يرجى تسجيل الدخول." }
    }

    const userId = Number.parseInt(session.user.id)

    // Get merchant ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { merchant: true },
    })

    if (!user?.merchant) {
      return { success: false, error: "حساب التاجر غير موجود" }
    }

    // Update merchant profile
    const updatedMerchant = await prisma.merchant.update({
      where: { id: user.merchant.id },
      data: {
        companyName: data.companyName,
        rib: data.rib,
        bankName: data.bankName,
      },
    })

    return {
      success: true,
      data: {
        companyName: updatedMerchant.companyName,
        rib: updatedMerchant.rib,
        bankName: updatedMerchant.bankName,
      },
    }
  } catch (error) {

    return { success: false, error: "حدث خطأ أثناء تحديث البيانات" }
  }
}
