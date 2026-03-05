"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface TimelineEvent {
  type: string;
  title: string;
  description: string;
  timestamp: any;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  details: any;
  sortOrder: number;
  attemptNumber?: number;
  attemptData?: any;
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Shield,
  ShoppingCart,
  UserCheck,
  FileText,
  MessageSquare,
  Eye,
  EyeOff,
} from "lucide-react";
import { UpdateOrderStatusDialog } from "./update-order-status-dialog";
import {
  generateAndDownloadInvoice,
  viewInvoice,
} from "@/lib/utils/pdf-client";
import { useToast } from "@/hooks/use-toast";

type OrderDetailProps = {
  order: any;
};

export function OrderDetailClient({ order }: OrderDetailProps) {
  const router = useRouter();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [showPrivateNotes, setShowPrivateNotes] = useState(false);
  const { toast } = useToast();

  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACCEPTED: "مقبول",
    ASSIGNED_TO_DELIVERY: "مسند للتوصيل",
    DELIVERED: "تم التوصيل",
    DELAYED: "مبلغ عنه",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-blue-100 text-blue-800",
    ASSIGNED_TO_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    DELAYED: "bg-red-100 text-red-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  // Filter delivery notes based on privacy settings
  const filteredDeliveryNotes = order.deliveryNotes?.filter(
    (note: any) => showPrivateNotes || !note.isPrivate
  ) || [];

  // Function to get timeline events from order history (sorted chronologically)
  const getTimelineEvents = () => {
    const events: TimelineEvent[] = [];

    // 1. Order Creation (always exists)
    events.push({
      type: "CREATION",
      title: "إنشاء الطلب",
      description: `تم إنشاء الطلب من قبل التاجر ${
        order.merchant?.user?.name || ""
      }`,
      timestamp: order.createdAt,
      icon: ShoppingCart,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      details: `تم إنشاء الطلب #${order.orderCode} بواسطة التاجر ${
        order.merchant?.user?.name || ""
      }`,
      sortOrder: 0,
    });

    // 2. Admin Acceptance (if order status is not PENDING)
    if (order.status !== "PENDING") {
      // Find the first delivery attempt with admin acceptance or look for status change to ACCEPTED
      const adminAcceptance = order.deliveryAttemptHistory?.find(
        (attempt: any) =>
          attempt.notes?.includes("قبول الطلب من قبل الإدارة") ||
          attempt.notes?.includes("موافقة إدارية")
      );

      events.push({
        type: "ADMIN_ACCEPTANCE",
        title: "قبول الطلب من قبل الإدارة",
        description: "تمت الموافقة على الطلب من قبل الإدارة",
        timestamp: adminAcceptance?.attemptedAt || order.updatedAt,
        icon: Shield,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-100",
        details: "تمت الموافقة على الطلب وتم نقله إلى مرحلة التوصيل",
        sortOrder: 1,
      });
    }

    // 3. Delivery Man Acceptance (if assigned)
    if (order.deliveryMan && order.status === "ASSIGNED_TO_DELIVERY") {
      const deliveryAcceptance = order.deliveryAttemptHistory?.find(
        (attempt: any) =>
          attempt.notes?.includes("قبول الطلب من قبل عامل التوصيل")
      );

      events.push({
        type: "DELIVERY_ACCEPTANCE",
        title: "قبول الطلب من قبل عامل التوصيل",
        description: `تم قبول الطلب بواسطة عامل التوصيل ${
          order.deliveryMan?.user?.name || ""
        }`,
        timestamp: deliveryAcceptance?.attemptedAt || order.updatedAt,
        icon: UserCheck,
        iconColor: "text-purple-600",
        bgColor: "bg-purple-100",
        details: `قام ${order.deliveryMan?.user?.name || ""} بقبول طلب التوصيل`,
        sortOrder: 2,
      });
    }

    // 4. Delivery Attempts (excluding admin/delivery man acceptance attempts)
    if (
      order.deliveryAttemptHistory &&
      order.deliveryAttemptHistory.length > 0
    ) {
      const deliveryAttempts = order.deliveryAttemptHistory.filter(
        (attempt: any) =>
          !attempt.notes?.includes("قبول الطلب من قبل الإدارة") &&
          !attempt.notes?.includes("موافقة إدارية") &&
          !attempt.notes?.includes("قبول الطلب من قبل عامل التوصيل")
      );

      deliveryAttempts.forEach((attempt: any, index: number) => {
        const attemptStatus = attempt.status;
        let title = "محاولة توصيل";
        let description = `محاولة توصيل ${index + 1}`;
        let iconColor = "text-yellow-600";
        let bgColor = "bg-yellow-100";
        let details = `بواسطة: ${attempt.deliveryMan?.user?.name || ""}`;

        if (attemptStatus === "SUCCESSFUL") {
          title = "توصيل ناجح";
          description = "تم تسليم الطلب بنجاح";
          iconColor = "text-green-600";
          bgColor = "bg-green-100";
        } else if (attemptStatus === "FAILED" || attemptStatus === "REFUSED") {
          title = "محاولة توصيل فاشلة";
          description = `سبب: ${attempt.reason || "غير محدد"}`;
          iconColor = "text-red-600";
          bgColor = "bg-red-100";
          details = `محاولة ${index + 1}: ${
            attempt.notes || "لا توجد ملاحظات"
          }`;
        } else if (attemptStatus === "CUSTOMER_NOT_AVAILABLE") {
          title = "العميل غير متاح";
          description = "العميل غير متاح في وقت التسليم";
          iconColor = "text-orange-600";
          bgColor = "bg-orange-100";
        } else if (attemptStatus === "WRONG_ADDRESS") {
          title = "عنوان خاطئ";
          description: "العنوان المقدم غير صحيح";
          iconColor = "text-red-600";
          bgColor = "bg-red-100";
        } else if (attemptStatus === "ATTEMPTED") {
          title = "محاولة توصيل";
          description: "محاولة تسليم الطلب";
        }

        events.push({
          type: "DELIVERY_ATTEMPT",
          title,
          description,
          timestamp: attempt.attemptedAt,
          icon: Truck,
          iconColor,
          bgColor,
          details,
          attemptNumber: index + 1,
          attemptData: attempt,
          sortOrder: 3 + index,
        });
      });
    }

    // 5. Report (if DELAY)
    if (order.status === "DELAYED") {
      const reportEvent = order.deliveryAttemptHistory?.find(
        (attempt: any) =>
          attempt.status === "DELAYED" || attempt.notes?.includes("إبلاغ")
      );

      events.push({
        type: "REPORT",
        title: "بلاغ عن الطلب",
        description: "تم إبلاغ عن مشكلة في الطلب",
        timestamp: reportEvent?.attemptedAt || order.updatedAt,
        icon: AlertCircle,
        iconColor: "text-red-600",
        bgColor: "bg-red-100",
        details: order.note || "تم الإبلاغ عن مشكلة في الطلب",
        sortOrder: 100,
      });
    }

    // 6. Delivery Completed
    if (order.status === "DELIVERED" && order.deliveredAt) {
      const deliveryCompleted = order.deliveryAttemptHistory?.find(
        (attempt: any) => attempt.status === "SUCCESSFUL"
      );

      events.push({
        type: "DELIVERY_COMPLETED",
        title: "اكتمال التوصيل",
        description: "تم تسليم الطلب إلى العميل بنجاح",
        timestamp: deliveryCompleted?.attemptedAt || order.deliveredAt,
        icon: CheckCircle2,
        iconColor: "text-green-600",
        bgColor: "bg-green-100",
        details: `تم تسليم الطلب بنجاح`,
        sortOrder: 1000,
      });
    }

    // 7. Order Cancelled/Rejected
    if (order.status === "CANCELLED" || order.status === "REJECTED") {
      const cancellationEvent = order.deliveryAttemptHistory?.find(
        (attempt: any) =>
          attempt.status === "REFUSED" ||
          attempt.status === "CANCELLED" ||
          attempt.notes?.includes("إلغاء") ||
          attempt.notes?.includes("رفض")
      );

      events.push({
        type: "CANCELLATION",
        title: order.status === "CANCELLED" ? "إلغاء الطلب" : "رفض الطلب",
        description:
          order.status === "CANCELLED" ? "تم إلغاء الطلب" : "تم رفض الطلب",
        timestamp: cancellationEvent?.attemptedAt || order.updatedAt,
        icon: XCircle,
        iconColor: "text-red-600",
        bgColor: "bg-red-100",
        details: order.note || "تم إلغاء/رفض الطلب",
        sortOrder: 1000,
      });
    }

    // Sort events by timestamp (oldest first for chronological display)
    return events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const timelineEvents = getTimelineEvents();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "CANCELLED":
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "DELAYED":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-[#048dba]" />;
    }
  };

  const getEventIcon = (event: any) => {
    const Icon = event.icon;
    return <Icon className={`w-5 h-5 ${event.iconColor}`} />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ar-MA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusProgress = () => {
    const statusOrder = [
      "PENDING",
      "ACCEPTED",
      "ASSIGNED_TO_DELIVERY",
      "DELIVERED",
    ];
    const currentIndex = statusOrder.indexOf(order.status);
    return {
      currentStep: currentIndex + 1,
      totalSteps: statusOrder.length,
      percentage: ((currentIndex + 1) / statusOrder.length) * 100,
    };
  };

  const progress = getStatusProgress();

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
                className={`${
                  statusColors[order.status]
                } border-0 text-sm font-medium px-3 py-1`}
              >
                {statusLabels[order.status]}
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
              setGeneratingPdf(true);
              try {
                const orderForPDF = {
                  orderCode: order.orderCode,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  address: order.address,
                  city: order.city,
                  note: order.note || "",
                  totalPrice: order.totalPrice,
                  paymentMethod: order.paymentMethod,
                  createdAt: order.createdAt,
                  orderItems: order.orderItems.map(
                    (item: {
                      id: number;
                      quantity: number;
                      product: { name: string };
                    }) => ({
                      id: item.id,
                      quantity: item.quantity,
                      product: {
                        name: item.product.name,
                      },
                    })
                  ),
                };

                const logoUrl = "/images/logo/logo.png";
                const result = await generateAndDownloadInvoice(
                  orderForPDF,
                  order.merchant?.user?.name || "—",
                  order.merchant?.user?.phone || "_",
                  logoUrl
                );

                if (result.success) {
                  toast({
                    title: "✓ تم إنشاء الفاتورة",
                    description: "تم إنشاء الفاتورة بنجاح وتنزيلها",
                  });
                } else {
                  throw new Error(result.error || "Failed to generate PDF");
                }
              } catch (error) {
                console.error("[v0] Error generating PDF:", error);
                toast({
                  title: "✗ خطأ",
                  description: "فشل في إنشاء الفاتورة",
                  variant: "destructive",
                });
              } finally {
                setGeneratingPdf(false);
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
              setViewingPdf(true);
              try {
                const orderForPDF = {
                  orderCode: order.orderCode,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  address: order.address,
                  city: order.city,
                  note: order.note || "",
                  totalPrice: order.totalPrice,
                  paymentMethod: order.paymentMethod,
                  createdAt: order.createdAt,
                  orderItems: order.orderItems.map(
                    (item: {
                      id: number;
                      quantity: number;
                      product: { name: string };
                    }) => ({
                      id: item.id,
                      quantity: item.quantity,
                      product: {
                        name: item.product.name,
                      },
                    })
                  ),
                };

                const logoUrl = "/images/logo/logo.png";
                const result = await viewInvoice(
                  orderForPDF,
                  order.merchant?.user?.name || "—",
                  order.merchant?.user?.phone || undefined,
                  logoUrl
                );

                if (!result.success) {
                  throw new Error(result.error || "Failed to open PDF");
                }
              } catch (error) {
                console.error("Error viewing PDF:", error);
                toast({
                  title: "خطأ",
                  description: "حدث خطأ أثناء فتح الفاتورة",
                  variant: "destructive",
                });
              } finally {
                setViewingPdf(false);
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

          <UpdateOrderStatusDialog
            orderId={order.id}
            currentStatus={order.status}
            orderCode={order.orderCode}
            onSuccess={() => router.refresh()}
          >
            <Button
              size="sm"
              className="bg-[#048dba] hover:bg-[#037296] text-white shadow-md hover:shadow-lg transition-all h-10 px-4 font-medium"
            >
              تحديث الحالة
            </Button>
          </UpdateOrderStatusDialog>
        </div>
      </div>

      {/* Order Progress */}
      <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 bg-[#048dba]/10 rounded-lg">
              <Clock className="w-5 h-5 text-[#048dba]" />
            </div>
            تقدم الطلب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              الخطوة {progress.currentStep} من {progress.totalSteps}
            </span>
            <span className="text-sm font-bold text-[#048dba]">
              {Math.round(progress.percentage)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#048dba] to-[#037296] rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-2">
            {["قيد الانتظار", "مقبول", "مسند للتوصيل", "تم التوصيل"].map(
              (step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-sm font-bold transition-all duration-300 ${
                      index + 1 <= progress.currentStep
                        ? "bg-[#048dba] text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs font-medium text-center leading-tight ${
                      index + 1 <= progress.currentStep
                        ? "text-[#048dba] font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Notes Card - New Section */}
      {order.deliveryMan && (
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-[#048dba]" />
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  ملاحظات الموصل
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-600"
                >
                  {filteredDeliveryNotes.length} ملاحظة
                </Badge>
                {order.deliveryNotes?.some((note: any) => note.isPrivate) && (
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
            </CardTitle>
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
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {note.content}
                      </p>
                    </div>
                    {note.updatedAt !== note.createdAt && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          تم التعديل في: {formatDate(note.updatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">لا توجد ملاحظات حتى الآن</p>
                {!showPrivateNotes && order.deliveryNotes?.some((note: any) => note.isPrivate) && (
                  <p className="text-xs mt-1 text-gray-400">
                    هناك ملاحظات خاصة مخفية
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Combined Merchant & Delivery Card - Full Width */}
      <Card className="shadow-md border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Merchant Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-[#048dba]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">التاجر</h3>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#048dba] to-[#037296] flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                  {order.merchant.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-gray-900 mb-1">
                    {order.merchant.user.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.merchant.companyName || "متجر"}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700 font-medium">
                    أرباح التاجر
                  </span>
                  <span className="font-bold text-green-600 text-base">
                    {order.merchantEarning.toFixed(2)} د.م
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 font-medium">
                    رسوم المنصة
                  </span>
                  <span className="font-semibold text-gray-600">
                    {(order.totalPrice - order.merchantEarning).toFixed(2)} د.م
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <Truck className="w-5 h-5 text-[#048dba]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">التوصيل</h3>
              </div>
              {order.deliveryMan ? (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {order.deliveryMan.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base text-gray-900 mb-1">
                      {order.deliveryMan.user.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.deliveryMan.vehicleType || "موصل"}
                    </p>
                    {order.deliveryMan.city && (
                      <Badge variant="outline" className="text-xs font-medium">
                        {order.deliveryMan.city}
                      </Badge>
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

              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 font-medium">
                    طريقة الدفع
                  </span>
                  <Badge
                    className={`text-xs font-medium ${
                      order.paymentMethod === "COD"
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-green-100 text-green-800 border-green-200"
                    }`}
                  >
                    {order.paymentMethod === "COD"
                      ? "الدفع عند الاستلام"
                      : "مدفوع مسبقاً"}
                  </Badge>
                </div>
                {order.deliveryAttemptHistory &&
                  order.deliveryAttemptHistory.length > 0 && (
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">
                        عدد محاولات التوصيل
                      </span>
                      <span className="font-bold text-[#048dba]">
                        {order.deliveryAttemptHistory.length}
                      </span>
                    </div>
                  )}
                {filteredDeliveryNotes.length > 0 && (
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium">
                      عدد الملاحظات
                    </span>
                    <span className="font-bold text-[#048dba]">
                      {filteredDeliveryNotes.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products Card */}
          <Card className="shadow-md border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#048dba]" />
                </div>
                <span>المنتجات</span>
                <Badge
                  variant="secondary"
                  className="ml-auto bg-gray-100 text-gray-700 font-medium"
                >
                  {order.orderItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.orderItems.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {item.product.image ? (
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 flex-shrink-0 shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 border-2 border-gray-200">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          الكمية:{" "}
                          <span className="font-medium text-gray-900">
                            {item.quantity}
                          </span>
                        </span>
                        {item.isFree && (
                          <Badge className="bg-green-100 text-green-800 border-0 text-xs font-medium">
                            مجاني
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {order.totalDiscount && order.totalDiscount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">المجموع الأصلي</span>
                      <span className="font-semibold text-gray-900">
                        {order.originalTotalPrice?.toFixed(2) ||
                          order.totalPrice.toFixed(2)}{" "}
                        د.م
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">الخصم</span>
                      <span className="font-semibold text-red-600">
                        -{order.totalDiscount.toFixed(2)} د.م
                      </span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-semibold text-gray-900">
                    المجموع الكلي
                  </span>
                  <span className="text-xl font-bold text-[#048dba]">
                    {order.totalPrice.toFixed(2)} د.م
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <div className="p-2 bg-[#048dba]/10 rounded-lg">
                  <User className="w-5 h-5 text-[#048dba]" />
                </div>
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">الاسم</p>
                  <p className="font-semibold text-base text-gray-900">
                    {order.customerName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Phone className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">الهاتف</p>
                  <p className="font-semibold text-base dir-ltr text-right text-gray-900">
                    {order.customerPhone}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MapPin className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">العنوان</p>
                  <p className="font-medium text-sm text-gray-900 mb-2 leading-relaxed">
                    {order.address}
                  </p>
                  <Badge variant="outline" className="text-xs font-medium">
                    {order.city}
                  </Badge>
                </div>
              </div>
              {order.note && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    ملاحظات إضافية
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {order.note}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}