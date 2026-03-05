import { getAllOrders } from "@/lib/actions/admin/order"
import { AdminOrdersClient } from "./admin-orders-client"

export async function AdminOrdersContent() {
  const result = await getAllOrders()
  const orders = result.success ? result.data : []

  return <AdminOrdersClient initialOrders={orders || []} />
}
