"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedImage } from "./optimized-image"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getMerchantPaymentData } from "@/lib/actions/payment-actions"
import { useToast } from "@/hooks/use-toast"

export function PaymentsDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "payments" | "orders">("all")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const paymentData = await getMerchantPaymentData()
      setData(paymentData)
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات المالية",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#048dba] mx-auto mb-4"></div>
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">لا توجد بيانات مالية متاحة</p>
      </div>
    )
  }

  const filteredPayments = data.paymentHistory.filter(
    (payment: any) =>
      payment.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.note?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredOrders = data.deliveredOrders.filter(
    (order: any) =>
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Separate COD and PREPAID orders for display
  const codOrders = filteredOrders.filter((o: any) => o.paymentMethod === "COD")
  const prepaidOrders = filteredOrders.filter((o: any) => o.paymentMethod === "PREPAID")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">المدفوعات والأرباح</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">إدارة جميع المعاملات المالية والأرباح</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-[#048dba] to-[#036a8f] text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium opacity-90">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.totalRevenue.toFixed(2)} د.م</div>
            <p className="text-xs opacity-75 mt-1">من جميع الطلبات المسلمة</p>
          </CardContent>
        </Card>

        <Card
          className={`border-0 ${
            data.currentBalance >= 0
              ? "bg-gradient-to-br from-green-500 to-green-600"
              : "bg-gradient-to-br from-red-500 to-red-600"
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
              {data.currentBalance.toFixed(2)} د.م
            </div>
            <p className="text-xs opacity-75 mt-1">
              {data.currentBalance >= 0 ? `رسوم الشركة: ${data.merchantBaseFee} د.م/طلب` : "يجب تسديد المبلغ للشركة"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium opacity-90">المبلغ المستلم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.totalPaidByAdmin.toFixed(2)} د.م</div>
            <p className="text-xs opacity-75 mt-1">تم استلامه من الإدارة</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium opacity-90">الرصيد الصافي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {(data.currentBalance - data.totalPaidByAdmin).toFixed(2)} د.م
            </div>
            <p className="text-xs opacity-75 mt-1">بعد خصم المدفوعات</p>
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
            <div className="text-2xl font-bold text-green-600 mb-1">+{data.totalAmountOwedByAdmin.toFixed(2)} د.م</div>
            <p className="text-xs text-gray-500">
              سيتم دفعها لك من الإدارة (السعر - {data.merchantBaseFee} د.م رسوم)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">طلبات الدفع المسبق (PREPAID)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-1">-{data.totalAmountOwedToCompany.toFixed(2)} د.م</div>
            <p className="text-xs text-gray-500">
              مستحق للشركة ({data.merchantBaseFee} د.م رسوم × {prepaidOrders.length} طلب)
            </p>
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
              {filteredPayments.map((transfer: any) => (
                <div
                  key={transfer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        تحويل مالي
                      </Badge>
                      {transfer.reference && (
                        <span className="text-xs text-gray-500 truncate">المرجع: {transfer.reference}</span>
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
                      })}
                    </p>
                  </div>
                  <div className="text-right sm:text-left shrink-0">
                    <div className="text-lg sm:text-xl font-bold text-green-600">+{transfer.amount.toFixed(2)} د.م</div>
                  </div>
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
              {filteredOrders.map((order: any) => (
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
                      <div className="text-lg font-bold text-gray-900">{order.totalPrice.toFixed(2)} د.م</div>
                      <div
                        className={`text-sm font-medium mt-1 ${
                          order.merchantEarning >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {order.merchantEarning >= 0 ? "ربحك: +" : "مستحق عليك: "}
                        {Math.abs(order.merchantEarning).toFixed(2)} د.م
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.paymentMethod === "COD"
                          ? `رسوم الشركة: ${data.merchantBaseFee} د.م`
                          : `رسوم مستحقة: ${data.merchantBaseFee} د.م`}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-3 space-y-2">
                    {order.orderItems.map((item: any) => (
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
                            {item.quantity} × {item.price.toFixed(2)} د.م
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900 shrink-0">
                          {(item.quantity * item.price).toFixed(2)} د.م
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
