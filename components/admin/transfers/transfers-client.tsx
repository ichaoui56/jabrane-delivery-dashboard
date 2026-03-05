"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, Search, Filter, Clock, Truck, CheckCircle, XCircle, Eye } from 'lucide-react'
import { updateTransferStatus } from "@/lib/actions/admin/transfers"
import { toast } from "@/hooks/use-toast"

type Transfer = {
  id: number
  transferCode: string
  status: string
  deliveryCompany: string | null
  trackingNumber: string | null
  note: string | null
  createdAt: Date
  shippedAt: Date | null
  deliveredToWarehouseAt: Date | null
  merchant: {
    id: number
    companyName: string | null
    user: {
      name: string
      email: string
      phone: string | null
    }
  }
  transferItems: Array<{
    quantity: number
    product: {
      id: number
      name: string
      price: number
      image: string | null
      sku: string | null
    }
  }>
}

export function TransfersClient({ initialTransfers }: { initialTransfers: Transfer[] }) {
  const [transfers, setTransfers] = useState(initialTransfers)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [merchantFilter, setMerchantFilter] = useState<string>("all")
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const uniqueMerchants = useMemo(() => {
    const merchantsMap = new Map()
    transfers.forEach((t) => {
      if (!merchantsMap.has(t.merchant.id)) {
        merchantsMap.set(t.merchant.id, t.merchant)
      }
    })
    return Array.from(merchantsMap.values())
  }, [transfers])

  const filteredTransfers = useMemo(() => {
    return transfers.filter((transfer) => {
      const matchesSearch =
        transfer.transferCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.merchant.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.merchant.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transfer.deliveryCompany?.toLowerCase() || '').includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || transfer.status === statusFilter
      const matchesMerchant = merchantFilter === "all" || transfer.merchant.id.toString() === merchantFilter

      return matchesSearch && matchesStatus && matchesMerchant
    })
  }, [transfers, searchQuery, statusFilter, merchantFilter])

  const stats = useMemo(() => {
    return {
      total: transfers.length,
      pending: transfers.filter((t) => t.status === "PENDING").length,
      inTransit: transfers.filter((t) => t.status === "IN_TRANSIT").length,
      delivered: transfers.filter((t) => t.status === "DELIVERED_TO_WAREHOUSE").length,
      cancelled: transfers.filter((t) => t.status === "CANCELLED").length,
    }
  }, [transfers])

  const handleStatusUpdate = async (transferId: number, newStatus: string) => {
    setIsUpdating(true)
    try {
      const result = await updateTransferStatus(
        transferId,
        newStatus as "PENDING" | "IN_TRANSIT" | "DELIVERED_TO_WAREHOUSE" | "CANCELLED"
      )

      if (result.success) {
        setTransfers((prev) =>
          prev.map((t) =>
            t.id === transferId ? { ...t, status: newStatus } : t
          )
        )
        toast({
          title: "نجح التحديث",
          description: result.message,
        })
        setSelectedTransfer(null)
      } else {
        toast({
          title: "فشل التحديث",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحديث",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "معلق", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      IN_TRANSIT: { label: "قيد الشحن", className: "bg-blue-100 text-blue-800 border-blue-300" },
      DELIVERED_TO_WAREHOUSE: { label: "تم التسليم", className: "bg-green-100 text-green-800 border-green-300" },
      CANCELLED: { label: "ملغي", className: "bg-red-100 text-red-800 border-red-300" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const totalItems = useMemo(() => {
    return filteredTransfers.reduce(
      (sum, t) => sum + t.transferItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    )
  }, [filteredTransfers])

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          إدارة شحنات المنتجات
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          إدارة وتتبع جميع شحنات المنتجات من التجار
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card className="p-3 sm:p-4 border-[#048dba]/20 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-[#048dba]/10 rounded-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-[#048dba]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">إجمالي الشحنات</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.total.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-yellow-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">معلق</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.pending.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">قيد الشحن</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.inTransit.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-green-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">تم التسليم</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.delivered.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-red-200 hover:shadow-md transition-shadow col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">ملغي</p>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {stats.cancelled.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-700">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-[#048dba]" />
            تصفية النتائج
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث برقم الشحنة، التاجر، أو شركة التوصيل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="PENDING">معلق</SelectItem>
                <SelectItem value="IN_TRANSIT">قيد الشحن</SelectItem>
                <SelectItem value="DELIVERED_TO_WAREHOUSE">تم التسليم</SelectItem>
                <SelectItem value="CANCELLED">ملغي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={merchantFilter} onValueChange={setMerchantFilter}>
              <SelectTrigger className="text-sm sm:col-span-2 lg:col-span-1">
                <SelectValue placeholder="التاجر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التجار</SelectItem>
                {uniqueMerchants.map((merchant) => (
                  <SelectItem key={merchant.id} value={merchant.id.toString()}>
                    {merchant.companyName || merchant.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || statusFilter !== "all" || merchantFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-xs sm:text-sm text-gray-600">الفلاتر النشطة:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  بحث: {searchQuery}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  الحالة: {statusFilter}
                </Badge>
              )}
              {merchantFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  تاجر محدد
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setMerchantFilter("all")
                }}
                className="h-6 text-xs text-[#048dba] hover:text-[#037299]"
              >
                مسح الكل
              </Button>
            </div>
          )}

          <div className="text-xs sm:text-sm text-gray-600">
            عرض {filteredTransfers.length.toLocaleString("en-US")} من أصل {stats.total.toLocaleString("en-US")} شحنة
            {" • "}
            {totalItems.toLocaleString("en-US")} قطعة إجمالاً
          </div>
        </div>
      </Card>

      {/* Transfers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filteredTransfers.map((transfer) => {
          const totalQuantity = transfer.transferItems.reduce((sum, item) => sum + item.quantity, 0)
          const totalValue = transfer.transferItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          )

          return (
            <Card
              key={transfer.id}
              className="p-3 sm:p-4 hover:shadow-lg transition-all border-[#048dba]/20 cursor-pointer"
              onClick={() => setSelectedTransfer(transfer)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-[#048dba] truncate">
                      {transfer.transferCode}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {transfer.merchant.companyName || transfer.merchant.user.name}
                    </p>
                  </div>
                  {getStatusBadge(transfer.status)}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">شركة التوصيل:</span>
                    <span className="font-medium truncate max-w-[60%]">{transfer.deliveryCompany}</span>
                  </div>
                  {transfer.trackingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">رقم التتبع:</span>
                      <span className="font-medium truncate max-w-[60%]">{transfer.trackingNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">عدد المنتجات:</span>
                    <span className="font-medium">{transfer.transferItems.length.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">إجمالي القطع:</span>
                    <span className="font-medium">{totalQuantity.toLocaleString("en-US")}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">تاريخ الإنشاء:</span>
                    <span className="font-medium">
                      {new Date(transfer.createdAt).toLocaleDateString("ar-MA")}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full bg-[#048dba] hover:bg-[#037299] text-white text-xs sm:text-sm"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTransfer(transfer)
                  }}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                  عرض التفاصيل
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredTransfers.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">لا توجد شحنات</h3>
          <p className="text-xs sm:text-sm text-gray-600">لم يتم العثور على أي شحنات مطابقة للفلاتر المحددة</p>
        </Card>
      )}

      {/* Transfer Details Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">تفاصيل الشحنة {selectedTransfer?.transferCode}</DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4 sm:space-y-6">
              {/* Merchant Info */}
              <Card className="p-3 sm:p-4 bg-gray-50">
                <h4 className="font-semibold text-sm sm:text-base mb-3">معلومات التاجر</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">الاسم:</span>
                    <span className="font-medium mr-2">{selectedTransfer.merchant.user.name}</span>
                  </div>
                  {selectedTransfer.merchant.companyName && (
                    <div>
                      <span className="text-gray-600">الشركة:</span>
                      <span className="font-medium mr-2">{selectedTransfer.merchant.companyName}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">البريد الإلكتروني:</span>
                    <span className="font-medium mr-2">{selectedTransfer.merchant.user.email}</span>
                  </div>
                  {selectedTransfer.merchant.user.phone && (
                    <div>
                      <span className="text-gray-600">الهاتف:</span>
                      <span className="font-medium mr-2">{selectedTransfer.merchant.user.phone}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Delivery Info */}
              <Card className="p-3 sm:p-4 bg-gray-50">
                <h4 className="font-semibold text-sm sm:text-base mb-3">معلومات الشحن</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">شركة التوصيل:</span>
                    <span className="font-medium mr-2">{selectedTransfer.deliveryCompany}</span>
                  </div>
                  {selectedTransfer.trackingNumber && (
                    <div>
                      <span className="text-gray-600">رقم التتبع:</span>
                      <span className="font-medium mr-2">{selectedTransfer.trackingNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">الحالة:</span>
                    <span className="mr-2">{getStatusBadge(selectedTransfer.status)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">تاريخ الإنشاء:</span>
                    <span className="font-medium mr-2">
                      {new Date(selectedTransfer.createdAt).toLocaleString("ar-MA")}
                    </span>
                  </div>
                  {selectedTransfer.shippedAt && (
                    <div>
                      <span className="text-gray-600">تاريخ الشحن:</span>
                      <span className="font-medium mr-2">
                        {new Date(selectedTransfer.shippedAt).toLocaleString("ar-MA")}
                      </span>
                    </div>
                  )}
                  {selectedTransfer.deliveredToWarehouseAt && (
                    <div>
                      <span className="text-gray-600">تاريخ التسليم:</span>
                      <span className="font-medium mr-2">
                        {new Date(selectedTransfer.deliveredToWarehouseAt).toLocaleString("ar-MA")}
                      </span>
                    </div>
                  )}
                </div>
                {selectedTransfer.note && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-gray-600 text-xs sm:text-sm">ملاحظات:</span>
                    <p className="text-xs sm:text-sm mt-1">{selectedTransfer.note}</p>
                  </div>
                )}
              </Card>

              {/* Products */}
              <div>
                <h4 className="font-semibold text-sm sm:text-base mb-3">المنتجات ({selectedTransfer.transferItems.length})</h4>
                <div className="space-y-2 sm:space-y-3">
                  {selectedTransfer.transferItems.map((item, index) => (
                    <Card key={index} className="p-2 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {item.product.image ? (
                          <img
                            src={item.product.image || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-xs sm:text-sm truncate">{item.product.name}</h5>
                          {item.product.sku && (
                            <p className="text-xs text-gray-600">SKU: {item.product.sku}</p>
                          )}
                          <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs sm:text-sm">
                            <span className="text-gray-600">
                              الكمية: <span className="font-medium">{item.quantity.toLocaleString("en-US")}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Status Update */}
              {selectedTransfer.status !== "DELIVERED_TO_WAREHOUSE" &&
                selectedTransfer.status !== "CANCELLED" && (
                  <Card className="p-3 sm:p-4 bg-[#048dba]/5">
                    <h4 className="font-semibold text-sm sm:text-base mb-3">تحديث حالة الشحنة</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedTransfer.status === "PENDING" && (
                        <>
                          <Button
                            onClick={() => handleStatusUpdate(selectedTransfer.id, "IN_TRANSIT")}
                            disabled={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                            size="sm"
                          >
                            قيد الشحن
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(selectedTransfer.id, "DELIVERED_TO_WAREHOUSE")}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                            size="sm"
                          >
                            تم التسليم
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(selectedTransfer.id, "CANCELLED")}
                            disabled={isUpdating}
                            variant="destructive"
                            className="text-xs sm:text-sm col-span-2 sm:col-span-2"
                            size="sm"
                          >
                            إلغاء
                          </Button>
                        </>
                      )}
                      {selectedTransfer.status === "IN_TRANSIT" && (
                        <>
                          <Button
                            onClick={() => handleStatusUpdate(selectedTransfer.id, "DELIVERED_TO_WAREHOUSE")}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm col-span-2"
                            size="sm"
                          >
                            تم التسليم
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(selectedTransfer.id, "CANCELLED")}
                            disabled={isUpdating}
                            variant="destructive"
                            className="text-xs sm:text-sm col-span-2"
                            size="sm"
                          >
                            إلغاء
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
