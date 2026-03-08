import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { getMerchantOrderById } from "@/lib/actions/order.actions"
import { OrderDetailClient } from "@/components/merchant/orders/order-detail-client"
import { extractIdFromSlug } from "@/lib/utils/slug"
import { notFound } from 'next/navigation'

export default async function MerchantOrderDetailPage({ params }: { params: { slug: string } }) {
  const orderId = extractIdFromSlug(params.slug)
  
  if (!orderId) {
    notFound()
  }

  const result = await getMerchantOrderById(orderId)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <OrderDetailClient order={result.data} />
    </DashboardLayoutWrapper>
  )
}