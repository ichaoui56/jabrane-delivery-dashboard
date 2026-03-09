"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OptimizedImage } from "@/components/optimized-image"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { updateMerchantOrder, deleteMerchantOrder, getMerchantBaseFee } from "@/lib/actions/order.actions"
import { getAvailableCitiesForMerchant } from "@/lib/actions/order.actions"
import { useToast } from "@/hooks/use-toast"
import { 
  ChevronRight, 
  ChevronLeft, 
  Pencil, 
  Trash2, 
  Eye, 
  Calendar, 
  Phone, 
  MapPin, 
  User, 
  Package, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ShoppingBag,
  Truck,
  AlertCircle,
  Percent,
  Printer
} from "lucide-react"
import { createSlugWithId } from "@/lib/utils/slug"
import { viewInvoice } from "@/lib/utils/pdf-client"
import { getCurrentUser } from "@/lib/actions/auth-actions"

type Order = any
type City = {
  id: number
  name: string
  code: string
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
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
    label: "تم التسليم", 
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

export function OrdersTable({
  orders,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  currentPage,
  totalPages,
  onPageChange,
  enableMerchantEditDelete = false,
}: {
  orders: Order[]
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  enableMerchantEditDelete?: boolean
}) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [baseFee, setBaseFee] = useState<number>(0)
  const [loadingBaseFee, setLoadingBaseFee] = useState(true)
  const [generatingPdfOrderId, setGeneratingPdfOrderId] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [editForm, setEditForm] = useState<{
    customerName: string
    customerPhone: string
    address: string
    cityId: string
    note: string
    paymentMethod: "COD" | "PREPAID"
    totalPrice: string
  } | null>(null)

  // Fetch base fee on component mount
  useEffect(() => {
    const fetchBaseFee = async () => {
      setLoadingBaseFee(true)
      try {
        const result = await getMerchantBaseFee()
        if (result.success) {
          setBaseFee(result.baseFee)
        } else {
          console.error("Failed to fetch base fee:", result.error)
        }
      } catch (error) {
        console.error("Error fetching base fee:", error)
      } finally {
        setLoadingBaseFee(false)
      }
    }
    
    fetchBaseFee()
  }, [])

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    inProgress: orders.filter((o) =>
      ["ACCEPTED", "ASSIGNED_TO_DELIVERY"].includes(o.status),
    ).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => ["REJECTED", "CANCELLED"].includes(o.status)).length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
    totalEarnings: orders.reduce((sum, o) => sum + o.merchantEarning, 0),
  }

  const handleEditClick = async (order: Order) => {
    setLoadingCities(true)
    try {
      const citiesData = await getAvailableCitiesForMerchant()
      setCities(citiesData)
      setEditingOrder(order)
      setEditForm({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        cityId: order.cityId?.toString() || "",
        note: order.note ?? "",
        paymentMethod: order.paymentMethod,
        totalPrice: String(order.totalPrice),
      })
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة المدن",
        variant: "destructive"
      })
    } finally {
      setLoadingCities(false)
    }
  }

  const handleUpdateOrder = async () => {
    if (!editingOrder || !editForm) return

    setIsSubmitting(true)
    try {
      const totalPrice = Number.parseFloat(editForm.totalPrice)
      const result = await updateMerchantOrder(editingOrder.id, {
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone,
        address: editForm.address,
        cityId: Number.parseInt(editForm.cityId),
        note: editForm.note,
        paymentMethod: editForm.paymentMethod,
        totalPrice,
      })

      if (result.success) {
        toast({ title: "✓ تم التعديل", description: result.message })
        setEditingOrder(null)
        setEditForm(null)
        router.refresh()
      } else {
        throw new Error(result.message)
      }
    } catch (e) {
      toast({
        title: "✗ خطأ",
        description: e instanceof Error ? e.message : "فشل في تعديل الطلب",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!deletingOrderId) return

    setIsSubmitting(true)
    try {
      const result = await deleteMerchantOrder(deletingOrderId)
      if (result.success) {
        toast({ title: "✓ تم الحذف", description: result.message })
        setDeletingOrderId(null)
        router.refresh()
      } else {
        throw new Error(result.message)
      }
    } catch (e) {
      toast({
        title: "✗ خطأ",
        description: e instanceof Error ? e.message : "فشل في حذف الطلب",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGeneratePDF = async (order: Order) => {
    setGeneratingPdfOrderId(order.id)
    try {
      const currentUser = await getCurrentUser()
      
      const orderForPDF = {
        orderCode: order.orderCode,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        city: order.city?.name || order.city,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        note: order.note || '',
        orderItems: order.orderItems.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            name: item.product.name,
          },
        })),
      }

      const logoUrl = '/images/logo/blue-logo.png'
      const result = await viewInvoice(
        orderForPDF,
        currentUser?.name || "—",
        currentUser?.phone || "—",
        logoUrl
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to view PDF')
      }
    } catch (error) {
      console.error("[v0] Error viewing PDF:", error)
      toast({
        title: "✗ خطأ",
        description: "فشل في فتح الفاتورة",
        variant: "destructive",
      })
    } finally {
      setGeneratingPdfOrderId(null)
    }
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(1)}
              className={currentPage === 1 ? "bg-[#048dba]" : ""}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={currentPage === page ? "bg-[#048dba]" : ""}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className={currentPage === totalPages ? "bg-[#048dba]" : ""}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          التالي
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">إجمالي الطلبات</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">قيد الانتظار</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">تم التسليم</p>
                <p className="text-xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-l-4 border-l-[#048dba]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">إجمالي الأرباح</p>
                <p className="text-xl font-bold text-[#048dba]">{stats.totalEarnings.toFixed(2)} د.م</p>
              </div>
              <div className="p-2 bg-[#048dba]/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-[#048dba]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="ابحث برقم الطلب أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-10 min-h-[44px]"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={statusFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange("ALL")}
                className={`min-w-[80px] ${statusFilter === "ALL" ? "bg-[#048dba]" : ""}`}
              >
                الكل
              </Button>
              <Button
                variant={statusFilter === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange(statusFilter === "PENDING" ? "ALL" : "PENDING")}
                className={`min-w-[80px] ${statusFilter === "PENDING" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                قيد الانتظار
              </Button>
              <Button
                variant={statusFilter === "DELIVERED" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange(statusFilter === "DELIVERED" ? "ALL" : "DELIVERED")}
                className={`min-w-[80px] ${statusFilter === "DELIVERED" ? "bg-green-500 hover:bg-green-600" : ""}`}
              >
                تم التسليم
              </Button>
              <Button
                variant={statusFilter === "CANCELLED" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange(statusFilter === "CANCELLED" ? "ALL" : "CANCELLED")}
                className={`min-w-[80px] ${statusFilter === "CANCELLED" ? "bg-red-500 hover:bg-red-600" : ""}`}
              >
                ملغية
              </Button>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-gray-500">
            <span>
              عرض {orders.length} من أصل {stats.total} طلب
            </span>
            {!loadingBaseFee && (
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3" />
                رسوم المنصة: {baseFee} د.م لكل طلب
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const StatusIcon = statusMap[order.status]?.icon || Package
          
          return (
            <Card 
              key={order.id} 
              className="hover:shadow-lg transition-all border-r-4 border-r-transparent hover:border-r-[#048dba] group"
            >
              <CardContent className="p-0">
                {/* Header with Order Code and Status */}
                <div className="p-4 sm:p-5 border-b bg-gradient-to-l from-gray-50 to-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#048dba]/10 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-[#048dba]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-gray-900">{order.orderCode}</h3>
                          <Badge className={`${statusMap[order.status]?.color} border-0`}>
                            <StatusIcon className="w-3 h-3 ml-1 inline" />
                            {statusMap[order.status]?.label || order.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left w-full sm:w-auto">
                      <p className="text-xl font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</p>
                      <p className="text-xs text-gray-500">ربحك: {order.merchantEarning.toFixed(2)} د.م</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <User className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <span className="truncate font-medium">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <Phone className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <span className="dir-ltr text-right font-medium">{order.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <span className="truncate font-medium">{order.city?.name || order.city}</span>
                    </div>
                  </div>

                  {/* Products Preview with Images */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Package className="w-3 h-3" />
                      <span>المنتجات ({order.orderItems.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {order.orderItems.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          {item.product.image ? (
                            <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                              <OptimizedImage
                                src={item.product.image}
                                alt={item.product.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="text-xs font-medium">{item.product.name}</span>
                          <Badge variant="outline" className="text-xs px-1">
                            {item.quantity}
                          </Badge>
                        </div>
                      ))}
                      {order.orderItems.length > 3 && (
                        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1">
                          <span className="text-xs font-medium">+{order.orderItems.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  {order.deliveryMan && (
                    <div className="mb-4 p-2 bg-purple-50 rounded-lg flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700">الموصل: {order.deliveryMan.user.name}</span>
                      {order.delivery_date && (
                        <>
                          <span className="text-purple-400">•</span>
                          <span className="text-purple-600 text-xs">
                            تاريخ التوصيل: {new Date(order.delivery_date).toLocaleDateString("ar-MA")}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 justify-end border-t pt-4">
                    <Link href={`/merchant/orders/${createSlugWithId(order.orderCode, order.id)}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[#048dba] border-[#048dba] hover:bg-[#048dba] hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        عرض التفاصيل
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGeneratePDF(order)}
                      disabled={generatingPdfOrderId === order.id}
                      className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white transition-colors"
                    >
                      <Printer className="w-4 h-4 ml-1" />
                      {generatingPdfOrderId === order.id ? "جاري الفتح..." : "عرض الفاتورة"}
                    </Button>

                    {enableMerchantEditDelete && order.status === "PENDING" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(order)}
                          className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                        >
                          <Pencil className="w-4 h-4 ml-1" />
                          تعديل
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingOrderId(order.id)}
                          className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {orders.length === 0 && searchQuery && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">لا توجد نتائج للبحث</p>
              <p className="text-sm text-gray-400">جرب كلمات بحث مختلفة</p>
              <Button 
                variant="outline" 
                onClick={() => onSearchChange("")} 
                className="mt-4 border-[#048dba] text-[#048dba]"
              >
                مسح البحث
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Edit Order Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الطلب #{editingOrder?.orderCode}</DialogTitle>
            <DialogDescription>
              يمكنك تعديل الطلب فقط عندما يكون في حالة "قيد الانتظار".
            </DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم العميل</Label>
                  <Input
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Select
                    value={editForm.cityId}
                    onValueChange={(value) => setEditForm({ ...editForm, cityId: value })}
                    disabled={loadingCities}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCities ? "جاري التحميل..." : "اختر المدينة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCities ? (
                        <div className="text-center py-2">جاري التحميل...</div>
                      ) : (
                        cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select
                    value={editForm.paymentMethod}
                    onValueChange={(value: "COD" | "PREPAID") => 
                      setEditForm({ ...editForm, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COD">الدفع عند الاستلام</SelectItem>
                      <SelectItem value="PREPAID">مدفوع مسبقاً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>السعر الإجمالي</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.totalPrice}
                  onChange={(e) => setEditForm({ ...editForm, totalPrice: e.target.value })}
                />
                {!loadingBaseFee && (
                  <p className="text-xs text-gray-500">
                    بعد خصم رسوم المنصة ({baseFee} د.م) يصبح ربحك: {(Number(editForm.totalPrice) - baseFee).toFixed(2)} د.م
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>العنوان</Label>
                <Textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrder(null)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button 
              onClick={handleUpdateOrder} 
              disabled={isSubmitting || !editForm?.cityId} 
              className="bg-[#048dba] hover:bg-[#037ba0]"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOrderId} onOpenChange={(open) => !open && setDeletingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الطلب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "جاري الحذف..." : "تأكيد الحذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}