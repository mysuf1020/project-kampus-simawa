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
  FileClock,
} from 'lucide-react'
import { Avatar, AvatarFallback, Badge, Button, Text } from '@/components/ui'
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

  useEffect(() => {
    if (isOpen) setIsOpen(false)
  }, [pathname, isOpen])

  const groupedNavItems = NAV_ITEMS.reduce((acc, item) => {
    const group = item.group || 'General'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const NavList = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
      {Object.entries(groupedNavItems).map(([group, items]) => {
        const visibleItems = items.filter(item => !item.requiredRoles || hasAnyRole(item.requiredRoles))
        if (visibleItems.length === 0) return null

        return (
          <div key={group} className="space-y-1">
            <h4 className="px-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              {group}
            </h4>
            {visibleItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/surat' && pathname.startsWith(`${item.href}/`))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 border',
                    active 
                      ? 'bg-brand-50 text-brand-700 border-brand-100 shadow-sm' 
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border-transparent'
                  )}
                >
                  <Icon className={cn("h-4 w-4 transition-colors", active ? "text-brand-600" : "text-neutral-400 group-hover:text-neutral-600")} />
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
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 shadow-sm md:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white text-sm font-bold shadow-md shadow-brand-500/20">
            S
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900">Simawa</div>
            <div className="text-[10px] text-neutral-500 font-medium">Backoffice</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[270px] transform flex-col border-r border-neutral-200 bg-white transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0',
          isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full md:shadow-none',
        )}
      >
        {/* Sidebar Header */}
        <div className="hidden h-16 items-center gap-3 border-b border-neutral-100 px-6 md:flex">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white text-lg font-bold shadow-lg shadow-brand-500/30">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-neutral-900 tracking-tight">SIMAWA</span>
            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Backoffice</span>
          </div>
        </div>

        {/* Navigation */}
        {NavList}

        {/* User Profile / Footer */}
        <div className="mt-auto border-t border-neutral-100 p-4 bg-neutral-50/50">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-neutral-200">
            <Avatar className="h-9 w-9 border border-neutral-100">
              <AvatarFallback className="bg-brand-100 text-brand-700 font-bold text-xs">
                {user?.username?.slice(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
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
            className="mt-2 w-full justify-start gap-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
            onClick={async () => {
              await signOut({ redirect: false })
              router.replace('/login?reason=logout')
            }}
          >
            <LogOut className="h-3.5 w-3.5" /> Keluar dari sesi
          </Button>
        </div>
      </aside>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-neutral-900/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          role="presentation"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export { Sidebar }
