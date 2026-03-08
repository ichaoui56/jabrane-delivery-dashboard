import { getAllOrdersForAdmin, getOrderStats } from "@/lib/actions/admin/order"
import { AdminOrdersClient } from "./admin-orders-client"

export async function AdminOrdersContent() {
  const [ordersResult, statsResult] = await Promise.all([
    getAllOrdersForAdmin({ page: 1, limit: 50 }),
    getOrderStats()
  ])

  if (!ordersResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{ordersResult.error}</p>
      </div>
    )
  }

  return (
    <AdminOrdersClient
      initialData={ordersResult.data} 
      initialStats={statsResult.success ? statsResult.data : null}
    />
  )
}