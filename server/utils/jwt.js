import jwt from 'jsonwebtoken'
import { db } from './db.js'
import crypto from 'crypto'

// 获取或生成 JWT 密钥
export async function getJwtSecret() {
  let setting = await db.settings.findOne({ key: 'jwtSecret' })

  if (!setting) {
    // 首次启动，生成随机密钥
    const secret = crypto.randomBytes(64).toString('hex')
    await db.settings.insert({
      key: 'jwtSecret',
      value: secret,
      createdAt: new Date()
    })
    return secret
  }

  return setting.value
}

// 生成 Token
export async function generateToken(payload) {
  const secret = await getJwtSecret()
  return jwt.sign(payload, secret, { expiresIn: '30d' })
}

// 验证 Token
export async function verifyToken(token) {
  try {
    const secret = await getJwtSecret()
    return jwt.verify(token, secret)
  } catch (error) {
    return null
  }
}

// 从请求头中提取 Token
export function extractToken(event) {
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}
