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
import { createMerchant } from "@/lib/actions/admin/merchant"
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X } from 'lucide-react'

export function CreateMerchantDialog({ 
  children,
  onSuccess 
}: { 
  children: React.ReactNode
  onSuccess?: (merchant: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [rib, setRib] = useState("")
  const [bankName, setBankName] = useState("")
  const [baseFee, setBaseFee] = useState("0")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const result = await createMerchant({
      name,
      email,
      phone: phone || null,
      password,
      image: profileImage,
      companyName: companyName || null,
      rib: rib || null,
      bankName: bankName || null,
      baseFee: parseFloat(baseFee) || 0,
    })

    if (result.success) {
      setMessage({ type: "success", text: "تم إنشاء التاجر بنجاح" })
      if (onSuccess && result.data) {
        onSuccess(result.data)
      }
      setTimeout(() => {
        setOpen(false)
        // Reset form
        setName("")
        setEmail("")
        setPhone("")
        setPassword("")
        setCompanyName("")
        setRib("")
        setBankName("")
        setBaseFee("0")
        setProfileImage(null)
        setImagePreview(null)
        setMessage(null)
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
      setImagePreview(null)
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
          <DialogTitle>إضافة تاجر جديد</DialogTitle>
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
                {name.charAt(0) || "T"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="createImage" className="cursor-pointer">
                <div className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>رفع صورة</span>
                    </>
                  )}
                </div>
              </Label>
              <Input
                id="createImage"
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
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="companyName">اسم الشركة</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* RIB */}
            <div>
              <Label htmlFor="rib">رقم الحساب البنكي (RIB)</Label>
              <Input
                id="rib"
                value={rib}
                onChange={(e) => setRib(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Bank Name */}
            <div>
              <Label htmlFor="bankName">اسم البنك</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Base Fee */}
            <div>
              <Label htmlFor="baseFee">الرسوم الأساسية (د.م)</Label>
              <Input
                id="baseFee"
                type="number"
                step="0.01"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || uploadingImage}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "جاري الحفظ..." : "إنشاء التاجر"}
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
