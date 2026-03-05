"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "../auth-actions"

export type CityData = {
  name: string
  code: string
  isActive: boolean
}

export async function getCities() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            orders: true,
            deliveryMen: true
          }
        }
      }
    })

    return { success: true, data: cities }
  } catch (error) {
    console.error("[v0] Error fetching cities:", error)
    return { success: false, error: "فشل في جلب المدن" }
  }
}

export async function getCity(id: number) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            deliveryMen: true
          }
        }
      }
    })

    if (!city) {
      return { success: false, error: "المدينة غير موجودة" }
    }

    return { success: true, data: city }
  } catch (error) {
    console.error("[v0] Error fetching city:", error)
    return { success: false, error: "فشل في جلب المدينة" }
  }
}

export async function createCity(data: CityData) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    // Validate data
    if (!data.name.trim() || !data.code.trim()) {
      return { success: false, error: "الاسم والرمز مطلوبان" }
    }

    // Check if city already exists
    const existingCity = await prisma.city.findFirst({
      where: {
        OR: [
          { name: data.name },
          { code: data.code }
        ]
      }
    })

    if (existingCity) {
      return { 
        success: false, 
        error: existingCity.name === data.name 
          ? "اسم المدينة موجود بالفعل"
          : "رمز المدينة موجود بالفعل"
      }
    }

    const city = await prisma.city.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        isActive: data.isActive
      },
      include: {
        _count: {
          select: {
            orders: true,
            deliveryMen: true
          }
        }
      }
    })

    revalidatePath("/admin/cities")
    return { success: true, data: city, message: "تم إضافة المدينة بنجاح" }
  } catch (error) {
    console.error("[v0] Error creating city:", error)
    return { success: false, error: "فشل في إضافة المدينة" }
  }
}

export async function updateCity(id: number, data: Partial<CityData>) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id }
    })

    if (!existingCity) {
      return { success: false, error: "المدينة غير موجودة" }
    }

    // Check for duplicate name/code
    if (data.name || data.code) {
      const duplicate = await prisma.city.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.name ? [{ name: data.name }] : []),
            ...(data.code ? [{ code: data.code.toUpperCase() }] : [])
          ]
        }
      })

      if (duplicate) {
        return { 
          success: false, 
          error: duplicate.name === data.name
            ? "اسم المدينة موجود بالفعل"
            : "رمز المدينة موجود بالفعل"
        }
      }
    }

    const city = await prisma.city.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.code && { code: data.code.trim().toUpperCase() }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      include: {
        _count: {
          select: {
            orders: true,
            deliveryMen: true
          }
        }
      }
    })

    revalidatePath("/admin/cities")
    return { success: true, data: city, message: "تم تحديث المدينة بنجاح" }
  } catch (error) {
    console.error("[v0] Error updating city:", error)
    return { success: false, error: "فشل في تحديث المدينة" }
  }
}

export async function deleteCity(id: number) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    // Check if city has orders or delivery men
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            deliveryMen: true
          }
        }
      }
    })

    if (!city) {
      return { success: false, error: "المدينة غير موجودة" }
    }

    if (city._count.orders > 0 || city._count.deliveryMen > 0) {
      return { 
        success: false, 
        error: "لا يمكن حذف المدينة لوجود طلبات أو موظفي توصيل مرتبطين بها"
      }
    }

    await prisma.city.delete({
      where: { id }
    })

    revalidatePath("/admin/cities")
    return { success: true, message: "تم حذف المدينة بنجاح" }
  } catch (error) {
    console.error("[v0] Error deleting city:", error)
    return { success: false, error: "فشل في حذف المدينة" }
  }
}

export async function getActiveCities() {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: "asc" }
    })

    return cities
  } catch (error) {
    console.error("[v0] Error fetching active cities:", error)
    return []
  }
}

export async function getCitiesForSelect() {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: "asc" }
    })

    return cities.map(city => ({
      value: city.id.toString(),
      label: city.name,
      code: city.code
    }))
  } catch (error) {
    console.error("[v0] Error fetching cities for select:", error)
    return []
  }
}

export async function getCityNameById(cityId: number) {
  try {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: { name: true }
    })
    
    return city?.name || ""
  } catch (error) {
    console.error("[v0] Error fetching city name:", error)
    return ""
  }
}

export async function getCityStats() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "غير مصرح" }
    }

    const stats = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        _count: {
          select: {
            orders: {
              where: {
                ...(user.role === "MERCHANT" ? {
                  merchant: {
                    userId: user.id
                  }
                } : {}),
                ...(user.role === "DELIVERYMAN" ? {
                  deliveryMan: {
                    userId: user.id
                  }
                } : {})
              }
            },
            deliveryMen: {
              where: {
                active: true
              }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return { success: true, data: stats }
  } catch (error) {
    console.error("[v0] Error fetching city stats:", error)
    return { success: false, error: "فشل في جلب إحصائيات المدن" }
  }
}

export async function getCityOrdersCount(cityId: number) {
  try {
    const count = await prisma.order.count({
      where: { cityId }
    })
    return count
  } catch (error) {
    console.error("[v0] Error fetching city orders count:", error)
    return 0
  }
}

export async function seedDefaultCities() {
  try {
    const defaultCities = [
      { name: "الداخلة", code: "DA", isActive: true },
      { name: "بوجدور", code: "BO", isActive: true },
      { name: "العيون", code: "LA", isActive: true }
    ]

    for (const cityData of defaultCities) {
      await prisma.city.upsert({
        where: { name: cityData.name },
        update: {},
        create: cityData
      })
    }

    return { success: true, message: "تم إضافة المدن الافتراضية بنجاح" }
  } catch (error) {
    console.error("[v0] Error seeding default cities:", error)
    return { success: false, error: "فشل في إضافة المدن الافتراضية" }
  }
}