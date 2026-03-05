import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { CitiesContent } from "@/components/admin/cities/cities-content"

export const revalidate = 30

export default function CitiesPage() {
    return (
        <DashboardLayoutWrapper userRole="ADMIN" expectedRole="ADMIN">
            <CitiesContent />
        </DashboardLayoutWrapper>
    )
}