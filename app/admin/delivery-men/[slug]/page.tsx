import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { DeliveryManDetailContent } from "@/components/admin/delivery-man/deliveryman-detail-content"
import { extractIdFromSlug } from "@/lib/utils/slug"
import { notFound } from 'next/navigation'

export const revalidate = 0

export default function DeliveryManDetailPage({ params }: { params: { slug: string } }) {
  const deliveryManId = extractIdFromSlug(params.slug)
  
  if (!deliveryManId) {
    notFound()
  }

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <DeliveryManDetailContent deliveryManId={deliveryManId} />
    </DashboardLayoutWrapper>
  )
}
