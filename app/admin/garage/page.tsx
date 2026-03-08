import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { AdminOrdersContent } from "@/components/admin/garage/admin-orders-content"

export const revalidate = 0

export default async function GaragePage() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <AdminOrdersContent />
    </DashboardLayoutWrapper>
  )
}