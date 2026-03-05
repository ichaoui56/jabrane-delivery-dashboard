import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { MerchantDashboardContent } from "@/components/merchant/dashboard/merchant-dashboard-content"
import { Suspense } from "react"
import { DashboardStatsSkeleton } from "@/components/skeletons/dashboard-stats-skeleton"
import { Card, CardContent } from "@/components/ui/card"

// Increase revalidation time
export const revalidate = 60 // Cache for 60 seconds instead of 30

// In your dashboard page component
export default function DashboardPage() {
  return (
    <DashboardLayoutWrapper userRole="MERCHANT" expectedRole="MERCHANT">
      <Suspense 
        fallback={
          <div className="space-y-4">
            <DashboardStatsSkeleton />
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="h-64 animate-pulse bg-gray-200" />
                </Card>
              </div>
              <Card>
                <CardContent className="h-64 animate-pulse bg-gray-200" />
              </Card>
            </div>
          </div>
        }
      >
        <MerchantDashboardContent />
      </Suspense>
    </DashboardLayoutWrapper>
  )
}