// components/dashboard-layout-wrapper.tsx
import { DashboardLayout } from "@/components/dashboard-layout"
import { getCurrentUserData } from "@/lib/actions/user.actions"
import { getCurrentUser } from "@/lib/actions/auth-actions"
import { redirect } from 'next/navigation'

export async function DashboardLayoutWrapper({
  children,
  userRole,
  expectedRole,
}: {
  children: React.ReactNode
  userRole: string
  expectedRole?: "ADMIN" | "MERCHANT" | "DELIVERYMAN"
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    // Redirect to login instead of showing 404
    redirect("/login")
  }

  if (expectedRole && user.role !== expectedRole) {
    // Redirect to appropriate dashboard based on actual user role
    if (user.role === "ADMIN") {
      redirect("/admin/dashboard")
    } else if (user.role === "DELIVERYMAN") {
      redirect("/delivery/dashboard")
    } else if (user.role === "MERCHANT") {
      redirect("/merchant/dashboard")
    } else {
      redirect("/login")
    }
  }

  const result = await getCurrentUserData()
  const userData = result.success ? result.data : null

  return (
    <DashboardLayout 
      userRole={userRole}
      userData={userData ? {
        name: userData.name,
        email: userData.email,
        image: userData.image,
      } : undefined}
    >
      {children}
    </DashboardLayout>
  )
}