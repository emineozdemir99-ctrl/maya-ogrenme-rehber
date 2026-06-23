import { SignJWT, jwtVerify } from 'jose'
import { httpError } from './http.js'

function secret() {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) throw new Error('JWT_SECRET en az 32 karakter olmalıdır.')
  return new TextEncoder().encode(value)
}

export async function createToken(user) {
  const lifetime = user.role === 'teacher' ? '4h' : '8h'
  return new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(lifetime)
    .setIssuer('maya-ogrenme-rehberi')
    .setAudience('maya-web')
    .sign(secret())
}

export async function requireAuth(event, requiredRole) {
  const header = event.headers.authorization || event.headers.Authorization || ''
  if (!header.startsWith('Bearer ')) throw httpError(401, 'Oturumunuz geçersiz. Lütfen yeniden giriş yapın.')
  try {
    const { payload } = await jwtVerify(header.slice(7), secret(), {
      issuer: 'maya-ogrenme-rehberi',
      audience: 'maya-web',
    })
    if (requiredRole && payload.role !== requiredRole) throw httpError(403, 'Bu işlem için yetkiniz yok.')
    return { id: payload.sub, role: payload.role, name: payload.name }
  } catch (error) {
    if (error.statusCode) throw error
    throw httpError(401, 'Oturumunuzun süresi doldu. Lütfen yeniden giriş yapın.')
  }
}
