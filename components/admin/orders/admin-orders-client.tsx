"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, ArrowUpRight, Package, Truck, CheckCircle2, Clock, AlertCircle, XCircle, Printer, Calendar, CalendarDays } from 'lucide-react'
import { UpdateOrderStatusDialog } from "./update-order-status-dialog"
import { AssignDeliveryManDialog } from "./assign-delivery-man-dialog"
import { UpdateDeliveryDateDialog } from "./update-delivery-date-dialog"
import { generateAndDownloadInvoice } from "@/lib/utils/pdf-client"
import { useToast } from "@/hooks/use-toast"
import { getAllOrders } from "@/lib/actions/admin/order"
import { createSlugWithId } from "@/lib/utils/slug"

type Order = {
  id: number
  orderCode: string
  customerName: string
  customerPhone: string
  address: string
  city: {
    name: string
    code: string
  }
  note: string | null
  totalPrice: number
  paymentMethod: "COD" | "PREPAID"
  merchantEarning: number
  status: string
  createdAt: Date
  deliveredAt: Date | null
  delivery_date: Date | null
  previous_delivery_date: Date | null
  delay_reason: string | null
  discountType: string | null
  discountValue: number | null
  discountDescription: string | null
  originalTotalPrice: number | null
  totalDiscount: number | null
  buyXGetYConfig: string | null
  orderItems: {
    id: number
    quantity: number
    price: number
    originalPrice: number | null
    isFree: boolean
    product: {
      id: number
      name: string
      image: string | null
    }
  }[]
  merchant: {
    user: {
      name: string
      phone: string | null
    }
  } | null
  deliveryMan: {
    user: {
      name: string
      phone: string | null
    }
  } | null
}

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCity, setFilterCity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [filterDateType, setFilterDateType] = useState<string>("none")
  const [specificDate, setSpecificDate] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [filterCreationDateType, setFilterCreationDateType] = useState<string>("none")
  const [specificCreationDate, setSpecificCreationDate] = useState<string>("")
  const [creationStartDate, setCreationStartDate] = useState<string>("")
  const [creationEndDate, setCreationEndDate] = useState<string>("")
  const [orders, setOrders] = useState(initialOrders)
  const [isLoading, setIsLoading] = useState(false)
  const [generatingPdfOrderId, setGeneratingPdfOrderId] = useState<number | null>(null)
  const { toast } = useToast()

  // Extract unique cities from orders
  const cities = Array.from(new Set(initialOrders.map(order => order.city.name))).sort()
  const statuses = ["PENDING", "ACCEPTED", "ASSIGNED_TO_DELIVERY", "DELIVERED", "DELAYED", "REJECTED", "CANCELLED"]
  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACCEPTED: "مقبول",
    ASSIGNED_TO_DELIVERY: "مسند للتوصيل",
    DELIVERED: "تم التوصيل",
    DELAYED: "مبلغ عنه",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى"
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    ACCEPTED: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    ASSIGNED_TO_DELIVERY: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    DELIVERED: "bg-green-100 text-green-800 hover:bg-green-200",
    DELAYED: "bg-red-100 text-red-800 hover:bg-red-200",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-200",
    CANCELLED: "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  // Load orders with filters
  const loadOrders = useCallback(async () => {
    setIsLoading(true)

    const filters: any = {}

    // Add search term to filters if provided
    if (searchTerm.trim()) {
      filters.searchTerm = searchTerm.trim()
    }

    // Delivery date filters
    if (filterDateType === "specific" && specificDate) {
      filters.deliveryDateSpecific = specificDate
    } else if (filterDateType === "range") {
      if (startDate) filters.deliveryStartDate = startDate
      if (endDate) filters.deliveryEndDate = endDate
    }

    // Creation date filters
    if (filterCreationDateType === "specific" && specificCreationDate) {
      filters.creationDateSpecific = specificCreationDate
    } else if (filterCreationDateType === "range") {
      if (creationStartDate) filters.creationStartDate = creationStartDate
      if (creationEndDate) filters.creationEndDate = creationEndDate
    }

    // Other filters
    if (filterCity !== "all") {
      filters.city = filterCity
    }

    if (filterStatus !== "all") {
      filters.status = filterStatus
    }

    if (filterPayment !== "all") {
      filters.paymentMethod = filterPayment
    }

    const result = await getAllOrders(filters)

    if (result.success && result.data) {
      setOrders(result.data)
    } else {
      toast({
        title: "✗ خطأ",
        description: result.error || "حدث خطأ أثناء تحميل الطلبات",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }, [
    searchTerm,
    filterCity,
    filterStatus,
    filterPayment,
    filterDateType,
    specificDate,
    startDate,
    endDate,
    filterCreationDateType,
    specificCreationDate,
    creationStartDate,
    creationEndDate,
    toast
  ])

  // Load orders when any filter changes (with debounce for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders()
    }, 500)

    return () => clearTimeout(timer)
  }, [
    loadOrders,
    filterCity,
    filterStatus,
    filterPayment,
    filterDateType,
    specificDate,
    startDate,
    endDate,
    filterCreationDateType,
    specificCreationDate,
    creationStartDate,
    creationEndDate
  ])

  // Handle search separately with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() !== "") {
        loadOrders()
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [searchTerm, loadOrders])

  // Reset all filters and reload initial orders
  const handleResetFilters = async () => {
    setFilterCity("all")
    setFilterStatus("all")
    setFilterPayment("all")
    setFilterDateType("none")
    setSpecificDate("")
    setStartDate("")
    setEndDate("")
    setFilterCreationDateType("none")
    setSpecificCreationDate("")
    setCreationStartDate("")
    setCreationEndDate("")
    setSearchTerm("")

    setIsLoading(true)
    const result = await getAllOrders()
    if (result.success && result.data) {
      setOrders(result.data)
    }
    setIsLoading(false)
  }

  // Handle PDF generation
  const handleGeneratePDF = async (order: Order) => {
    console.log('Order merchant object:', order.merchant);
    console.log('Order merchant user object:', order.merchant?.user);

    setGeneratingPdfOrderId(order.id)
    try {
      const orderForPDF = {
        orderCode: order.orderCode,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        city: order.city.name,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        note: order.note || '',
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            name: item.product.name
          }
        }))
      }

      const logoUrl = '/images/logo/logo.png'
      const result = await generateAndDownloadInvoice(
        orderForPDF,
        order.merchant?.user?.name || "—",
        order.merchant?.user?.phone || "—",
        logoUrl
      )

      if (result.success) {
        toast({
          title: "✓ تم إنشاء الفاتورة",
          description: "تم إنشاء الفاتورة بنجاح وتنزيلها",
        })
      } else {
        throw new Error(result.error || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      toast({
        title: "✗ خطأ",
        description: "فشل في إنشاء الفاتورة",
        variant: "destructive",
      })
    } finally {
      setGeneratingPdfOrderId(null)
    }
  }

  // Calculate statistics from filtered orders
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    assigned: orders.filter(o => o.status === "ASSIGNED_TO_DELIVERY").length,
    delayed: orders.filter(o => o.status === "DELAYED").length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
    withDeliveryDate: orders.filter(o => o.delivery_date).length,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-gray-500 mt-1">لوحة تحكم شاملة لمتابعة وإدارة جميع الطلبات</p>
        </div>
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>نظام متابعة تواريخ الطلبات والتوصيل</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-t-4 border-t-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">إجمالي الطلبات</p>
                <h3 className="text-xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-yellow-400 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">قيد الانتظار</p>
                <h3 className="text-xl font-bold mt-1 text-yellow-600">{stats.pending}</h3>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">مسند للتوصيل</p>
                <h3 className="text-xl font-bold mt-1 text-purple-600">{stats.assigned}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">تم التوصيل</p>
                <h3 className="text-xl font-bold mt-1 text-green-600">{stats.delivered}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">متأخر</p>
                <h3 className="text-xl font-bold mt-1 text-red-600">{stats.delayed}</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#048dba] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500">إجمالي الإيرادات</p>
                <h3 className="text-xl font-bold mt-1 text-[#048dba]">{stats.totalRevenue.toFixed(2)} <span className="text-xs font-normal text-gray-500">د.م</span></h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <ArrowUpRight className="w-4 h-4 text-[#048dba]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="بحث شامل (رقم الطلب، اسم العميل، التاجر...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 border-gray-200 focus:border-[#048dba] focus:ring-[#048dba]"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المدن</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="COD">عند الاستلام</SelectItem>
                    <SelectItem value="PREPAID">مسبق</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetFilters}
                  disabled={isLoading}
                  title="إعادة تعيين جميع الفلاتر"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Date filtering section - Split into two columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Delivery date filtering */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">تصفية حسب تاريخ التوصيل:</span>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                    value={filterDateType}
                    onValueChange={setFilterDateType}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">لا يوجد</SelectItem>
                      <SelectItem value="specific">تاريخ محدد</SelectItem>
                      <SelectItem value="range">نطاق تاريخ</SelectItem>
                    </SelectContent>
                  </Select>

                  {filterDateType === "specific" && (
                    <Input
                      type="date"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      className="w-[150px]"
                      disabled={isLoading}
                    />
                  )}

                  {filterDateType === "range" && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600 text-nowrap">من:</span>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-[150px]"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600 text-nowrap">إلى:</span>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-[150px]"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Creation date filtering */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">تصفية حسب تاريخ الإنشاء:</span>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Select
                    value={filterCreationDateType}
                    onValueChange={setFilterCreationDateType}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">لا يوجد</SelectItem>
                      <SelectItem value="specific">تاريخ محدد</SelectItem>
                      <SelectItem value="range">نطاق تاريخ</SelectItem>
                    </SelectContent>
                  </Select>

                  {filterCreationDateType === "specific" && (
                    <Input
                      type="date"
                      value={specificCreationDate}
                      onChange={(e) => setSpecificCreationDate(e.target.value)}
                      className="w-[150px]"
                      disabled={isLoading}
                    />
                  )}

                  {filterCreationDateType === "range" && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600 text-nowrap">من:</span>
                        <Input
                          type="date"
                          value={creationStartDate}
                          onChange={(e) => setCreationStartDate(e.target.value)}
                          className="w-[150px]"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600 text-nowrap">إلى:</span>
                        <Input
                          type="date"
                          value={creationEndDate}
                          onChange={(e) => setCreationEndDate(e.target.value)}
                          className="w-[150px]"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            {(filterCity !== "all" || filterStatus !== "all" || filterPayment !== "all" ||
              filterDateType !== "none" || filterCreationDateType !== "none" || searchTerm.trim()) && (
                <div className="flex flex-wrap gap-2 items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-sm text-blue-700 font-medium">الفلاتر النشطة:</span>
                  {searchTerm.trim() && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      بحث: {searchTerm}
                    </Badge>
                  )}
                  {filterCity !== "all" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      مدينة: {filterCity}
                    </Badge>
                  )}
                  {filterStatus !== "all" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      حالة: {statusLabels[filterStatus]}
                    </Badge>
                  )}
                  {filterPayment !== "all" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      دفع: {filterPayment === "COD" ? "عند الاستلام" : "مسبق"}
                    </Badge>
                  )}
                  {filterDateType === "specific" && specificDate && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Calendar className="w-3 h-3 mr-1" />
                      توصيل: {new Date(specificDate).toLocaleDateString("ar-MA")}
                    </Badge>
                  )}
                  {filterDateType === "range" && (startDate || endDate) && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Calendar className="w-3 h-3 mr-1" />
                      نطاق توصيل: {startDate ? new Date(startDate).toLocaleDateString("ar-MA") : "بداية"} - {endDate ? new Date(endDate).toLocaleDateString("ar-MA") : "نهاية"}
                    </Badge>
                  )}
                  {filterCreationDateType === "specific" && specificCreationDate && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      إنشاء: {new Date(specificCreationDate).toLocaleDateString("ar-MA")}
                    </Badge>
                  )}
                  {filterCreationDateType === "range" && (creationStartDate || creationEndDate) && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      نطاق إنشاء: {creationStartDate ? new Date(creationStartDate).toLocaleDateString("ar-MA") : "بداية"} - {creationEndDate ? new Date(creationEndDate).toLocaleDateString("ar-MA") : "نهاية"}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    disabled={isLoading}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    إزالة الكل
                  </Button>
                </div>
              )}

            {isLoading && (
              <div className="text-sm text-blue-600 animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                جاري التحميل وتطبيق الفلاتر...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            قائمة الطلبات ({orders.length})
            <span className="text-sm font-normal text-gray-500 mr-2">
              • {stats.withDeliveryDate} طلب لديه تاريخ توصيل
            </span>
          </h2>
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                تحديث البيانات...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                محدث
              </div>
            )}
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterCity !== "all" || filterStatus !== "all" || filterPayment !== "all" ||
                  filterDateType !== "none" || filterCreationDateType !== "none"
                  ? "لم يتم العثور على طلبات تطابق معايير البحث"
                  : "لا توجد طلبات في النظام حالياً"}
              </p>
              {(searchTerm || filterCity !== "all" || filterStatus !== "all" || filterPayment !== "all" ||
                filterDateType !== "none" || filterCreationDateType !== "none") && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    disabled={isLoading}
                    className="border-[#048dba] text-[#048dba] hover:bg-blue-50"
                  >
                    إعادة تعيين الفلاتر
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-[#048dba] group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Main Info Section */}
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg text-[#048dba] font-bold text-lg">
                            #{order.orderCode}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                {order.city.name}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleDateString("ar-MA")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${statusColors[order.status]} border-0 px-3 py-1`}>
                            {statusLabels[order.status]}
                          </Badge>

                          {/* Delivery date badge */}
                          {order.delivery_date && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>تاريخ التوصيل: {new Date(order.delivery_date).toLocaleDateString("ar-MA")}</span>
                            </div>
                          )}

                          {/* Previous date if delayed */}
                          {order.previous_delivery_date && order.delay_reason && (
                            <div className="flex flex-col items-end text-xs">
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                <span>تاريخ سابق: {new Date(order.previous_delivery_date).toLocaleDateString("ar-MA")}</span>
                              </div>
                              <div className="text-red-500 mt-1 max-w-[200px] truncate" title={order.delay_reason}>
                                {order.delay_reason}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">التاجر</p>
                          <p className="font-medium text-gray-900">
                            {order.merchant?.user?.name || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">المبلغ</p>
                          <p className="font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</p>
                          <p className="text-xs text-gray-500">
                            {order.paymentMethod === "COD" ? "عند الاستلام" : "مسبق"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">تاريخ الطلب</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString("ar-MA")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString("ar-MA", { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">الموصل</p>
                          <p className="font-medium text-gray-900">
                            {order.deliveryMan ? order.deliveryMan.user.name : "—"}
                          </p>
                          {order.deliveryMan?.user?.phone && (
                            <p className="text-xs text-gray-500">{order.deliveryMan.user.phone}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">تاريخ التوصيل</p>
                          <p className="font-medium text-gray-900">
                            {order.delivery_date
                              ? new Date(order.delivery_date).toLocaleDateString("ar-MA")
                              : "لم يحدد"}
                          </p>
                          {order.deliveredAt && (
                            <p className="text-xs text-green-600">
                              تم التوصيل: {new Date(order.deliveredAt).toLocaleDateString("ar-MA")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order items summary */}
                      {order.orderItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 mb-2">المنتجات:</p>
                          <div className="flex flex-wrap gap-2">
                            {order.orderItems.slice(0, 3).map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item.product.name} × {item.quantity}
                                {item.isFree && <span className="text-green-600 mr-1"> (مجاني)</span>}
                              </Badge>
                            ))}
                            {order.orderItems.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-gray-50">
                                +{order.orderItems.length - 3} أكثر
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Section */}
                    <div className="border-t md:border-t-0 md:border-r border-gray-100 bg-gray-50/50 p-4 flex flex-col justify-center gap-2 min-w-[180px]">
                      <Link href={`/admin/orders/${createSlugWithId(order.orderCode, order.id)}`} className="w-full">
                        <Button className="w-full bg-white hover:bg-white text-[#048dba] border border-[#048dba] hover:bg-blue-50 transition-colors">
                          التفاصيل الكاملة
                        </Button>
                      </Link>

                      <UpdateOrderStatusDialog
                        orderId={order.id}
                        currentStatus={order.status}
                        orderCode={order.orderCode}
                        onSuccess={() => window.location.reload()}
                      >
                        <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors">
                          تحديث الحالة
                        </Button>
                      </UpdateOrderStatusDialog>

                      <AssignDeliveryManDialog
                        orderId={order.id}
                        orderCode={order.orderCode}
                        orderCity={order.city.name}
                        onSuccess={() => window.location.reload()}
                      />

                      {order.status === "ASSIGNED_TO_DELIVERY" && order.delivery_date && (
                        <UpdateDeliveryDateDialog
                          orderId={order.id}
                          currentDeliveryDate={order.delivery_date}
                          orderCode={order.orderCode}
                          onSuccess={() => window.location.reload()}
                        >
                          <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors">
                            تعديل تاريخ التوصيل
                          </Button>
                        </UpdateDeliveryDateDialog>
                      )}

                      <Button
                        onClick={() => handleGeneratePDF(order)}
                        disabled={generatingPdfOrderId === order.id}
                        variant="outline"
                        className="w-full text-[#0586b5] hover:text-[#047395] hover:bg-blue-50 border-[#0586b5] transition-colors"
                      >
                        <Printer className="w-4 h-4 ml-2" />
                        {generatingPdfOrderId === order.id ? "جاري الإنشاء..." : "طباعة الفاتورة"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}