"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getAdminSettings() {
    try {
        const session = await auth()

        if (!session?.user || session.user.role !== "ADMIN") {
            return { success: false, error: "غير مصرح" }
        }

        const userId = Number.parseInt(session.user.id)

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                admin: true,
            },
        })

        if (!user || !user.admin) {
            return { success: false, error: "المستخدم غير موجود" }
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
                admin: {
                    id: user.admin.id,
                    address: user.admin.address,
                },
            },
        }
    } catch (error) {
        console.error("[v0] Error fetching admin settings:", error)
        return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
    }
}

// Combined update function for both user and admin
export async function updateAdminSettings(data: {
  name: string
  email: string
  phone: string | null
  profileImage: string | null
  address: string | null
  currentPassword?: string // For email/password verification
  newPassword?: string // For password change
  confirmPassword?: string // For password confirmation
}) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error('غير مصرح')
    }

    const userId = Number.parseInt(session.user.id)

    // Get current user to verify password if needed
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true }
    })

    if (!currentUser) {
      throw new Error('المستخدم غير موجود')
    }

    // Check if email is being changed
    const isEmailChanging = data.email !== currentUser.email
    
    if (isEmailChanging) {
      // Require password verification for email changes
      if (!data.currentPassword) {
        throw new Error('الرجاء إدخال كلمة المرور الحالية لتغيير البريد الإلكتروني')
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(data.currentPassword, currentUser.password)
      if (!isPasswordValid) {
        throw new Error('كلمة المرور الحالية غير صحيحة')
      }
    }

    // Check if password is being changed
    const isPasswordChanging = data.newPassword && data.confirmPassword
    
    if (isPasswordChanging) {
      // Validate password change
      if (!data.currentPassword) {
        throw new Error('الرجاء إدخال كلمة المرور الحالية لتغيير كلمة المرور')
      }
      
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين')
      }
      
      if (data.newPassword && data.newPassword.length < 6) {
        throw new Error('كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف')
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(data.currentPassword, currentUser.password)
      if (!isPasswordValid) {
        throw new Error('كلمة المرور الحالية غير صحيحة')
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword!, 10)
      
      // Update user with new password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      })
      
      return { 
        success: true,
        message: 'تم تحديث كلمة المرور بنجاح'
      }
    }

    // Check if new email already exists (only if changing)
    if (isEmailChanging) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true }
      })
      
      if (existingUser && existingUser.id !== userId) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل')
      }
    }

    // Update both user and admin in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          image: data.profileImage,
        },
      }),
      prisma.admin.update({
        where: { userId: userId },
        data: {
          address: data.address,
        },
      }),
    ])

    return { 
      success: true,
      message: isEmailChanging 
        ? 'تم تحديث البيانات بنجاح. يرجى تسجيل الدخول مرة أخرى باستخدام البريد الإلكتروني الجديد.' 
        : 'تم تحديث البيانات بنجاح'
    }
  } catch (error: any) {
    console.error('[v0] Error updating admin settings:', error)
    throw new Error(error.message || 'حدث خطأ أثناء تحديث الإعدادات')
  }
}

// Separate function for changing password only
export async function changeAdminPassword(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  try {
    const session = await auth()

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error('غير مصرح')
    }

    const userId = Number.parseInt(session.user.id)

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    })

    if (!currentUser) {
      throw new Error('المستخدم غير موجود')
    }

    // Validate inputs
    if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
      throw new Error('جميع حقول كلمة المرور مطلوبة')
    }
    
    if (data.newPassword !== data.confirmPassword) {
      throw new Error('كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين')
    }
    
    if (data.newPassword.length < 6) {
      throw new Error('كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف')
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, currentUser.password)
    if (!isPasswordValid) {
      throw new Error('كلمة المرور الحالية غير صحيحة')
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    })
    
    return { 
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    }
  } catch (error: any) {
    console.error('[v0] Error changing password:', error)
    throw new Error(error.message || 'حدث خطأ أثناء تغيير كلمة المرور')
  }
}

// Admin settings types
export interface AdminSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  admin: {
    id: number
    address: string | null
  }
}

export async function fetchAdminSettings() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const userId = Number.parseInt(session.user.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true,
      },
    })

    if (!user || !user.admin) {
      return { success: false, error: "المستخدم غير موجود" }
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
        admin: {
          id: user.admin.id,
          address: user.admin.address,
        },
      },
    }
  } catch (error) {
    console.error("Error fetching admin settings:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getAdminCompanyInfo() {
  try {
    const session = await auth()

    // Allow all authenticated users to see admin info (or adjust as needed)
    if (!session?.user) {
      return { success: false, error: "غير مصرح" }
    }

    // Get the first admin from database
    const admin = await prisma.admin.findFirst({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            image: true,
          }
        },
      },
      orderBy: {
        id: 'asc'
      }
    })

    if (!admin) {
      return { success: false, error: "بيانات المشرف غير موجودة" }
    }

    const companyInfo = {
      companyName: admin.user.name || "Jabrane Delivery",
      email: admin.user.email || "Ahmedjabran588@gmail.com",
      phone: admin.user.phone || "+2120702505050",
      address: admin.address || "السطات - المركز",
    }

    return {
      success: true,
      data: companyInfo,
    }
  } catch (error) {
    console.error("[v0] Error fetching admin display info:", error)
    return { 
      success: false, 
      error: "حدث خطأ أثناء جلب بيانات الشركة",
      data: {
        companyName: "Jabrane Delivery",
        email: "Ahmedjabran588@gmail.com",
        phone: "+2120702505050",
        address: "السطات - المركز",
      }
    }
  }
}