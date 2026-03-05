import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { AdminDashboardContent } from "@/components/admin/dashboard/admin-dashboard-content"
import { Suspense } from "react"
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"

export const revalidate = 30

export default function AdminDashboardPage() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <AdminDashboardContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
