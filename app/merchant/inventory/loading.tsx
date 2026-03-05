import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryTableSkeleton } from "@/components/skeletons/inventory-table-skeleton"

export default function InventoryLoading() {
  return (
    <DashboardLayout userRole="MERCHANT">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المخزون</h1>
          <p className="text-gray-500 mt-1">عرض وإدارة منتجاتك في المخزن</p>
        </div>

        <InventoryTableSkeleton />
      </div>
    </DashboardLayout>
  )
}
