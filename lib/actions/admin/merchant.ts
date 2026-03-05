"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function getMerchants() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const merchants = await prisma.merchant.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: merchants }
  } catch (error) {
    console.error("[v0] Error fetching merchants:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getMerchantById(id: number) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح. يجب أن تكون مديرًا." }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        user: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        products: true,
        moneyTransfers: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    return { success: true, data: merchant }
  } catch (error) {
    console.error("[v0] Error fetching merchant:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function createMerchant(data: {
  name: string
  email: string
  phone: string | null
  password: string
  image: string | null
  companyName: string | null
  rib: string | null
  bankName: string | null
  baseFee: number
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const merchant = await prisma.merchant.create({
      data: {
        companyName: data.companyName,
        rib: data.rib,
        bankName: data.bankName,
        baseFee: data.baseFee,
        user: {
          create: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
            role: "MERCHANT",
            image: data.image,
          },
        },
      },
      include: {
        user: true,
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    })

    return { success: true, data: merchant }
  } catch (error) {
    console.error("[v0] Error creating merchant:", error)
    return { success: false, error: "حدث خطأ أثناء إنشاء التاجر" }
  }
}

export async function updateMerchant(merchantId: number, data: {
  name: string
  email: string
  phone: string | null
  image: string | null
  companyName: string | null
  rib: string | null
  bankName: string | null
  baseFee: number
  newPassword?: string | null
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const passwordUpdate = data.newPassword ? await bcrypt.hash(data.newPassword, 10) : null

    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        companyName: data.companyName,
        rib: data.rib,
        bankName: data.bankName,
        baseFee: data.baseFee,
        user: {
          update: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            image: data.image,
            ...(passwordUpdate ? { password: passwordUpdate } : {}),
          },
        },
      },
      include: {
        user: true,
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    })

    return { success: true, data: merchant }
  } catch (error) {
    console.error("[v0] Error updating merchant:", error)
    return { success: false, error: "حدث خطأ أثناء تحديث البيانات" }
  }
}

export async function getMerchantDetails(merchantId: number) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        user: true,
        products: {
          orderBy: { createdAt: "desc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        moneyTransfers: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    })

    if (!merchant) {
      return { success: false, error: "التاجر غير موجود" }
    }

    return { success: true, data: merchant }
  } catch (error) {
    console.error("[v0] Error fetching merchant details:", error)
    return { success: false, error: "حدث خطأ أثناء جلب البيانات" }
  }
}

export async function getMerchantDetail(merchantId: number) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, message: "غير مصرح" }
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            createdAt: true,
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            image: true,
            stockQuantity: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        orders: {
          select: {
            id: true,
            orderCode: true,
            customerName: true,
            totalPrice: true,
            merchantEarning: true,
            status: true,
            city: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        productTransfers: {
          select: {
            id: true,
            transferCode: true,
            status: true,
            createdAt: true,
            transferItems: {
              select: {
                quantity: true,
                product: {
                  select: {
                    name: true,
                    image: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!merchant) {
      return { success: false, message: "التاجر غير موجود" }
    }

    const moneyTransfers = await prisma.moneyTransfer.findMany({
      where: { 
        merchantId: merchantId,
      },
      select: {
        id: true,
        amount: true,
        reference: true,
        note: true,
        invoiceImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: { ...merchant, moneyTransfers } }
  } catch (error) {
    console.error("[v0] Error fetching merchant detail:", error)
    return { success: false, message: "حدث خطأ أثناء جلب بيانات التاجر" }
  }
}

export async function addMoneyTransfer(merchantId: number, data: {
  amount: number
  reference: string | null
  note: string | null
  invoiceImage: string | null
}) {
  try {
    console.log("[v0] addMoneyTransfer called with:", { merchantId, data })
    
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.log("[v0] Unauthorized: User role is", session?.user?.role)
      return { success: false, error: "غير مصرح" }
    }

    const transfer = await prisma.$transaction(async (tx:any) => {
      console.log("[v0] Creating money transfer in database...")
      const moneyTransfer = await tx.moneyTransfer.create({
        data: {
          merchantId,
          amount: data.amount,
          reference: data.reference,
          note: data.note,
          invoiceImage: data.invoiceImage,
        },
      })
      console.log("[v0] Money transfer created:", moneyTransfer)

      console.log("[v0] Updating merchant balance...")
      await tx.merchant.update({
        where: { id: merchantId },
        data: {
          balance: {
            decrement: data.amount,
          },
        },
      })
      console.log("[v0] Merchant balance updated")

      return moneyTransfer
    })

    console.log("[v0] Transaction completed successfully")
    return { success: true, data: transfer }
  } catch (error) {
    console.error("[v0] Error adding money transfer:", error)
    return { success: false, error: "حدث خطأ أثناء إضافة الدفعة" }
  }
}
