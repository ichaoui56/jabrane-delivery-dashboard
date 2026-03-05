import { getAdminDashboardStats } from "@/lib/actions/admin/dashboard"
import { AdminDashboardClient } from "./admin-dashboard-client"

export async function AdminDashboardContent() {
  const result = await getAdminDashboardStats()
  const data = result.success ? result.data : null

  return <AdminDashboardClient initialData={data || null} />
}
