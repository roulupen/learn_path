import api from './api'

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  is_verified: boolean
  bio?: string
  profile_image?: string
  created_at: string
  last_login?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  full_name: string
  password: string
  bio?: string
}

export interface UpdateProfileRequest {
  full_name?: string
  bio?: string
  profile_image?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', {
      username,
      password,
    })
    return response.data
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/api/auth/register', userData)
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me')
    return response.data
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const response = await api.put<User>('/api/users/profile', profileData)
    return response.data
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    await api.post('/api/auth/change-password', passwordData)
  }

  async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  }
}

export const authService = new AuthService()
