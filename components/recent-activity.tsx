import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const activities = [
  {
    user: "محمد أحمد",
    action: "سجل حضور",
    time: "منذ 5 دقائق",
    avatar: "مأ",
    type: "attendance",
  },
  {
    user: "فاطمة علي",
    action: "أضافت عملية بيع جديدة",
    time: "منذ 15 دقيقة",
    avatar: "فع",
    type: "sale",
  },
  {
    user: "خالد محمود",
    action: "حدّث بيانات عميل",
    time: "منذ 30 دقيقة",
    avatar: "خم",
    type: "update",
  },
  {
    user: "سارة حسن",
    action: "صدّرت تقرير الرواتب",
    time: "منذ ساعة",
    avatar: "سح",
    type: "report",
  },
  {
    user: "عمر يوسف",
    action: "سجل حضور",
    time: "منذ ساعتين",
    avatar: "عي",
    type: "attendance",
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>النشاط الأخير</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary">{activity.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.user}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
