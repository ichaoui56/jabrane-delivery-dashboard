import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { FinancesContent } from "@/components/admin/finances/finances-content"
import { Suspense } from "react"
import { FinancesContentLoading } from "./loading"

export const revalidate = 30

export default function FinancesPage() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <Suspense fallback={<FinancesContentLoading />}>
        <FinancesContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
