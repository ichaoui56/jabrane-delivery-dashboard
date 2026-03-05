import { Card, CardContent } from "@/components/ui/card"

export function InventoryTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-9 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <div className="h-[300px] bg-gray-200" />
            <CardContent className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-16 bg-gray-200 rounded" />
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
