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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Loader2 } from 'lucide-react'
import { compressImage } from "@/lib/utils/image-compression"
import { addDeliveryManPayment } from "@/lib/actions/admin/delivery-men"
import { toast } from "sonner"

export function AddPaymentDialog({ 
  deliveryManId,
  deliveryManName,
  children,
  onSuccess
}: { 
  deliveryManId: number
  deliveryManName: string
  children: React.ReactNode
  onSuccess?: (newTransfer: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const compressed = await compressImage(file, 500)
      
      const formData = new FormData()
      formData.append("file", compressed)

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("فشل رفع الصورة")
      }

      const url = await response.json()
      setInvoiceImage(url)
      toast.success("تم رفع الفاتورة بنجاح")
    } catch (error) {
      toast.error("فشل رفع الفاتورة")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await addDeliveryManPayment(deliveryManId, {
      amount: parseFloat(amount),
      reference: reference || null,
      note: note || null,
      invoiceImage: invoiceImage,
    })

    if (result.success) {
      const newTransfer = {
        id: Date.now(),
        amount: parseFloat(amount),
        reference: reference,
        note: note,
        invoiceImage: invoiceImage,
        createdAt: new Date().toISOString()
      }
      
      if (onSuccess) {
        onSuccess(newTransfer)
      }
      
      toast.success("تمت إضافة الدفعة بنجاح")
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || "حدث خطأ")
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setAmount("")
    setReference("")
    setNote("")
    setInvoiceImage(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة دفعة مالية - {deliveryManName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="dmAmount">المبلغ (د.م) *</Label>
            <Input
              id="dmAmount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="dmReference">المرجع</Label>
            <Input
              id="dmReference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={isLoading}
              placeholder="رقم التحويل أو المرجع"
            />
          </div>

          <div>
            <Label htmlFor="dmNote">ملاحظة</Label>
            <Textarea
              id="dmNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              placeholder="أضف ملاحظة..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dmInvoice">صورة الفاتورة (اختياري)</Label>
            {invoiceImage ? (
              <div className="relative mt-2">
                <img src={invoiceImage || "/placeholder.svg"} alt="Invoice" className="w-full h-40 object-cover rounded border" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 left-2"
                  onClick={() => setInvoiceImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading || isLoading}
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">اضغط لرفع صورة الفاتورة</p>
                  </div>
                )}
              </label>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#048dba] hover:bg-[#0570a1]"
            >
              {isLoading ? "جاري الحفظ..." : "إضافة الدفعة"}
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