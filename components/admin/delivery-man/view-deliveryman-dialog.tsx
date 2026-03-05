"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDeliveryManDetails } from "@/lib/actions/admin/delivery-men"
import { Loader2, ShoppingCart, History } from 'lucide-react'

export function ViewDeliveryManDialog({ 
  deliveryManId,
  children 
}: { 
  deliveryManId: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deliveryMan, setDeliveryMan] = useState<any>(null)

  useEffect(() => {
    if (open && !deliveryMan) {
      loadDeliveryManData()
    }
  }, [open])

  const loadDeliveryManData = async () => {
    setLoading(true)
    const result = await getDeliveryManDetails(deliveryManId)
    if (result.success) {
      setDeliveryMan(result.data)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل موظف التوصيل</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : deliveryMan ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Avatar className="w-20 h-20">
                <AvatarImage src={deliveryMan.user.image || undefined} />
                <AvatarFallback className="bg-purple-600 text-white text-2xl">
                  {deliveryMan.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{deliveryMan.user.name}</h3>
                  <Badge variant={deliveryMan.active ? "default" : "secondary"}>
                    {deliveryMan.active ? "نشط" : "غير نشط"}
                  </Badge>
                </div>
                <p className="text-gray-600">{deliveryMan.vehicleType || "لا توجد مركبة"}</p>
                <p className="text-sm text-gray-500">{deliveryMan.user.email}</p>
                {deliveryMan.user.phone && (
                  <p className="text-sm text-gray-500">{deliveryMan.user.phone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-green-600">
                  {deliveryMan.totalEarned.toFixed(2)} د.م
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-500">إجمالي التوصيلات</p>
                <p className="text-2xl font-bold">{deliveryMan.totalDeliveries}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">التوصيلات الناجحة</p>
                <p className="text-2xl font-bold text-green-600">
                  {deliveryMan.successfulDeliveries}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">معدل النجاح</p>
                <p className="text-2xl font-bold text-blue-600">
                  {deliveryMan.totalDeliveries > 0
                    ? ((deliveryMan.successfulDeliveries / deliveryMan.totalDeliveries) * 100).toFixed(1)
                    : "0"}%
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">الرسوم الأساسية</p>
                <p className="text-2xl font-bold">{deliveryMan.baseFee.toFixed(2)} د.م</p>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  الطلبات المسندة
                </TabsTrigger>
                <TabsTrigger value="attempts">
                  <History className="w-4 h-4 ml-2" />
                  محاولات التوصيل
                </TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-2">
                {deliveryMan.assignedOrders.length > 0 ? (
                  deliveryMan.assignedOrders.slice(0, 10).map((order: any) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{order.orderCode}</p>
                          <p className="text-sm text-gray-500">{order.customerName}</p>
                          <p className="text-sm text-gray-500">
                            التاجر: {order.merchant.user.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString("en-US")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{order.totalPrice.toFixed(2)} د.م</p>
                          <Badge>{order.status}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد طلبات مسندة</p>
                )}
              </TabsContent>

              {/* Attempts Tab */}
              <TabsContent value="attempts" className="space-y-2">
                {deliveryMan.deliveryAttempts.length > 0 ? (
                  deliveryMan.deliveryAttempts.map((attempt: any) => (
                    <Card key={attempt.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">محاولة #{attempt.attemptNumber}</p>
                          <p className="text-sm text-gray-500">
                            الطلب: {attempt.order.orderCode}
                          </p>
                          {attempt.reason && (
                            <p className="text-sm text-gray-500">السبب: {attempt.reason}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {new Date(attempt.attemptedAt).toLocaleDateString("ar-MA")}
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
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">لم يتم العثور على البيانات</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
