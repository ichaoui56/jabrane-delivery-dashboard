"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
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
import { OptimizedImage } from "@/components/optimized-image"
import { 
  Package, 
  Search, 
  Filter, 
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  User,
  Calendar,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Eye,
  Printer,
  MapPin,
  Phone,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Store
} from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { createSlugWithId } from "@/lib/utils/slug"
import { cn } from "@/lib/utils"

type Order = any
type Merchant = any
type City = any

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { 
    label: "قيد الانتظار", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  ACCEPTED: { 
    label: "مقبول", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle
  },
  ASSIGNED_TO_DELIVERY: { 
    label: "مسند للتوصيل", 
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Truck
  },
  DELIVERED: { 
    label: "تم التوصيل", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  DELAYED: { 
    label: "مبلغ عنه", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle
  },
  REJECTED: { 
    label: "مرفوض", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle
  },
  CANCELLED: { 
    label: "ملغى", 
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle
  },
}

// Group orders by merchant
const groupOrdersByMerchant = (orders: Order[]) => {
  const groups = new Map<number, { merchant: any; orders: Order[] }>()
  
  orders.forEach(order => {
    const merchantId = order.merchant.id
    if (!groups.has(merchantId)) {
      groups.set(merchantId, {
        merchant: order.merchant,
        orders: []
      })
    }
    groups.get(merchantId)!.orders.push(order)
  })
  
  // Sort merchants by name
  return Array.from(groups.values()).sort((a, b) => 
    (a.merchant.user.name || "").localeCompare(b.merchant.user.name || "", "ar")
  )
}

export function AdminOrdersClient({ 
  initialData, 
  initialStats 
}: { 
  initialData: any
  initialStats: any
}) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialData.orders)
  const [merchants] = useState(initialData.merchants)
  const [cities] = useState(initialData.cities)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)
  const [expandedMerchants, setExpandedMerchants] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(initialData.pagination.totalPages)

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    merchantId: "all",
    cityId: "all",
    status: "all",
    paymentMethod: "all",
    startDate: "",
    endDate: ""
  })

  const [showFilters, setShowFilters] = useState(false)

  // Group orders by merchant
  const merchantGroups = groupOrdersByMerchant(orders)

  // Toggle merchant expansion
  const toggleMerchant = (merchantId: number) => {
    const newExpanded = new Set(expandedMerchants)
    if (newExpanded.has(merchantId)) {
      newExpanded.delete(merchantId)
    } else {
      newExpanded.add(merchantId)
    }
    setExpandedMerchants(newExpanded)
  }

  // Expand all merchants
  const expandAll = () => {
    setExpandedMerchants(new Set(merchantGroups.map(g => g.merchant.id)))
  }

  // Collapse all merchants
  const collapseAll = () => {
    setExpandedMerchants(new Set())
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      merchantId: "all",
      cityId: "all",
      status: "all",
      paymentMethod: "all",
      startDate: "",
      endDate: ""
    })
    setCurrentPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== "" && value !== "all"
  )

  // Format date
  const formatDate = (date: string) => {
    return format(new Date(date), "dd MMM yyyy", { locale: ar })
  }

  // Get merchant stats
  const getMerchantStats = (merchantOrders: Order[]) => {
    const total = merchantOrders.length
    const delivered = merchantOrders.filter(o => o.status === "DELIVERED").length
    const pending = merchantOrders.filter(o => o.status === "PENDING").length
    const revenue = merchantOrders
      .filter(o => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.totalPrice, 0)
    
    return { total, delivered, pending, revenue }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              إدارة الطلبات
            </h1>
            <p className="text-sm text-gray-600">عرض وإدارة طلبات التجار - {orders.length} طلب</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <Card className="p-4 border-l-4 border-l-gray-500 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">قيد الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">مقبول</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.acceptedOrders}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">مسند للتوصيل</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.assignedOrders}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">تم التوصيل</p>
                  <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">ملغاة / مرفوضة</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <Card className="p-4 sm:p-6 mb-6 border-gray-200 shadow-sm bg-white">
        <div className="space-y-4">
          <div 
            className="flex items-center gap-2 text-base font-semibold text-gray-800 cursor-pointer"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5 text-[#048dba]" />
            تصفية الطلبات
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              showFilters ? "rotate-180" : ""
            )} />
          </div>
          
          {/* Search Bar - Always visible */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ابحث برقم الطلب، اسم العميل، رقم الهاتف..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pr-10 h-11"
            />
          </div>

          {/* Advanced Filters - Collapsible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {/* Merchant Filter */}
              <Select 
                value={filters.merchantId} 
                onValueChange={(value) => handleFilterChange("merchantId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التاجر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التجار</SelectItem>
                  {merchants.map((merchant: Merchant) => (
                    <SelectItem key={merchant.id} value={merchant.id.toString()}>
                      {merchant.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Select 
                value={filters.cityId} 
                onValueChange={(value) => handleFilterChange("cityId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {cities.map((city: City) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment Method Filter */}
              <Select 
                value={filters.paymentMethod} 
                onValueChange={(value) => handleFilterChange("paymentMethod", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="COD">الدفع عند الاستلام</SelectItem>
                  <SelectItem value="PREPAID">مدفوع مسبقاً</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="md:col-span-2 lg:col-span-4 grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  placeholder="من تاريخ"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  placeholder="إلى تاريخ"
                />
              </div>
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
              {filters.search && (
                <Badge variant="secondary" className="text-xs gap-1">
                  🔍 {filters.search}
                  <button onClick={() => handleFilterChange("search", "")}>×</button>
                </Badge>
              )}
              {filters.merchantId !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1">
                  👤 {merchants.find((m: Merchant) => m.id.toString() === filters.merchantId)?.user.name}
                  <button onClick={() => handleFilterChange("merchantId", "all")}>×</button>
                </Badge>
              )}
              {filters.cityId !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1">
                  🏙️ {cities.find((c: City) => c.id.toString() === filters.cityId)?.name}
                  <button onClick={() => handleFilterChange("cityId", "all")}>×</button>
                </Badge>
              )}
              {filters.status !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1">
                  {statusConfig[filters.status]?.label}
                  <button onClick={() => handleFilterChange("status", "all")}>×</button>
                </Badge>
              )}
              {filters.paymentMethod !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1">
                  {filters.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                  <button onClick={() => handleFilterChange("paymentMethod", "all")}>×</button>
                </Badge>
              )}
              {(filters.startDate || filters.endDate) && (
                <Badge variant="secondary" className="text-xs gap-1">
                  📅 {filters.startDate || "..."} - {filters.endDate || "..."}
                  <button onClick={() => {
                    handleFilterChange("startDate", "")
                    handleFilterChange("endDate", "")
                  }}>×</button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 text-xs text-red-600 hover:text-red-700"
              >
                مسح الكل
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Merchants List */}
      {merchantGroups.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-white to-gray-50 border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">لا توجد طلبات</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            لم يتم العثور على طلبات تطابق معايير البحث. حاول تغيير الفلاتر.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white"
            >
              مسح جميع الفلاتر
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Expand/Collapse Controls */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={expandAll} className="gap-1">
              <ChevronDown className="w-4 h-4" />
              فتح الكل
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1">
              <ChevronUp className="w-4 h-4" />
              إغلاق الكل
            </Button>
          </div>

          {/* Merchant Groups */}
          {merchantGroups.map(({ merchant, orders: merchantOrders }) => {
            const isExpanded = expandedMerchants.has(merchant.id)
            const merchantStats = getMerchantStats(merchantOrders)
            const StatusIcon = statusConfig[merchantOrders[0]?.status]?.icon || Package

            return (
              <Card key={merchant.id} className="overflow-hidden border border-gray-200 shadow-sm">
                {/* Merchant Header - Clickable */}
                <div 
                  className="bg-gradient-to-l from-[#048dba]/5 to-white p-4 sm:p-5 border-b border-gray-200 cursor-pointer hover:bg-[#048dba]/5 transition-colors"
                  onClick={() => toggleMerchant(merchant.id)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#048dba] to-[#037296] flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {merchant.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-xl font-bold text-gray-900">
                            {merchant.companyName || merchant.user.name}
                          </h3>
                          <Badge className="bg-[#048dba] text-white">
                            <Store className="w-3 h-3 ml-1" />
                            تاجر
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {merchant.user.email}
                        </p>
                        {merchant.user.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4" />
                            {merchant.user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="bg-white text-base px-3 py-1">
                        <ShoppingBag className="w-4 h-4 ml-1" />
                        {merchantStats.total} طلب
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-base px-3 py-1">
                        <CheckCircle className="w-4 h-4 ml-1" />
                        {merchantStats.delivered} تم التوصيل
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-base px-3 py-1">
                        <Clock className="w-4 h-4 ml-1" />
                        {merchantStats.pending} قيد الانتظار
                      </Badge>
                      <Badge className="bg-[#048dba]/10 text-[#048dba] border-[#048dba]/20 text-base px-3 py-1">
                        <DollarSign className="w-4 h-4 ml-1" />
                        {merchantStats.revenue.toFixed(2)} د.م
                      </Badge>
                      <Button variant="ghost" size="icon" className="mr-2">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Orders Grid - 2 columns on desktop */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-gray-50/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {merchantOrders.map((order: Order) => {
                        const OrderStatusIcon = statusConfig[order.status]?.icon || Package
                        const totalItems = order.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)

                        return (
                          <Card key={order.id} className="hover:shadow-lg transition-all border-r-4 border-r-transparent hover:border-r-[#048dba] group bg-white">
                            <CardContent className="p-0">
                              {/* Order Header */}
                              <div className="p-3 sm:p-4 border-b bg-gradient-to-l from-gray-50 to-white">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <h4 className="font-bold text-gray-900">{order.orderCode}</h4>
                                      <Badge className={cn(statusConfig[order.status]?.color, "border-0 text-xs")}>
                                        <OrderStatusIcon className="w-3 h-3 ml-1 inline" />
                                        {statusConfig[order.status]?.label || order.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(order.createdAt)}
                                      <MapPin className="w-3 h-3 mr-1" />
                                      {order.city.name}
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-lg font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</p>
                                  </div>
                                </div>
                              </div>

                              {/* Order Content */}
                              <div className="p-3 sm:p-4">
                                {/* Customer Info */}
                                <div className="mb-3 pb-3 border-b border-gray-100">
                                  <p className="text-xs text-gray-500 mb-1">العميل</p>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium">{order.customerName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{order.customerPhone}</span>
                                  </div>
                                  <div className="flex items-start gap-2 mt-1">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-sm text-gray-600 line-clamp-1">{order.address}</span>
                                  </div>
                                </div>

                                {/* Delivery Info */}
                                <div className="mb-3 pb-3 border-b border-gray-100">
                                  <p className="text-xs text-gray-500 mb-1">الموصل</p>
                                  <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium">
                                      {order.deliveryMan?.user?.name || "لم يعين بعد"}
                                    </span>
                                  </div>
                                  {order.delivery_date && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      <span className="text-xs text-gray-600">
                                        تاريخ التوصيل: {formatDate(order.delivery_date)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Products Preview */}
                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-2">المنتجات ({totalItems} قطعة)</p>
                                  <div className="flex flex-wrap gap-2">
                                    {order.orderItems.slice(0, 3).map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border">
                                        {item.product.image ? (
                                          <div className="w-6 h-6 rounded overflow-hidden">
                                            <OptimizedImage
                                              src={item.product.image}
                                              alt={item.product.name}
                                              width={24}
                                              height={24}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        ) : (
                                          <Package className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className="text-xs px-1">{item.quantity}</span>
                                      </div>
                                    ))}
                                    {order.orderItems.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{order.orderItems.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                  <Link href={`/admin/orders/${createSlugWithId(order.orderCode, order.id)}`}>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/10"
                                    >
                                      <Eye className="w-4 h-4 ml-1" />
                                      التفاصيل
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-600 hover:bg-green-50"
                                  >
                                    <Printer className="w-4 h-4 ml-1" />
                                    فاتورة
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <span className="text-sm text-gray-600">
            صفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}