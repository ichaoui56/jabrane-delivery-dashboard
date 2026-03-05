import { Card, CardContent } from "@/components/ui/card"

export function DashboardStatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2 animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-blue-200 rounded-lg animate-pulse" />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse border-t-4" style={{ borderTopColor: i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : i === 2 ? '#22c55e' : '#f59e0b' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="p-2 rounded-lg bg-gray-100 w-10 h-10" />
              </div>
              <div className="h-10 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best Selling Products Skeleton */}
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Trend Skeleton */}
        <Card className="animate-pulse">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded-full" />
            </div>
            <div className="h-64 bg-gray-100 rounded-lg flex items-end justify-around gap-2 p-4">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-t w-full"
                  style={{ height: `${Math.random() * 60 + 40}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
