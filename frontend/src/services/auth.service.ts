import api from '@/lib/api'
import { User } from '@/types'

export async function register(email: string, password: string, name: string): Promise<void> {
  await api.post('/auth/register', { email, password, name })
}

export async function login(email: string, password: string): Promise<void> {
  await api.post('/auth/login', { email, password })
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}
