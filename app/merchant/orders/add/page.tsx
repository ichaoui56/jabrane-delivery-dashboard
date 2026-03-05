import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { CreateOrderContent } from "@/components/merchant/orders/add/create-order-content"

export default function CreateOrderPage() {

  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <CreateOrderContent />
    </DashboardLayoutWrapper>
  )
}
