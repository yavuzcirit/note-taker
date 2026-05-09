import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service'
import { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies } from '../lib/cookie'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = registerSchema.parse(req.body)
    const { accessToken, refreshToken } = await authService.register(email, password, name)
    setAccessTokenCookie(res, accessToken)
    setRefreshTokenCookie(res, refreshToken)
    res.status(201).json({ message: 'Registered successfully' })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const { accessToken, refreshToken } = await authService.login(email, password)
    setAccessTokenCookie(res, accessToken)
    setRefreshTokenCookie(res, refreshToken)
    res.json({ message: 'Logged in successfully' })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token' })
      return
    }
    const tokens = await authService.refresh(refreshToken)
    setAccessTokenCookie(res, tokens.accessToken)
    setRefreshTokenCookie(res, tokens.refreshToken)
    res.json({ message: 'Token refreshed' })
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.cookies?.refresh_token)
    clearAuthCookies(res)
    res.json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id)
    res.json(user)
  } catch (err) {
    next(err)
  }
}
