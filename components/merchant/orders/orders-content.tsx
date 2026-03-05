import { getMerchantOrders, getMerchantProducts } from "@/lib/actions/order.actions"
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
  const products = await getMerchantProducts()
  const hasProducts = products.length > 0

  return (
    <OrdersClient 
      initialOrders={ordersResult.data} 
      totalOrders={ordersResult.total}
      currentPage={ordersResult.page}
      totalPages={ordersResult.totalPages}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      hasProducts={hasProducts}
    />
  )
}