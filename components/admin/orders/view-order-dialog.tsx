"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrderDetails } from "@/lib/actions/admin/order"
import { Loader2, Package, User, MapPin, History } from 'lucide-react'

export function ViewOrderDialog({ 
  orderId,
  children 
}: { 
  orderId: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (open && !order) {
      loadOrderData()
    }
  }, [open])

  const loadOrderData = async () => {
    setLoading(true)
    const result = await getOrderDetails(orderId)
    if (result.success) {
      setOrder(result.data)
    }
    setLoading(false)
  }

  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACCEPTED: "مقبول",
    ASSIGNED_TO_DELIVERY: "مسند للتوصيل",
    DELIVERED: "تم التوصيل",
    DELAYED: "مبلغ عنه",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل الطلب</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="text-2xl font-bold text-blue-600">{order.orderCode}</h3>
                <p className="text-gray-600">{order.customerName}</p>
                <p className="text-sm text-gray-500">{order.customerPhone}</p>
              </div>
              <div className="text-right">
                <Badge className="mb-2">{statusLabels[order.status]}</Badge>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString("ar-MA")}
                </p>
              </div>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <h4 className="font-semibold">التاجر</h4>
                </div>
                <p className="font-medium">{order.merchant.user.name}</p>
                <p className="text-sm text-gray-500">{order.merchant.user.email}</p>
                {order.merchant.user.phone && (
                  <p className="text-sm text-gray-500">{order.merchant.user.phone}</p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <h4 className="font-semibold">موظف التوصيل</h4>
                </div>
                {order.deliveryMan ? (
                  <>
                    <p className="font-medium">{order.deliveryMan.user.name}</p>
                    <p className="text-sm text-gray-500">{order.deliveryMan.user.email}</p>
                    {order.deliveryMan.user.phone && (
                      <p className="text-sm text-gray-500">{order.deliveryMan.user.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400">لم يتم التعيين بعد</p>
                )}
              </Card>
            </div>

            {/* Address */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <h4 className="font-semibold">عنوان التوصيل</h4>
              </div>
              <p className="text-gray-600">{order.address}</p>
              <p className="text-sm text-gray-500 mt-1">المدينة: {order.city}</p>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items">
                  <Package className="w-4 h-4 ml-2" />
                  المنتجات
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="w-4 h-4 ml-2" />
                  سجل التوصيل
                </TabsTrigger>
              </TabsList>

              {/* Order Items */}
              <TabsContent value="items" className="space-y-2">
                {order.orderItems.map((item: any) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center gap-4">
                      {item.product.image && (
                        <img
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-gray-500">{item.product.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                        <p className="font-semibold">{item.price.toFixed(2)} د.م</p>
                        <p className="text-sm text-gray-500">
                          المجموع: {(item.price * item.quantity).toFixed(2)} د.م
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Total */}
                <Card className="p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">المجموع الإجمالي</p>
                      <p className="text-sm text-gray-500">
                        {order.paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {order.totalPrice.toFixed(2)} د.م
                    </p>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t">
                    <p className="text-sm text-gray-600">أرباح التاجر</p>
                    <p className="text-sm font-semibold">{order.merchantEarning.toFixed(2)} د.م</p>
                  </div>
                </Card>
              </TabsContent>

              {/* Delivery History */}
              <TabsContent value="history" className="space-y-2">
                {order.deliveryAttemptHistory.length > 0 ? (
                  order.deliveryAttemptHistory.map((attempt: any) => (
                    <Card key={attempt.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">محاولة توصيل #{attempt.attemptNumber}</p>
                          {attempt.deliveryMan && (
                            <p className="text-sm text-gray-500">
                              الموصل: {attempt.deliveryMan.user.name}
                            </p>
                          )}
                          {attempt.reason && (
                            <p className="text-sm text-gray-600 mt-1">السبب: {attempt.reason}</p>
                          )}
                          {attempt.notes && (
                            <p className="text-sm text-gray-600">ملاحظات: {attempt.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(attempt.attemptedAt).toLocaleString("ar-MA")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            attempt.status === "SUCCESSFUL"
                              ? "default"
                              : attempt.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {attempt.status}
                        </Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد محاولات توصيل</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Note */}
            {order.note && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold mb-2">ملاحظة</h4>
                <p className="text-gray-700">{order.note}</p>
              </Card>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">لم يتم العثور على البيانات</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
