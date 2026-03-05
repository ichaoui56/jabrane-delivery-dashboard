import { getDeliveryMen } from "@/lib/actions/admin/delivery-men"
import { DeliveryMenClient } from "./delivery-men-client"
import { DeliveryMan } from "@prisma/client"

export async function DeliveryMenContent() {
  const result = await getDeliveryMen()
  const deliveryMen = result.success ? result.data : []

  return <DeliveryMenClient initialDeliveryMen={deliveryMen as DeliveryMan[] || []} />
}
