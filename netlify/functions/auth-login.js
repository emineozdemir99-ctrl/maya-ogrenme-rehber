import bcrypt from 'bcryptjs'
import { createToken } from './_lib/auth.js'
import { assertDb, getSupabase } from './_lib/supabase.js'
import { errorResponse, httpError, json, parseBody } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Bu yöntem desteklenmiyor.' })
  try {
    const body = parseBody(event)
    if (!body) throw httpError(400, 'Geçersiz istek.')
    const { role, identifier, password } = body
    if (!['student', 'teacher'].includes(role) || typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
      throw httpError(400, 'Tüm alanları doldurun.')
    }
    if (identifier.length > 50 || password.length > 100) throw httpError(400, 'Giriş bilgileri çok uzun.')

    const supabase = getSupabase()
    const table = role === 'student' ? 'students' : 'teachers'
    const field = role === 'student' ? 'student_no' : 'username'
    const columns = role === 'student' ? 'id, student_no, full_name, password, class_name' : 'id, username, password'
    const record = assertDb(await supabase.from(table).select(columns).eq(field, identifier.trim()).maybeSingle())
    const valid = record && await bcrypt.compare(password, record.password)
    if (!valid) throw httpError(401, 'Giriş bilgileri eşleşmedi.')

    await supabase.from(table).update({ last_login_at: new Date().toISOString() }).eq('id', record.id)
    const token = await createToken({ id: record.id, role, name: role === 'student' ? record.full_name : record.username })
    const user = role === 'student'
      ? { id: record.id, role, studentNo: record.student_no, fullName: record.full_name, className: record.class_name }
      : { id: record.id, role, username: record.username }
    return json(200, { token, user })
  } catch (error) {
    return errorResponse(error)
  }
}
