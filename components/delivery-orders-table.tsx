"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "./optimized-image"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { updateOrderStatus, acceptOrder, rejectOrder } from "@/lib/actions/order.actions"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getActiveCities } from "@/lib/actions/admin/city"

type Order = {
  id: number
  orderCode: string
  customerName: string
  customerPhone: string
  address: string
  city: string
  cityId: number
  note: string | null
  totalPrice: number
  paymentMethod: "COD" | "PREPAID"
  status: string
  createdAt: Date
  deliveryManId: number | null
  orderItems: {
    id: number
    quantity: number
    price: number
    product: {
      id: number
      name: string
      image: string | null
    }
  }[]
  merchant: {
    user: {
      name: string
    }
  }
}

type City = {
  id: number
  name: string
  code: string
}

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { 
    label: "قيد الانتظار", 
    color: "bg-amber-50 text-amber-700 border-amber-200", 
    icon: "⏳" 
  },
  ACCEPTED: { 
    label: "مقبول", 
    color: "bg-green-50 text-green-700 border-green-200", 
    icon: "✓" 
  },
  ASSIGNED_TO_DELIVERY: { 
    label: "معين لك", 
    color: "bg-indigo-50 text-indigo-700 border-indigo-200", 
    icon: "👤" 
  },
  DELIVERED: { 
    label: "تم التسليم", 
    color: "bg-emerald-50 text-emerald-700 border-emerald-200", 
    icon: "✅" 
  },
  DELAYED: { 
    label: "تم الإبلاغ", 
    color: "bg-yellow-50 text-yellow-700 border-yellow-200", 
    icon: "⚠️" 
  },
  REJECTED: { 
    label: "مرفوض", 
    color: "bg-red-50 text-red-700 border-red-200", 
    icon: "❌" 
  },
  CANCELLED: { 
    label: "ملغي", 
    color: "bg-gray-100 text-gray-700 border-gray-300", 
    icon: "🚫" 
  },
}

export function DeliveryOrdersTable({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [cityFilter, setCityFilter] = useState<string>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL")
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [cities, setCities] = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  useEffect(() => {
    async function loadCities() {
      setLoadingCities(true)
      try {
        const citiesData = await getActiveCities()
        setCities(citiesData)
      } catch (error) {
        console.error("Error loading cities:", error)
        toast.error("فشل في تحميل قائمة المدن")
      } finally {
        setLoadingCities(false)
      }
    }
    
    loadCities()
  }, [])

  const cityMap = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {}
    const colors = [
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-teal-50 text-teal-700 border-teal-200",
      "bg-amber-50 text-amber-700 border-amber-200",
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-green-50 text-green-700 border-green-200",
      "bg-red-50 text-red-700 border-red-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-pink-50 text-pink-700 border-pink-200"
    ]
    
    cities.forEach((city, index) => {
      map[city.name] = {
        label: city.name,
        color: colors[index % colors.length] || "bg-gray-50 text-gray-700 border-gray-200"
      }
    })
    
    return map
  }, [cities])

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (activeTab === "available") {
      filtered = filtered.filter(o => 
        o.status === "ACCEPTED" && !o.deliveryManId
      )
    } else if (activeTab === "my-orders") {
      filtered = filtered.filter(o => o.deliveryManId)
    } else if (activeTab === "completed") {
      filtered = filtered.filter(o => o.status === "DELIVERED")
    }

    if (searchQuery) {
      filtered = filtered.filter((order) =>
        order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery) ||
        order.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (cityFilter !== "ALL") {
      filtered = filtered.filter(order => order.city === cityFilter)
    }

    if (paymentFilter !== "ALL") {
      filtered = filtered.filter(order => order.paymentMethod === paymentFilter)
    }

    return filtered
  }, [orders, searchQuery, statusFilter, cityFilter, paymentFilter, activeTab])

  const stats = useMemo(() => {
    const available = orders.filter((o) => 
      o.status === "ACCEPTED" && !o.deliveryManId
    ).length
    
    const assigned = orders.filter((o) => 
      o.deliveryManId && o.status === "ASSIGNED_TO_DELIVERY"
    ).length
    
    const delivered = orders.filter((o) => 
      o.status === "DELIVERED"
    ).length

    const totalEarnings = orders
      .filter(o => o.status === "DELIVERED" && o.deliveryManId)
      .reduce((sum, order) => sum + 15, 0)

    return {
      available,
      assigned,
      delivered,
      totalEarnings
    }
  }, [orders])

  const uniqueCities = useMemo(() => {
    const cities = [...new Set(orders.map(order => order.city))]
    return cities.map(city => ({
      value: city,
      label: cityMap[city]?.label || city,
      color: cityMap[city]?.color || "bg-gray-50 text-gray-700 border-gray-200"
    }))
  }, [orders, cityMap])

  const handleAcceptOrder = async (orderId: number) => {
    setUpdatingOrderId(orderId)
    
    const orderToAccept = orders.find(o => o.id === orderId);
    if (orderToAccept && orderToAccept.status !== "ACCEPTED") {
      toast.error("لا يمكن قبول هذا الطلب. يجب أن يكون في حالة مقبول أولاً من قبل الإدارة.")
      setUpdatingOrderId(null)
      return
    }
    
    const result = await acceptOrder(orderId)

    if (result.success) {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: "ASSIGNED_TO_DELIVERY", deliveryManId: 1 }
          : order
      ))
      
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
    setUpdatingOrderId(null)
  }

  const handleRejectOrder = async () => {
    if (!selectedOrderId || !rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض")
      return
    }

    setUpdatingOrderId(selectedOrderId)
    const result = await rejectOrder(selectedOrderId, rejectionReason)

    if (result.success) {
      setOrders(prev => prev.map(order => 
        order.id === selectedOrderId 
          ? { ...order, status: "REJECTED" }
          : order
      ))
      
      toast.success(result.message)
      setRejectDialogOpen(false)
      setRejectionReason("")
      setSelectedOrderId(null)
    } else {
      toast.error(result.message)
    }
    setUpdatingOrderId(null)
  }

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId)
    const result = await updateOrderStatus(orderId, newStatus as any)

    if (result.success) {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))
      
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
    setUpdatingOrderId(null)
  }

  const getAvailableStatuses = (currentStatus: string, deliveryManId: number | null) => {
    const statuses: { value: string; label: string; icon: string }[] = []

    if (deliveryManId) {
      if (currentStatus === "ASSIGNED_TO_DELIVERY" || currentStatus === "ACCEPTED") {
        statuses.push(
          { value: "DELIVERED", label: "تم التسليم بنجاح", icon: "✅" },
          { value: "REJECTED", label: "رفض العميل", icon: "❌" },
          { value: "DELAYED", label: "الإبلاغ عن مشكلة", icon: "⚠️" },
          { value: "CANCELLED", label: "إلغاء الطلب", icon: "🚫" }
        )
      }
    }

    return statuses
  }

  const handleStatusClick = (orderId: number, status: string) => {
    if (status === "DELAYED") {
      setSelectedOrderId(orderId)
      setReportDialogOpen(true)
    } else if (status === "REJECTED" || status === "CANCELLED") {
      setSelectedOrderId(orderId)
      setRejectDialogOpen(true)
    } else {
      handleStatusUpdate(orderId, status)
    }
  }

  const handleReportOrder = async () => {
    if (!selectedOrderId || !reportReason.trim()) {
      toast.error("يرجى إدخال سبب الإبلاغ")
      return
    }

    setUpdatingOrderId(selectedOrderId)
    const result = await updateOrderStatus(selectedOrderId, "DELAYED")

    if (result.success) {
      setOrders(prev => prev.map(order => 
        order.id === selectedOrderId 
          ? { ...order, status: "DELAYED" }
          : order
      ))
      
      toast.success(result.message)
      setReportDialogOpen(false)
      setReportReason("")
      setSelectedOrderId(null)
    } else {
      toast.error(result.message)
    }
    setUpdatingOrderId(null)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
    setCityFilter("ALL")
    setPaymentFilter("ALL")
    setActiveTab("all")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "ALL" || cityFilter !== "ALL" || paymentFilter !== "ALL" || activeTab !== "all"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">متاحة للتوصيل</p>
                <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">📦</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">معينة لي</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-lg">👤</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 text-lg">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings.toFixed(2)} د.م</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 text-lg">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            جميع الطلبات
          </TabsTrigger>
          <TabsTrigger value="available" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            متاحة للتوصيل
          </TabsTrigger>
          <TabsTrigger value="my-orders" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            طلباتي
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            مكتملة
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="search"
                placeholder="ابحث في الطلبات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الحالات</SelectItem>
                {Object.entries(statusMap).map(([value, { label, icon }]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter} disabled={loadingCities}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder={loadingCities ? "جاري التحميل..." : "المدينة"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع المدن</SelectItem>
                {loadingCities ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-[#048dba] border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="text-sm text-gray-500">جاري التحميل...</span>
                  </div>
                ) : uniqueCities.length === 0 ? (
                  <div className="text-center py-2 text-gray-500 text-sm">لا توجد مدن</div>
                ) : (
                  uniqueCities.map(city => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الطرق</SelectItem>
                <SelectItem value="COD">الدفع عند الاستلام</SelectItem>
                <SelectItem value="PREPAID">مدفوع مسبقاً</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearAllFilters} className="lg:w-auto">
                مسح الكل
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-gray-600">
          عرض <span className="font-semibold text-gray-900">{filteredOrders.length}</span> من أصل <span className="font-semibold text-gray-900">{orders.length}</span> طلب
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                بحث: {searchQuery}
                <button onClick={() => setSearchQuery("")} className="hover:text-red-500">×</button>
              </Badge>
            )}
            {statusFilter !== "ALL" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                حالة: {statusMap[statusFilter]?.label}
                <button onClick={() => setStatusFilter("ALL")} className="hover:text-red-500">×</button>
              </Badge>
            )}
            {cityFilter !== "ALL" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                مدينة: {cityMap[cityFilter]?.label || cityFilter}
                <button onClick={() => setCityFilter("ALL")} className="hover:text-red-500">×</button>
              </Badge>
            )}
            {paymentFilter !== "ALL" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                دفع: {paymentFilter === "COD" ? "عند الاستلام" : "مسبق"}
                <button onClick={() => setPaymentFilter("ALL")} className="hover:text-red500">×</button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-xl">📦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{order.orderCode}</h3>
                      <Badge className={statusMap[order.status]?.color}>
                        <span className="ml-1">{statusMap[order.status]?.icon}</span>
                        {statusMap[order.status]?.label}
                      </Badge>
                      <Badge variant="outline" className={cityMap[order.city]?.color || "bg-gray-50 text-gray-700 border-gray-200"}>
                        {order.city}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: ar })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        التاجر: {order.merchant.user.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-2xl font-bold text-blue-600">{order.totalPrice.toFixed(2)} د.م</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>ربحك:</span>
                    <span className="font-semibold text-green-600">15.00</span>
                  </div>
                  <Badge variant="outline" className="mt-1 bg-white">
                    {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">اسم العميل</p>
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="font-semibold text-gray-900 direction-ltr text-right">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">المدينة</p>
                  <p className="font-semibold text-gray-900">{order.city}</p>
                </div>
                <div className="lg:col-span-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">العنوان</p>
                  <p className="font-semibold text-gray-900">{order.address}</p>
                </div>
                {order.note && (
                  <div className="md:col-span-2 lg:col-span-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">ملاحظات</p>
                    <p className="text-sm text-gray-700 bg-white p-2 rounded border">{order.note}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">المنتجات ({order.orderItems.length})</p>
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-2 pr-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">
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
                              <span className="text-lg">📦</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.product.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>الكمية: {item.quantity}</span>
                            <span>السعر: {item.price.toFixed(2)} د.م</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{(item.price * item.quantity).toFixed(2)} د.م</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {order.status === "ACCEPTED" && !order.deliveryManId && (
                  <>
                    <Button
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={updatingOrderId === order.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                      size="lg"
                    >
                      {updatingOrderId === order.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          جاري القبول...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>✅</span>
                          قبول الطلب
                        </div>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedOrderId(order.id)
                        setRejectDialogOpen(true)
                      }}
                      disabled={updatingOrderId === order.id}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-12"
                      size="lg"
                    >
                      <div className="flex items-center gap-2">
                        <span>❌</span>
                        رفض الطلب
                      </div>
                    </Button>
                  </>
                )}

                {order.deliveryManId && order.status !== "DELIVERED" && order.status !== "REJECTED" && (
                  <div className="flex-1">
                    <Select
                      onValueChange={(value) => handleStatusClick(order.id, value)}
                      disabled={updatingOrderId === order.id}
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="تحديث حالة الطلب..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableStatuses(order.status, order.deliveryManId).map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <span>{status.icon}</span>
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters 
                  ? "لم يتم العثور على طلبات تطابق معايير البحث الخاصة بك"
                  : "لا توجد طلبات متاحة حاليًا للتوصيل"
                }
              </p>
              {hasActiveFilters && (
                <Button onClick={clearAllFilters}>
                  مسح جميع الفلاتر
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>❌</span>
              رفض/إلغاء الطلب
            </DialogTitle>
            <DialogDescription>يرجى تحديد سبب رفض أو إلغاء هذا الطلب</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="rejection-reason">سبب الرفض أو الإلغاء</Label>
            <Textarea
              id="rejection-reason"
              placeholder="اكتب السبب هنا..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleRejectOrder}
              disabled={!rejectionReason.trim() || updatingOrderId === selectedOrderId}
              className="bg-red-600 hover:bg-red-700"
            >
              {updatingOrderId === selectedOrderId ? "جاري المعالجة..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>⚠️</span>
              الإبلاغ عن مشكلة في التوصيل
            </DialogTitle>
            <DialogDescription>يرجى وصف المشكلة التي واجهتها أثناء محاولة التوصيل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason">سبب المشكلة</Label>
              <Textarea
                id="report-reason"
                placeholder="مثال: العميل غير متوفر، عنوان خاطئ، رفض استلام الطلب..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="resize-none mt-2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleReportOrder}
              disabled={!reportReason.trim() || updatingOrderId === selectedOrderId}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updatingOrderId === selectedOrderId ? "جاري الإبلاغ..." : "إرسال البلاغ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}