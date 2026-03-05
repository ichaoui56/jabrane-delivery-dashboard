import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { PaymentsContent } from "@/components/merchant/payment/payments-content"

export const revalidate = 60

export default function MerchantPaymentsPage() {

  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <PaymentsContent />
    </DashboardLayoutWrapper>
  )
}
