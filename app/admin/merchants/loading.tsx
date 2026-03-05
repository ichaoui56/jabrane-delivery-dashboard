import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"

export function MerchantsContentLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MerchantsLoading() {
  return (
    <DashboardLayout userRole="ADMIN">
      <MerchantsContentLoading />
    </DashboardLayout>
  )
}
