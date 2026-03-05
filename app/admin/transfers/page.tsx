import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { TransfersContent } from "@/components/admin/transfers/transfers-content"

export const revalidate = 0

export default async function TransfersPage() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <TransfersContent />
    </DashboardLayoutWrapper>
  )
}
