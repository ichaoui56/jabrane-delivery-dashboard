import { DashboardLayout } from "@/components/dashboard-layout"
import { SettingsSkeleton } from "@/components/skeletons/settings-skeleton"

export function SettingsContentLoading() {
  return <SettingsSkeleton />
}

export default function SettingsLoading() {
  return (
    <DashboardLayout userRole="MERCHANT">
      <SettingsSkeleton />
    </DashboardLayout>
  )
}



