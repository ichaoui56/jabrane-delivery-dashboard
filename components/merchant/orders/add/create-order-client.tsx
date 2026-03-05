"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CreateOrderForm } from "@/components/create-order-form"

type Product = any // Use the proper type from your codebase

export function CreateOrderClient({ initialProducts }: { initialProducts: Product[] }) {
  if (initialProducts.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إنشاء طلب جديد</h1>
        </div>

        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">لا توجد منتجات في المخزون</h3>
                <p className="text-gray-500">يجب إضافة منتجات إلى المخزون أولاً قبل إنشاء طلب جديد</p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Link href="/merchant/orders">
                  <Button variant="outline" className="min-h-[44px] bg-transparent">
                    العودة إلى الطلبات
                  </Button>
                </Link>
                <Link href="/merchant/transfer-products">
                  <Button className="bg-[#048dba] hover:bg-[#037ba0] min-h-[44px]">إضافة منتجات</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إنشاء طلب جديد</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CreateOrderForm products={initialProducts} />
        </CardContent>
      </Card>
    </div>
  )
}
