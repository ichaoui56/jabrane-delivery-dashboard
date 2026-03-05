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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateMerchant } from "@/lib/actions/admin/merchant"
import { compressImage } from "@/lib/utils/image-compression"
import { Eye, EyeOff, Loader2, Upload } from 'lucide-react'

type Merchant = {
  id: number
  companyName: string | null
  rib: string | null
  bankName: string | null
  baseFee: number
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
}

export function EditMerchantDialog({ 
  merchant,
  children,
  onSuccess 
}: { 
  merchant: Merchant
  children: React.ReactNode
  onSuccess?: (merchant: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [name, setName] = useState(merchant.user.name)
  const [email, setEmail] = useState(merchant.user.email)
  const [phone, setPhone] = useState(merchant.user.phone || "")
  const [companyName, setCompanyName] = useState(merchant.companyName || "")
  const [rib, setRib] = useState(merchant.rib || "")
  const [bankName, setBankName] = useState(merchant.bankName || "")
  const [baseFee, setBaseFee] = useState(String(merchant.baseFee ?? 0))
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(merchant.user.image)
  const [imagePreview, setImagePreview] = useState<string | null>(merchant.user.image)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const result = await updateMerchant(merchant.id, {
      name,
      email,
      phone: phone || null,
      image: profileImage,
      companyName: companyName || null,
      rib: rib || null,
      bankName: bankName || null,
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
      setImagePreview(merchant.user.image)
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
          <DialogTitle>تعديل بيانات التاجر</DialogTitle>
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
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={imagePreview || undefined} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="editImage" className="cursor-pointer">
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
                id="editImage"
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
              <Label htmlFor="editName">الاسم الكامل *</Label>
              <Input
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="editPhone">رقم الهاتف</Label>
              <Input
                id="editPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="editCompanyName">اسم الشركة</Label>
              <Input
                id="editCompanyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* RIB */}
            <div>
              <Label htmlFor="editRib">رقم الحساب البنكي (RIB)</Label>
              <Input
                id="editRib"
                value={rib}
                onChange={(e) => setRib(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Bank Name */}
            <div>
              <Label htmlFor="editBankName">اسم البنك</Label>
              <Input
                id="editBankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="editBaseFee">رسوم التاجر (Base Fee)</Label>
              <Input
                id="editBaseFee"
                inputMode="decimal"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="editNewPassword">كلمة مرور جديدة (اختياري)</Label>
              <div className="relative">
                <Input
                  id="editNewPassword"
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
              disabled={isLoading || uploadingImage}
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
