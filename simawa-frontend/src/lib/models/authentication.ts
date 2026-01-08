import { JwtPayload } from 'jwt-decode'

export type Authentication = {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
  session_id: string
}

export type ResourceAction = 'create' | 'read' | 'update' | 'delete' | 'review'

export interface Permission {
  resource: string
  actions: ResourceAction[]
}

export interface UserRoles {
  // kept for backward compatibility; the app uses string role codes in JWT now
  role_id?: string
  role_name?: string
  permissions?: Permission[]
}

export interface RoledJwtPayload extends JwtPayload {
  roles?: string[]
}
