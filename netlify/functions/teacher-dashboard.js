import { requireAuth } from './_lib/auth.js'
import { assertDb, getSupabase } from './_lib/supabase.js'
import { errorResponse, json } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Bu yöntem desteklenmiyor.' })
  try {
    await requireAuth(event, 'teacher')
    const supabase = getSupabase()
    const students = assertDb(await supabase.from('students').select('id, student_no, full_name, class_name, created_at, last_login_at').order('full_name'))
    const conversations = assertDb(await supabase.from('conversations').select('id, student_id, started_at').order('started_at', { ascending: false }))
    const messages = assertDb(await supabase.from('messages').select('id, conversation_id, role, content, created_at').order('created_at', { ascending: false }))

    const conversationOwner = new Map(conversations.map((c) => [c.id, c.student_id]))
    const messageCounts = new Map()
    for (const message of messages) {
      const studentId = conversationOwner.get(message.conversation_id)
      if (studentId) messageCounts.set(studentId, (messageCounts.get(studentId) || 0) + 1)
    }
    const enrichedStudents = students.map((student) => ({ ...student, message_count: messageCounts.get(student.id) || 0 }))
    const studentsById = new Map(enrichedStudents.map((s) => [s.id, s]))
    const latestByConversation = new Map()
    for (const message of messages) if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message.content)
    const recentConversations = conversations.slice(0, 8).map((conversation) => ({
      ...conversation,
      preview: latestByConversation.get(conversation.id) || '',
      student: studentsById.get(conversation.student_id),
    })).filter((item) => item.student)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const activeToday = students.filter((student) => student.last_login_at && new Date(student.last_login_at) >= today).length

    return json(200, {
      stats: { totalStudents: students.length, totalMessages: messages.length, totalConversations: conversations.length, activeToday },
      students: enrichedStudents,
      topStudents: [...enrichedStudents].sort((a, b) => b.message_count - a.message_count).slice(0, 5),
      recentConversations,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
