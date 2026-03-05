"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, TruckIcon, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'

type AdminDashboardData = {
  stats: {
    totalMerchants: number
    activeMerchants: number
    totalDeliveryMen: number
    activeDeliveryMen: number
    totalOrders: number
    pendingOrders: number
    deliveredOrders: number
    totalRevenue: number
    totalProducts: number
  }
  recentActivity: Array<{
    id: number
    type: string
    message: string
    createdAt: Date
  }>
}

export function AdminDashboardClient({ initialData }: { initialData: AdminDashboardData | null }) {
  if (!initialData) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  const { stats } = initialData

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المدير</h1>
        <p className="text-gray-500 mt-1">نظرة شاملة على النظام</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">التجار</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMerchants}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.activeMerchants} نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">موظفو التوصيل</CardTitle>
            <TruckIcon className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeliveryMen}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.activeDeliveryMen} نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الطلبات</CardTitle>
            <ShoppingCart className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.pendingOrders} قيد الانتظار</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الإيرادات</CardTitle>
            <DollarSign className="w-5 h-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} د.م</div>
            <p className="text-xs text-gray-500 mt-1">إجمالي الإيرادات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">المنتجات</CardTitle>
            <Package className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-gray-500 mt-1">في النظام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">تم التوصيل</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
            <p className="text-xs text-gray-500 mt-1">طلب مكتمل</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/merchants"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">إدارة التجار</span>
            </a>
            <a
              href="/admin/delivery-men"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TruckIcon className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">إدارة التوصيل</span>
            </a>
            <a
              href="/admin/orders"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">إدارة الطلبات</span>
            </a>
            <a
              href="/admin/finances"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="w-8 h-8 text-teal-600 mb-2" />
              <span className="text-sm font-medium">المالية</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
