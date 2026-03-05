import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"

export function FinancesContentLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function FinancesLoading() {
  return (
    <DashboardLayout userRole="ADMIN">
      <FinancesContentLoading />
    </DashboardLayout>
  )
}
