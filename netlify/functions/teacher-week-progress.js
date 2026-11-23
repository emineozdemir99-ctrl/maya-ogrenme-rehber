import { requireAuth } from './_lib/auth.js'
import { assertDb, getSupabase } from './_lib/supabase.js'
import { errorResponse, json } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Yöntem desteklenmiyor.' })
  try {
    await requireAuth(event, 'teacher')
    const db = getSupabase()
    const week = assertDb(await db.from('maya_weeks').select('id,title,learning_outcome,is_open').eq('id', 1).maybeSingle())
    const activity = week ? assertDb(await db.from('maya_activities').select('id').eq('week_id', week.id).eq('activity_no', 1).maybeSingle()) : null
    if (!activity) return json(200, { week, students: [], configured: false })
    const students = assertDb(await db.from('students').select('id,student_no,class_name').order('student_no'))
    const progress = assertDb(await db.from('maya_progress').select('student_id,status,hints_used,updated_at').eq('activity_id', activity.id))
    const attempts = assertDb(await db.from('maya_attempts').select('student_id,is_correct,support_level').eq('activity_id', activity.id))
    const p = new Map(progress.map(x => [x.student_id, x]))
    const rows = students.map(s => {
      const a = attempts.filter(x => x.student_id === s.id)
      return { student_no: s.student_no, class_name: s.class_name,
        status: p.get(s.id)?.status || 'not_started',
        hints_used: p.get(s.id)?.hints_used || 0, attempts: a.length,
        independent_successes: a.filter(x => x.is_correct === true && x.support_level === 0).length,
        updated_at: p.get(s.id)?.updated_at || null }
    })
    return json(200, { week, configured: true, students: rows })
  } catch (error) { return errorResponse(error) }
}
