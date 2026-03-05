"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateOrderDeliveryDate } from "@/lib/actions/admin/order"

export function UpdateDeliveryDateDialog({ 
  orderId,
  currentDeliveryDate,
  orderCode,
  children,
  onSuccess
}: { 
  orderId: number
  currentDeliveryDate: Date | null
  orderCode: string
  children: React.ReactNode
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deliveryDate, setDeliveryDate] = useState<string>(
    currentDeliveryDate ? new Date(currentDeliveryDate).toISOString().split('T')[0] : ""
  )
  const [reason, setReason] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!deliveryDate) {
      setMessage({ type: "error", text: "تاريخ التوصيل مطلوب" })
      return
    }
    
    setIsLoading(true)
    setMessage(null)

    const result = await updateOrderDeliveryDate(
      orderId, 
      new Date(deliveryDate),
      reason || undefined
    )

    if (result.success) {
      setMessage({ type: "success", text: "تم تحديث تاريخ التوصيل بنجاح" })
      setTimeout(() => {
        setOpen(false)
        if (onSuccess) onSuccess()
      }, 1000)
    } else {
      setMessage({ type: "error", text: result.error || "حدث خطأ" })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تحديث تاريخ التوصيل - {orderCode}</DialogTitle>
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
            <Label htmlFor="deliveryDate">تاريخ التوصيل الجديد</Label>
            <Input
              type="date"
              id="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              disabled={isLoading}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              التاريخ الحالي: {currentDeliveryDate ? new Date(currentDeliveryDate).toLocaleDateString("ar-MA") : "لم يحدد"}
            </p>
          </div>

          <div>
            <Label htmlFor="reason">سبب التغيير (اختياري)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              placeholder="سبب تغيير تاريخ التوصيل..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !deliveryDate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "جاري التحديث..." : "تحديث التاريخ"}
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