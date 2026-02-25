'use client'

import { useRBAC } from '@/lib/providers/rbac-provider'
import { AccessDenied } from '@/components/access-denied'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'BEM_ADMIN', 'DEMA_ADMIN', 'ORG_ADMIN', 'ORG_*']

interface AdminGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function AdminGuard({ children, requiredRoles = ADMIN_ROLES }: AdminGuardProps) {
  const { hasAnyRole } = useRBAC()

  if (!hasAnyRole(requiredRoles)) {
    return <AccessDenied />
  }

  return <>{children}</>
}
