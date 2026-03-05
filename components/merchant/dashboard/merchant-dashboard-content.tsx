// components/merchant/dashboard/merchant-dashboard-content.tsx
import { getMerchantDashboardData } from "@/lib/actions/dashboard.actions"
import { MerchantDashboardClient } from "./merchant-dashboard-client"
import { DashboardData } from "@/types/types"
import { notFound } from "next/navigation"

export async function MerchantDashboardContent() {
  const data = await getMerchantDashboardData()
  
  if (!data || !data.merchant) {
    // Show an error state or redirect
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">فشل في تحميل البيانات</h2>
        <p className="text-gray-600">تعذر تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.</p>
      </div>
    )
  }

  return <MerchantDashboardClient initialData={data as DashboardData} />
}