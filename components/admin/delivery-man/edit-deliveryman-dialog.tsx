"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateDeliveryMan } from "@/lib/actions/admin/delivery-men"
import { compressImage } from "@/lib/utils/image-compression"
import { Eye, EyeOff, Loader2, Upload } from 'lucide-react'
import { getActiveCities } from "@/lib/actions/admin/city"

type DeliveryMan = {
  id: number
  vehicleType: string | null
  city: string | null
  cityId: number | null
  active: boolean
  baseFee: number
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
}

type City = {
  id: number
  name: string
  code: string
}

export function EditDeliveryManDialog({
  deliveryMan,
  children,
  onSuccess
}: {
  deliveryMan: DeliveryMan
  children: React.ReactNode
  onSuccess?: (deliveryMan: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  const [name, setName] = useState(deliveryMan.user.name)
  const [email, setEmail] = useState(deliveryMan.user.email)
  const [phone, setPhone] = useState(deliveryMan.user.phone || "")
  const [vehicleType, setVehicleType] = useState(deliveryMan.vehicleType || "")
  const [cityId, setCityId] = useState(
    deliveryMan.cityId
      ? deliveryMan.cityId.toString()
      : "none"
  )
  const [active, setActive] = useState(deliveryMan.active ? "true" : "false")
  const [baseFee, setBaseFee] = useState(String(deliveryMan.baseFee ?? 0))
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(deliveryMan.user.image)
  const [imagePreview, setImagePreview] = useState<string | null>(deliveryMan.user.image)

  // Load cities on dialog open
  useEffect(() => {
    async function loadCities() {
      if (!open) return

      setLoadingCities(true)
      try {
        const citiesData = await getActiveCities()
        setCities(citiesData)
      } catch (error) {
        console.error("Error loading cities:", error)
        setMessage({ type: "error", text: "فشل في تحميل قائمة المدن" })
      } finally {
        setLoadingCities(false)
      }
    }

    loadCities()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const result = await updateDeliveryMan(deliveryMan.id, {
      name,
      email,
      phone: phone || null,
      image: profileImage,
      vehicleType: vehicleType || null,
      cityId: cityId && cityId !== "none" ? Number.parseInt(cityId) : null, // Handle "none"
      active: active === "true",
      baseFee: Number.parseFloat(baseFee) || 0,
      newPassword: newPassword.trim() ? newPassword : null,
    })

    if (result.success) {
      setMessage({ type: "success", text: "تم تحديث البيانات بنجاح" })
      if (onSuccess && result.data) {
        onSuccess(result.data)
      }
      setTimeout(() => {
        setOpen(false)
        window.location.reload()
      }, 1000)
    } else {
      setMessage({ type: "error", text: result.error || "حدث خطأ" })
    }

    setIsLoading(false)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "الملف المختار ليس صورة" })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)

    try {
      const compressedFile = await compressImage(file, 200)
      const formData = new FormData()
      formData.set("file", compressedFile)

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("فشل رفع الصورة")
      }

      const url = await response.json()
      setProfileImage(url)
    } catch (error) {
      setMessage({ type: "error", text: "فشل في رفع الصورة" })
      setImagePreview(deliveryMan.user.image)
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل بيانات موظف التوصيل</DialogTitle>
        </DialogHeader>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
              }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={imagePreview || undefined} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="editDMImage" className="cursor-pointer">
                <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>تغيير الصورة</span>
                    </>
                  )}
                </div>
              </Label>
              <Input
                id="editDMImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploadingImage || isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <Label className="mb-2" htmlFor="editDMName">الاسم الكامل *</Label>
              <Input
                id="editDMName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <Label className="mb-2">البريد الإلكتروني</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div>
              <Label className="mb-2" htmlFor="editDMPhone">رقم الهاتف</Label>
              <Input
                id="editDMPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <Label className="mb-2" htmlFor="editDMVehicle">نوع المركبة</Label>
              <Input
                id="editDMVehicle"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* City */}
            <div>
              <Label className="mb-2" htmlFor="editDMCity">المدينة</Label>
              <Select
                value={cityId}
                onValueChange={setCityId}
                disabled={isLoading || loadingCities}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCities ? "جاري التحميل..." : "اختر المدينة"} />
                </SelectTrigger>
                <SelectContent>
                  {/* FIXED: Changed from empty string to "none" */}
                  <SelectItem value="none">غير محدد</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div>
              <Label className="mb-2" htmlFor="editDMActive">الحالة</Label>
              <Select value={active} onValueChange={setActive} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">نشط</SelectItem>
                  <SelectItem value="false">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2" htmlFor="editDMBaseFee">رسوم عامل التوصيل (Base Fee)</Label>
              <Input
                id="editDMBaseFee"
                inputMode="decimal"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label className="mb-2" htmlFor="editDMNewPassword">كلمة مرور جديدة (اختياري)</Label>
              <div className="relative">
                <Input
                  id="editDMNewPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  aria-label={showNewPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || uploadingImage || loadingCities}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}