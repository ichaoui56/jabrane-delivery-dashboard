import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { MerchantsContent } from "@/components/admin/merchant/merchants-content"
import { Suspense } from "react"
import { MerchantsContentLoading } from "./loading"

export const revalidate = 30

export default function MerchantsPage() {

  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <Suspense fallback={<MerchantsContentLoading />}>
        <MerchantsContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
