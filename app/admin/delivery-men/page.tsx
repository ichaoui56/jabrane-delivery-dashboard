import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { DeliveryMenContent } from "@/components/admin/delivery-man/delivery-men-content"
import { Suspense } from "react"
import { DeliveryMenContentLoading } from "./loading"

export const revalidate = 30

export default function DeliveryMenPage() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
      <Suspense fallback={<DeliveryMenContentLoading />}>
        <DeliveryMenContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}
