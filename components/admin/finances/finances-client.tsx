"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Wallet, Search, Filter, Download } from 'lucide-react'

type FinancialData = {
  totalRevenue: number
  totalMerchantBalance: number
  totalDeliveryManEarnings: number
  companyProfit: number
  totalPaid: number
  merchantBalances: Array<{
    merchant: {
      id: number
      user: {
        name: string
      }
      companyName: string | null
    }
    balance: number
    totalEarned: number
  }>
  deliveryMenBalances: Array<{
    deliveryMan: {
      id: number
      user: {
        name: string
      }
    }
    totalEarned: number
  }>
  transactions: Array<{
    id: number
    type: "MERCHANT_PAYMENT" | "DELIVERY_PAYMENT" | "ORDER_REVENUE"
    amount: number
    reference: string | null
    note: string | null
    createdAt: string
    relatedUser: {
      name: string
      type: string
    }
  }>
}

export function FinancesClient({ initialData }: { initialData: FinancialData | null }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterPeriod, setFilterPeriod] = useState<string>("all")

  if (!initialData) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  const filteredTransactions = initialData.transactions.filter((transaction) => {
    const searchTermLower = searchTerm.toLowerCase()
    const userName = transaction.relatedUser?.name?.toLowerCase() || ''
    const reference = transaction.reference?.toLowerCase() || ''
    const note = transaction.note?.toLowerCase() || ''

    const matchesSearch =
      userName.includes(searchTermLower) ||
      reference.includes(searchTermLower) ||
      note.includes(searchTermLower)

    const matchesType = filterType === "all" || transaction.type === filterType

    // Filter by period (last 7 days, 30 days, etc.)
    let matchesPeriod = true
    if (filterPeriod !== "all") {
      const transactionDate = new Date(transaction.createdAt)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24))

      if (filterPeriod === "7days") matchesPeriod = daysDiff <= 7
      else if (filterPeriod === "30days") matchesPeriod = daysDiff <= 30
      else if (filterPeriod === "90days") matchesPeriod = daysDiff <= 90
    }

    return matchesSearch && matchesType && matchesPeriod
  })

  const transactionTypeLabels: Record<string, string> = {
    MERCHANT_PAYMENT: "دفعة للتاجر",
    DELIVERY_PAYMENT: "دفعة لموظف التوصيل",
    ORDER_REVENUE: "إيرادات طلب"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الإدارة المالية</h1>
          <p className="text-gray-500 mt-1">نظرة شاملة على الأمور المالية والمعاملات</p>
        </div>

      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">إجمالي الإيرادات</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{initialData.totalRevenue.toFixed(2)} د.م</div>
            <p className="text-xs text-gray-500 mt-1">من جميع الطلبات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">مستحقات التجار</CardTitle>
            <Wallet className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{initialData.totalMerchantBalance.toFixed(2)} د.م</div>
            <p className="text-xs text-gray-500 mt-1">أرصدة التجار الحالية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">مستحقات التوصيل</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {initialData.totalDeliveryManEarnings.toFixed(2)} د.م
            </div>
            <p className="text-xs text-gray-500 mt-1">أرباح موظفي التوصيل</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">إجمالي المدفوعات</CardTitle>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{initialData.totalPaid.toFixed(2)} د.م</div>
            <p className="text-xs text-gray-500 mt-1">تم دفعها للمستخدمين</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">سجل المعاملات</TabsTrigger>
          <TabsTrigger value="merchants">أرصدة التجار</TabsTrigger>
          <TabsTrigger value="delivery">أرصدة التوصيل</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="ابحث بالاسم، المرجع، أو الملاحظة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="نوع المعاملة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        <SelectItem value="MERCHANT_PAYMENT">دفعات التجار</SelectItem>
                        <SelectItem value="DELIVERY_PAYMENT">دفعات التوصيل</SelectItem>
                        <SelectItem value="ORDER_REVENUE">إيرادات الطلبات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="الفترة الزمنية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفترات</SelectItem>
                        <SelectItem value="7days">آخر 7 أيام</SelectItem>
                        <SelectItem value="30days">آخر 30 يوم</SelectItem>
                        <SelectItem value="90days">آخر 90 يوم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterType("all")
                      setFilterPeriod("all")
                      setSearchTerm("")
                    }}
                  >
                    <Filter className="w-4 h-4 ml-2" />
                    إعادة تعيين
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>المعاملات ({filteredTransactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  // Determine user type based on transaction type
                  console.log('Transaction:', {
                    id: transaction.id,
                    type: transaction.type,
                    typeLabel: transactionTypeLabels[transaction.type],
                    userType: transaction.relatedUser.type,
                    userName: transaction.relatedUser.name
                  })
                  const getUserType = (type:any) => {
                    switch (type) {
                      case "MERCHANT_PAYMENT": return "تاجر"
                      case "DELIVERY_PAYMENT": return "موظف توصيل"
                      case "ORDER_REVENUE": return "زبون"
                      default: return transaction.relatedUser.type || "مستخدم"
                    }
                  }

                  const userType = getUserType(transaction.type)

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge>{transactionTypeLabels[transaction.type]}</Badge>
                          <p className="font-semibold">{transaction.relatedUser.name || "غير معروف"}</p>
                          <span className="text-xs text-gray-400">({userType})</span>
                        </div>
                        {transaction.note && (
                          <p className="text-sm text-gray-600">{transaction.note}</p>
                        )}
                        {transaction.reference && (
                          <p className="text-xs text-gray-400">مرجع: {transaction.reference}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(transaction.createdAt).toLocaleString("en-US")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${transaction.type === "ORDER_REVENUE"
                          ? "text-green-600"
                          : "text-red-600"
                          }`}>
                          {transaction.type === "ORDER_REVENUE" ? "+" : "-"}
                          {transaction.amount.toFixed(2)} د.م
                        </p>
                      </div>
                    </div>
                  )
                })}
                {filteredTransactions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">لا توجد معاملات</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Merchants Balances Tab */}
        <TabsContent value="merchants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أرصدة التجار ({initialData.merchantBalances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialData.merchantBalances.map((item) => (
                  <div key={item.merchant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-semibold">{item.merchant.user.name}</p>
                      <p className="text-sm text-gray-500">{item.merchant.companyName || "لا يوجد اسم شركة"}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        إجمالي الأرباح: {item.totalEarned.toFixed(2)} د.م
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">الرصيد الحالي</p>
                      <p className={`text-xl font-bold ${item.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.balance >= 0 ? "+" : ""}
                        {item.balance.toFixed(2)} د.م
                      </p>
                      <Badge variant={item.balance > 0 ? "default" : "secondary"} className="mt-2">
                        {item.balance > 0 ? "مستحق" : "مدفوع"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Men Balances Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أرصدة موظفي التوصيل ({initialData.deliveryMenBalances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialData.deliveryMenBalances.map((item) => (
                  <div key={item.deliveryMan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-semibold">{item.deliveryMan.user.name}</p>
                      <p className="text-sm text-gray-500">موظف توصيل</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">إجمالي الأرباح</p>
                      <p className={`text-xl font-bold ${item.totalEarned >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.totalEarned >= 0 ? "+" : ""}
                        {item.totalEarned.toFixed(2)} د.م
                      </p>
                      <Badge variant={item.totalEarned > 0 ? "default" : "secondary"} className="mt-2">
                        {item.totalEarned > 0 ? "مستحق" : "مدفوع"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
