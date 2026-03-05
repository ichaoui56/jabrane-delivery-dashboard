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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assignDeliveryMan, getActiveDeliveryMen } from "@/lib/actions/admin/order"
import { Truck } from "lucide-react"

type DeliveryMan = {
  id: number
  user: {
    name: string
    phone: string | null
  }
  city: string | null
  totalDeliveries: number
  successfulDeliveries: number
  rating: number | null
}

export function AssignDeliveryManDialog({ 
  orderId,
  orderCode,
  orderCity,
  children,
  onSuccess
}: { 
  orderId: number
  orderCode: string
  orderCity: string
  children?: React.ReactNode
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingDeliveryMen, setIsFetchingDeliveryMen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deliveryManId, setDeliveryManId] = useState<string>("")
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([])

  useEffect(() => {
    if (open) {
      fetchDeliveryMen()
    }
  }, [open])

  const fetchDeliveryMen = async () => {
    setIsFetchingDeliveryMen(true)
    const result = await getActiveDeliveryMen()
    
    if (result.success && result.data) {
      setDeliveryMen(result.data)
    } else {
      setMessage({ type: "error", text: result.error || "فشل في جلب قائمة الموصلين" })
    }
    setIsFetchingDeliveryMen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!deliveryManId) {
      setMessage({ type: "error", text: "يرجى اختيار موصل" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    const result = await assignDeliveryMan(orderId, parseInt(deliveryManId))

    if (result.success) {
      setMessage({ type: "success", text: "تم تعيين الموصل بنجاح وتحديث حالة الطلب" })
      setTimeout(() => {
        setOpen(false)
        setDeliveryManId("")
        if (onSuccess) onSuccess()
      }, 1000)
    } else {
      setMessage({ type: "error", text: result.error || "حدث خطأ" })
    }

    setIsLoading(false)
  }

  // Filter delivery men by city (prioritize same city, but show all)
  const deliveryMenSameCity = deliveryMen.filter(dm => dm.city === orderCity)
  const deliveryMenOtherCities = deliveryMen.filter(dm => dm.city !== orderCity)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200">
            <Truck className="w-4 h-4 ml-2" />
            تعيين موصل
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعيين موصل للطلب - {orderCode}</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            المدينة: {orderCity}
          </p>
        </DialogHeader>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="deliveryMan">اختر الموصل</Label>
            {isFetchingDeliveryMen ? (
              <div className="p-4 text-center text-gray-500">
                جاري تحميل الموصلين...
              </div>
            ) : deliveryMen.length === 0 ? (
              <div className="p-4 text-center text-red-500">
                لا يوجد موصلين نشطين متاحين
              </div>
            ) : (
              <Select value={deliveryManId} onValueChange={setDeliveryManId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر موصل..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Delivery men from the same city */}
                  {deliveryMenSameCity.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                        موصلين من {orderCity}
                      </div>
                      {deliveryMenSameCity.map(dm => (
                        <SelectItem key={dm.id} value={dm.id.toString()}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{dm.user.name}</span>
                              {dm.rating && (
                                <span className="text-xs text-yellow-600">
                                  ⭐ {dm.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {dm.user.phone || "لا يوجد رقم"} • 
                              {dm.successfulDeliveries}/{dm.totalDeliveries} توصيل ناجح
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Delivery men from other cities */}
                  {deliveryMenOtherCities.length > 0 && (
                    <>
                      {deliveryMenSameCity.length > 0 && (
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 mt-2">
                          موصلين من مدن أخرى
                        </div>
                      )}
                      {deliveryMenOtherCities.map(dm => (
                        <SelectItem key={dm.id} value={dm.id.toString()}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{dm.user.name}</span>
                              {dm.rating && (
                                <span className="text-xs text-yellow-600">
                                  ⭐ {dm.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {dm.user.phone || "لا يوجد رقم"} • 
                              {dm.successfulDeliveries}/{dm.totalDeliveries} توصيل ناجح
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">ملاحظة:</p>
            <p>عند تعيين الموصل، سيتم تغيير حالة الطلب تلقائياً إلى "مسند للتوصيل"</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !deliveryManId || deliveryMen.length === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "جاري التعيين..." : "تعيين الموصل"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setDeliveryManId("")
                setMessage(null)
              }}
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