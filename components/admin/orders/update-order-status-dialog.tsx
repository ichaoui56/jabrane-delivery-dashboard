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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOrderStatus } from "@/lib/actions/admin/order"

export function UpdateOrderStatusDialog({ 
  orderId,
  currentStatus,
  orderCode,
  children,
  onSuccess
}: { 
  orderId: number
  currentStatus: string
  orderCode: string
  children: React.ReactNode
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [status, setStatus] = useState(currentStatus)

  const statuses = [
    { value: "PENDING", label: "قيد الانتظار" },
    { value: "ACCEPTED", label: "مقبول" },
    { value: "ASSIGNED_TO_DELIVERY", label: "مسند للتوصيل" },
    { value: "DELIVERED", label: "تم التوصيل" },
    { value: "DELAYED", label: "مبلغ عنه" },
    { value: "REJECTED", label: "مرفوض" },
    { value: "CANCELLED", label: "ملغى" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const result = await updateOrderStatus(orderId, status)

    if (result.success) {
      setMessage({ type: "success", text: "تم تحديث حالة الطلب بنجاح" })
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
          <DialogTitle>تحديث حالة الطلب - {orderCode}</DialogTitle>
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
            <Label htmlFor="status">الحالة الجديدة</Label>
            <Select value={status} onValueChange={setStatus} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || status === currentStatus}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "جاري التحديث..." : "تحديث الحالة"}
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
