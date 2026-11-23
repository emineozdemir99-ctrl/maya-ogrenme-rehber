import { requireAuth } from './_lib/auth.js'
import { assertDb, getSupabase } from './_lib/supabase.js'
import { errorResponse, json } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Yöntem desteklenmiyor.' })
  try {
    const user = await requireAuth(event, 'student')
    const db = getSupabase()
    const week = assertDb(await db.from('maya_weeks').select('id,title,learning_outcome').eq('is_open', true).order('id').limit(1).maybeSingle())
    if (!week) return json(200, { week: null, progress: null })
    const activity = assertDb(await db.from('maya_activities').select('id').eq('week_id', week.id).eq('activity_no', 1).maybeSingle())
    if (!activity) return json(200, { week, progress: null, configured: false })
    const progress = assertDb(await db.from('maya_progress').select('status,hints_used,updated_at').eq('student_id', user.id).eq('activity_id', activity.id).maybeSingle())
    const attempts = assertDb(await db.from('maya_attempts').select('id,is_correct,support_level').eq('student_id', user.id).eq('activity_id', activity.id))
    return json(200, { week, progress, configured: true, attempts: attempts.length, independentSuccesses: attempts.filter(a => a.is_correct === true && a.support_level === 0).length })
  } catch (error) { return errorResponse(error) }
}
