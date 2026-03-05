"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Archive } from 'lucide-react'
import { InventoryTable } from "@/components/inventory-table"

type InventoryStats = {
  totalProducts: number
  activeProducts: number
  totalStockQuantity: number
  totalInventoryValue: number
  totalDeliveredItems: number
  lowStockProducts: number
  outOfStockProducts: number
}

type Product = any

export function InventoryClient({
  initialProducts,
  initialStats,
}: {
  initialProducts: Product[]
  initialStats: InventoryStats | null
}) {
  const products = initialProducts
  const stats = initialStats
  console.log("stats",stats)

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">إدارة المخزون</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1">
          عرض شامل للمخزون المتوفر في مستودع الشركة
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900 mt-1">
                      {stats.totalProducts}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md text-center">
                  <span>{stats.activeProducts}</span> نشط
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-teal-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg flex items-center justify-center">
                    <Archive className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm font-medium text-gray-600">إجمالي الكميات</p>
                    <p className="text-lg md:text-xl font-bold text-teal-700 mt-1">
                      {stats.totalStockQuantity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-1 rounded-md text-center">
                  قطعة
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm font-medium text-gray-600">تم التوصيل</p>
                    <p className="text-lg md:text-xl font-bold text-green-700 mt-1">
                      {stats.totalDeliveredItems.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md text-center">
                  قطعة
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 md:w-5 md-h-5 text-yellow-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm font-medium text-gray-600">مخزون منخفض</p>
                    <p className="text-lg md:text-xl font-bold text-yellow-700 mt-1">
                      {stats.lowStockProducts}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md text-center">
                  منتج
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && (stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-md transition-all">
          <CardContent className="p-4 md:p-5 flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-yellow-900 mb-1 text-sm md:text-base">تنبيه المخزون</p>
              <p className="text-xs md:text-sm text-yellow-800 leading-relaxed">
                {stats.lowStockProducts > 0 && (
                  <span>
                    <span className="font-bold">{stats.lowStockProducts}</span> منتج يحتاج إلى إعادة تعبئة
                    {stats.outOfStockProducts > 0 && " و "}
                  </span>
                )}
                {stats.outOfStockProducts > 0 && (
                  <span>
                    <span className="font-bold">{stats.outOfStockProducts}</span> منتج نفذ من المخزون
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {products && products.length > 0 ? (
        <InventoryTable products={products} />
      ) : (
        <Card className="hover:shadow-md transition-all">
          <CardContent className="py-12 md:py-16">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
              </div>
              <p className="text-lg md:text-xl font-medium mb-2">لا توجد منتجات</p>
              <p className="text-xs md:text-sm">ابدأ بإنشاء شحنة منتجات جديدة لإضافة منتجات إلى المخزون</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}