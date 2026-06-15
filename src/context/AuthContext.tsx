import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { adminApi } from '../api'
import type { AdminUser } from '../types'

interface AuthContextType {
  adminUser: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string) => Promise<{ hash: string; message: string }>
  verifyOTP: (email: string, otp: string, hash: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const storedUser = localStorage.getItem('admin_user')
    if (storedUser && adminApi.isAuthenticated()) {
      setAdminUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string) => {
    const response = await adminApi.login(email)
    if (!response.success || !response.hash) {
      throw new Error(response.message || 'Failed to send OTP')
    }
    return {
      hash: response.hash,
      message: response.message || 'OTP sent successfully',
    }
  }

  const verifyOTP = async (email: string, otp: string, hash: string) => {
    const response = await adminApi.verifyOTP(email, otp, hash)
    if (!response.success || !response.data) {
      throw new Error('Invalid OTP')
    }

    // Store admin user
    setAdminUser(response.data.adminUser)
    localStorage.setItem('admin_user', JSON.stringify(response.data.adminUser))
  }

  const logout = () => {
    adminApi.logout()
    setAdminUser(null)
    localStorage.removeItem('admin_user')
  }

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        isLoading,
        login,
        verifyOTP,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
