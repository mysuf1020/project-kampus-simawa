'use client'

import { ReactNode } from 'react'
import { useRBAC } from '@/lib/providers/rbac-provider'
import { Forbidden } from '@/components/ui/customized/forbidden'

// Role constants matching backend
export const ROLE_ADMIN = 'ADMIN'
export const ROLE_BEM_ADMIN = 'BEM_ADMIN'
export const ROLE_DEMA_ADMIN = 'DEMA_ADMIN'
export const ROLE_ORG_ADMIN = 'ORG_ADMIN'
export const ROLE_USER = 'USER'

// Admin roles that can access sensitive pages
export const ADMIN_ROLES = [ROLE_ADMIN, ROLE_BEM_ADMIN, ROLE_DEMA_ADMIN]

// Roles that can approve (BEM only)
export const APPROVE_ROLES = [ROLE_ADMIN, ROLE_BEM_ADMIN]

type RoleGuardProps = {
  children: ReactNode
  allowedRoles: string[]
  fallback?: ReactNode
  showForbidden?: boolean
}

/**
 * RoleGuard component to protect content based on user roles.
 * If user doesn't have any of the allowed roles, shows Forbidden page or custom fallback.
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  showForbidden = true,
}: RoleGuardProps) {
  const { hasAnyRole, isAuthenticated } = useRBAC()

  // If not authenticated, don't render anything (middleware handles redirect)
  if (!isAuthenticated) {
    return null
  }

  // Check if user has any of the allowed roles
  if (!hasAnyRole(allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>
    }
    if (showForbidden) {
      return <Forbidden />
    }
    return null
  }

  return <>{children}</>
}

/**
 * AdminGuard - shortcut for admin-only pages (ADMIN, BEM_ADMIN, DEMA_ADMIN)
 */
export function AdminGuard({ children, fallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={ADMIN_ROLES} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * ApproverGuard - shortcut for pages that require approval permission (ADMIN, BEM_ADMIN only)
 */
export function ApproverGuard({ children, fallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={APPROVE_ROLES} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Hook to check if current user can approve items
 */
export function useCanApprove(): boolean {
  const { hasAnyRole } = useRBAC()
  return hasAnyRole(APPROVE_ROLES)
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin(): boolean {
  const { hasAnyRole } = useRBAC()
  return hasAnyRole(ADMIN_ROLES)
}
