"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "@/components/optimized-image"
import { DashboardData } from "@/types/types"

export function MerchantDashboardClient({ initialData }: { initialData: DashboardData }) {
  const data = initialData

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "قيد الانتظار", variant: "secondary" },
      ACCEPTED: { label: "مقبول", variant: "default" },
      ASSIGNED_TO_DELIVERY: { label: "تم التعيين", variant: "default" },
      IN_TRANSIT: { label: "في الطريق", variant: "default" },
      DELIVERED: { label: "تم التسليم", variant: "default" },
      CANCELLED: { label: "ملغي", variant: "destructive" },
      REJECTED: { label: "مرفوض", variant: "destructive" },
    }

    const config = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={config.variant} className="text-xs px-1.5 py-0 h-5">{config.label}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-8">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 -mx-2 sm:-mx-4 lg:-mx-6 px-2 sm:px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              مرحباً، {data.merchant.user.name}
            </h1>
            <p className="text-xs xs:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                numberingSystem: "latn",
              })}
            </p>
          </div>
          <Button asChild className="bg-[#048dba] hover:bg-[#037099] w-full xs:w-auto text-xs sm:text-sm h-9 sm:h-10">
            <Link href="/merchant/orders/add" className="flex items-center justify-center gap-1 sm:gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="truncate">إنشاء طلب جديد</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Ultra responsive grid */}
      <div className="grid gap-2 xs:gap-3 sm:gap-4 grid-cols-2 xxs:grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* Orders Card */}
        <Card className="border-l-2 xs:border-l-4 border-l-blue-500 hover:shadow-md transition-shadow min-w-0">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between mb-2 xs:mb-3 sm:mb-4">
              <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-blue-50">
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <span className="text-[10px] xs:text-xs font-medium text-gray-500 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full whitespace-nowrap">إجمالي</span>
            </div>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5 xs:mb-1 truncate">{data.stats.orders.total}</h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-2 xs:mb-3 sm:mb-4 truncate">طلب</p>
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 pt-2 xs:pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 xs:gap-1.5 min-w-0">
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-yellow-500 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs text-gray-600 truncate">{data.stats.orders.pending}</span>
              </div>
              <div className="flex items-center gap-1 xs:gap-1.5 min-w-0">
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs text-gray-600 truncate">{data.stats.orders.delivered}</span>
              </div>
              <div className="flex items-center gap-1 xs:gap-1.5 min-w-0">
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-[10px] xs:text-xs text-gray-600 truncate">{data.stats.orders.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="border-l-2 xs:border-l-4 border-l-green-500 hover:shadow-md transition-shadow min-w-0">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between mb-2 xs:mb-3 sm:mb-4">
              <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-green-50">
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-[10px] xs:text-xs font-medium text-gray-500 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full whitespace-nowrap">مبيعات</span>
            </div>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5 xs:mb-1 truncate">{data.stats.revenue.total.toFixed(0)}</h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-2 xs:mb-3 sm:mb-4 truncate">درهم</p>
            <div className="pt-2 xs:pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-600 truncate">قيد الانتظار</span>
                <span className="text-[10px] xs:text-xs font-semibold text-yellow-600 whitespace-nowrap">
                  {data.stats.revenue.pending.toFixed(0)} د.م
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="border-l-2 xs:border-l-4 border-l-purple-500 hover:shadow-md transition-shadow min-w-0">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between mb-2 xs:mb-3 sm:mb-4">
              <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-purple-50">
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <span className="text-[10px] xs:text-xs font-medium text-gray-500 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full whitespace-nowrap">مخزون</span>
            </div>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5 xs:mb-1 truncate">{data.stats.products.total}</h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-2 xs:mb-3 sm:mb-4 truncate">منتج</p>
            <div className="pt-2 xs:pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1 xs:mb-2">
                <span className="text-[10px] xs:text-xs text-gray-600 truncate">إجمالي القطع</span>
                <span className="text-[10px] xs:text-xs font-semibold text-gray-900 whitespace-nowrap">{data.stats.products.totalStock}</span>
              </div>
              {data.stats.products.lowStock > 0 && (
                <div className="flex items-center gap-1 xs:gap-1.5 text-orange-600">
                  <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[10px] xs:text-xs font-medium truncate">{data.stats.products.lowStock} مخزون منخفض</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="border-l-2 xs:border-l-4 border-l-[#048dba] hover:shadow-md transition-shadow min-w-0">
          <CardContent className="p-3 xs:p-4 sm:p-6">
            <div className="flex items-start justify-between mb-2 xs:mb-3 sm:mb-4">
              <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-[#048dba]/10">
                <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <span className="text-[10px] xs:text-xs font-medium text-gray-500 bg-gray-100 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full whitespace-nowrap">رصيد</span>
            </div>
            <h3 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5 xs:mb-1 truncate">{data.stats.payments.currentBalance.toFixed(0)}</h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-2 xs:mb-3 sm:mb-4 truncate">درهم</p>
            <div className="pt-2 xs:pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] xs:text-xs text-gray-600 truncate">تم الدفع</span>
                <span className="text-[10px] xs:text-xs font-semibold text-[#048dba] whitespace-nowrap">
                  {data.stats.payments.totalPaid.toFixed(0)} د.م
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Sales Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg font-bold truncate">اتجاه المبيعات</CardTitle>
                <CardDescription className="text-xs sm:text-sm">آخر 7 أيام</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-[#048dba]" />
                  <span className="text-gray-600 whitespace-nowrap">الإيرادات</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-48 xs:h-56 sm:h-64 lg:h-72 flex items-end justify-between gap-1 xs:gap-2 sm:gap-3">
              {data.last7Days.map((day, idx) => {
                const maxRevenue = Math.max(...data.last7Days.map((d) => d.revenue), 1)
                const height = (day.revenue / maxRevenue) * 100

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 xs:gap-3 group min-w-0">
                    {/* Tooltip value */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5 xs:py-1 rounded whitespace-nowrap z-10">
                      {day.revenue.toFixed(0)} د.م
                    </div>

                    {/* Bar */}
                    <div className="relative w-full flex flex-col items-center">
                      <div
                        className="w-full bg-[#048dba] rounded-t-sm xs:rounded-t-lg hover:bg-[#037099] transition-all cursor-pointer relative"
                        style={{ height: `${Math.max(height, 6)}%`, minHeight: height > 0 ? "24px" : "6px" }}
                      >
                        {/* Orders count badge */}
                        {day.orders > 0 && (
                          <div className="absolute -top-4 xs:-top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] xs:text-[10px] px-1 xs:px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {day.orders}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date label */}
                    <div className="text-[10px] xs:text-xs text-gray-600 font-medium text-center leading-tight min-h-[2rem] flex items-center">
                      {day.date}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary below chart */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">إجمالي الطلبات</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {data.last7Days.reduce((sum, d) => sum + d.orders, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">إجمالي الإيرادات</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {data.last7Days.reduce((sum, d) => sum + d.revenue, 0).toFixed(0)} د.م
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Selling Products */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-bold">الأكثر مبيعاً</CardTitle>
            <CardDescription className="text-xs sm:text-sm">أفضل 5 منتجات</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 xs:space-y-4">
              {data.bestSellingProducts.length > 0 ? (
                data.bestSellingProducts.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 xs:gap-3 p-2 xs:p-3 rounded-lg hover:bg-gray-50 transition-colors min-w-0">
                    {/* Rank badge */}
                    <div
                      className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] xs:text-xs font-bold flex-shrink-0 ${
                        idx === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : idx === 1
                            ? "bg-gray-200 text-gray-700"
                            : idx === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Product image */}
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.product.image ? (
                        <OptimizedImage
                          src={item.product.image}
                          alt={item.product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs xs:text-sm font-semibold text-gray-900 truncate mb-0.5">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 xs:gap-2 text-[10px] xs:text-xs">
                        <span className="text-gray-600 whitespace-nowrap">{item.quantity} قطعة</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#048dba] font-medium whitespace-nowrap">{item.revenue.toFixed(0)} د.م</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 xs:py-12">
                  <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto mb-3 xs:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="text-xs xs:text-sm text-gray-500">لا توجد مبيعات بعد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="border-b border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 xs:gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-bold">الطلبات الأخيرة</CardTitle>
              <CardDescription className="text-xs sm:text-sm">آخر 5 طلبات تم إنشاؤها</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto bg-transparent text-xs sm:text-sm h-8 sm:h-9">
              <Link href="/merchant/orders" className="flex items-center justify-center gap-1 sm:gap-2">
                <span className="truncate">عرض جميع الطلبات</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-2 xs:space-y-3">
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/merchant/orders`}
                  className="flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 p-2 xs:p-3 sm:p-4 border border-gray-200 rounded-lg xs:rounded-xl hover:border-[#048dba] hover:bg-[#048dba]/5 transition-all group min-w-0"
                >
                  <div className="flex gap-1 xs:gap-2 overflow-x-auto pb-1 xs:pb-2 sm:pb-0 sm:overflow-visible sm:flex-shrink-0 -mx-1 px-1">
                    {order.orderItems.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="relative w-10 h-10 xs:w-12 xs:h-12 sm:w-12 sm:h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm"
                        style={{ marginLeft: idx > 0 ? "-8px" : "0", zIndex: 3 - idx }}
                      >
                        {item.product.image ? (
                          <OptimizedImage
                            src={item.product.image}
                            alt={item.product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <div
                        className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-gray-200 flex items-center justify-center text-[8px] xs:text-[10px] sm:text-xs font-bold text-gray-600 flex-shrink-0 border-2 border-white shadow-sm"
                        style={{ marginLeft: "-8px", zIndex: 0 }}
                      >
                        +{order.orderItems.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5 xs:space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                      <p className="font-bold text-gray-900 text-sm xs:text-base truncate min-w-0">{order.orderCode}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-1.5 sm:gap-3">
                      <div className="flex items-center gap-1 xs:gap-1.5 text-gray-600 min-w-0">
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-xs xs:text-sm truncate">{order.customerName}</span>
                      </div>
                      <span className="hidden xs:inline text-gray-400">•</span>
                      <div className="flex items-center gap-1 xs:gap-1.5 text-gray-500">
                        <svg className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs">{new Date(order.createdAt).toLocaleDateString("en-US", {
                          numberingSystem: "latn",
                        })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between xs:justify-end gap-2 xs:gap-3 pt-2 xs:pt-3 sm:pt-0 border-t xs:border-t-0 border-gray-100 min-w-0">
                    <div className="text-right min-w-0">
                      <p className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 truncate">{order.totalPrice.toFixed(2)} د.م</p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">{order.orderItems.length} منتج</p>
                    </div>
                    <svg
                      className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 group-hover:text-[#048dba] transition-colors flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 xs:py-16">
                <div className="w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 mx-auto mb-3 xs:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-sm xs:text-base font-medium text-gray-900 mb-1">لا توجد طلبات بعد</p>
                <p className="text-xs xs:text-sm text-gray-500">ابدأ بإنشاء أول طلب لك</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-2 xs:gap-3 sm:gap-4 grid-cols-2 xxs:grid-cols-2 xs:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/merchant/inventory"
          className="group p-3 xs:p-4 sm:p-6 border border-gray-200 rounded-lg xs:rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all min-w-0"
        >
          <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <svg
              className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm xs:text-base mb-0.5 xs:mb-1 truncate">إدارة المخزون</h3>
          <p className="text-xs xs:text-sm text-gray-600 truncate">عرض وتعديل المنتجات</p>
        </Link>

        <Link
          href="/merchant/transfer-products"
          className="group p-3 xs:p-4 sm:p-6 border border-gray-200 rounded-lg xs:rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all min-w-0"
        >
          <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <svg
              className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm xs:text-base mb-0.5 xs:mb-1 truncate">نقل المنتجات</h3>
          <p className="text-xs xs:text-sm text-gray-600 truncate">إرسال منتجات للمخزن</p>
        </Link>

        <Link
          href="/merchant/payments"
          className="group p-3 xs:p-4 sm:p-6 border border-gray-200 rounded-lg xs:rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all min-w-0"
        >
          <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
              <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <svg
              className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm xs:text-base mb-0.5 xs:mb-1 truncate">المدفوعات</h3>
          <p className="text-xs xs:text-sm text-gray-600 truncate">تتبع الأرباح والمدفوعات</p>
        </Link>

        <Link
          href="/merchant/support"
          className="group p-3 xs:p-4 sm:p-6 border border-gray-200 rounded-lg xs:rounded-xl hover:border-[#048dba] hover:bg-[#048dba]/5 transition-all min-w-0"
        >
          <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
            <div className="p-1.5 xs:p-2 sm:p-3 rounded-lg xs:rounded-xl bg-[#048dba]/10 group-hover:bg-[#048dba]/20 transition-colors">
              <svg className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <svg
              className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#048dba] transition-colors flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-sm xs:text-base mb-0.5 xs:mb-1 truncate">الدعم الفني</h3>
          <p className="text-xs xs:text-sm text-gray-600 truncate">تواصل معنا للمساعدة</p>
        </Link>
      </div>
    </div>
  )
}