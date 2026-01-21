'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Menu,
  Settings,
  X,
  LucideIcon,
  FolderKanban,
  Mail,
  Building2,
  ScrollText,
  LogOut,
  Users,
  Bell,
} from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import {
  listNotifications,
  markNotificationRead,
  type Notification,
} from '@/lib/apis/notification'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { useRBAC } from '@/lib/providers/rbac-provider'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  requiredRoles?: string[]
  group?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, group: 'General' },
  { label: 'Aktivitas', href: '/activities', icon: FolderKanban, group: 'General' },
  {
    label: 'Surat',
    href: '/surat',
    icon: Mail,
    group: 'Administrasi',
  },
  {
    label: 'LPJ & Laporan',
    href: '/lpj',
    icon: ScrollText,
    group: 'Administrasi',
  },
  { label: 'Organisasi', href: '/organizations', icon: Building2, group: 'Management' },
  {
    label: 'Pengguna',
    href: '/users',
    icon: Users,
    requiredRoles: ['ADMIN', 'BEM_ADMIN', 'DEMA_ADMIN'],
    group: 'Management',
  },
  {
    label: 'Audit Log',
    href: '/audit',
    icon: ScrollText, // Or another icon like FileClock
    requiredRoles: ['ADMIN'],
    group: 'Management',
  },
  { label: 'Pengaturan', href: '/settings', icon: Settings, group: 'System' },
]

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { user, hasAnyRole } = useRBAC()

  const { data: notifications, refetch: refetchNotifications } = useQuery<Notification[]>(
    {
      queryKey: ['notifications'],
      queryFn: listNotifications,
    },
  )

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    await refetchNotifications()
  }

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const groupedNavItems = NAV_ITEMS.reduce(
    (acc, item) => {
      const group = item.group || 'General'
      if (!acc[group]) acc[group] = []
      acc[group].push(item)
      return acc
    },
    {} as Record<string, NavItem[]>,
  )

  return (
    <>
      {/* Modern Header/Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-200/80 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle menu"
            onClick={() => setIsOpen((v) => !v)}
            className="h-9 w-9 rounded-lg hover:bg-neutral-100"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-500/25">
              S
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-neutral-900 leading-tight">
                SIMAWA
              </div>
              <div className="text-[10px] text-neutral-500 font-medium -mt-0.5">
                Sistem Informasi Kemahasiswaan
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-lg hover:bg-neutral-100"
              >
                <Bell className="h-5 w-5 text-neutral-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-xl border-neutral-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="text-sm font-semibold text-neutral-900">Notifikasi</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" size="xs">
                    {unreadCount} baru
                  </Badge>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                    <Bell className="h-8 w-8 mb-2 opacity-30" />
                    <span className="text-xs">Tidak ada notifikasi</span>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => !n.read_at && handleMarkRead(n.id)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-neutral-50',
                          !n.read_at && 'bg-brand-50/40',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-1.5 h-2 w-2 rounded-full shrink-0',
                            !n.read_at ? 'bg-brand-500' : 'bg-neutral-300',
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm leading-tight',
                              !n.read_at
                                ? 'font-semibold text-neutral-900'
                                : 'font-medium text-neutral-600',
                            )}
                          >
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">
                              {n.body}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-neutral-100 bg-neutral-50/30">
                <Link href="/dashboard" className="block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                  >
                    Lihat Semua Notifikasi
                  </Button>
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Avatar */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-neutral-100 transition-colors"
          >
            <Avatar className="h-8 w-8 border-2 border-neutral-200">
              <AvatarFallback className="bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 font-bold text-xs">
                {user?.username?.slice(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium text-neutral-700 max-w-[100px] truncate">
              {user?.username || 'User'}
            </span>
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer - slides in from left */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white text-lg font-bold shadow-lg shadow-brand-500/30">
              S
            </div>
            <div>
              <span className="text-sm font-bold text-neutral-900">SIMAWA</span>
              <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                Backoffice
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
          {Object.entries(groupedNavItems).map(([group, items]) => {
            const visibleItems = items.filter(
              (item) => !item.requiredRoles || hasAnyRole(item.requiredRoles),
            )
            if (visibleItems.length === 0) return null

            return (
              <div key={group} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  {group}
                </h4>
                {visibleItems.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      item.href !== '/surat' &&
                      pathname.startsWith(`${item.href}/`))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors',
                          active
                            ? 'text-brand-600'
                            : 'text-neutral-400 group-hover:text-neutral-600',
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 text-[10px] font-semibold bg-brand-100 text-brand-700 border-none"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User Profile / Footer */}
        <div className="border-t border-neutral-100 p-3 bg-neutral-50/50">
          <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm border border-neutral-200">
            <Avatar className="h-9 w-9 shrink-0 border border-neutral-100">
              <AvatarFallback className="bg-brand-100 text-brand-700 font-bold text-xs">
                {user?.username?.slice(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {user?.username || 'Simawa User'}
              </span>
              <span className="text-[10px] text-neutral-500 truncate">
                {user?.email || 'admin@simawa.local'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full gap-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg justify-start"
            onClick={async () => {
              await signOut({ redirect: false })
              router.replace('/login?reason=logout')
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar</span>
          </Button>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
