import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { auth } from "@/auth"
import { TrackShipmentsContent } from "@/components/merchant/track-shipments/track-shipments-content"

export const revalidate = 60

export default function TrackShipmentsPage() {

  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <TrackShipmentsContent />
    </DashboardLayoutWrapper>
  )
}
