import { AdminSettingsContent } from "@/components/settings/admin-settings-content"
import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"

export default function AdminSettingsPage() {
  return (
    <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
        
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">إعدادات المشرف</h1>
        <AdminSettingsContent />
      </div>
    </DashboardLayoutWrapper>
  )
}
