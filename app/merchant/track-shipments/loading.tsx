import { DashboardLayout } from "@/components/dashboard-layout"
import { TrackShipmentsSkeleton } from "@/components/skeletons/track-shipments-skeleton"

export default function TrackShipmentsLoading() {
  return (
    <DashboardLayout userRole="MERCHANT">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تتبع الشحنات</h1>
          <p className="text-gray-500 mt-1">راقب حالة شحنات منتجاتك</p>
        </div>

        <TrackShipmentsSkeleton />
      </div>
    </DashboardLayout>
  )
}
