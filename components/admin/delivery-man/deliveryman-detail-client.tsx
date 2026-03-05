"use client"

import { createSlugWithId } from "@/lib/utils/slug"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MapPin, 
  Package, 
  DollarSign, 
  Clock, 
  CreditCard,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Truck,
  User,
  Receipt,
  RefreshCw
} from 'lucide-react'
import { PaymentActions } from "./payment-actions"
import { AddPaymentDialog } from "./add-payment-dialog"
import { EditDeliveryManDialog } from "./edit-deliveryman-dialog"
import { markOrderAsDelivered } from "@/lib/actions/admin/delivery-men"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type DeliveryManDetail = {
  id: number
  vehicleType: string | null
  active: boolean
  city: string
  cityId: number | null
  totalDeliveries: number
  successfulDeliveries: number
  totalEarned: number
  pendingEarnings: number
  collectedCOD: number
  pendingCOD: number
  baseFee: number
  rating: number | null
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
    createdAt: string
  }
  assignedOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    status: string
    city: string | null
    createdAt: string
    deliveredAt: string | null
    paymentMethod: "COD" | "PREPAID"
    merchant: {
      user: {
        name: string
      }
    }
  }>
  deliveryAttempts: Array<{
    id: number
    attemptedAt: string
    status: string
    wasSuccessful: boolean
    notes: string | null
    order: {
      id: number
      orderCode: string
      customerName: string
    }
  }>
  moneyTransfers: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    invoiceImage: string | null
    createdAt: string
  }>
  allOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    status: string
    city: string | null
    createdAt: string
    deliveredAt: string | null
    paymentMethod: "COD" | "PREPAID"
    merchant: {
      user: {
        name: string
      }
    }
    deliveryAttempts: Array<{
      attemptedAt: string
      status: string
      notes: string | null
    }>
  }>
}

export function DeliveryManDetailClient({ initialDeliveryMan }: { initialDeliveryMan: DeliveryManDetail }) {
  const [deliveryMan, setDeliveryMan] = useState<DeliveryManDetail>(initialDeliveryMan)
  const [processingOrder, setProcessingOrder] = useState<number | null>(null)
  const [updatingData, setUpdatingData] = useState(false)
  const [activeTab, setActiveTab] = useState("current")

  const successRate = deliveryMan.totalDeliveries > 0
    ? ((deliveryMan.successfulDeliveries / deliveryMan.totalDeliveries) * 100).toFixed(1)
    : "0"

  const handleMarkAsDelivered = async (orderId: number) => {
    setProcessingOrder(orderId)
    try {
      const result = await markOrderAsDelivered(orderId, deliveryMan.id)
      if (result.success) {
        // Find the order to get its details
        const deliveredOrder = deliveryMan.assignedOrders.find(order => order.id === orderId)
        const codAmount = deliveredOrder?.paymentMethod === "COD" ? deliveredOrder.totalPrice : 0
        
        // Update local state with the response from server
        setDeliveryMan(prev => ({
          ...prev,
          assignedOrders: prev.assignedOrders.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  status: "DELIVERED",
                  deliveredAt: new Date().toISOString()
                }
              : order
          ),
          allOrders: prev.allOrders.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  status: "DELIVERED",
                  deliveredAt: new Date().toISOString()
                }
              : order
          ),
          totalDeliveries: prev.totalDeliveries + 1,
          successfulDeliveries: prev.successfulDeliveries + 1,
          totalEarned: prev.totalEarned + prev.baseFee,
          pendingEarnings: prev.pendingEarnings + prev.baseFee,
          collectedCOD: prev.collectedCOD + codAmount,
          pendingCOD: prev.pendingCOD + codAmount
        }))
        
        toast.success("تم تأكيد تسليم الطلب بنجاح")
        
        // Refresh data to get the latest from server
        await refreshData()
      } else {
        toast.error(result.error || "حدث خطأ أثناء تحديث حالة الطلب")
      }
    } catch (error) {
      console.error("Error marking order as delivered:", error)
      toast.error("حدث خطأ أثناء تحديث حالة الطلب")
    } finally {
      setProcessingOrder(null)
    }
  }

  const handlePaymentSuccess = (type: 'earnings' | 'cod', amount: number) => {
    // Update local state when payment is made
    setDeliveryMan(prev => ({
      ...prev,
      pendingEarnings: type === 'earnings' ? prev.pendingEarnings - amount : prev.pendingEarnings,
      pendingCOD: type === 'cod' ? prev.pendingCOD - amount : prev.pendingCOD,
      moneyTransfers: [
        {
          id: Date.now(),
          amount: amount,
          reference: null,
          note: type === 'earnings' ? "دفع أرباح من العمولات" : "تحصيل دفع نقدي عند الاستلام",
          invoiceImage: null,
          createdAt: new Date().toISOString()
        },
        ...prev.moneyTransfers
      ]
    }))
    
    toast.success(`تم ${type === 'earnings' ? 'دفع الأرباح' : 'تحصيل COD'} بنجاح`)
  }

  const handleAddPaymentSuccess = (newTransfer: any) => {
    // Add new payment to local state
    setDeliveryMan(prev => ({
      ...prev,
      moneyTransfers: [newTransfer, ...prev.moneyTransfers]
    }))
    
    toast.success("تمت إضافة الدفعة بنجاح")
  }

  const handleDeliveryManUpdated = (updatedDM: any) => {
    // Update delivery man data when edited
    setDeliveryMan(prev => ({
      ...prev,
      ...updatedDM,
      user: {
        ...prev.user,
        ...updatedDM.user
      }
    }))
    
    toast.success("تم تحديث بيانات موظف التوصيل بنجاح")
  }

  const refreshData = async () => {
    setUpdatingData(true)
    try {
      // Fetch fresh data from server
      const response = await fetch(`/api/admin/delivery-men/${createSlugWithId(deliveryMan.user.name, deliveryMan.id)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDeliveryMan(data.data)
          toast.success("تم تحديث البيانات")
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("حدث خطأ أثناء تحديث البيانات")
    } finally {
      setUpdatingData(false)
    }
  }

  // Filter orders based on active tab
  const getOrdersToDisplay = () => {
    switch (activeTab) {
      case "current":
        return deliveryMan.assignedOrders.filter(order => 
          order.status === "ASSIGNED_TO_DELIVERY" || order.status === "PENDING"
        )
      case "delivered":
        return deliveryMan.allOrders.filter(order => order.status === "DELIVERED")
      case "all":
        return deliveryMan.allOrders
      case "failed":
        return deliveryMan.allOrders.filter(order => 
          order.status === "CANCELLED" || order.status === "REJECTED"
        )
      default:
        return deliveryMan.assignedOrders
    }
  }

  const displayedOrders = getOrdersToDisplay()

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 ring-4 ring-[#048dba]/20">
            <AvatarImage src={deliveryMan.user.image || undefined} />
            <AvatarFallback className="bg-[#048dba] text-white text-2xl">
              {deliveryMan.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {deliveryMan.user.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={deliveryMan.active ? "default" : "secondary"} 
                className={deliveryMan.active ? "bg-green-500 hover:bg-green-600" : ""}>
                {deliveryMan.active ? "نشط" : "غير نشط"}
              </Badge>
              {deliveryMan.city && (
                <Badge variant="outline" className="border-[#048dba] text-[#048dba]">
                  <MapPin className="w-3 h-3 ml-1" />
                  {deliveryMan.city}
                </Badge>
              )}
              {deliveryMan.rating && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                  ⭐ {deliveryMan.rating.toFixed(1)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <EditDeliveryManDialog
            deliveryMan={deliveryMan}
            onSuccess={handleDeliveryManUpdated}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث البيانات
            </Button>
          </EditDeliveryManDialog>
          
          {/* <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={updatingData}
            className="h-10"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${updatingData ? 'animate-spin' : ''}`} />
            {updatingData ? "جاري التحديث..." : "تحديث البيانات"}
          </Button> */}
          
          <PaymentActions
            deliveryManId={deliveryMan.id}
            deliveryManName={deliveryMan.user.name}
            pendingEarnings={deliveryMan.pendingEarnings}
            pendingCOD={deliveryMan.pendingCOD}
            onSuccess={handlePaymentSuccess}
          >
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <CreditCard className="w-4 h-4 ml-2" />
              معاملات مالية
            </Button>
          </PaymentActions>
          
          {/* <AddPaymentDialog
            deliveryManId={deliveryMan.id}
            deliveryManName={deliveryMan.user.name}
            onSuccess={handleAddPaymentSuccess}
          >
            <Button variant="outline" className="border-[#048dba] text-[#048dba] w-full sm:w-auto">
              <DollarSign className="w-4 h-4 ml-2" />
              إضافة دفعة
            </Button>
          </AddPaymentDialog> */}
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            معلومات الموصل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">المعلومات الشخصية</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{deliveryMan.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{deliveryMan.user.email}</span>
                  </div>
                  {deliveryMan.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{deliveryMan.user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      انضم في {new Date(deliveryMan.user.createdAt).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">معلومات التوصيل</h3>
                <div className="mt-2 space-y-2">
                  {deliveryMan.vehicleType && (
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span>نوع المركبة: {deliveryMan.vehicleType}</span>
                    </div>
                  )}
                  {deliveryMan.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>المدينة: {deliveryMan.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span>أجرة التوصيل: {deliveryMan.baseFee.toFixed(2)} د.م</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الأرباح الإجمالية</p>
                <p className="text-2xl font-bold text-blue-600">
                  {deliveryMan.totalEarned.toFixed(2)} د.م
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  من {deliveryMan.successfulDeliveries} طلبات
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">أرباح معلقة</p>
                <p className="text-2xl font-bold text-orange-600">
                  {deliveryMan.pendingEarnings.toFixed(2)} د.م
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {deliveryMan.baseFee > 0 ? Math.round(deliveryMan.pendingEarnings / deliveryMan.baseFee) : 0} طلبات معلقة
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Pending COD */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">COD معلقة</p>
                <p className="text-2xl font-bold text-red-600">
                  {deliveryMan.pendingCOD.toFixed(2)} د.م
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  تحتاج لتسليم للإدارة
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

          <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-red-600">
                  {deliveryMan.collectedCOD.toFixed(2)} د.م
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  إجمالي الأرباح
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            المعلومات
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            الطلبات ({deliveryMan.allOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            المعاملات ({deliveryMan.moneyTransfers.length})
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">المعلومات الشخصية</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">الاسم الكامل:</span>
                      <span className="font-medium">{deliveryMan.user.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">البريد الإلكتروني:</span>
                      <span>{deliveryMan.user.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">رقم الهاتف:</span>
                      <span>{deliveryMan.user.phone || "غير متوفر"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">تاريخ الانضمام:</span>
                      <span>{new Date(deliveryMan.user.createdAt).toLocaleDateString('en-US')}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات التوصيل</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">نوع المركبة:</span>
                      <span>{deliveryMan.vehicleType || "غير محدد"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">المدينة:</span>
                      <span>{deliveryMan.city || "غير محدد"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">أجرة التوصيل:</span>
                      <span className="font-medium">{deliveryMan.baseFee.toFixed(2)} د.م</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">الحالة:</span>
                      <Badge variant={deliveryMan.active ? "default" : "secondary"} 
                        className={deliveryMan.active ? "bg-green-500" : ""}>
                        {deliveryMan.active ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    {deliveryMan.rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">التقييم:</span>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          ⭐ {deliveryMan.rating.toFixed(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>جميع الطلبات ({deliveryMan.allOrders?.length || 0})</CardTitle>
                <div className="flex gap-2 overflow-x-auto">
                  <Button
                    size="sm"
                    variant={activeTab === "current" ? "default" : "outline"}
                    onClick={() => setActiveTab("current")}
                    className="whitespace-nowrap"
                  >
                    الحالية ({deliveryMan.assignedOrders.filter(o => 
                      o.status === "ASSIGNED_TO_DELIVERY" || o.status === "PENDING"
                    ).length})
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "delivered" ? "default" : "outline"}
                    onClick={() => setActiveTab("delivered")}
                    className="whitespace-nowrap"
                  >
                    المسلمة ({deliveryMan.allOrders?.filter(o => o.status === "DELIVERED").length || 0})
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "all" ? "default" : "outline"}
                    onClick={() => setActiveTab("all")}
                    className="whitespace-nowrap"
                  >
                    الكل ({deliveryMan.allOrders?.length || 0})
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "failed" ? "default" : "outline"}
                    onClick={() => setActiveTab("failed")}
                    className="whitespace-nowrap"
                  >
                    الفاشلة ({deliveryMan.allOrders?.filter(o => 
                      o.status === "CANCELLED" || o.status === "REJECTED"
                    ).length || 0})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-3 text-sm font-medium">رقم الطلب</th>
                      <th className="text-right p-3 text-sm font-medium">العميل</th>
                      <th className="text-right p-3 text-sm font-medium">التاجر</th>
                      <th className="text-right p-3 text-sm font-medium">المبلغ</th>
                      <th className="text-right p-3 text-sm font-medium">طريقة الدفع</th>
                      <th className="text-right p-3 text-sm font-medium">الحالة</th>
                      <th className="text-right p-3 text-sm font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center">
                          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500">لا توجد طلبات في هذا القسم</p>
                        </td>
                      </tr>
                    ) : (
                      displayedOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{order.orderCode}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              {order.city && (
                                <p className="text-xs text-gray-500">{order.city}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-sm">{order.merchant.user.name}</p>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{order.totalPrice.toFixed(2)} د.م</p>
                              {order.paymentMethod === "COD" && (
                                <p className="text-xs text-red-600">دفع نقدي</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={order.paymentMethod === "COD" ? "default" : "secondary"}>
                              {order.paymentMethod === "COD" ? "دفع نقدي" : "مدفوع مسبقاً"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                order.status === "DELIVERED" ? "default" :
                                order.status === "ASSIGNED_TO_DELIVERY" ? "secondary" :
                                order.status === "PENDING" ? "outline" :
                                "destructive"
                              }>
                                {order.status === "DELIVERED" ? "تم التوصيل" :
                                 order.status === "ASSIGNED_TO_DELIVERY" ? "مسند للشحن" :
                                 order.status === "PENDING" ? "قيد الانتظار" :
                                 order.status === "CANCELLED" ? "ملغي" :
                                 order.status === "REJECTED" ? "مرفوض" : order.status}
                              </Badge>
                              {order.deliveredAt && (
                                <span className="text-xs text-gray-500">
                                  {new Date(order.deliveredAt).toLocaleDateString('en-US')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="text-sm">
                                {new Date(order.createdAt).toLocaleDateString('en-US')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleTimeString('en-US')}
                              </p>
                            </div>
                          </td>
                         
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>سجل المعاملات المالية ({deliveryMan.moneyTransfers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryMan.moneyTransfers.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">لا توجد معاملات مالية</p>
                  </div>
                ) : (
                  deliveryMan.moneyTransfers.map((transfer) => (
                    <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transfer.amount > 0 ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {transfer.amount > 0 ? (
                            <DollarSign className="w-5 h-5 text-green-600" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transfer.amount > 0 ? "دفعة مالية" : "تحصيل COD"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transfer.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {transfer.reference && (
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">المرجع:</span> {transfer.reference}
                            </p>
                          )}
                          {transfer.note && (
                            <p className="text-sm text-gray-600 mt-1">{transfer.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transfer.amount > 0 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {transfer.amount > 0 ? '+' : '-'}{Math.abs(transfer.amount).toFixed(2)} د.م
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}