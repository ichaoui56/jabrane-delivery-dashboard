"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { OrdersTable } from "@/components/orders-table"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type Order = any

export function OrdersClient({ 
  initialOrders, 
  totalOrders,
  currentPage,
  totalPages,
  searchQuery: initialSearch,
  statusFilter: initialStatus,
  hasProducts 
}: { 
  initialOrders: Order[]
  totalOrders: number
  currentPage: number
  totalPages: number
  searchQuery: string
  statusFilter: string
  hasProducts: boolean
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
            عرض {initialOrders.length} من {totalOrders} طلب
          </p>
        </div>
        <Link href="/merchant/orders/add">
          <Button className="bg-[#048dba] hover:bg-[#037ba0] text-white min-h-[44px] w-full sm:w-auto">
            إنشاء طلب جديد
          </Button>
        </Link>
      </div>

      {!hasProducts && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">لا توجد منتجات في المخزون</p>
              <p className="text-sm text-yellow-700 mt-1">
                يجب إضافة منتجات إلى المخزون قبل إنشاء طلبات جديدة.{" "}
                <Link href="/merchant/transfer-products" className="underline font-medium">
                  إضافة منتجات الآن
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}