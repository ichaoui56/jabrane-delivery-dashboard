"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin, 
  Package, 
  Users,
  CheckCircle,
  XCircle 
} from 'lucide-react'
import { createCity, updateCity, deleteCity } from "@/lib/actions/admin/city"

// Define City type
type City = {
  id: number
  name: string
  code: string
  isActive: boolean
  orderCount: number
  createdAt: Date
  _count: {
    orders: number
    deliveryMen: number
  }
}

export function CitiesClient({ initialCities }: { initialCities: City[] }) {
  const [cities, setCities] = useState<City[]>(initialCities)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    isActive: true
  })

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: cities.length,
    active: cities.filter(city => city.isActive).length,
    totalOrders: cities.reduce((sum, city) => sum + city._count.orders, 0),
    totalDeliveryMen: cities.reduce((sum, city) => sum + city._count.deliveryMen, 0)
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsLoading(true)
    const result = await createCity(formData)
    
    if (result.success && result.data) {
      toast.success(result.message || "تم إضافة المدينة بنجاح")
      setCities([result.data, ...cities])
      setIsCreateDialogOpen(false)
      resetForm()
    } else {
      toast.error(result.error || "فشل في إضافة المدينة")
    }
    setIsLoading(false)
  }

  const handleEdit = async () => {
    if (!selectedCity || !formData.name.trim() || !formData.code.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsLoading(true)
    const result = await updateCity(selectedCity.id, formData)
    
    if (result.success && result.data) {
      toast.success(result.message || "تم تحديث المدينة بنجاح")
      setCities(cities.map(city => 
        city.id === selectedCity.id ? result.data! : city
      ))
      setIsEditDialogOpen(false)
      resetForm()
      setSelectedCity(null)
    } else {
      toast.error(result.error || "فشل في تحديث المدينة")
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedCity) return

    setIsLoading(true)
    const result = await deleteCity(selectedCity.id)
    
    if (result.success) {
      toast.success(result.message || "تم حذف المدينة بنجاح")
      setCities(cities.filter(city => city.id !== selectedCity.id))
      setIsDeleteDialogOpen(false)
      setSelectedCity(null)
    } else {
      toast.error(result.error || "فشل في حذف المدينة")
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      isActive: true
    })
  }

  const openEditDialog = (city: City) => {
    setSelectedCity(city)
    setFormData({
      name: city.name,
      code: city.code,
      isActive: city.isActive
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (city: City) => {
    setSelectedCity(city)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">إدارة المدن</h1>
          <p className="text-sm text-gray-500 mt-1">إضافة وتعديل وحذف المدن المتاحة في النظام</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#048dba] hover:bg-[#037299] w-full md:w-auto">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مدينة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مدينة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">اسم المدينة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: الداخلة"
                />
              </div>
              <div>
                <Label htmlFor="code">رمز المدينة *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="مثال: DA"
                  maxLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">يستخدم في أرقام الطلبات (3 أحرف كحد أقصى)</p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">حالة المدينة</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreate}
                disabled={isLoading}
                className="flex-1 bg-[#048dba] hover:bg-[#037299]"
              >
                {isLoading ? "جاري الإضافة..." : "إضافة المدينة"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">إجمالي المدن</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">المدن النشطة</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">الطلبات</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalOrders}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">عاملين التوصيل</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalDeliveryMen}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن مدينة بالاسم أو الرمز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cities List */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle>قائمة المدن ({filteredCities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCities.map((city) => (
              <div
                key={city.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{city.name}</h3>
                      <Badge variant="outline" className="font-mono bg-gray-100">
                        {city.code}
                      </Badge>
                      <Badge 
                        variant={city.isActive ? "default" : "secondary"}
                        className={city.isActive ? "bg-green-100 text-green-800 border-green-200" : ""}
                      >
                        {city.isActive ? "نشطة" : "غير نشطة"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {city._count.orders} طلب
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {city._count.deliveryMen} عامل توصيل
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => openEditDialog(city)}
                    className="flex-1 md:flex-none border-blue-500 text-blue-500 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openDeleteDialog(city)}
                    className="flex-1 md:flex-none border-red-500 text-red-500 hover:bg-red-50"
                    disabled={city._count.orders > 0 || city._count.deliveryMen > 0}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المدينة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">اسم المدينة *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-code">رمز المدينة *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                maxLength={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">حالة المدينة</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleEdit}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "جاري التحديث..." : "حفظ التغييرات"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المدينة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف مدينة "{selectedCity?.name}"؟
              {selectedCity && (selectedCity._count.orders > 0 || selectedCity._count.deliveryMen > 0) && (
                <div className="mt-2 text-red-600 text-sm">
                  ⚠️ هذه المدينة تحتوي على {selectedCity._count.orders} طلب و{selectedCity._count.deliveryMen} عامل توصيل.
                  لا يمكن حذفها إلا إذا كانت فارغة.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading || (selectedCity ? selectedCity._count.orders > 0 || selectedCity._count.deliveryMen > 0 : false)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}