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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDeliveryMan } from "@/lib/actions/admin/delivery-men"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { getActiveCities } from "@/lib/actions/admin/city"

type City = {
  id: number
  name: string
  code: string
}

export function CreateDeliveryManDialog({
  children,
  onSuccess,
  cities: initialCities = []
}: {
  children: React.ReactNode
  onSuccess?: (deliveryMan: any) => void
  cities?: City[]
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cities, setCities] = useState<City[]>(initialCities)
  const [loadingCities, setLoadingCities] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [vehicleType, setVehicleType] = useState("")
  const [cityId, setCityId] = useState<string>("") // Using cityId instead of city string
  const [baseFee, setBaseFee] = useState("15")
  const [active, setActive] = useState("true")

  // Load cities if not provided
  // In CreateDeliveryManDialog, update the cities useEffect:
  useEffect(() => {
    async function loadCities() {
      if (!open) return

      setLoadingCities(true)
      try {
        const citiesData = await getActiveCities()
        console.log("Cities data loaded in dialog:", citiesData) // Debug log
        setCities(citiesData)
      } catch (error) {
        console.error("Error loading cities:", error)
        toast.error("فشل في تحميل قائمة المدن")
      } finally {
        setLoadingCities(false)
      }
    }

    // Only load cities if not provided as props
    if (initialCities.length === 0) {
      loadCities()
    } else {
      setCities(initialCities)
    }
  }, [open, initialCities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      setIsLoading(false)
      return
    }

    const result = await createDeliveryMan({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      password: password.trim(),
      image: null,
      vehicleType: vehicleType.trim() || null,
      cityId: cityId && cityId !== "none" ? Number.parseInt(cityId) : null, // Use cityId instead of city string
      baseFee: Number.parseFloat(baseFee) || 15,
      active: active === "true",
    })

    if (result.success) {
      toast.success("تم إضافة موظف التوصيل بنجاح")
      setOpen(false)
      resetForm()
      if (onSuccess && result.data) {
        onSuccess(result.data)
      }
    } else {
      toast.error(result.error || "حدث خطأ أثناء إضافة موظف التوصيل")
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setPassword("")
    setVehicleType("")
    setCityId("")
    setBaseFee("15")
    setActive("true")
    setShowPassword(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          resetForm()
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة موظف توصيل جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <Label className="mb-2" htmlFor="createDMName">الاسم الكامل *</Label>
              <Input
                id="createDMName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            {/* Email */}
            <div>
              <Label className="mb-2" htmlFor="createDMEmail">البريد الإلكتروني *</Label>
              <Input
                id="createDMEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="example@sonic-delivery.com"
              />
            </div>

            {/* Phone */}
            <div>
              <Label className="mb-2" htmlFor="createDMPhone">رقم الهاتف</Label>
              <Input
                id="createDMPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                placeholder="+212600000000"
              />
            </div>

            {/* Password */}
            <div>
              <Label className="mb-2" htmlFor="createDMPassword">كلمة المرور *</Label>
              <div className="relative">
                <Input
                  id="createDMPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                  placeholder="كلمة مرور قوية"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Vehicle Type */}
            <div>
              <Label className="mb-2" htmlFor="createDMVehicle">نوع المركبة</Label>
              <Input
                id="createDMVehicle"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                disabled={isLoading}
                placeholder="دراجة نارية، سيارة، إلخ"
              />
            </div>

            {/* City - FIXED: Using proper value prop */}
            <div>
              <Label className="mb-2" htmlFor="createDMCity">المدينة</Label>
              <Select
                value={cityId}
                onValueChange={setCityId}
                disabled={isLoading || loadingCities}
              >
                <SelectTrigger id="createDMCity">
                  <SelectValue placeholder={loadingCities ? "جاري التحميل..." : "اختر المدينة (اختياري)"} />
                </SelectTrigger>
                <SelectContent>
                  {/* FIXED: Changed empty string to "none" */}
                  <SelectItem value="none">غير محدد</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base Fee */}
            <div>
              <Label className="mb-2" htmlFor="createDMBaseFee">رسوم عامل التوصيل</Label>
              <Input
                id="createDMBaseFee"
                inputMode="decimal"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                disabled={isLoading}
                placeholder="15"
              />
            </div>

            {/* Active Status */}
            <div>
              <Label className="mb-2" htmlFor="createDMActive">الحالة</Label>
              <Select value={active} onValueChange={setActive} disabled={isLoading}>
                <SelectTrigger id="createDMActive">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">نشط</SelectItem>
                  <SelectItem value="false">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || loadingCities}
              className="flex-1 bg-[#048dba] hover:bg-[#037ba0]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                "إضافة موظف التوصيل"
              )}
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