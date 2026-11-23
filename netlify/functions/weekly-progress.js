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
    const activities = assertDb(await db.from('maya_activities').select('id,activity_no,answer_key').eq('week_id',week.id).order('activity_no'))
    const configured = activities.length===12 && activities.every(a=>a.answer_key?.mode==='curated')
    if (!configured) return json(200,{week,progress:null,configured:false})
    const progress = assertDb(await db.from('maya_progress').select('activity_id,status,hints_used').eq('student_id',user.id).in('activity_id',activities.map(a=>a.id)))
    const attempts = assertDb(await db.from('maya_attempts').select('id,activity_id,is_correct,support_level').eq('student_id',user.id).in('activity_id',activities.map(a=>a.id)))
    return json(200,{week,configured:true,attempts:attempts.length,
      completed:progress.filter(p=>p.status==='completed').length,
      progress:{hints_used:progress.reduce((n,p)=>n+p.hints_used,0)},
      independentSuccesses:attempts.filter(a=>a.is_correct===true && a.support_level===0).length})
  } catch (error) { return errorResponse(error) }
}
