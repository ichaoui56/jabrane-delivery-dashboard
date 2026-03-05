import { DashboardLayout } from "@/components/dashboard-layout"
import { OrdersTableSkeleton } from "@/components/skeletons/orders-table-skeleton"

export default function OrdersLoading() {
  return (
    <DashboardLayout userRole="MERCHANT">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-gray-500 mt-1">عرض وإدارة جميع طلباتك</p>
        </div>
        
        <OrdersTableSkeleton />
      </div>
    </DashboardLayout>
  )
}
