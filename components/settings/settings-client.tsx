"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateMerchantProfile, updateUserProfile } from "@/lib/actions/settings.actions"
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X } from 'lucide-react'
import Link from "next/link"
import { toast } from "sonner"

interface MerchantSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  merchant: {
    id: number
    companyName: string | null
    rib: string | null
    bankName: string | null
    balance: number
    totalEarned: number
    baseFee: number
  }
}

interface SettingsClientProps {
  initialData: MerchantSettingsData
}

export function SettingsClient({ initialData }: SettingsClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [userName, setUserName] = useState(initialData.user.name)
  const [userPhone, setUserPhone] = useState(initialData.user.phone || "")
  const [profileImage, setProfileImage] = useState<string | null>(initialData.user.image)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.user.image)

  const [companyName, setCompanyName] = useState(initialData.merchant.companyName || "")
  const [rib, setRib] = useState(initialData.merchant.rib || "")
  const [bankName, setBankName] = useState(initialData.merchant.bankName || "")

  const handleUserProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateUserProfile({
        name: userName,
        phone: userPhone || null,
        profileImage: profileImage || null,
      })

      if (result.success) {
        toast.success("تم تحديث البيانات الشخصية بنجاح")
      } else {
        toast.error(result.error || "حدث خطأ أثناء تحديث البيانات")
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMerchantProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateMerchantProfile({
        companyName: companyName || null,
        rib: rib || null,
        bankName: bankName || null,
      })

      if (result.success) {
        toast.success("تم تحديث معلومات الشركة بنجاح")
      } else {
        toast.error(result.error || "حدث خطأ أثناء تحديث البيانات")
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("الملف المختار ليس صورة")
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
        throw new Error(`فشل رفع الصورة: ${response.status}`)
      }

      const responseData = await response.json()
      const url = typeof responseData === 'string' ? responseData : responseData.url
      
      setProfileImage(url)

      const result = await updateUserProfile({
        name: userName,
        phone: userPhone || null,
        profileImage: url,
      })

      if (result.success) {
        toast.success("تم رفع الصورة وحفظها بنجاح")
      } else {
        toast.error(result.error || "تم رفع الصورة لكن فشل الحفظ في قاعدة البيانات")
      }
    } catch (error) {
      toast.error("فشل في رفع الصورة. حاول مرة أخرى.")
      setImagePreview(initialData.user.image)
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  const clearImage = async () => {
    setUploadingImage(true)

    try {
      const result = await updateUserProfile({
        name: userName,
        phone: userPhone || null,
        profileImage: null,
      })

      if (result.success) {
        setProfileImage(null)
        setImagePreview(null)
        toast.success("تم حذف الصورة بنجاح")
      } else {
        toast.error(result.error || "فشل حذف الصورة")
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الصورة")
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة معلوماتك الشخصية ومعلومات الشركة</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            المعلومات الشخصية
          </h2>

          <form onSubmit={handleUserProfileUpdate} className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={imagePreview || undefined} alt={userName} />
                  <AvatarFallback className="bg-[#048dba] text-white text-2xl">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600"
                    disabled={uploadingImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div>
                <Label htmlFor="profileImage" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-black hover:text-[#048dba]">
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
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploadingImage || isLoading}
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  JPG, PNG أو GIF (الحد الأقصى 5MB)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="userName">الاسم الكامل</Label>
              <Input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="userEmail">البريد الإلكتروني</Label>
              <Input
                id="userEmail"
                type="email"
                value={initialData.user.email}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
            </div>

            <div>
              <Label htmlFor="userPhone">رقم الهاتف</Label>
              <Input
                id="userPhone"
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="أدخل رقم الهاتف"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || uploadingImage}
              className="w-full bg-[#048dba] hover:bg-[#048dba]/80"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            معلومات الشركة
          </h2>

          <form onSubmit={handleMerchantProfileUpdate} className="space-y-4">
            <div>
              <Label htmlFor="companyName">اسم الشركة</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="أدخل اسم الشركة"
              />
            </div>

            <div>
              <Label htmlFor="rib">رقم الحساب البنكي (RIB)</Label>
              <Input
                id="rib"
                type="text"
                value={rib}
                onChange={(e) => setRib(e.target.value)}
                placeholder="أدخل رقم الحساب البنكي"
              />
            </div>

            <div>
              <Label htmlFor="bankName">اسم البنك</Label>
              <Input
                id="bankName"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="أدخل اسم البنك"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">الرصيد الحالي</span>
                <span className="font-semibold text-green-600">{initialData.merchant.balance.toFixed(2)} د.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">إجمالي الأرباح</span>
                <span className="font-semibold">{initialData.merchant.totalEarned.toFixed(2)} د.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">الرسوم الأساسية</span>
                <span className="font-semibold">{initialData.merchant.baseFee.toFixed(2)} د.م</span>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-[#048dba] hover:bg-[#048dba]/80">
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          الأمان وكلمة المرور
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            لتغيير كلمة المرور أو إعدادات الأمان الخاصة بك، يرجى الاتصال بالدعم الفني.
          </p>
          <Link href="/merchant/support">
            <Button variant="outline" className="w-full md:w-auto">
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              الاتصال بالدعم
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}