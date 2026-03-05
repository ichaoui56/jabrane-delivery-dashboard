import { getDeliveryManDetail } from "@/lib/actions/admin/delivery-men"
import { DeliveryManDetailClient } from "./deliveryman-detail-client"
import { redirect } from 'next/navigation'
import { DeliveryManDetail } from "@/types/types"

export async function DeliveryManDetailContent({ deliveryManId }: { deliveryManId: number }) {
  const result = await getDeliveryManDetail(deliveryManId)

  if (!result.success || !result.data) {
    redirect("/admin/delivery-men")
  }

  return <DeliveryManDetailClient initialDeliveryMan={result.data as unknown as DeliveryManDetail} />
}
