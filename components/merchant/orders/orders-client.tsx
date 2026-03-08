"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Package, PlusCircle } from "lucide-react"
import { OrdersTable } from "@/components/orders-table"

type Order = any

export function OrdersClient({ 
  initialOrders, 
  totalOrders,
  currentPage,
  totalPages,
  searchQuery: initialSearch,
  statusFilter: initialStatus,
}: { 
  initialOrders: Order[]
  totalOrders: number
  currentPage: number
  totalPages: number
  searchQuery: string
  statusFilter: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/merchant/orders?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/merchant/orders?${params.toString()}`)
  }

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'ALL') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    params.set('page', '1')
    router.push(`/merchant/orders?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            عرض {initialOrders.length} من إجمالي {totalOrders} طلب
          </p>
        </div>
        <Link href="/merchant/orders/add">
          <Button className="bg-[#048dba] hover:bg-[#037ba0] text-white min-h-[44px] w-full sm:w-auto gap-2">
            <PlusCircle className="w-4 h-4" />
            إنشاء طلب جديد
          </Button>
        </Link>
      </div>

      {initialOrders.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-[#048dba]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات بعد</h3>
          <p className="text-sm text-gray-600 mb-4">
            ابدأ بإنشاء أول طلب لك الآن
          </p>
          <Link href="/merchant/orders/add">
            <Button className="bg-[#048dba] hover:bg-[#037ba0] text-white">
              <PlusCircle className="w-4 h-4 ml-2" />
              إنشاء طلب جديد
            </Button>
          </Link>
        </div>
      ) : (
        <OrdersTable
          orders={initialOrders} 
          searchQuery={search}
          onSearchChange={handleSearch}
          statusFilter={initialStatus}
          onStatusChange={handleStatusChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          enableMerchantEditDelete
        />
      )}
    </div>
  )
}