import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { AppError } from '../middleware/error.middleware'
import { env } from '../config/env'

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new AppError(409, 'Email already in use')

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
  })

  return issueTokens(user.id, user.email)
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new AppError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'Invalid credentials')

  return issueTokens(user.id, user.email)
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string; jti: string }
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token')
  }

  const tokenHash = hashToken(refreshToken)
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token revoked or expired')
  }

  await prisma.refreshToken.delete({ where: { tokenHash } })

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true },
  })
  if (!user) throw new AppError(401, 'User not found')

  return issueTokens(user.id, user.email)
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return
  const tokenHash = hashToken(refreshToken)
  await prisma.refreshToken.deleteMany({ where: { tokenHash } }).catch(() => {})
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
  })
  if (!user) throw new AppError(404, 'User not found')
  return user
}

async function issueTokens(userId: string, email: string) {
  const jti = crypto.randomUUID()
  const accessToken = signAccessToken({ sub: userId, email })
  const refreshToken = signRefreshToken({ sub: userId, jti })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
  })

  return { accessToken, refreshToken }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
