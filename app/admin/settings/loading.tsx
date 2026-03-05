import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton"

export default function Loading() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <div className="container mx-auto p-6">
        <SettingsSkeleton />
      </div>
    </DashboardLayoutWrapper>
  )
}
