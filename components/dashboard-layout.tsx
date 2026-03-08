"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { signOutAction } from "@/lib/actions/auth-actions"
import {
  Home,
  ShoppingBag,
  DollarSign,
  Settings,
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Package,
  Truck,
  MapPin,
  Users,
  Building2,
  Wallet,
  HelpCircle,
  Shield
} from "lucide-react"

const navigationByRole = {
  ADMIN: {
    main: [
      {
        name: "الرئيسية",
        href: "/admin/dashboard",
        icon: <Home className="w-5 h-5" />,
      },
    ],
    section: [
      {
        name: "إدارة التجار",
        href: "/admin/merchants",
        icon: <Building2 className="w-5 h-5" />,
      },
      {
        name: "إدارة عمال التوصيل",
        href: "/admin/delivery-men",
        icon: <Users className="w-5 h-5" />,
      },
      {
        name: "إدارة المدن",
        href: "/admin/cities",
        icon: <MapPin className="w-5 h-5" />,
      },
      {
        name: "إدارة الطلبات",
        href: "/admin/orders",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        name: "مخزون المستودع",
        href: "/admin/garage",
        icon: <Package className="w-5 h-5" />,
      },
      {
        name: "الشؤون المالية",
        href: "/admin/finances",
        icon: <Wallet className="w-5 h-5" />,
      },
      {
        name: "الإعدادات",
        href: "/admin/settings",
        icon: <Settings className="w-5 h-5" />,
      },
    ],
  },
  MERCHANT: {
    main: [
      {
        name: "الرئيسية",
        href: "/merchant/dashboard",
        icon: <Home className="w-5 h-5" />,
      },
    ],
    section: [
      {
        name: "الطلبات",
        href: "/merchant/orders",
        icon: <ShoppingBag className="w-5 h-5" />,
      },
      {
        name: "المدفوعات",
        href: "/merchant/payments",
        icon: <DollarSign className="w-5 h-5" />,
      },
      {
        name: "الإعدادات",
        href: "/merchant/settings",
        icon: <Settings className="w-5 h-5" />,
      },
      {
        name: "الدعم الفني",
        href: "/merchant/support",
        icon: <HelpCircle className="w-5 h-5" />,
      },
    ],
  },
  DELIVERYMAN: {
    main: [
      {
        name: "الرئيسية",
        href: "/delivery/dashboard",
        icon: <Home className="w-5 h-5" />,
      },
    ],
    section: [
      {
        name: "الطلبات المعينة",
        href: "/delivery/assigned-orders",
        icon: <Truck className="w-5 h-5" />,
      },
      {
        name: "سجل التسليم",
        href: "/delivery/history",
        icon: <Package className="w-5 h-5" />,
      },
      {
        name: "الأرباح",
        href: "/delivery/earnings",
        icon: <Wallet className="w-5 h-5" />,
      },
      {
        name: "الإعدادات",
        href: "/delivery/settings",
        icon: <Settings className="w-5 h-5" />,
      },
    ],
  },
}

// Role labels in Arabic
const roleLabels: Record<string, string> = {
  ADMIN: "مدير النظام",
  MERCHANT: "تاجر",
  DELIVERYMAN: "عامل توصيل"
}

export function DashboardLayout({
  children,
  userRole,
  userData
}: {
  children: React.ReactNode
  userRole: string
  userData?: {
    name: string | null
    email: string | null
    image: string | null
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [cachedUserData, setCachedUserData] = useState<typeof userData>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('jabrane_user_data')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return userData
        }
      }
    }
    return userData
  })

  useEffect(() => {
    if (userData && (userData.name || userData.email)) {
      setCachedUserData(userData)
      localStorage.setItem('jabrane_user_data', JSON.stringify(userData))
    }
  }, [userData])

  const roleNav = navigationByRole[userRole as keyof typeof navigationByRole] || navigationByRole.MERCHANT
  const navigation = roleNav.main
  const navigationSection = roleNav.section

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleLogout = async () => {
    try {
      await signOutAction()
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Handle search based on current section
      const currentPath = pathname.split('/')[2] // Gets the section name
      if (currentPath === 'orders') {
        router.push(`/${userRole.toLowerCase()}/orders?search=${encodeURIComponent(searchQuery)}`)
      }
    }
  }

  const userName = cachedUserData?.name || "مستخدم"
  const userEmail = cachedUserData?.email || ""
  const userInitials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const roleLabel = roleLabels[userRole] || "مستخدم"

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 z-40 transition-all duration-300 ease-in-out",
          "w-72 shadow-xl",
          isSidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex flex-col h-full transition-opacity duration-300",
            isSidebarOpen ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-white">
            <div className="flex items-center justify-center">
              <img 
                src="/images/logo/blue-logo.png" 
                alt="Jabrane Delivery" 
                className="w-48 h-auto object-contain"
              />
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs font-medium text-[#048dba] bg-[#048dba]/10 px-3 py-1 rounded-full">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Main Navigation */}
            <div>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 min-h-[44px] font-medium group",
                        isActive 
                          ? "bg-gradient-to-l from-[#048dba] to-[#037296] text-white shadow-md" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-[#048dba]",
                      )}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      <span className={cn(
                        "transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "text-gray-500 group-hover:text-[#048dba]"
                      )}>
                        {item.icon}
                      </span>
                      <span className="text-sm flex-1">{item.name}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Section Navigation */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3 px-4 uppercase tracking-wider">
                {userRole === 'MERCHANT' ? 'القائمة الرئيسية' : 'التنقل السريع'}
              </p>
              <div className="space-y-1">
                {navigationSection.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 min-h-[44px] font-medium group",
                        isActive 
                          ? "bg-gradient-to-l from-[#048dba] to-[#037296] text-white shadow-md" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-[#048dba]",
                      )}
                      onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                      <span className={cn(
                        "transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "text-gray-500 group-hover:text-[#048dba]"
                      )}>
                        {item.icon}
                      </span>
                      <span className="text-sm flex-1">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 min-h-[44px] text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium rounded-xl transition-all"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen",
          isSidebarOpen && !isMobile ? "mr-72" : "mr-0",
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Search Bar - Only show on larger screens */}
              <form onSubmit={handleSearch} className="relative flex-1 max-w-md hidden sm:block">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 bg-gray-50 border-gray-200 focus:bg-white rounded-xl"
                />
              </form>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hidden sm:flex min-h-[44px] min-w-[44px] hover:bg-gray-100 rounded-xl"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="gap-3 min-h-[44px] hover:bg-gray-100 rounded-xl px-2 sm:px-3"
                  >
                    <Avatar className="w-9 h-9 border-2 border-[#048dba]/20">
                      <AvatarImage src={cachedUserData?.image || ""} alt={userName} />
                      <AvatarFallback className="bg-gradient-to-br from-[#048dba] to-[#037296] text-white font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        {userName}
                        {userRole === 'MERCHANT' && (
                          <Shield className="w-3 h-3 text-green-500" />
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{userEmail || roleLabel}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-2 rounded-xl">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{userEmail}</p>
                      <span className="text-xs text-[#048dba] bg-[#048dba]/10 px-2 py-0.5 rounded-full inline-block w-fit mt-1">
                        {roleLabel}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2 py-2"
                    onClick={() => router.push(`/${userRole.toLowerCase()}/settings`)}
                  >
                    <User className="w-4 h-4" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2 py-2"
                    onClick={() => router.push(`/${userRole.toLowerCase()}/settings`)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>الإعدادات</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2 py-2 text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}