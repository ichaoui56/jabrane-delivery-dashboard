import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { OrdersContent } from "@/components/merchant/orders/orders-content"

export const revalidate = 30

interface SearchParams {
  page?: string
  search?: string
  status?: string
}

export default function OrdersPage({ 
  searchParams 
}: { 
  searchParams: Promise<SearchParams>
}) {
  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <OrdersContent searchParams={searchParams} />
    </DashboardLayoutWrapper>
  )
}