import { jsonError, jsonOk } from "@/lib/mobile/http"
import { requireDeliveryManAuth } from "@/lib/mobile/deliveryman-auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

type UpdateProfileData = {
  name: string
  phone?: string | null
  image?: string | null
  vehicleType?: string | null
  notificationEnabled?: boolean
}

export async function GET(request: Request) {
  try {
    const ctx = await requireDeliveryManAuth(request)
    
    // Fetch the full user data including notification preferences
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        notificationEnabled: true,
      },
    })

    if (!user) {
      return jsonError("User not found", 404)
    }

    return jsonOk({ 
      user: { 
        ...user,
        deliveryMan: ctx.deliveryMan,
      } 
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return jsonError("حدث خطأ أثناء جلب بيانات الملف الشخصي", 500)
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requireDeliveryManAuth(request)
    const data: UpdateProfileData = await request.json()

    // Validate required fields
    if (!data.name || typeof data.name !== 'string') {
      return jsonError("الاسم مطلوب", 400)
    }

    // Prepare update data
    const updateData: any = {
      name: data.name,
      phone: data.phone ?? null,
      image: data.image ?? null,
    }

    // Update user info and optionally update delivery man info in a transaction
    const [updatedUser, updatedDeliveryMan] = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: ctx.user.id },
        data: {
          name: updateData.name,
          phone: updateData.phone,
          image: updateData.image,
          ...(updateData.notificationEnabled !== undefined && {
            notificationEnabled: updateData.notificationEnabled
          })
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          notificationEnabled: true
        },
      });

      let deliveryMan = null;
      if (data.vehicleType !== undefined) {
        deliveryMan = await tx.deliveryMan.update({
          where: { id: ctx.deliveryMan.id },
          data: {
            vehicleType: data.vehicleType,
          },
        });
      }

      return [user, deliveryMan];
    })

    // Fetch the latest delivery man data
    const deliveryMan = await prisma.deliveryMan.findUnique({
      where: { id: ctx.deliveryMan.id },
      select: {
        id: true,
        vehicleType: true,
        baseFee: true,
        city: true,
        active: true,
      },
    })

    if (!deliveryMan) {
      throw new Error("Delivery man not found")
    }

    return jsonOk({
      user: {
        ...updatedUser,
        deliveryMan,
      },
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return jsonError("حدث خطأ أثناء تحديث الملف الشخصي", 500)
  }
}
