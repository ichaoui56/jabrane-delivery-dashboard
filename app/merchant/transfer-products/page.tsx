import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { CreateTransferContent } from "@/components/merchant/transfer-products/create-transfer-content"

export const revalidate = 60

export default function TransferProductsPage() {
  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">نقل المنتجات</h1>
          <p className="text-gray-500 mt-1">قم بإنشاء طلب نقل منتجات إلى الشركة بالداخلة</p>
        </div>
        <CreateTransferContent />
      </div>
    </DashboardLayoutWrapper>
  )
}
