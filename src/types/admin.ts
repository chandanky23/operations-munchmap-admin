export const AdminRole = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  SUPPORT: 'support',
} as const

export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole]

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface AdminAuthResponse {
  success: boolean
  message?: string
  hash?: string
  data?: {
    accessToken: string
    adminUser: AdminUser
  }
}
