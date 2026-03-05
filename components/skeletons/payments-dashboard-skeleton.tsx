import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function PaymentsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-200 rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions Table */}
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
