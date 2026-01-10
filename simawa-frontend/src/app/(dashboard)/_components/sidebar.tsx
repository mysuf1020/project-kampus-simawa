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
  FileText,
  Users,
  BarChart3,
  PenSquare,
} from 'lucide-react'
import { Avatar, AvatarFallback, Badge, Button } from '@/components/ui'
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
  { label: 'Activities', href: '/activities', icon: FolderKanban, group: 'General' },
  {
    label: 'Surat Masuk',
    href: '/surat',
    icon: Mail,
    group: 'Administrasi'
  },
  {
    label: 'Buat Surat',
    href: '/surat/create',
    icon: PenSquare,
    group: 'Administrasi'
  },
  {
    label: 'Template Surat',
    href: '/surat/templates',
    icon: FileText,
    group: 'Administrasi'
  },
  {
    label: 'LPJ & Laporan',
    href: '/lpj',
    icon: ScrollText,
    requiredRoles: ['ADMIN', 'BEM_ADMIN', 'DEMA_ADMIN'],
    group: 'Administrasi'
  },
  { label: 'Organisasi', href: '/organizations', icon: Building2, group: 'Management' },
  {
    label: 'Pengguna',
    href: '/users',
    icon: Users,
    requiredRoles: ['ADMIN', 'BEM_ADMIN', 'DEMA_ADMIN'],
    group: 'Management'
  },
  {
    label: 'Laporan Sistem',
    href: '/reports',
    icon: BarChart3,
    badge: 'New',
    requiredRoles: ['ADMIN', 'BEM_ADMIN', 'DEMA_ADMIN'],
    group: 'System'
  },
  { label: 'Pengaturan', href: '/settings', icon: Settings, group: 'System' },
]

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { user, hasAnyRole } = useRBAC()

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const groupedNavItems = NAV_ITEMS.reduce((acc, item) => {
    const group = item.group || 'General'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  return (
    <>
      {/* Header with hamburger menu - visible on ALL screen sizes */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((v) => !v)}
          className="h-10 w-10"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white text-sm font-bold shadow-md shadow-brand-500/20">
            S
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900">Simawa</div>
            <div className="text-[10px] text-neutral-500 font-medium">Backoffice</div>
          </div>
        </div>
        {/* Spacer for centering */}
        <div className="w-10" />
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
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
              <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Backoffice</p>
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
            const visibleItems = items.filter(item => !item.requiredRoles || hasAnyRole(item.requiredRoles))
            if (visibleItems.length === 0) return null

            return (
              <div key={group} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  {group}
                </h4>
                {visibleItems.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/surat' && pathname.startsWith(`${item.href}/`))
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
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent'
                      )}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0 transition-colors", active ? "text-brand-600" : "text-neutral-400 group-hover:text-neutral-600")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold bg-brand-100 text-brand-700 border-none">
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
