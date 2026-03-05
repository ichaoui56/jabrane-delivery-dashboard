"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMerchantDashboardData } from "@/lib/actions/dashboard.actions"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "./optimized-image"

type DashboardData = Awaited<ReturnType<typeof getMerchantDashboardData>>

export function MerchantDashboard() {
  const [data, setData] = useState<DashboardData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getMerchantDashboardData()
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#048dba]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">فشل في تحميل البيانات</p>
      </div>
    )
  }

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
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">مرحباً، {data.merchant.user.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                numberingSystem: "latn",
              })}
            </p>
          </div>
          <Button asChild className="bg-[#048dba] hover:bg-[#037099] w-full sm:w-auto">
            <Link href="/merchant/orders/create">
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إنشاء طلب جديد
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        {/* Orders Card */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">إجمالي</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{data.stats.orders.total}</h3>
            <p className="text-sm text-gray-600 mb-4">طلب</p>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-xs text-gray-600">{data.stats.orders.pending}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600">{data.stats.orders.delivered}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600">{data.stats.orders.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">مبيعات</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{data.stats.revenue.total.toFixed(0)}</h3>
            <p className="text-sm text-gray-600 mb-4">درهم</p>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">قيد الانتظار</span>
                <span className="text-xs font-semibold text-yellow-600">
                  {data.stats.revenue.pending.toFixed(0)} د.م
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">مخزون</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{data.stats.products.total}</h3>
            <p className="text-sm text-gray-600 mb-4">منتج</p>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">إجمالي القطع</span>
                <span className="text-xs font-semibold text-gray-900">{data.stats.products.totalStock}</span>
              </div>
              {data.stats.products.lowStock > 0 && (
                <div className="flex items-center gap-1.5 text-orange-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium">{data.stats.products.lowStock} مخزون منخفض</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="border-l-4 border-l-[#048dba] hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#048dba]/10">
                <svg className="w-6 h-6 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">رصيد</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{data.stats.payments.currentBalance.toFixed(0)}</h3>
            <p className="text-sm text-gray-600 mb-4">درهم</p>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">تم الدفع</span>
                <span className="text-xs font-semibold text-[#048dba]">
                  {data.stats.payments.totalPaid.toFixed(0)} د.م
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Sales Trend - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">اتجاه المبيعات</CardTitle>
                <CardDescription className="text-sm">آخر 7 أيام</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#048dba]" />
                  <span className="text-gray-600">الإيرادات</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 flex items-end justify-between gap-2 sm:gap-3">
              {data.last7Days.map((day, idx) => {
                const maxRevenue = Math.max(...data.last7Days.map((d) => d.revenue), 1)
                const height = (day.revenue / maxRevenue) * 100

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                    {/* Tooltip value */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {day.revenue.toFixed(0)} د.م
                    </div>

                    {/* Bar */}
                    <div className="relative w-full flex flex-col items-center">
                      <div
                        className="w-full bg-[#048dba] rounded-t-lg hover:bg-[#037099] transition-all cursor-pointer relative"
                        style={{ height: `${Math.max(height, 8)}%`, minHeight: height > 0 ? "32px" : "8px" }}
                      >
                        {/* Orders count badge */}
                        {day.orders > 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                            {day.orders}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date label */}
                    <div className="text-xs text-gray-600 font-medium">{day.date}</div>
                  </div>
                )
              })}
            </div>

            {/* Summary below chart */}
            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">إجمالي الطلبات</p>
                <p className="text-xl font-bold text-gray-900">
                  {data.last7Days.reduce((sum, d) => sum + d.orders, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">إجمالي الإيرادات</p>
                <p className="text-xl font-bold text-gray-900">
                  {data.last7Days.reduce((sum, d) => sum + d.revenue, 0).toFixed(0)} د.م
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Selling Products - 1/3 width */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-bold">الأكثر مبيعاً</CardTitle>
            <CardDescription className="text-sm">أفضل 5 منتجات</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {data.bestSellingProducts.length > 0 ? (
                data.bestSellingProducts.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Rank badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
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
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
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
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">{item.product.name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600">{item.quantity} قطعة</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#048dba] font-medium">{item.revenue.toFixed(0)} د.م</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">لا توجد مبيعات بعد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">الطلبات الأخيرة</CardTitle>
              <CardDescription className="text-sm">آخر 5 طلبات تم إنشاؤها</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
              <Link href="/merchant/orders">
                عرض جميع الطلبات
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/merchant/orders`}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-[#048dba] hover:bg-[#048dba]/5 transition-all group"
                >
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:overflow-visible sm:flex-shrink-0 -mx-1 px-1">
                    {order.orderItems.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="relative w-14 h-14 sm:w-12 sm:h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm"
                        style={{ marginLeft: idx > 0 ? "-12px" : "0", zIndex: 3 - idx }}
                      >
                        {item.product.image ? (
                          <OptimizedImage
                            src={item.product.image}
                            alt={item.product.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-600 flex-shrink-0 border-2 border-white shadow-sm"
                        style={{ marginLeft: "-12px", zIndex: 0 }}
                      >
                        +{order.orderItems.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{order.orderCode}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="text-xs sm:text-sm truncate">{order.customerName}</span>
                      </div>
                      <span className="hidden sm:inline text-gray-400">•</span>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-right">
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{order.totalPrice.toFixed(2)} د.م</p>
                      <p className="text-xs text-gray-500">{order.orderItems.length} منتج</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-[#048dba] transition-colors flex-shrink-0"
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
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-base font-medium text-gray-900 mb-1">لا توجد طلبات بعد</p>
                <p className="text-sm text-gray-500">ابدأ بإنشاء أول طلب لك</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/merchant/inventory"
          className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">إدارة المخزون</h3>
          <p className="text-sm text-gray-600">عرض وتعديل المنتجات</p>
        </Link>

        <Link
          href="/merchant/transfer-products"
          className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">نقل المنتجات</h3>
          <p className="text-sm text-gray-600">إرسال منتجات للمخزن</p>
        </Link>

        <Link
          href="/merchant/payments"
          className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">المدفوعات</h3>
          <p className="text-sm text-gray-600">تتبع الأرباح والمدفوعات</p>
        </Link>

        <Link
          href="/merchant/support"
          className="group p-6 border-2 border-gray-200 rounded-xl hover:border-[#048dba] hover:bg-[#048dba]/5 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-[#048dba]/10 group-hover:bg-[#048dba]/20 transition-colors">
              <svg className="w-6 h-6 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-[#048dba] transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">الدعم الفني</h3>
          <p className="text-sm text-gray-600">تواصل معنا للمساعدة</p>
        </Link>
      </div>
    </div>
  )
}
