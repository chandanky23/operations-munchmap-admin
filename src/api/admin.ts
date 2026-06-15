import { apiClient } from './client'
import type { AdminAuthResponse } from '../types'

export const adminApi = {
  /**
   * Send OTP to admin email
   */
  async login(email: string): Promise<AdminAuthResponse> {
    return apiClient.post<AdminAuthResponse>('/api/v1/admin/auth/login', { email })
  },

  /**
   * Verify OTP and get access token
   */
  async verifyOTP(email: string, otp: string, hash: string): Promise<AdminAuthResponse> {
    const response = await apiClient.post<AdminAuthResponse>('/api/v1/admin/auth/verify-otp', {
      email,
      otp,
      hash,
    })

    // Store token if successful
    if (response.data?.accessToken) {
      apiClient.setToken(response.data.accessToken)
    }

    return response
  },

  /**
   * Logout (clear token)
   */
  logout() {
    apiClient.setToken(null)
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.getToken() !== null
  },
}
