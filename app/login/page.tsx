import { LoginForm } from "@/components/login-form"
import { redirect } from 'next/navigation'
import { auth } from "@/auth"

export const metadata = {
  title: "تسجيل الدخول - Sonixpress",
  description: "نظام تسجيل دخول آمن للتجار والعاملين بالتوصيل",
}

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    const userRole = session.user.role
    
    if (userRole === "ADMIN") {
      redirect("/admin/dashboard")
    } else if (userRole === "DELIVERYMAN") {
      redirect("/delivery/dashboard")
    } else if (userRole === "MERCHANT") {
      redirect("/merchant/dashboard")
    }
  }

  return (

    <div className="flex min-h-screen" dir="rtl">

      {/* Left side - Banner Section */}
      <div className="hidden md:flex w-1/2 flex-col justify-between bg-gradient-to-br from-[#048dba] to-[#0570a1] p-12 text-white">
        {/* Logo and Company Name at Top */}
        <div className="flex items-center justify-start gap-3">
          <div className="rounded-full bg-white border-2 border-white p-2">
            <img src="images/logo/logo.png" className="w-12 h-12" alt="" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sonixpress</h1>
            <p className="text-sm opacity-90">خدمة التوصيل الموثوقة</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">إدارة عمليات التوصيل بكل سهولة</h2>
            <p className="text-lg opacity-90">
              منصة متكاملة تساعد المتاجر والعاملين في التوصيل على إدارة الطلبات والشحنات بكفاءة عالية
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">تتبع الطلبات في الوقت الفعلي</p>
                <p className="text-sm opacity-80">راقب جميع طلباتك وشحناتك من مكان واحد</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4.242 4.242a4 4 0 105.656 5.656l4.242-4.242a4 4 0 00-5.656-5.656l4.242 4.242"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold">إدارة فريق التوصيل</p>
                <p className="text-sm opacity-80">تخصيص الطلبات وتوزيعها على الفريق بكفاءة</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">تقارير وإحصائيات</p>
                <p className="text-sm opacity-80">احصل على تقارير شاملة لأنشطتك وربحيتك</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm opacity-75">
          <p>موثوق من قبل التجار والعاملين</p>
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 md:w-1/2">
        <LoginForm />
      </div>
    </div>
  )
}
