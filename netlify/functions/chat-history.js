import { requireAuth } from './_lib/auth.js'
import { assertDb, getSupabase } from './_lib/supabase.js'
import { errorResponse, json } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Bu yöntem desteklenmiyor.' })
  try {
    const user = await requireAuth(event, 'student')
    const supabase = getSupabase()
    const conversation = assertDb(await supabase.from('conversations').select('id').eq('student_id', user.id).order('started_at', { ascending: false }).limit(1).maybeSingle())
    if (!conversation) return json(200, { conversationId: null, messages: [] })
    const messages = assertDb(await supabase.from('messages').select('id, role, content, created_at').eq('conversation_id', conversation.id).order('created_at', { ascending: true }))
    return json(200, { conversationId: conversation.id, messages })
  } catch (error) {
    return errorResponse(error)
  }
}
