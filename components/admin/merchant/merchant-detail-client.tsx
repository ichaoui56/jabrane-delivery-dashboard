"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, DollarSign, Package, ShoppingCart, TrendingUp, Phone, Mail, Building, CreditCard, Calendar, Eye, FileText, Box, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import { EditMerchantDialog } from "./edit-merchant-dialog"
import { AddPaymentDialog } from "./add-payment-dialog"
import { createSlugWithId } from "@/lib/utils/slug"

type MerchantDetail = {
  id: number
  companyName: string | null
  balance: number
  totalEarned: number
  rib: string | null
  bankName: string | null
  baseFee: number
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
    createdAt: string
  }
  products: Array<{
    id: number
    name: string
    image: string | null
    stockQuantity: number
    isActive: boolean
    createdAt: string
  }>
  orders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    merchantEarning: number
    status: string
    city: {
      id: number
      name: string
      code: string
      isActive: boolean
      orderCount: number
      createdAt: string
      updatedAt: string
    }
    createdAt: string
  }>
  productTransfers: Array<{
    id: number
    transferCode: string
    status: string
    createdAt: string
    transferItems: Array<{
      quantity: number
      product: {
        name: string
        image: string | null
      }
    }>
  }>
  moneyTransfers: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    invoiceImage: string | null
    createdAt: string
  }>
}

export function MerchantDetailClient({ initialMerchant }: { initialMerchant: MerchantDetail }) {
  const [merchant, setMerchant] = useState(initialMerchant)
  const router = useRouter()

  const stats = {
    totalProducts: merchant.products.length,
    activeProducts: merchant.products.filter(p => p.isActive).length,
    totalOrders: merchant.orders.length,
    deliveredOrders: merchant.orders.filter(o => o.status === "DELIVERED").length,
    totalTransfers: merchant.productTransfers.length,
    totalPayments: merchant.moneyTransfers.filter(mt => mt.amount < 0).length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
            <Clock className="w-3 h-3 ml-1" />
            قيد الانتظار
          </Badge>
        )
      case "PROCESSING":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            <Truck className="w-3 h-3 ml-1" />
            قيد المعالجة
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <CheckCircle className="w-3 h-3 ml-1" />
            مكتمل
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            <XCircle className="w-3 h-3 ml-1" />
            ملغي
          </Badge>
        )
      default:
        return <Badge className="text-xs">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "PROCESSING":
        return <Truck className="w-4 h-4 text-blue-600" />
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Box className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fully responsive */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-[#048dba]/10"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">تفاصيل التاجر</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">معلومات كاملة عن التاجر ونشاطه</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <EditMerchantDialog 
                merchant={merchant} 
                onSuccess={(updated) => setMerchant({ ...merchant, ...updated })}
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  <span className="hidden xs:inline">تعديل البيانات</span>
                  <span className="xs:hidden">تعديل</span>
                </Button>
              </EditMerchantDialog>
              <AddPaymentDialog merchantId={merchant.id} merchantName={merchant.user.name}>
                <Button 
                  size="sm"
                  className="bg-[#048dba] hover:bg-[#037a9e] text-white flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  <span className="hidden xs:inline">إضافة دفعة</span>
                  <span className="xs:hidden">دفعة</span>
                </Button>
              </AddPaymentDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Profile Card - Fully responsive */}
        <Card className="border-t-4 border-t-[#048dba] shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex justify-center sm:justify-start">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-[#048dba]/20">
                  <AvatarImage src={merchant.user.image || undefined} />
                  <AvatarFallback className="bg-[#048dba] text-white text-xl sm:text-2xl">
                    {merchant.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Building className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    الاسم الكامل
                  </p>
                  <p className="font-semibold text-sm sm:text-base lg:text-lg truncate">{merchant.user.name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Building className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    اسم الشركة
                  </p>
                  <p className="font-semibold text-sm sm:text-base lg:text-lg truncate">{merchant.companyName || "غير محدد"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    البريد الإلكتروني
                  </p>
                  <p className="font-semibold text-xs sm:text-sm truncate">{merchant.user.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    رقم الهاتف
                  </p>
                  <p className="font-semibold text-sm sm:text-base">{merchant.user.phone || "غير محدد"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    RIB
                  </p>
                  <p className="font-semibold font-mono text-xs sm:text-sm truncate">{merchant.rib || "غير محدد"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <Building className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    اسم البنك
                  </p>
                  <p className="font-semibold text-sm sm:text-base truncate">{merchant.bankName || "غير محدد"}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mb-1">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-[#048dba]" />
                    الرسوم الأساسية
                  </p>
                  <p className="font-semibold text-sm sm:text-base">
                    {merchant.baseFee}dh
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards - Fully responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-r-4 border-r-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">الرصيد الحالي</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">{merchant.balance.toFixed(2)} د.م</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-[#048dba] hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">إجمالي الأرباح</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#048dba] truncate">{merchant.totalEarned.toFixed(2)} د.م</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-[#048dba]/10 rounded-full flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#048dba]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">المنتجات</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{stats.activeProducts} / {stats.totalProducts}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">الطلبات المنجزة</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{stats.deliveredOrders} / {stats.totalOrders}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-1">الرسوم الأساسية</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                    {merchant.baseFee}dh
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Responsive */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-gray-100 p-1 h-auto gap-1">
            <TabsTrigger 
              value="products" 
              className="text-xs sm:text-sm data-[state=active]:bg-[#048dba] data-[state=active]:text-white py-2"
            >
              <span className="hidden sm:inline">المنتجات</span>
              <span className="sm:hidden">منتجات</span>
              <span className="mr-1">({merchant.products.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="text-xs sm:text-sm data-[state=active]:bg-[#048dba] data-[state=active]:text-white py-2"
            >
              <span className="hidden sm:inline">الطلبات</span>
              <span className="sm:hidden">طلبات</span>
              <span className="mr-1">({merchant.orders.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transfers"
              className="text-xs sm:text-sm data-[state=active]:bg-[#048dba] data-[state=active]:text-white py-2"
            >
              <span className="hidden sm:inline">طلبات النقل</span>
              <span className="sm:hidden">نقل</span>
              <span className="mr-1">({merchant.productTransfers.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              className="text-xs sm:text-sm data-[state=active]:bg-[#048dba] data-[state=active]:text-white py-2"
            >
              <span className="hidden sm:inline">المدفوعات</span>
              <span className="sm:hidden">دفع</span>
              <span className="mr-1">({merchant.moneyTransfers.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Products Tab - Responsive cards */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                  قائمة المنتجات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {merchant.products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد منتجات حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {merchant.products.map((product) => (
                      <div key={product.id} className="flex gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow hover:border-[#048dba]/50">
                        {product.image && (
                          <img 
                            src={product.image || "/placeholder.svg"} 
                            alt={product.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border-2 border-gray-100"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <p className="font-semibold text-sm sm:text-base truncate">{product.name}</p>
                            <Badge 
                              variant={product.isActive ? "default" : "secondary"}
                              className={`${product.isActive ? 'bg-[#048dba]' : ''} text-xs shrink-0`}
                            >
                              {product.isActive ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">المخزون: {product.stockQuantity}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(product.createdAt).toLocaleDateString("en-US")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab - Responsive */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                  الطلبات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {merchant.orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد طلبات حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {merchant.orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-[#048dba]/50 cursor-pointer transition-all"
                        onClick={() => router.push(`/admin/orders/${createSlugWithId(order.orderCode, order.id)}`)}
                      >
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <p className="font-semibold text-[#048dba] text-sm sm:text-base">{order.orderCode}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{order.customerName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">المدينة</p>
                            <p className="font-semibold text-sm">{order.city.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">السعر الإجمالي</p>
                            <p className="font-semibold text-sm text-green-600">{order.totalPrice.toFixed(2)} د.م</p>
                            <p className="text-xs text-gray-400">ربح: {order.merchantEarning.toFixed(2)} د.م</p>
                          </div>
                          <div>
                            {getStatusBadge(order.status)}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(order.createdAt).toLocaleDateString("eu-US")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transfers Tab - Enhanced with product details */}
          <TabsContent value="transfers">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                  طلبات نقل المنتجات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {merchant.productTransfers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد طلبات نقل حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {merchant.productTransfers.map((transfer) => {
                      const totalQuantity = transfer.transferItems.reduce((sum: number, tp) => sum + tp.quantity, 0)
                      const totalProducts = transfer.transferItems.length
                      
                      return (
                        <div key={transfer.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-[#048dba]/30 transition-all bg-white">
                          {/* Transfer Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(transfer.status)}
                                <div>
                                  <p className="font-semibold text-sm sm:text-base text-gray-800">{transfer.transferCode}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(transfer.createdAt).toLocaleDateString("en-US", {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      numberingSystem: 'latn'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(transfer.status)}
                            </div>
                          </div>

                          {/* Transfer Summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs text-blue-600 mb-1">إجمالي المنتجات</p>
                              <p className="font-bold text-lg text-blue-700">{totalProducts}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-xs text-green-600 mb-1">إجمالي الكمية</p>
                              <p className="font-bold text-lg text-green-700">{totalQuantity}</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-xs text-purple-600 mb-1">رقم الطلب</p>
                              <p className="font-bold text-sm text-purple-700 font-mono">{transfer.transferCode}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">تاريخ الطلب</p>
                              <p className="font-semibold text-sm text-gray-700">
                                {new Date(transfer.createdAt).toLocaleDateString("en-US")}
                              </p>
                            </div>
                          </div>

                          {/* Products List */}
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-500" />
                              المنتجات المنقولة:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {transfer.transferItems.map((tp, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#048dba]/10 rounded-xl border-2 border-white flex items-center justify-center">
                                    <img src={tp.product.image || '/placeholder.png'} className="w-full h-full object-contain rounded-xl"  alt={tp.product.name} width={64} height={64} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                                        {tp.product.name}
                                      </p>
                                      <Badge variant="outline" className="bg-white text-xs font-bold">
                                        {tp.quantity} وحدة
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab - Responsive */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#048dba]" />
                  سجل المدفوعات والتحويلات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {merchant.moneyTransfers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">لا توجد مدفوعات حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {merchant.moneyTransfers.map((transfer) => (
                      <div key={transfer.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">
                                {new Date(transfer.createdAt).toLocaleDateString("en-US")}
                              </p>
                              <p className="font-semibold text-base sm:text-lg text-red-600">
                                -{Math.abs(transfer.amount).toFixed(2)} د.م
                              </p>
                            </div>
                            {transfer.reference && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">المرجع</p>
                                <p className="text-xs sm:text-sm font-mono">{transfer.reference}</p>
                              </div>
                            )}
                            {transfer.note && (
                              <div className="col-span-1 xs:col-span-2 sm:col-span-1">
                                <p className="text-xs text-gray-500 mb-1">ملاحظات</p>
                                <p className="text-xs sm:text-sm line-clamp-2">{transfer.note}</p>
                              </div>
                            )}
                          </div>
                          
                          {transfer.invoiceImage && (
                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                صورة الفاتورة:
                              </p>
                              <a
                                href={transfer.invoiceImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                              >
                                <img
                                  src={transfer.invoiceImage || "/placeholder.svg"}
                                  alt="فاتورة الدفع"
                                  className="w-full max-w-xs rounded-lg border-2 border-gray-200 hover:border-[#048dba] transition-colors cursor-pointer group-hover:shadow-lg"
                                />
                                <p className="text-xs text-[#048dba] mt-1 flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  اضغط للعرض بالحجم الكامل
                                </p>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}