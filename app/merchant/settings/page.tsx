import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { SettingsContent } from "@/components/settings/settings-content"
import { Suspense } from "react"
import { SettingsContentLoading } from "./loading"

export const revalidate = 60

export default function SettingsPage() {

  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <Suspense fallback={<SettingsContentLoading />}>
        <SettingsContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
