import { requireAuth } from './_lib/auth.js'
import { assertDb, getSupabase } from './_lib/supabase.js'
import { errorResponse, json } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Yöntem desteklenmiyor.' })
  try {
    await requireAuth(event, 'teacher')
    const db = getSupabase()
    const week = assertDb(await db.from('maya_weeks').select('id,title,learning_outcome,is_open').eq('id', 1).maybeSingle())
    const activities = week ? assertDb(await db.from('maya_activities').select('id,activity_no,answer_key').eq('week_id',week.id).order('activity_no')) : []
    const configured = activities.length === 12 && activities.every(a=>a.answer_key?.mode==='curated')
    if (!configured) return json(200,{week,students:[],configured:false})
    const students = assertDb(await db.from('students').select('id,student_no,class_name').order('student_no'))
    const ids = activities.map(a=>a.id)
    const progress = assertDb(await db.from('maya_progress').select('student_id,activity_id,status,hints_used,updated_at').in('activity_id',ids))
    const attempts = assertDb(await db.from('maya_attempts').select('student_id,activity_id,is_correct,support_level').in('activity_id',ids))
    const rows = students.map(s=>{
      const p = progress.filter(x=>x.student_id===s.id)
      const a = attempts.filter(x=>x.student_id===s.id)
      return {student_no:s.student_no,class_name:s.class_name,
        completed:p.filter(x=>x.status==='completed').length,
        status:p.some(x=>x.status==='in_progress')?'in_progress':p.length?'completed':'not_started',
        hints_used:p.reduce((n,x)=>n+(x.hints_used||0),0),
        attempts:a.length,
        independent_successes:a.filter(x=>x.is_correct===true&&x.support_level===0).length,
        updated_at:p.reduce((v,x)=>!v||x.updated_at>v?x.updated_at:v,null)}
    })
    return json(200,{week,configured:true,students:rows,totalActivities:activities.length})
  } catch (error) { return errorResponse(error) }
}
