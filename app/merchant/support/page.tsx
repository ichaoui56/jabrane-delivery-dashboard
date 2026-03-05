import { DashboardLayoutWrapper } from "@/components/dashboard-layout-wrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function SupportPage() {
  const session = await auth()
  const user = session?.user

  if (!user) {
    redirect("/login")
  }

  // WhatsApp support number (replace with actual number)
  const whatsappNumber = "+212601717961" // Format: country code + number without +
  const whatsappMessage = encodeURIComponent(
    `السلام عليكم، عندي مشكل فالحساب ديالي فسيت ويب ديال SONIXPRESS.\n\nسميتي: ${user.name || "ماشي معروف"}\nالإيميل: ${user.email || "ماشي معروف"}`,
  )
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <DashboardLayoutWrapper userRole={user?.role || "MERCHANT"}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">مركز الدعم</h1>
          <p className="text-gray-600 text-base md:text-lg">
            نحن هنا لمساعدتك! تواصل معنا عبر واتساب للحصول على دعم فوري
          </p>
        </div>

        {/* Main Support Card */}
        <Card className="border-2 border-[#048dba]/20 shadow-lg">
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* WhatsApp Icon */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center shadow-xl">
                  <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                {/* Pulse animation */}
                <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 bg-[#25D366] rounded-full animate-ping opacity-20" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">تواصل معنا عبر واتساب</h2>
                <p className="text-gray-600 text-sm md:text-base max-w-2xl leading-relaxed">
                  فريق الدعم الفني متاح على مدار الساعة للإجابة على استفساراتك وحل المشكلات التقنية. انقر على الزر أدناه
                  لبدء محادثة فورية
                </p>
              </div>

              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full max-w-sm">
                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white text-base md:text-lg py-6 md:py-7 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
                  <svg className="w-6 h-6 ml-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  فتح محادثة واتساب
                </Button>
              </a>

              <p className="text-xs md:text-sm text-gray-500">
                سيتم فتح واتساب في نافذة جديدة مع رسالة تحتوي على معلومات حسابك
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Support Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* FAQ Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#048dba]/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-900">الأسئلة الشائعة</h3>
                  <p className="text-sm text-gray-600">احصل على إجابات سريعة للأسئلة الشائعة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Support Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#048dba]/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-900">البريد الإلكتروني</h3>
                  <p className="text-sm text-gray-600 break-all">deliverysonicdak@gmail.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Hours Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#048dba]/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#048dba]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-900">ساعات العمل</h3>
                  <p className="text-sm text-gray-600">متاح 24/7 للدعم الفوري</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayoutWrapper>
  )
}
