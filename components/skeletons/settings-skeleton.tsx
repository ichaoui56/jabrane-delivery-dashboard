import { Skeleton } from "@/components/ui/skeleton"

export function SettingsSkeleton() {
  return (

    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-6" />

          {/* Avatar Skeleton */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>

          {/* Form Fields Skeleton */}
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Merchant Profile Card Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-6" />

          {/* Form Fields Skeleton */}
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>

            {/* Stats Skeleton */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>

            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Security Card Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="h-4 bg-gray-200 rounded w-full mb-4" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
    </div>
  )
}
