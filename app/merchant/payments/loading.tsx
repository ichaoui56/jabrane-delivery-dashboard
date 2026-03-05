import { DashboardLayout } from "@/components/dashboard-layout"
import { PaymentsDashboardSkeleton } from "@/components/skeletons/payments-dashboard-skeleton"

export default function PaymentsLoading() {
  return (
    <DashboardLayout userRole="MERCHANT">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المدفوعات</h1>
          <p className="text-gray-500 mt-1">تتبع الأرباح والمدفوعات</p>
        </div>

        <PaymentsDashboardSkeleton />
      </div>
    </DashboardLayout>
  )
}
