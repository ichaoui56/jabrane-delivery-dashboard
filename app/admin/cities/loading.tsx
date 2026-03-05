import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function CitiesLoading() {
    return (
        <DashboardLayout userRole="ADMIN">
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="border-t-4 border-t-gray-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Search Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>

                {/* Cities List */}
                <Card>
                    <CardHeader className="pb-6">
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-6 w-12" />
                                                <Skeleton className="h-6 w-16" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Skeleton className="h-9 w-20" />
                                        <Skeleton className="h-9 w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}