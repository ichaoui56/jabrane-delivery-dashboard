"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OptimizedImage } from "@/components/optimized-image"
import {
  ArrowRight,
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Printer,
  ShoppingCart,
  FileText,
  MessageSquare,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
  DollarSign,
  AlertTriangle,
  Copy,
  Store,
  Hash,
  Tag,
  BarChart3,
  Info
} from "lucide-react"
import { generateAndDownloadInvoice, viewInvoice } from "@/lib/utils/pdf-client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

type OrderDetailProps = {
  order: any
}

export function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter()
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [viewingPdf, setViewingPdf] = useState(false)
  const [showPrivateNotes, setShowPrivateNotes] = useState(false)
  const { toast } = useToast()

  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACCEPTED: "مقبول",
    ASSIGNED_TO_DELIVERY: "مسند للتوصيل",
    DELIVERED: "تم التوصيل",
    DELAYED: "مبلغ عنه",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى",
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ACCEPTED: "bg-blue-100 text-blue-800 border-blue-200",
    ASSIGNED_TO_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    DELAYED: "bg-red-100 text-red-800 border-red-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
  }

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    ACCEPTED: Shield,
    ASSIGNED_TO_DELIVERY: UserCheck,
    DELIVERED: CheckCircle2,
    DELAYED: AlertTriangle,
    REJECTED: XCircle,
    CANCELLED: XCircle,
  }

  // Filter delivery notes based on privacy settings
  const filteredDeliveryNotes = order.deliveryNotes?.filter(
    (note: any) => showPrivateNotes || !note.isPrivate
  ) || []

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "PPP p", { locale: ar })
  }

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2) + " د.م"
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "✓ تم النسخ",
      description: message,
    })
  }

  const StatusIcon = statusIcons[order.status] || Clock

  return (
    <div className="space-y-6 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-[#048dba]/10 text-[#048dba] flex-shrink-0 h-10 w-10 rounded-lg"
            aria-label="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                الطلب #{order.orderCode}
              </h1>
              <Badge
                className={`${statusColors[order.status]} border-0 text-sm font-medium px-3 py-1`}
              >
                <StatusIcon className="w-4 h-4 ml-1 inline" />
                {statusLabels[order.status]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>تم الإنشاء في {formatDate(order.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-start sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white transition-all shadow-sm h-10 px-4"
            onClick={async () => {
              setGeneratingPdf(true)
              try {
                const orderForPDF = {
                  orderCode: order.orderCode,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  address: order.address,
                  city: order.city?.name || order.city,
                  note: order.note || "",
                  totalPrice: order.totalPrice,
                  paymentMethod: order.paymentMethod,
                  createdAt: order.createdAt,
                  orderItems: order.orderItems.map((item: any) => ({
                    id: item.id,
                    quantity: item.quantity,
                    product: {
                      name: item.product.name,
                    },
                  })),
                }

                const logoUrl = "/images/logo/blue-logo.png"
                const result = await generateAndDownloadInvoice(
                  orderForPDF,
                  order.merchant?.user?.name || "—",
                  order.merchant?.user?.phone || "_",
                  logoUrl
                )

                if (result.success) {
                  toast({
                    title: "✓ تم إنشاء الفاتورة",
                    description: "تم إنشاء الفاتورة بنجاح وتنزيلها",
                  })
                } else {
                  throw new Error(result.error || "Failed to generate PDF")
                }
              } catch (error) {
                console.error("Error generating PDF:", error)
                toast({
                  title: "✗ خطأ",
                  description: "فشل في إنشاء الفاتورة",
                  variant: "destructive",
                })
              } finally {
                setGeneratingPdf(false)
              }
            }}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <span className="text-sm">جاري التحميل...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                <span>تحميل الفاتورة</span>
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm h-10 px-4"
            onClick={async () => {
              setViewingPdf(true)
              try {
                const orderForPDF = {
                  orderCode: order.orderCode,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  address: order.address,
                  city: order.city?.name || order.city,
                  note: order.note || "",
                  totalPrice: order.totalPrice,
                  paymentMethod: order.paymentMethod,
                  createdAt: order.createdAt,
                  orderItems: order.orderItems.map((item: any) => ({
                    id: item.id,
                    quantity: item.quantity,
                    product: {
                      name: item.product.name,
                    },
                  })),
                }

                const logoUrl = "/images/logo/blue-logo.png"
                const result = await viewInvoice(
                  orderForPDF,
                  order.merchant?.user?.name || "—",
                  order.merchant?.user?.phone || undefined,
                  logoUrl
                )

                if (!result.success) {
                  throw new Error(result.error || "Failed to open PDF")
                }
              } catch (error) {
                console.error("Error viewing PDF:", error)
                toast({
                  title: "خطأ",
                  description: "حدث خطأ أثناء فتح الفاتورة",
                  variant: "destructive",
                })
              } finally {
                setViewingPdf(false)
              }
            }}
            disabled={viewingPdf}
          >
            {viewingPdf ? (
              <span className="text-sm">جاري التحميل...</span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>عرض الفاتورة</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Order Status Timeline */}
      <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 bg-[#048dba]/10 rounded-lg">
              <Clock className="w-5 h-5 text-[#048dba]" />
            </div>
            حالة الطلب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <div className="p-2 rounded-full bg-blue-100">
                <StatusIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{statusLabels[order.status]}</p>
                <p className="text-sm text-gray-500">
                  آخر تحديث: {formatDate(order.updatedAt)}
                </p>
              </div>
            </div>

            {order.delivery_date && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="p-2 rounded-full bg-green-100">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">تاريخ التوصيل المتوقع</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.delivery_date)}
                  </p>
                </div>
              </div>
            )}

            {order.previous_delivery_date && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-100 bg-yellow-50">
                <div className="p-2 rounded-full bg-yellow-100">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">تم تأجيل التوصيل</p>
                  <p className="text-sm text-yellow-600">
                    تاريخ سابق: {formatDate(order.previous_delivery_date)}
                  </p>
                  {order.delay_reason && (
                    <p className="text-xs text-yellow-700 mt-1">{order.delay_reason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Products and Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products Card */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#048dba]" />
                </div>
                <span>المنتجات</span>
                <Badge variant="secondary" className="mr-auto bg-gray-100 text-gray-700">
                  {order.orderItems.length} منتج
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.orderItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {item.product.image ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0 shadow-sm">
                        <OptimizedImage
                          src={item.product.image}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 border-2 border-gray-200">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-base">
                          {item.product.name}
                        </h3>
                        {item.product.sku && (
                          <Badge variant="outline" className="text-xs">
                            <Hash className="w-3 h-3 ml-1" />
                            {item.product.sku}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          الكمية:{" "}
                          <span className="font-medium text-gray-900">
                            {item.quantity}
                          </span>
                        </span>
                        {item.isFree && (
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                            مجاني
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">
                    المجموع الكلي
                  </span>
                  <div className="text-left">
                    {order.originalTotalPrice && order.originalTotalPrice !== order.totalPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        {formatCurrency(order.originalTotalPrice)}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-[#048dba]">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </div>
                </div>
                {order.totalDiscount && order.totalDiscount > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    تم توفير {formatCurrency(order.totalDiscount)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Attempts Timeline */}
          {order.deliveryAttemptHistory && order.deliveryAttemptHistory.length > 0 && (
            <Card className="shadow-md border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <div className="p-2 bg-[#048dba]/10 rounded-lg">
                    <Clock className="w-5 h-5 text-[#048dba]" />
                  </div>
                  <span>سجل محاولات التوصيل</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.deliveryAttemptHistory.map((attempt: any, index: number) => {
                    const attemptLabels: Record<string, { label: string; color: string }> = {
                      ATTEMPTED: { label: "محاولة توصيل", color: "text-yellow-600 bg-yellow-50" },
                      SUCCESSFUL: { label: "توصيل ناجح", color: "text-green-600 bg-green-50" },
                      FAILED: { label: "فشل التوصيل", color: "text-red-600 bg-red-50" },
                      CUSTOMER_NOT_AVAILABLE: { label: "العميل غير متاح", color: "text-orange-600 bg-orange-50" },
                      WRONG_ADDRESS: { label: "عنوان خاطئ", color: "text-red-600 bg-red-50" },
                      REFUSED: { label: "رفض الاستلام", color: "text-red-600 bg-red-50" },
                      OTHER: { label: "أخرى", color: "text-gray-600 bg-gray-50" },
                    }

                    const attemptInfo = attemptLabels[attempt.status] || { 
                      label: attempt.status, 
                      color: "text-gray-600 bg-gray-50" 
                    }

                    return (
                      <div key={attempt.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${attemptInfo.color}`}>
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                          {index < order.deliveryAttemptHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{attemptInfo.label}</h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(attempt.attemptedAt)}
                            </span>
                          </div>
                          {attempt.deliveryMan && (
                            <p className="text-sm text-gray-600 mb-1">
                              الموصل: {attempt.deliveryMan.user.name}
                            </p>
                          )}
                          {attempt.notes && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                              {attempt.notes}
                            </p>
                          )}
                          {attempt.reason && (
                            <p className="text-xs text-red-600 mt-1">السبب: {attempt.reason}</p>
                          )}
                          {attempt.location && (
                            <p className="text-xs text-gray-500 mt-1">الموقع: {attempt.location}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-[#048dba]" />
                </div>
                <span>معلومات الدفع</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">طريقة الدفع</span>
                <Badge
                  className={`text-xs font-medium ${
                    order.paymentMethod === "COD"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">إجمالي الطلب</span>
                <span className="font-bold text-[#048dba]">
                  {formatCurrency(order.totalPrice)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700 font-medium">ربحك</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(order.merchantEarning)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">رسوم المنصة</span>
                <span className="font-semibold text-gray-600">
                  {formatCurrency(order.totalPrice - order.merchantEarning)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer and Delivery Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <User className="w-5 h-5 text-[#048dba]" />
                </div>
                <span>معلومات العميل</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">الاسم</p>
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(order.customerName, "تم نسخ الاسم")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Phone className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="font-semibold text-gray-900 dir-ltr text-right">
                    {order.customerPhone}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(order.customerPhone, "تم نسخ رقم الهاتف")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MapPin className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">العنوان</p>
                  <p className="font-medium text-sm text-gray-900 mb-2">
                    {order.address}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {order.city?.name || order.city}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(order.address, "تم نسخ العنوان")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              {order.note && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-medium">ملاحظات إضافية</p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{order.note}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Delivery Info */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <Truck className="w-5 h-5 text-[#048dba]" />
                </div>
                <span>معلومات التوصيل</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.deliveryMan ? (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0">
                    {order.deliveryMan.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-1">
                      {order.deliveryMan.user.name}
                    </p>
                    {order.deliveryMan.vehicleType && (
                      <p className="text-xs text-gray-600">{order.deliveryMan.vehicleType}</p>
                    )}
                    {order.deliveryMan.user.phone && (
                      <p className="text-xs text-gray-500 mt-1 dir-ltr">{order.deliveryMan.user.phone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">
                    لم يتم تعيين موصل بعد
                  </p>
                </div>
              )}

              {order.deliveryAttemptHistory && order.deliveryAttemptHistory.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">عدد محاولات التوصيل</span>
                  <span className="font-bold text-[#048dba]">
                    {order.deliveryAttemptHistory.length}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Notes */}
          {order.deliveryNotes && order.deliveryNotes.length > 0 && (
            <Card className="shadow-md border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    <div className="p-2 bg-[#048dba]/10 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-[#048dba]" />
                    </div>
                    <span>ملاحظات الموصل</span>
                  </CardTitle>
                  {order.deliveryNotes.some((note: any) => note.isPrivate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivateNotes(!showPrivateNotes)}
                      className="h-8 px-2 text-xs"
                    >
                      {showPrivateNotes ? (
                        <>
                          <EyeOff className="w-3 h-3 ml-1" />
                          إخفاء الخاصة
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 ml-1" />
                          عرض الخاصة
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredDeliveryNotes.length > 0 ? (
                  <div className="space-y-4">
                    {filteredDeliveryNotes.map((note: any) => (
                      <div
                        key={note.id}
                        className={`p-4 rounded-lg border ${
                          note.isPrivate
                            ? "bg-red-50 border-red-100"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#048dba] to-[#037296] flex items-center justify-center text-white text-sm font-semibold">
                              {note.deliveryMan?.user?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                {note.deliveryMan?.user?.name || "غير معروف"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(note.createdAt)}
                              </p>
                            </div>
                          </div>
                          {note.isPrivate && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-red-100 text-red-800 border-red-200"
                            >
                              خاصة
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {note.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">لا توجد ملاحظات حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}