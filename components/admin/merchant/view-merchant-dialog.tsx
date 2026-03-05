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
import { getMerchantDetails } from "@/lib/actions/admin/merchant"
import { Loader2, Package, ShoppingCart, History, DollarSign } from 'lucide-react'

export function ViewMerchantDialog({ 
  merchantId,
  children 
}: { 
  merchantId: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [merchant, setMerchant] = useState<any>(null)

  useEffect(() => {
    if (open && !merchant) {
      loadMerchantData()
    }
  }, [open])

  const loadMerchantData = async () => {
    setLoading(true)
    const result = await getMerchantDetails(merchantId)
    if (result.success) {
      setMerchant(result.data)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل التاجر</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : merchant ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Avatar className="w-20 h-20">
                <AvatarImage src={merchant.user.image || undefined} />
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {merchant.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{merchant.user.name}</h3>
                <p className="text-gray-600">{merchant.companyName || "لا يوجد اسم شركة"}</p>
                <p className="text-sm text-gray-500">{merchant.user.email}</p>
                {merchant.user.phone && (
                  <p className="text-sm text-gray-500">{merchant.user.phone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">الرصيد الحالي</p>
                <p className="text-2xl font-bold text-green-600">
                  {merchant.balance.toFixed(2)} د.م
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-500">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{merchant._count.orders}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">المنتجات</p>
                <p className="text-2xl font-bold">{merchant._count.products}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-green-600">
                  {merchant.totalEarned.toFixed(2)} د.م
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-gray-500">الرسوم الأساسية</p>
                <p className="text-2xl font-bold">{merchant.baseFee.toFixed(2)} د.م</p>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">
                  <Package className="w-4 h-4 ml-2" />
                  المنتجات
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  الطلبات الأخيرة
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  <DollarSign className="w-4 h-4 ml-2" />
                  المدفوعات
                </TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-2">
                {merchant.products.length > 0 ? (
                  merchant.products.map((product: any) => (
                    <Card key={product.id} className="p-4">
                      <div className="flex items-center gap-4">
                        {product.image && (
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.description}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-sm">
                              السعر: <strong>{product.price.toFixed(2)} د.م</strong>
                            </span>
                            <span className="text-sm">
                              المخزون: <strong>{product.stockQuantity}</strong>
                            </span>
                            <span className="text-sm">
                              تم التوصيل: <strong>{product.deliveredCount}</strong>
                            </span>
                          </div>
                        </div>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد منتجات</p>
                )}
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-2">
                {merchant.orders.length > 0 ? (
                  merchant.orders.slice(0, 10).map((order: any) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{order.orderCode}</p>
                          <p className="text-sm text-gray-500">{order.customerName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString("ar-MA")}
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
                  <p className="text-center text-gray-500 py-8">لا توجد طلبات</p>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-2">
                {merchant.moneyTransfers.length > 0 ? (
                  merchant.moneyTransfers.map((transfer: any) => (
                    <Card key={transfer.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-green-600">
                            +{transfer.amount.toFixed(2)} د.م
                          </p>
                          <p className="text-sm text-gray-500">{transfer.note || "تحويل مالي"}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(transfer.transferDate).toLocaleDateString("ar-MA")}
                          </p>
                        </div>
                        {transfer.reference && (
                          <Badge variant="outline">مرجع: {transfer.reference}</Badge>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">لا توجد معاملات مالية</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Banking Info */}
            {(merchant.rib || merchant.bankName) && (
              <Card className="p-4">
                <h4 className="font-semibold mb-2">المعلومات البنكية</h4>
                <div className="space-y-1 text-sm">
                  {merchant.bankName && (
                    <p>
                      البنك: <strong>{merchant.bankName}</strong>
                    </p>
                  )}
                  {merchant.rib && (
                    <p>
                      RIB: <strong>{merchant.rib}</strong>
                    </p>
                  )}
                </div>
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
