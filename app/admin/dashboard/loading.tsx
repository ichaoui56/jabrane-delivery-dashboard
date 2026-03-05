import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function Loading() {
  return (
    <DashboardLayout userRole="ADMIN">
      <DashboardStatsSkeleton />
    </DashboardLayout>
  )
}
