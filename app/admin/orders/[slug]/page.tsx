import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { getOrderDetails } from "@/lib/actions/admin/order"
import { OrderDetailClient } from "@/components/admin/orders/order-detail-client"
import { extractIdFromSlug } from "@/lib/utils/slug"
import { notFound } from 'next/navigation'

export default async function OrderDetailPage({ params }: { params: { slug: string } }) {
  const orderId = extractIdFromSlug(params.slug)
  
  if (!orderId) {
    notFound()
  }

  const result = await getOrderDetails(orderId)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <OrderDetailClient order={result.data} />
    </DashboardLayoutWrapper>
  )
}
