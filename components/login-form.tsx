"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signInAction } from "@/lib/actions/auth-actions"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string[]; password?: string[] }>({})
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setMessage("")

    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)

    try {
      const result = await signInAction(null, formData)

      if (result.errors) {
        setErrors(result.errors)
      }

      if (result.message) {
        setMessage(result.message)
      }

      if (result.success && result.redirectUrl) {
        router.replace(result.redirectUrl)
        return
      }
    } catch (error) {
      console.error("Login error:", error)
      setMessage("حدث خطأ ما. يرجى المحاولة مرة أخرى")
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-lg">
      <CardHeader className="space-y-3 text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground">تسجيل الدخول</CardTitle>
        <CardDescription className="text-base">أدخل بيانات دخولك للوصول إلى لوحة التحكم الخاصة بك</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right block font-semibold">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className={`text-right ${errors.email ? "border-red-500" : ""} h-12 rounded-lg`}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-right block font-semibold">
              كلمة المرور
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`text-right ${errors.password ? "border-red-500" : ""} h-12 rounded-lg pr-12`}
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password[0]}</p>}
          </div>

          {message && (
            <div
              className={`p-3 text-sm rounded-lg ${message.includes("نجاح") ? "text-green-600 bg-green-50 border border-green-200" : "text-red-600 bg-red-50 border border-red-200"}`}
            >
              {message}
            </div>
          )}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" className="w-full bg-primary h-12 mt-6 text-base font-semibold rounded-lg" disabled={isLoading}>
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </CardContent>
        <CardContent className="pt-2 text-center">
          <p className="text-xs text-muted-foreground mb-4">نظام تسجيل الدخول الآمن</p>
          
        </CardContent>
      </form>
    </Card>
  )
}
