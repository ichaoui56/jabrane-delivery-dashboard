import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function TrackShipmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 mx-auto bg-gray-200 rounded" />
                <div className="h-8 w-12 mx-auto bg-gray-200 rounded" />
                <div className="h-3 w-20 mx-auto bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-9 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Shipments List */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="bg-gray-200 h-24" />
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-24 bg-gray-200 rounded" />
              <div className="space-y-2">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="h-16 bg-gray-200 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
