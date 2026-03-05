"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Eye, DollarSign, Package, Edit, Phone, Mail } from 'lucide-react'
import { CreateMerchantDialog } from "./create-merchant-dialog"
import { EditMerchantDialog } from "./edit-merchant-dialog"
import { ViewMerchantDialog } from "./view-merchant-dialog"
import { AddPaymentDialog } from "./add-payment-dialog"
import { useRouter } from 'next/navigation'
import { createSlugWithId } from "@/lib/utils/slug"

type Merchant = {
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
  }
  _count: {
    orders: number
    products: number
  }
}

export function MerchantsClient({ initialMerchants }: { initialMerchants: Merchant[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [merchants, setMerchants] = useState(initialMerchants)
  const router = useRouter()

  const filteredMerchants = merchants.filter((merchant) =>
    merchant.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (merchant.companyName && merchant.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">إدارة التجار</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">عرض وإدارة جميع التجار</p>
        </div>
        <CreateMerchantDialog onSuccess={(newMerchant) => setMerchants([newMerchant, ...merchants])}>
          <Button className="bg-[#048dba] hover:bg-[#037299] w-full sm:w-auto text-sm">
            <Plus className="w-4 h-4 ml-2" />
            إضافة تاجر
          </Button>
        </CreateMerchantDialog>
      </div>

      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="ابحث بالاسم، البريد، أو الشركة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">قائمة التجار ({filteredMerchants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {filteredMerchants.map((merchant) => (
              <div
                key={merchant.id}
                className="border rounded-lg hover:shadow-md cursor-pointer transition-all p-3 sm:p-4 hover:border-[#048dba]"
              >
                {/* Mobile & Tablet Layout */}
                <div className="flex flex-col gap-3">
                  {/* Top Section: Avatar + Name + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <AvatarImage src={merchant.user.image || undefined} />
                        <AvatarFallback className="bg-[#048dba] text-white text-sm">
                          {merchant.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{merchant.user.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {merchant.companyName || "لا يوجد اسم شركة"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-400 truncate">{merchant.user.email}</p>
                        </div>
                      </div>
                    </div>
                     <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/merchants/${createSlugWithId(merchant.user.name, merchant.id)}`)
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                          <span className="hidden xs:inline">عرض التفاصيل</span>
                          <span className="xs:hidden">تفاصيل</span>
                        </Button>
                      </div>
                    {/* Action Buttons - Hidden on smallest screens, shown as icons */}
                    <div className="hidden xs:flex gap-1 sm:gap-2 flex-shrink-0">
                      <EditMerchantDialog merchant={merchant} onSuccess={(updated) => {
                        setMerchants(merchants.map(m => m.id === updated.id ? updated : m))
                      }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 px-2 sm:px-3 text-xs border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white"
                        >
                          <Edit className="w-3 h-3 sm:ml-1" />
                          <span className="hidden sm:inline">تعديل</span>
                        </Button>
                      </EditMerchantDialog>
                      <AddPaymentDialog merchantId={merchant.id} merchantName={merchant.user.name}>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8 px-2 sm:px-3 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </AddPaymentDialog>
                       
                    </div>
                  </div>

                  {/* Stats Grid - Responsive columns */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">الطلبات</p>
                      <p className="font-semibold text-xs sm:text-sm text-[#048dba]">
                        {merchant._count.orders}
                      </p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-xs text-gray-500 mb-1">المنتجات</p>
                      <p className="font-semibold text-xs sm:text-sm text-[#048dba]">
                        {merchant._count.products}
                      </p>
                    </div>
                    <div className="text-center border-r">
                      <p className="text-xs text-gray-500 mb-1">الرصيد</p>
                      <p className="font-semibold text-xs sm:text-sm text-green-600">
                        {merchant.balance.toFixed(2)} د.م
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">الرسوم</p>
                      <p className="font-semibold text-xs sm:text-sm text-purple-600">
                        {merchant.baseFee}dh
                      </p>
                    </div>
                  </div>

                  {/* Mobile Actions - Only on smallest screens */}
                  <div className="flex xs:hidden gap-2 pt-2 border-t">
                    <EditMerchantDialog merchant={merchant} onSuccess={(updated) => {
                      setMerchants(merchants.map(m => m.id === updated.id ? updated : m))
                    }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 h-8 text-xs border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white"
                      >
                        <Edit className="w-3 h-3 ml-1" />
                        تعديل
                      </Button>
                    </EditMerchantDialog>
                    <AddPaymentDialog merchantId={merchant.id} merchantName={merchant.user.name}>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#048dba] hover:bg-[#037299] h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DollarSign className="w-3 h-3 ml-1" />
                        دفعة
                      </Button>
                    </AddPaymentDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
