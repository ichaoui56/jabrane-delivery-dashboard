import { DashboardLayout } from "@/components/dashboard-layout"
import { auth } from "@/auth"
import { redirect } from 'next/navigation'
import { InventoryContent } from "@/components/merchant/inventory/inventory-content"
import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"

export const revalidate = 60

export default function InventoryPage() {

  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <InventoryContent />
    </DashboardLayoutWrapper>
  )
}
