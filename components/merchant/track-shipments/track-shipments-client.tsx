"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"
import { TrackShipmentsTable } from "@/components/track-shipments-table"

type Transfer = any // Use the proper type from your codebase

export function TrackShipmentsClient({ initialTransfers }: { initialTransfers: Transfer[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">تتبع الشحنات</h1>
        <p className="text-gray-500 mt-1">راقب حالة شحناتك المرسلة إلى الشركة</p>
      </div>

      {initialTransfers && initialTransfers.length > 0 ? (
        <TrackShipmentsTable transfers={initialTransfers} />
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">لا توجد شحنات</p>
              <p className="text-sm">لم تقم بإنشاء أي شحنات بعد</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
