"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, ArrowUpRight, Package, Truck, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'
import { UpdateOrderStatusDialog } from "./update-order-status-dialog"
import { createSlugWithId } from "@/lib/utils/slug"

type Order = {
  id: number
  orderCode: string
  customerName: string
  customerPhone: string
  address: string
  city: string
  totalPrice: number
  merchantEarning: number
  status: string
  paymentMethod: string
  createdAt: string
  merchant: {
    user: {
      name: string
    }
  }
  deliveryMan: {
    user: {
      name: string
    }
  } | null
  orderItems: any[]
}

export function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCity, setFilterCity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [orders, setOrders] = useState(initialOrders)

  const cities = ["الداخلة", "بوجدور", "العيون"]
  const statuses = ["PENDING", "ACCEPTED", "ASSIGNED_TO_DELIVERY", "DELIVERED", "DELAY", "REJECTED", "CANCELLED"]
  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار",
    ACCEPTED: "مقبول",
    ASSIGNED_TO_DELIVERY: "مسند للتوصيل",
    DELIVERED: "تم التوصيل",
    DELAYED: "مبلغ عنه",
    REJECTED: "مرفوض",
    CANCELLED: "ملغى"
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    ACCEPTED: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    ASSIGNED_TO_DELIVERY: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    DELIVERED: "bg-green-100 text-green-800 hover:bg-green-200",
    DELAYED: "bg-red-100 text-red-800 hover:bg-red-200",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-200",
    CANCELLED: "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.merchant.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCity = filterCity === "all" || order.city === filterCity
    const matchesStatus = filterStatus === "all" || order.status === filterStatus
    const matchesPayment = filterPayment === "all" || order.paymentMethod === filterPayment
    
    return matchesSearch && matchesCity && matchesStatus && matchesPayment
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    assigned: orders.filter(o => o.status === "ASSIGNED_TO_DELIVERY").length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-gray-500 mt-1">لوحة تحكم شاملة لمتابعة وإدارة جميع الطلبات</p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">إجمالي الطلبات</p>
                <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-yellow-400 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">قيد الانتظار</p>
                <h3 className="text-2xl font-bold mt-2 text-yellow-600">{stats.pending}</h3>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">تم التوصيل</p>
                <h3 className="text-2xl font-bold mt-2 text-green-600">{stats.delivered}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#048dba] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">إجمالي الإيرادات</p>
                <h3 className="text-2xl font-bold mt-2 text-[#048dba]">{stats.totalRevenue.toFixed(2)} <span className="text-sm font-normal text-gray-500">د.م</span></h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="w-5 h-5 text-[#048dba]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="بحث شامل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 border-gray-200 focus:border-[#048dba] focus:ring-[#048dba]"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="COD">عند الاستلام</SelectItem>
                  <SelectItem value="PREPAID">مسبق</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setFilterCity("all")
                  setFilterStatus("all")
                  setFilterPayment("all")
                  setSearchTerm("")
                }}
                title="إعادة تعيين"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">قائمة الطلبات ({filteredOrders.length})</h2>
        </div>
        
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-[#048dba] group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Main Info Section */}
                  <div className="flex-1 p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-[#048dba] font-bold text-lg">
                          #{order.orderCode}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                            {order.city}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusColors[order.status]} border-0 px-3 py-1`}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">التاجر</p>
                        <p className="font-medium text-gray-900">{order.merchant.user.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">المبلغ</p>
                        <p className="font-bold text-[#048dba]">{order.totalPrice.toFixed(2)} د.م</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">التاريخ</p>
                        <p className="font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString("ar-MA")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">الموصل</p>
                        <p className="font-medium text-gray-900">
                          {order.deliveryMan ? order.deliveryMan.user.name : "---"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="border-t md:border-t-0 md:border-r border-gray-100 bg-gray-50/50 p-4 flex flex-row md:flex-col justify-center gap-2 min-w-[140px]">
                    <Link href={`/admin/orders/${createSlugWithId(order.orderCode, order.id)}`} className="w-full">
                      <Button className="w-full bg-white hover:bg-white text-[#048dba] border border-[#048dba] hover:bg-blue-50">
                        التفاصيل
                      </Button>
                    </Link>
                    
                    <UpdateOrderStatusDialog 
                      orderId={order.id}
                      currentStatus={order.status}
                      orderCode={order.orderCode}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-200">
                        تحديث الحالة
                      </Button>
                    </UpdateOrderStatusDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
