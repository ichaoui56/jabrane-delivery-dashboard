import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"

export default function DashboardLoading() {
  return (
    <DashboardLayout userRole="MERCHANT">
      <DashboardStatsSkeleton />
    </DashboardLayout>
  )
}
