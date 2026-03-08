import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { CreateOrderClient } from "@/components/merchant/orders/add/create-order-client"

export default function CreateOrderPage() {
  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <CreateOrderClient />
    </DashboardLayoutWrapper>
  )
}