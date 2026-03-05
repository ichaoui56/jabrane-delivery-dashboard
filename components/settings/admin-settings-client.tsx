"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateAdminSettings, changeAdminPassword } from "@/lib/actions/admin/settings"
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X, AlertCircle, Mail, Key, Lock, Eye, EyeOff } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface AdminSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  admin: {
    id: number
    address: string | null
  }
}

interface AdminSettingsClientProps {
  initialData: AdminSettingsData
}

export function SettingsClient({ initialData }: AdminSettingsClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPasswordField, setShowPasswordField] = useState(false)
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [userName, setUserName] = useState(initialData.user.name)
  const [userEmail, setUserEmail] = useState(initialData.user.email)
  const [userPhone, setUserPhone] = useState(initialData.user.phone || "")
  const [address, setAddress] = useState(initialData.admin.address || "")
  const [profileImage, setProfileImage] = useState<string | null>(initialData.user.image)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.user.image)
  const [currentPassword, setCurrentPassword] = useState("")
  
  const [passwordCurrent, setPasswordCurrent] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const compressedFile = await compressImage(file, 200)

      const formData = new FormData()
      formData.append('file', compressedFile)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('فشل رفع الصورة')
      }

      const url = await response.json()
      setProfileImage(url)
      setImagePreview(url)
      
      toast.success('تم رفع الصورة بنجاح')
    } catch (error) {
      toast.error('فشل رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setImagePreview(null)
  }

  const handleEmailChange = (value: string) => {
    setUserEmail(value)
    if (value !== initialData.user.email) {
      setShowPasswordField(true)
    } else {
      setShowPasswordField(false)
      setCurrentPassword("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateAdminSettings({
        name: userName,
        email: userEmail,
        phone: userPhone || null,
        profileImage: profileImage,
        address: address || null,
        currentPassword: showPasswordField ? currentPassword : undefined,
      })

      toast.success(result.message || 'تم تحديث الملف الشخصي بنجاح')
      
      if (userEmail !== initialData.user.email) {
        toast.info("تم تغيير البريد الإلكتروني، يرجى تسجيل الدخول مرة أخرى")
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تحديث الملف الشخصي')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)

    try {
      const result = await changeAdminPassword({
        currentPassword: passwordCurrent,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      })

      toast.success(result.message || 'تم تغيير كلمة المرور بنجاح')
      
      setPasswordCurrent("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تغيير كلمة المرور')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">الملف الشخصي</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profileImage">الصورة الشخصية</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt={userName} />
                  ) : (
                    <AvatarFallback className="text-xl">
                      {userName ? userName.charAt(0).toUpperCase() : 'A'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                  />
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">الصورة الشخصية للمشرف</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="أدخل بريدك الإلكتروني"
              required
            />
            {showPasswordField && (
              <Alert className="mt-2 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  لتغيير البريد الإلكتروني، الرجاء إدخال كلمة المرور الحالية للتأكيد.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {showPasswordField && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                كلمة المرور الحالية *
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  required={showPasswordField}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                مطلوب لتغيير البريد الإلكتروني
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="أدخل رقم هاتفك"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="أدخل العنوان الكامل"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">عنوان مكتب المشرف الرئيسي</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || (showPasswordField && !currentPassword)}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          تغيير كلمة المرور
        </h2>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passwordCurrent" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              كلمة المرور الحالية *
            </Label>
            <div className="relative">
              <Input
                id="passwordCurrent"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordCurrent}
                onChange={(e) => setPasswordCurrent(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              كلمة المرور الجديدة *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">يجب أن تكون كلمة المرور 6 أحرف على الأقل</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              تأكيد كلمة المرور الجديدة *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isChangingPassword || !passwordCurrent || !newPassword || !confirmPassword}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التغيير...
                </>
              ) : (
                'تغيير كلمة المرور'
              )}
            </Button>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل</li>
                <li>تأكد من مطابقة كلمة المرور الجديدة مع تأكيد كلمة المرور</li>
                <li>يجب إدخال كلمة المرور الحالية للتأكيد</li>
              </ul>
            </AlertDescription>
          </Alert>
        </form>
      </Card>

      {showPasswordField && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            عند تغيير البريد الإلكتروني، سيتم تسجيل خروجك من النظام ويجب عليك تسجيل الدخول مرة أخرى باستخدام البريد الإلكتروني الجديد.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}