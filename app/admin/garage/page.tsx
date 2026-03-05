import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { GarageContent } from "@/components/admin/garage/garage-content"

export const revalidate = 0

export default async function GaragePage() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <GarageContent />
    </DashboardLayoutWrapper>
  )
}
