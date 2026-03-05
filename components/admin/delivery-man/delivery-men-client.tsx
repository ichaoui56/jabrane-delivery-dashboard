"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Eye, 
  X, 
  MapPin, 
  DollarSign,
  Clock,
  Package,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  User,
  RefreshCw
} from 'lucide-react'
import { CreateDeliveryManDialog } from "./create-deliveryman-dialog"
import { EditDeliveryManDialog } from "./edit-deliveryman-dialog"
import { getActiveCities } from "@/lib/actions/admin/city"
import { createSlugWithId } from "@/lib/utils/slug"

type DeliveryMan = {
  id: number
  vehicleType: string | null
  active: boolean
  city: string | null
  cityId: number | null
  totalDeliveries: number
  successfulDeliveries: number
  totalEarned: number
  pendingEarnings: number
  collectedCOD: number
  pendingCOD: number
  baseFee: number
  rating: number | null
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  _count: {
    assignedOrders: number
  }
}

type City = {
  id: number
  name: string
  code: string
}

export function DeliveryMenClient({ initialDeliveryMen }: { initialDeliveryMen: DeliveryMan[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>(initialDeliveryMen)
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [filterCity, setFilterCity] = useState<string>("all")
  const [cities, setCities] = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(false)
  const router = useRouter()

  // Load cities on component mount
  useEffect(() => {
    async function loadCities() {
      setLoadingCities(true)
      try {
        const citiesData = await getActiveCities()
        setCities(citiesData)
      } catch (error) {
        console.error("Error loading cities:", error)
      } finally {
        setLoadingCities(false)
      }
    }

    loadCities()
  }, [])

  const filteredDeliveryMen = deliveryMen.filter((dm) => {
    const matchesSearch =
      dm.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dm.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dm.vehicleType && dm.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dm.user.phone && dm.user.phone.includes(searchTerm))

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && dm.active) ||
      (filterStatus === "inactive" && !dm.active)

    const matchesCity =
      filterCity === "all" ||
      dm.city === filterCity

    return matchesSearch && matchesStatus && matchesCity
  })

  // Calculate statistics
  const stats = useMemo(() => {
    const total = deliveryMen.length
    const active = deliveryMen.filter(dm => dm.active).length
    const inactive = deliveryMen.filter(dm => !dm.active).length
    const totalEarnings = deliveryMen.reduce((sum, dm) => sum + dm.totalEarned, 0)
    const pendingEarnings = deliveryMen.reduce((sum, dm) => sum + dm.pendingEarnings, 0)
    const pendingCOD = deliveryMen.reduce((sum, dm) => sum + dm.pendingCOD, 0)
    const collectedCOD = deliveryMen.reduce((sum, dm) => sum + dm.collectedCOD, 0)

    // City stats
    const cityStats: Record<string, number> = {}
    cities.forEach(city => {
      cityStats[city.name] = deliveryMen.filter(dm => dm.city === city.name).length
    })

    return {
      total,
      active,
      inactive,
      totalEarnings,
      pendingEarnings,
      pendingCOD,
      collectedCOD,
      cityStats
    }
  }, [deliveryMen, cities])

  const activeFilters = []
  if (filterStatus !== "all") activeFilters.push(filterStatus === "active" ? "نشط" : "غير نشط")
  if (filterCity !== "all") activeFilters.push(filterCity)

  const handleDeliveryManCreated = (newDM: DeliveryMan) => {
    setDeliveryMen([newDM, ...deliveryMen])
  }

  const handleDeliveryManUpdated = (updatedDM: DeliveryMan) => {
    setDeliveryMen(deliveryMen.map(dm => dm.id === updatedDM.id ? updatedDM : dm))
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">إدارة موظفي التوصيل</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">عرض وإدارة جميع موظفي التوصيل</p>
        </div>
        <CreateDeliveryManDialog
          onSuccess={handleDeliveryManCreated}
          cities={cities}
        >
          <Button className="bg-[#048dba] hover:bg-[#037a9e] text-xs sm:text-sm w-full sm:w-auto">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
            إضافة موظف توصيل
          </Button>
        </CreateDeliveryManDialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {/* Total Delivery Men */}
        <Card className="border-t-4 border-t-[#048dba] hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">إجمالي الموظفين</p>
              <div className="w-8 h-8 rounded-full bg-[#048dba]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#048dba]" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#048dba]">{stats.total}</p>
          </CardContent>
        </Card>

        {/* Active Delivery Men */}
        <Card className="border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">النشطون</p>
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>

        {/* Inactive Delivery Men */}
        <Card className="border-t-4 border-t-red-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">غير النشطين</p>
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.inactive}</p>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card className="border-t-4 border-t-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">أرباح معلقة</p>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
              {stats.pendingEarnings.toFixed(2)} د.م
            </p>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">إجمالي الأرباح</p>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              {stats.totalEarnings.toFixed(2)} د.م
            </p>
          </CardContent>
        </Card>

        {/* Pending COD */}
        <Card className="border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">COD معلقة</p>
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">
              {stats.pendingCOD.toFixed(2)} د.م
            </p>
          </CardContent>
        </Card>

        {/* Success Rate Average */}
        <Card className="border-t-4 border-t-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">معدل النجاح</p>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
              {deliveryMen.length > 0
                ? (deliveryMen.reduce((sum, dm) => {
                    const rate = dm.totalDeliveries > 0 
                      ? (dm.successfulDeliveries / dm.totalDeliveries) * 100 
                      : 0
                    return sum + rate
                  }, 0) / deliveryMen.length).toFixed(1)
                : "0"}%
            </p>
          </CardContent>
        </Card>

        {/* Total COD Collected */}
        <Card className="border-t-4 border-t-cyan-500 hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">COD المجمعة</p>
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-cyan-500" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-cyan-600">
              {stats.collectedCOD.toFixed(2)} د.م
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="border-[#048dba]/20">
        <CardContent className="pt-4 sm:pt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="ابحث بالاسم، البريد الإلكتروني، الهاتف، أو نوع المركبة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-sm border-gray-300 focus:border-[#048dba] focus:ring-[#048dba]"
            />
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">الفلاتر النشطة:</span>
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="bg-[#048dba]/10 text-[#048dba] border-[#048dba]/20">
                  {filter}
                </Badge>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterStatus("all")
                  setFilterCity("all")
                }}
                className="h-6 text-xs text-gray-500 hover:text-[#048dba]"
              >
                <X className="w-3 h-3 ml-1" />
                مسح الكل
              </Button>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-3">
            {/* Status Filter */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">الحالة</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className={`flex-1 text-xs sm:text-sm transition-all ${filterStatus === "all"
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm'
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                    }`}
                >
                  الكل ({stats.total})
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "active" ? "default" : "outline"}
                  onClick={() => setFilterStatus("active")}
                  className={`flex-1 text-xs sm:text-sm transition-all ${filterStatus === "active"
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm'
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                    }`}
                >
                  نشط ({stats.active})
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "inactive" ? "default" : "outline"}
                  onClick={() => setFilterStatus("inactive")}
                  className={`flex-1 text-xs sm:text-sm transition-all ${filterStatus === "inactive"
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm'
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                    }`}
                >
                  غير نشط ({stats.inactive})
                </Button>
              </div>
            </div>

            {/* City Filter */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">المدينة</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant={filterCity === "all" ? "default" : "outline"}
                  onClick={() => setFilterCity("all")}
                  className={`text-xs sm:text-sm transition-all ${filterCity === "all"
                      ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm'
                      : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                    }`}
                >
                  <MapPin className="w-3 h-3 ml-1" />
                  كل المدن
                </Button>
                {cities.map((city) => (
                  <Button
                    key={city.id}
                    size="sm"
                    variant={filterCity === city.name ? "default" : "outline"}
                    onClick={() => setFilterCity(city.name)}
                    className={`text-xs sm:text-sm transition-all ${filterCity === city.name
                        ? 'bg-[#048dba] hover:bg-[#037a9e] shadow-sm'
                        : 'hover:border-[#048dba] hover:text-[#048dba] hover:bg-[#048dba]/5'
                      }`}
                  >
                    {city.name} ({stats.cityStats[city.name] || 0})
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Men List */}
      <Card>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-base sm:text-lg">
            قائمة موظفي التوصيل ({filteredDeliveryMen.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredDeliveryMen.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">لا توجد نتائج</p>
                <p className="text-sm text-gray-400 mt-1">حاول تغيير عوامل البحث أو الفلاتر</p>
              </div>
            ) : (
              filteredDeliveryMen.map((deliveryMan) => {
                const successRate = deliveryMan.totalDeliveries > 0
                  ? ((deliveryMan.successfulDeliveries / deliveryMan.totalDeliveries) * 100).toFixed(1)
                  : "0"

                return (
                  <div
                    key={deliveryMan.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 hover:border-[#048dba]/50 cursor-pointer transition-all group"
                    onClick={() => router.push(`/admin/delivery-men/${createSlugWithId(deliveryMan.user.name, deliveryMan.id)}`)}
                  >
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-[#048dba]/20 group-hover:ring-[#048dba]/40 transition-all">
                      <AvatarImage src={deliveryMan.user.image || undefined} />
                      <AvatarFallback className="bg-[#048dba] text-white text-base sm:text-lg">
                        {deliveryMan.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 w-full">
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm sm:text-base">{deliveryMan.user.name}</p>
                          <Badge
                            variant={deliveryMan.active ? "default" : "secondary"}
                            className={`text-xs ${deliveryMan.active ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'}`}
                          >
                            {deliveryMan.active ? "نشط" : "غير نشط"}
                          </Badge>
                          {deliveryMan.rating && (
                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                              ⭐ {deliveryMan.rating.toFixed(1)}
                            </Badge>
                          )}
                          {deliveryMan.city && (
                            <Badge variant="outline" className="text-xs border-[#048dba] text-[#048dba]">
                              <MapPin className="w-3 h-3 ml-1" />
                              {deliveryMan.city}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500 mb-1">
                        {deliveryMan.vehicleType || "لا توجد مركبة"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{deliveryMan.user.email}</p>
                      {deliveryMan.user.phone && (
                        <p className="text-xs text-gray-500 mt-1">{deliveryMan.user.phone}</p>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 xs:grid-cols-6 gap-2 sm:gap-4 mt-3">
                        {/* Assigned Orders */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">الطلبات المسندة</p>
                          <p className="font-semibold text-sm">{deliveryMan._count.assignedOrders}</p>
                        </div>

                        {/* Success Rate */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">معدل النجاح</p>
                          <p className={`font-semibold text-sm ${
                            parseFloat(successRate) >= 90 ? 'text-green-600' :
                            parseFloat(successRate) >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {successRate}%
                          </p>
                        </div>

                        {/* Total Earnings */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">إجمالي الأرباح</p>
                          <p className="font-semibold text-sm text-blue-600">
                            {deliveryMan.totalEarned.toFixed(2)} د.م
                          </p>
                        </div>

                        {/* Pending Earnings */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">أرباح معلقة</p>
                          <p className="font-semibold text-sm text-orange-600">
                            {deliveryMan.pendingEarnings.toFixed(2)} د.م
                          </p>
                        </div>

                        {/* Pending COD */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">COD معلقة</p>
                          <p className="font-semibold text-sm text-red-600">
                            {deliveryMan.pendingCOD.toFixed(2)} د.م
                          </p>
                        </div>

                        {/* Base Fee */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-xs text-gray-500">الأجرة الأساسية</p>
                          <p className="font-semibold text-sm">{deliveryMan.baseFee.toFixed(2)} د.م</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/delivery-men/${createSlugWithId(deliveryMan.user.name, deliveryMan.id)}`)
                        }}
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        <span className="hidden xs:inline">عرض التفاصيل</span>
                        <span className="xs:hidden">تفاصيل</span>
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}