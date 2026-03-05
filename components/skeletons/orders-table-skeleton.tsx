import { Card, CardContent } from "@/components/ui/card"

export function OrdersTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />

      {/* Orders List */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="space-y-2">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
