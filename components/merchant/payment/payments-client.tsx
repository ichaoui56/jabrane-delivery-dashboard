"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedImage } from "@/components/optimized-image"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Eye } from 'lucide-react'

type PaymentData = {
  totalRevenue: number
  currentBalance: number
  totalPaidByAdmin: number
  merchantBaseFee: number
  totalAmountOwedByAdmin: number
  totalAmountOwedToCompany: number
  paymentHistory: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    transferDate: Date
    invoiceImage: string | null
  }>
  deliveredOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    customerPhone: string
    totalPrice: number
    merchantEarning: number
    paymentMethod: "COD" | "PREPAID"
    deliveredAt: Date | null
    orderItems: Array<{
      id: number
      quantity: number
      price: number
      product: {
        id: number
        name: string
        image: string | null
      }
    }>
  }>
}

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PaymentsClient({ initialData }: { initialData: PaymentData }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "payments" | "orders">("all")

  const data = initialData

  const deliveredOrdersCount = data.deliveredOrders.length
  const totalAfterBaseFees = data.totalRevenue - data.merchantBaseFee * deliveredOrdersCount

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredPayments = data.paymentHistory.filter((payment) => {
    if (!normalizedSearch) return true
    const ref = (payment.reference ?? "").toLowerCase()
    const note = (payment.note ?? "").toLowerCase()
    return ref.includes(normalizedSearch) || note.includes(normalizedSearch)
  })

  const filteredOrders = data.deliveredOrders.filter(
    (order) =>
      order.orderCode.toLowerCase().includes(normalizedSearch) ||
      order.customerName.toLowerCase().includes(normalizedSearch),
  )

  const prepaidOrders = filteredOrders.filter((o) => o.paymentMethod === "PREPAID")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">المدفوعات والأرباح</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">إدارة جميع المعاملات المالية والأرباح</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-[#048dba] text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium opacity-90">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(data.totalRevenue)} د.م</div>
            <p className="text-xs opacity-75 mt-1">من جميع الطلبات المسلمة</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium opacity-90">إجمالي بعد الرسوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(totalAfterBaseFees)} د.م</div>
            <p className="text-xs opacity-75 mt-1">
              ({formatNumber(data.merchantBaseFee)} د.م × {deliveredOrdersCount} طلب)
            </p>
          </CardContent>
        </Card>
        <Card
          className={`border-0 ${data.currentBalance >= 0
              ? "bg-green-500"
              : "bg-red-500"
            } text-white`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium opacity-90">
              {data.currentBalance >= 0 ? "سيتم دفعه لك" : "مستحق عليك"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.currentBalance >= 0 ? "+" : ""}
              {formatNumber(data.currentBalance)} د.م
            </div>
            <p className="text-xs opacity-75 mt-1">
              {data.currentBalance >= 0 ? `رسوم الشركة: ${formatNumber(data.merchantBaseFee)} د.م/طلب` : "يجب تسديد المبلغ للشركة"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium opacity-90">المبلغ المستلم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatNumber(data.totalPaidByAdmin)} د.م</div>
            <p className="text-xs opacity-75 mt-1">تم استلامه من الإدارة</p>
          </CardContent>
        </Card>


      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">طلبات الدفع عند الاستلام (COD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-1">+{formatNumber(data.totalAmountOwedByAdmin)} د.م</div>
           
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">طلبات الدفع المسبق (PREPAID)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-1">-{formatNumber(data.totalAmountOwedToCompany)} د.م</div>
            
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">السجل المالي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="بحث برقم الطلب، المرجع، أو العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className="whitespace-nowrap min-w-[80px] text-sm"
              >
                الكل ({data.paymentHistory.length + data.deliveredOrders.length})
              </Button>
              <Button
                variant={filterType === "payments" ? "default" : "outline"}
                onClick={() => setFilterType("payments")}
                className="whitespace-nowrap min-w-[80px] text-sm"
              >
                التحويلات ({data.paymentHistory.length})
              </Button>
              <Button
                variant={filterType === "orders" ? "default" : "outline"}
                onClick={() => setFilterType("orders")}
                className="whitespace-nowrap min-w-[80px] text-sm"
              >
                الطلبات ({data.deliveredOrders.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {(filterType === "all" || filterType === "payments") && filteredPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              سجل التحويلات المالية ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPayments.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          تحويل مالي
                        </Badge>
                        {transfer.reference && (
                          <span className="text-xs text-gray-500 truncate font-mono">المرجع: {transfer.reference}</span>
                        )}
                      </div>
                      {transfer.note && <p className="text-sm text-gray-600 mt-1">{transfer.note}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(transfer.transferDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          numberingSystem: "latn",
                        })}
                      </p>
                    </div>
                    <div className="text-right sm:text-left shrink-0">
                      <div className="text-lg sm:text-xl font-bold text-green-600">+{formatNumber(transfer.amount)} د.م</div>
                    </div>
                  </div>

                  {transfer.invoiceImage && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        صورة الفاتورة:
                      </p>
                      <a
                        href={transfer.invoiceImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <img
                          src={transfer.invoiceImage || "/placeholder.svg"}
                          alt="فاتورة الدفع"
                          className="w-full max-w-xs rounded-lg border-2 border-gray-200 hover:border-[#048dba] transition-colors cursor-pointer group-hover:shadow-lg"
                        />
                        <p className="text-xs text-[#048dba] mt-1 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          اضغط للعرض بالحجم الكامل
                        </p>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders History */}
      {(filterType === "all" || filterType === "orders") && filteredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              سجل الطلبات المسلمة ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className="bg-[#048dba] text-white">{order.orderCode}</Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          تم التسليم
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            order.paymentMethod === "COD"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }
                        >
                          {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.customerPhone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        تم التسليم:{" "}
                        {order.deliveredAt
                          ? new Date(order.deliveredAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            numberingSystem: "latn",
                          })
                          : "غير محدد"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-medium text-gray-500">السعر الكلي</div>
                      <div className="text-lg font-bold text-gray-900">{formatNumber(order.totalPrice)} د.م</div>
                      <div
                        className={`text-sm font-medium mt-1 ${order.merchantEarning >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {order.merchantEarning >= 0 ? "ربحك: +" : "مستحق عليك: "}
                        {formatNumber(Math.abs(order.merchantEarning))} د.م
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.paymentMethod === "COD"
                          ? `رسوم الشركة: ${formatNumber(data.merchantBaseFee)} د.م`
                          : `رسوم مستحقة: ${formatNumber(data.merchantBaseFee)} د.م`}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-3 space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product.image && (
                          <OptimizedImage
                            src={item.product.image}
                            alt={item.product.name}
                            width={40}
                            height={40}
                            className="rounded object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × قطعة
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {((filterType === "payments" && filteredPayments.length === 0) ||
        (filterType === "orders" && filteredOrders.length === 0) ||
        (filterType === "all" && filteredPayments.length === 0 && filteredOrders.length === 0)) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-center">
                لا توجد {filterType === "payments" ? "تحويلات مالية" : "طلبات"} متاحة
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
