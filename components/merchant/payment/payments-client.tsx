"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OptimizedImage } from "@/components/optimized-image"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Landmark,
  Receipt,
  Printer
} from 'lucide-react'
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { PaymentData } from "@/lib/actions/payment-actions"

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PaymentsClient({ initialData }: { initialData: PaymentData }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "week" | "month" | "year">("all")
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  const data = initialData
  const deliveredOrdersCount = data.deliveredOrders.length
  const totalAfterBaseFees = data.totalRevenue - (data.merchantBaseFee * deliveredOrdersCount)
  const pendingEarnings = data.pendingOrders.reduce((sum, order) => sum + order.merchantEarning, 0)

  // Filter data based on search
  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredPayments = data.paymentHistory.filter((payment) => {
    if (!normalizedSearch) return true
    return (
      (payment.reference?.toLowerCase() || "").includes(normalizedSearch) ||
      (payment.note?.toLowerCase() || "").includes(normalizedSearch) ||
      formatNumber(payment.amount).includes(normalizedSearch)
    )
  })

  const filteredDeliveredOrders = data.deliveredOrders.filter((order) => {
    if (!normalizedSearch) return true
    return (
      order.orderCode.toLowerCase().includes(normalizedSearch) ||
      order.customerName.toLowerCase().includes(normalizedSearch) ||
      order.customerPhone.includes(normalizedSearch)
    )
  })

  const filteredPendingOrders = data.pendingOrders.filter((order) => {
    if (!normalizedSearch) return true
    return (
      order.orderCode.toLowerCase().includes(normalizedSearch) ||
      order.customerName.toLowerCase().includes(normalizedSearch)
    )
  })

  // Calculate summary statistics
  const summaryStats = {
    totalOrders: data.deliveredOrders.length + data.pendingOrders.length,
    deliveredOrders: data.deliveredOrders.length,
    pendingOrders: data.pendingOrders.length,
    averageOrderValue: data.deliveredOrders.length > 0 
      ? data.totalRevenue / data.deliveredOrders.length 
      : 0,
    pendingPayout: pendingEarnings,
    availableBalance: data.currentBalance,
  }

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">المدفوعات والأرباح</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">نظرة شاملة على أرباحك ومعاملاتك المالية</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8 opacity-80" />
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">الرصيد الحالي</span>
            </div>
            <div className="text-3xl font-bold mb-1">{formatNumber(data.currentBalance)} د.م</div>
            <p className="text-sm opacity-80">متاح للسحب</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">إجمالي المبيعات</span>
            </div>
            <div className="text-3xl font-bold mb-1">{formatNumber(data.totalRevenue)} د.م</div>
            <p className="text-sm opacity-80">من {deliveredOrdersCount} طلب</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="w-8 h-8 opacity-80" />
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">المستلم من الإدارة</span>
            </div>
            <div className="text-3xl font-bold mb-1">{formatNumber(data.totalPaidByAdmin)} د.م</div>
            <p className="text-sm opacity-80">{data.paymentHistory.length} تحويل</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">بإنتظار الدفع</span>
            </div>
            <div className="text-3xl font-bold mb-1">{formatNumber(pendingEarnings)} د.م</div>
            <p className="text-sm opacity-80">من {data.pendingOrders.length} طلب</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              إحصائيات المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">متوسط قيمة الطلب</span>
                <span className="font-bold text-[#048dba]">{formatNumber(summaryStats.averageOrderValue)} د.م</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">إجمالي الطلبات</span>
                <span className="font-bold">{summaryStats.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">الطلبات المكتملة</span>
                <span className="font-bold text-green-600">{summaryStats.deliveredOrders}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">الطلبات قيد التنفيذ</span>
                <span className="font-bold text-yellow-600">{summaryStats.pendingOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              تفاصيل الأرباح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">صافي الأرباح (بعد الرسوم)</span>
                <span className="font-bold text-green-600">{formatNumber(totalAfterBaseFees)} د.م</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">أرباح COD</span>
                <span className="font-bold text-green-600">+{formatNumber(data.totalAmountOwedByAdmin)} د.م</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">أرباح PREPAID</span>
                <span className="font-bold text-red-600">-{formatNumber(data.totalAmountOwedToCompany)} د.م</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings Chart Placeholder */}
      {data.monthlyEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#048dba]" />
              الأرباح الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {data.monthlyEarnings.map((month, index) => (
                <Card key={index} className="bg-gradient-to-b from-gray-50 to-white">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{month.month}</p>
                    <p className="font-bold text-[#048dba] text-sm">{formatNumber(month.amount)} د.م</p>
                    <p className="text-xs text-gray-400">{month.count} طلب</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">السجل المالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث برقم الطلب، المرجع، أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="payments">التحويلات</TabsTrigger>
                <TabsTrigger value="delivered">المكتملة</TabsTrigger>
                <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
              </TabsList>

              {/* All Tab */}
              <TabsContent value="all" className="space-y-4 mt-4">
                {/* Payments Section */}
                {filteredPayments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-600 flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      التحويلات المالية ({filteredPayments.length})
                    </h3>
                    {filteredPayments.map((transfer) => (
                      <PaymentCard key={transfer.id} transfer={transfer} />
                    ))}
                  </div>
                )}

                {/* Delivered Orders Section */}
                {filteredDeliveredOrders.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold text-sm text-gray-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      الطلبات المكتملة ({filteredDeliveredOrders.length})
                    </h3>
                    {filteredDeliveredOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        baseFee={data.merchantBaseFee}
                        expanded={expandedOrder === order.id}
                        onToggle={() => toggleOrderExpand(order.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Pending Orders Section */}
                {filteredPendingOrders.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="font-semibold text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      الطلبات قيد الانتظار ({filteredPendingOrders.length})
                    </h3>
                    {filteredPendingOrders.map((order) => (
                      <PendingOrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}

                {filteredPayments.length === 0 && 
                 filteredDeliveredOrders.length === 0 && 
                 filteredPendingOrders.length === 0 && (
                  <EmptyState />
                )}
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-3 mt-4">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((transfer) => (
                    <PaymentCard key={transfer.id} transfer={transfer} />
                  ))
                ) : (
                  <EmptyState message="لا توجد تحويلات مالية" />
                )}
              </TabsContent>

              {/* Delivered Orders Tab */}
              <TabsContent value="delivered" className="space-y-3 mt-4">
                {filteredDeliveredOrders.length > 0 ? (
                  filteredDeliveredOrders.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      baseFee={data.merchantBaseFee}
                      expanded={expandedOrder === order.id}
                      onToggle={() => toggleOrderExpand(order.id)}
                    />
                  ))
                ) : (
                  <EmptyState message="لا توجد طلبات مكتملة" />
                )}
              </TabsContent>

              {/* Pending Orders Tab */}
              <TabsContent value="pending" className="space-y-3 mt-4">
                {filteredPendingOrders.length > 0 ? (
                  filteredPendingOrders.map((order) => (
                    <PendingOrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <EmptyState message="لا توجد طلبات قيد الانتظار" />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <Card className="bg-gradient-to-l from-blue-50 to-white border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#048dba]/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-[#048dba]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">ملخص العمولة</p>
                <p className="text-xs text-gray-500">رسوم المنصة الثابتة: {formatNumber(data.merchantBaseFee)} د.م لكل طلب</p>
              </div>
            </div>
            <Badge className="bg-[#048dba] text-white px-4 py-2 text-sm">
              إجمالي العمولات: {formatNumber(data.merchantBaseFee * deliveredOrdersCount)} د.م
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Payment Card Component
function PaymentCard({ transfer }: { transfer: any }) {
  const [showImage, setShowImage] = useState(false)

  return (
    <Card className="hover:shadow-md transition-all border-r-4 border-r-green-500">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Wallet className="w-3 h-3 ml-1" />
                تحويل مالي
              </Badge>
              {transfer.reference && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  مرجع: {transfer.reference}
                </span>
              )}
            </div>
            {transfer.note && (
              <p className="text-sm text-gray-600 mb-2">{transfer.note}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              {format(new Date(transfer.transferDate), "dd MMMM yyyy, hh:mm a", { locale: ar })}
            </div>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-2xl font-bold text-green-600">+{formatNumber(transfer.amount)} د.م</p>
          </div>
        </div>

        {transfer.invoiceImage && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImage(!showImage)}
              className="text-[#048dba]"
            >
              <FileText className="w-4 h-4 ml-1" />
              {showImage ? "إخفاء الفاتورة" : "عرض الفاتورة"}
            </Button>
            {showImage && (
              <div className="mt-3">
                <a href={transfer.invoiceImage} target="_blank" rel="noopener noreferrer">
                  <img
                    src={transfer.invoiceImage}
                    alt="فاتورة الدفع"
                    className="max-w-full max-h-64 rounded-lg border-2 border-gray-200 hover:border-[#048dba] transition-colors"
                  />
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Delivered Order Card Component
function OrderCard({ order, baseFee, expanded, onToggle }: { order: any; baseFee: number; expanded: boolean; onToggle: () => void }) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-0">
        {/* Header - Clickable */}
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggle}
        >
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-[#048dba] text-white">{order.orderCode}</Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  تم التسليم
                </Badge>
                <Badge
                  variant="outline"
                  className={order.paymentMethod === "COD" 
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                  }
                >
                  {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                </Badge>
              </div>
              <p className="font-medium text-gray-900">{order.customerName}</p>
              <p className="text-xs text-gray-500 mt-1">{order.customerPhone}</p>
            </div>
            <div className="text-right sm:text-left flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-[#048dba]">{formatNumber(order.totalPrice)} د.م</p>
                <p className="text-xs text-gray-500">ربحك: {formatNumber(order.merchantEarning)} د.م</p>
              </div>
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50">
            <div className="space-y-3">
              {/* Delivery Date */}
              {order.deliveredAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>تم التسليم: {format(new Date(order.deliveredAt), "dd MMMM yyyy", { locale: ar })}</span>
                </div>
              )}

              {/* Products */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">المنتجات:</p>
                <div className="space-y-2">
                  {order.orderItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border">
                      {item.product.image && (
                        <OptimizedImage
                          src={item.product.image}
                          alt={item.product.name}
                          width={40}
                          height={40}
                          className="rounded object-cover w-10 h-10"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product.name}</p>
                      </div>
                      <Badge variant="outline">{item.quantity} قطعة</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white p-2 rounded-lg border">
                  <p className="text-xs text-gray-500">إجمالي الطلب</p>
                  <p className="font-bold text-[#048dba]">{formatNumber(order.totalPrice)} د.م</p>
                </div>
                <div className="bg-white p-2 rounded-lg border">
                  <p className="text-xs text-gray-500">رسوم المنصة</p>
                  <p className="font-bold text-orange-600">{formatNumber(baseFee)} د.م</p>
                </div>
                <div className="bg-white p-2 rounded-lg border col-span-2">
                  <p className="text-xs text-gray-500">صافي ربحك</p>
                  <p className="font-bold text-green-600 text-lg">{formatNumber(order.merchantEarning)} د.م</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Pending Order Card Component
function PendingOrderCard({ order }: { order: any }) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800" },
      ACCEPTED: { label: "مقبول", color: "bg-blue-100 text-blue-800" },
      ASSIGNED_TO_DELIVERY: { label: "مسند للتوصيل", color: "bg-purple-100 text-purple-800" },
      DELAYED: { label: "مبلغ عنه", color: "bg-red-100 text-red-800" },
    }
    return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" }
  }

  const status = getStatusBadge(order.status)

  return (
    <Card className="hover:shadow-md transition-all border-r-4 border-r-yellow-400">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-[#048dba] text-white">{order.orderCode}</Badge>
              <Badge className={status.color}>{status.label}</Badge>
              <Badge
                variant="outline"
                className={order.paymentMethod === "COD" 
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-purple-50 text-purple-700 border-purple-200"
                }
              >
                {order.paymentMethod === "COD" ? "COD" : "PREPAID"}
              </Badge>
            </div>
            <p className="font-medium text-gray-900">{order.customerName}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(order.createdAt), "dd MMMM yyyy", { locale: ar })}
            </div>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-lg font-bold text-[#048dba]">{formatNumber(order.totalPrice)} د.م</p>
            <p className="text-xs text-gray-500">ربح متوقع: {formatNumber(order.merchantEarning)} د.م</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State Component
function EmptyState({ message = "لا توجد نتائج" }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500">{message}</p>
    </div>
  )
}