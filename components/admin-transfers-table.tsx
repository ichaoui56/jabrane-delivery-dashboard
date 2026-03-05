"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateTransferStatus, getAllTransfers } from "@/lib/actions/admin-actions"
import { Truck, Package, CheckCircle, Clock, XCircle, Loader2, Search, Filter, X, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Transfer = {
  id: number
  transferCode: string
  deliveryCompany: string | null
  trackingNumber: string | null
  status: string
  note: string | null
  createdAt: Date
  shippedAt: Date | null
  deliveredToWarehouseAt: Date | null
  merchant: {
    companyName: string | null
    user: {
      name: string
      email: string
    }
  }
  transferItems: Array<{
    id: number
    quantity: number
    product: {
      id: number
      name: string
      price: number
    }
  }>
}

const statusConfig = {
  PENDING: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  IN_TRANSIT: { label: "في الطريق", color: "bg-blue-100 text-blue-800", icon: Truck },
  DELIVERED_TO_WAREHOUSE: { label: "تم التسليم", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "تم الإلغاء", color: "bg-red-100 text-red-800", icon: XCircle },
}

export function AdminTransfersTable() {
  const { toast } = useToast()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [showFilters, setShowFilters] = useState(false)

  // Load transfers on component mount
  useEffect(() => {
    loadTransfers()
  }, [])

  const loadTransfers = async () => {
    try {
      setLoading(true)
      const result = await getAllTransfers()
      if (result.success && result.data) {
        setTransfers(result.data)
      } else {
        toast({
          title: "خطأ",
          description: result.error || "فشل في تحميل البيانات",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (transferId: number, newStatus: string) => {
    setUpdating(transferId)
    try {
      const result = await updateTransferStatus(transferId, newStatus as any)
      
      if (result.success) {
        toast({
          title: "تم التحديث",
          description: result.message,
          variant: "default",
        })
        // Reload transfers to get updated data
        await loadTransfers()
      } else {
        toast({
          title: "خطأ",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  // Filter transfers based on search and status
  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      searchTerm === "" ||
      transfer.transferCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.merchant.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.merchant.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.merchant.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.transferItems.some((item) => 
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )

    const matchesStatus = statusFilter === "ALL" || transfer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case "PENDING": return "IN_TRANSIT"
      case "IN_TRANSIT": return "DELIVERED_TO_WAREHOUSE"
      case "DELIVERED_TO_WAREHOUSE": return null
      case "CANCELLED": return null
      default: return null
    }
  }

  const getStatusButtonText = (currentStatus: string): string => {
    switch (currentStatus) {
      case "PENDING": return "تم الشحن"
      case "IN_TRANSIT": return "تم التسليم"
      default: return "تحديث"
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("ALL")
  }

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "ALL"

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Package className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xl md:text-2xl font-bold">{transfers.length}</p>
              <p className="text-xs md:text-sm text-gray-600">الكل</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("PENDING")}>
          <CardContent className="p-4">
            <div className="text-center">
              <Clock className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-xl md:text-2xl font-bold">
                {transfers.filter(t => t.status === "PENDING").length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">قيد الانتظار</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("IN_TRANSIT")}>
          <CardContent className="p-4">
            <div className="text-center">
              <Truck className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-xl md:text-2xl font-bold">
                {transfers.filter(t => t.status === "IN_TRANSIT").length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">في الطريق</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("DELIVERED_TO_WAREHOUSE")}>
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-green-600" />
              <p className="text-xl md:text-2xl font-bold">
                {transfers.filter(t => t.status === "DELIVERED_TO_WAREHOUSE").length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">تم التسليم</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("CANCELLED")}>
          <CardContent className="p-4">
            <div className="text-center">
              <XCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-red-600" />
              <p className="text-xl md:text-2xl font-bold">
                {transfers.filter(t => t.status === "CANCELLED").length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">ملغي</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="ابحث برقم الشحنة، اسم التاجر، المنتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto bg-transparent"
              >
                <Filter className="w-4 h-4 ml-2" />
                فلترة
                <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {showFilters && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">حالة الشحنة</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="PENDING">قيد الانتظار</option>
                    <option value="IN_TRANSIT">في الطريق</option>
                    <option value="DELIVERED_TO_WAREHOUSE">تم التسليم</option>
                    <option value="CANCELLED">ملغي</option>
                  </select>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    بحث: {searchTerm}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {statusFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    الحالة: {statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setStatusFilter("ALL")} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                  مسح الكل
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-gray-600">
          عرض <span className="font-semibold">{filteredTransfers.length}</span> من{" "}
          <span className="font-semibold">{transfers.length}</span> شحنة
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTransfers}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {/* Transfers List */}
      <Card>
        <CardHeader>
          <CardTitle>الشحنات</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500 mb-2">لا توجد نتائج</p>
              <p className="text-sm text-gray-400">جرب تغيير معايير البحث أو الفلترة</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent" size="sm">
                  مسح الفلاتر
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransfers.map((transfer) => {
                const status = statusConfig[transfer.status as keyof typeof statusConfig] || statusConfig.PENDING
                const StatusIcon = status.icon
                const nextStatus = getNextStatus(transfer.status)
                const totalItems = transfer.transferItems.reduce((sum, item) => sum + item.quantity, 0)
                const totalValue = transfer.transferItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

                return (
                  <div key={transfer.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-gray-600" />
                          <h3 className="font-bold text-lg">{transfer.transferCode}</h3>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          التاجر: {transfer.merchant.companyName || transfer.merchant.user.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {totalItems} قطعة - {totalValue.toFixed(2)} درهم
                        </p>
                        {transfer.trackingNumber && (
                          <p className="text-sm text-gray-600">
                            رقم التتبع: {transfer.trackingNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {nextStatus && (
                          <Button
                            onClick={() => handleStatusUpdate(transfer.id, nextStatus)}
                            disabled={updating === transfer.id}
                            className="bg-[#048dba] text-white hover:bg-[#037a9f]"
                          >
                            {updating === transfer.id ? (
                              <Loader2 className="w-4 h-4 animate-spin ml-2" />
                            ) : null}
                            {getStatusButtonText(transfer.status)}
                          </Button>
                        )}
                        
                        {transfer.status !== "CANCELLED" && transfer.status !== "DELIVERED_TO_WAREHOUSE" && (
                          <Button
                            variant="outline"
                            onClick={() => handleStatusUpdate(transfer.id, "CANCELLED")}
                            disabled={updating === transfer.id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            إلغاء
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {transfer.transferItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{item.product.name}</span>
                          <span className="text-sm text-gray-600">
                            {item.quantity} × {item.product.price} درهم
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                      <span>تاريخ الإنشاء: {new Date(transfer.createdAt).toLocaleDateString("ar-MA")}</span>
                      {transfer.shippedAt && (
                        <span>تاريخ الشحن: {new Date(transfer.shippedAt).toLocaleDateString("ar-MA")}</span>
                      )}
                      {transfer.deliveredToWarehouseAt && (
                        <span>تاريخ التسليم: {new Date(transfer.deliveredToWarehouseAt).toLocaleDateString("ar-MA")}</span>
                      )}
                    </div>

                    {transfer.note && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-semibold text-yellow-800 mb-1">ملاحظات:</p>
                        <p className="text-sm text-yellow-700">{transfer.note}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}