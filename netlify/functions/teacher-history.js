import { requireAuth } from './_lib/auth.js'
import { assertDb, getSupabase } from './_lib/supabase.js'
import { errorResponse, httpError, json } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Bu yöntem desteklenmiyor.' })
  try {
    await requireAuth(event, 'teacher')
    const studentId = event.queryStringParameters?.studentId
    if (!studentId) throw httpError(400, 'Öğrenci seçilmedi.')
    const supabase = getSupabase()
    const student = assertDb(await supabase.from('students').select('id').eq('id', studentId).maybeSingle())
    if (!student) throw httpError(404, 'Öğrenci bulunamadı.')
    const conversations = assertDb(await supabase.from('conversations').select('id').eq('student_id', studentId))
    if (!conversations.length) return json(200, { messages: [] })
    const messages = assertDb(await supabase.from('messages').select('id, conversation_id, role, content, created_at').in('conversation_id', conversations.map((c) => c.id)).order('created_at', { ascending: true }))
    return json(200, { messages })
  } catch (error) {
    return errorResponse(error)
  }
}
