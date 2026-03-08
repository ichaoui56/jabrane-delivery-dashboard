"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CreateOrderForm } from "@/components/create-order-form"
import { Package } from "lucide-react"

export function CreateOrderClient() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إنشاء طلب جديد</h1>
      </div>

      <Card className="border-2 border-[#048dba]/20 shadow-xl">
        <CardContent className="pt-6">
          <CreateOrderForm />
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">طريقة إنشاء الطلب</p>
            <p className="text-sm text-blue-700 mt-1">
              يمكنك إضافة المنتجات مباشرة أثناء إنشاء الطلب. كل منتج ستقوم بإضافته سيتم حفظه في قاعدة البيانات ويمكنك استخدامه مرة أخرى في طلبات مستقبلية.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}