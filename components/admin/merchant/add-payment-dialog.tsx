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
import { addMoneyTransfer } from "@/lib/actions/admin/merchant"

export function AddPaymentDialog({ 
  merchantId,
  merchantName,
  children 
}: { 
  merchantId: number
  merchantName: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("[v0] Starting invoice image upload for merchant:", merchantId)
    console.log("[v0] File selected:", file.name, "Size:", (file.size / 1024).toFixed(2), "KB")

    setUploading(true)
    try {
      console.log("[v0] Compressing image...")
      const compressed = await compressImage(file, 500)
      console.log("[v0] Image compressed. New size:", (compressed.size / 1024).toFixed(2), "KB")
      
      const formData = new FormData()
      formData.append("file", compressed)

      console.log("[v0] Uploading to Pinata via /api/files...")
      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Upload response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Upload failed with response:", errorText)
        throw new Error("فشل رفع الصورة")
      }

      const url = await response.json()
      console.log("[v0] Invoice uploaded successfully. URL:", url)
      setInvoiceImage(url)
      setMessage({ type: "success", text: "تم رفع الفاتورة بنجاح" })
    } catch (error) {
      console.error("[v0] Error uploading invoice:", error)
      setMessage({ type: "error", text: "فشل رفع الفاتورة" })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    console.log("[v0] Submitting payment with data:", {
      merchantId,
      amount: parseFloat(amount),
      reference: reference || null,
      note: note || null,
      invoiceImage: invoiceImage,
    })

    const result = await addMoneyTransfer(merchantId, {
      amount: parseFloat(amount),
      reference: reference || null,
      note: note || null,
      invoiceImage: invoiceImage,
    })

    console.log("[v0] Payment submission result:", result)

    if (result.success) {
      setMessage({ type: "success", text: "تمت إضافة الدفعة بنجاح" })
      setTimeout(() => {
        setOpen(false)
        setAmount("")
        setReference("")
        setNote("")
        setInvoiceImage(null)
        setMessage(null)
        window.location.reload()
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
          <DialogTitle>إضافة دفعة مالية - {merchantName}</DialogTitle>
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
          {/* Amount */}
          <div>
            <Label htmlFor="amount">المبلغ (د.م) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading}
              placeholder="0.00"
            />
          </div>

          {/* Reference */}
          <div>
            <Label htmlFor="reference">المرجع</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={isLoading}
              placeholder="رقم التحويل أو المرجع"
            />
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="note">ملاحظة</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              placeholder="أضف ملاحظة..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="invoice">صورة الفاتورة (اختياري)</Label>
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
