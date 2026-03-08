import { getMerchantOrders } from "@/lib/actions/order.actions"
import { OrdersClient } from "./orders-client"

interface SearchParams {
  page?: string
  search?: string
  status?: string
}

export async function OrdersContent({ 
  searchParams 
}: { 
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1'))
  const searchQuery = params.search || ''
  const statusFilter = params.status || 'ALL'
  const limit = 20
  
  const ordersResult = await getMerchantOrders(page, limit, statusFilter, searchQuery)

  return (
    <OrdersClient 
      initialOrders={ordersResult.data || []} 
      totalOrders={ordersResult.total || 0}
      currentPage={ordersResult.page || 1}
      totalPages={ordersResult.totalPages || 1}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
    />
  )
}