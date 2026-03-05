import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { AdminOrdersContent } from "@/components/admin/orders/admin-orders-content"
import { Suspense } from "react"
import { AdminOrdersContentLoading } from "./loading"

export const revalidate = 30

export default function AdminOrdersPage() {

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <Suspense fallback={<AdminOrdersContentLoading />}>
        <AdminOrdersContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
