const STUDENTS = [
  { id: 'demo-101', student_no: '101', full_name: 'Ece Yılmaz', class_name: '6-A', password: '1234', last_login_at: new Date().toISOString() },
  { id: 'demo-102', student_no: '102', full_name: 'Arda Demir', class_name: '6-A', password: '1234', last_login_at: null },
  { id: 'demo-103', student_no: '103', full_name: 'Defne Kaya', class_name: '7-B', password: '1234', last_login_at: null },
]

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))
const readMessages = () => JSON.parse(localStorage.getItem('maya_demo_messages') || '[]')
const saveMessages = (messages) => localStorage.setItem('maya_demo_messages', JSON.stringify(messages))

function mayaReply(text) {
  const lower = text.toLocaleLowerCase('tr-TR')
  if (/merhaba|selam/.test(lower)) return 'Merhaba! 🌱 Bugün hangi matematik konusu üzerine düşünmek istersin?'
  if (/kesir/.test(lower)) return 'Kesirlerde önce bütünü ve eş parçaları düşünelim. Pay ve paydadan hangisi eş parça sayısını gösteriyordu?'
  if (/denklem|bilinmeyen|\bx\b/.test(lower)) return 'Güzel bir başlangıç! Bilinmeyeni yalnız bırakmak için eşitliğin iki tarafına da hangi aynı işlemi uygulayabilirsin?'
  if (/yüzde/.test(lower)) return 'Yüzdeyi “100 parçadan kaçı?” diye okuyabiliriz. Verilen miktarı önce 100 eş parçaya ayırsan bir parçayı nasıl bulurdun?'
  if (/alan|çevre/.test(lower)) return 'Önce aradığımızın alan mı çevre mi olduğunu ayıralım. Şeklin içini mi, yoksa kenarlarının toplamını mı bulmak istiyorsun?'
  if (/\d/.test(lower)) return 'Sorudaki verilenleri çok iyi yakaladın. Sence ilk adımda hangi iki bilgi arasında işlem kurmalıyız? Neden?'
  return 'Bunu birlikte küçük adımlara bölelim. Soruda bildiğin bilgiler neler, bulman istenen tam olarak ne?'
}

export async function demoApi(path, options = {}) {
  await wait()
  const body = options.body ? JSON.parse(options.body) : {}

  if (path === '/auth-login') {
    if (body.role === 'student') {
      const student = STUDENTS.find((item) => item.student_no === body.identifier && item.password === body.password)
      if (!student) throw new Error('Demo girişi için öğrenci no 101, şifre 1234 kullanın.')
      return { token: 'demo-student-token', user: { id: student.id, role: 'student', studentNo: student.student_no, fullName: student.full_name, className: student.class_name } }
    }
    if (body.identifier !== 'ogretmen' || body.password !== 'Maya2026!') throw new Error('Demo öğretmen girişi: ogretmen / Maya2026!')
    return { token: 'demo-teacher-token', user: { id: 'demo-teacher', role: 'teacher', username: 'ogretmen' } }
  }

  if (path === '/chat-history') return { conversationId: 'demo-conversation', messages: readMessages() }

  if (path === '/chat') {
    const messages = readMessages()
    const now = new Date().toISOString()
    messages.push({ id: crypto.randomUUID(), role: 'user', content: body.content, created_at: now })
    const message = { id: crypto.randomUUID(), role: 'assistant', content: mayaReply(body.content), created_at: new Date().toISOString() }
    messages.push(message)
    saveMessages(messages)
    return { conversationId: 'demo-conversation', message }
  }

  if (path === '/teacher-dashboard') {
    const messages = readMessages()
    const students = STUDENTS.map((student, index) => ({
      id: student.id,
      student_no: student.student_no,
      full_name: student.full_name,
      class_name: student.class_name,
      last_login_at: student.last_login_at,
      message_count: index === 0 ? messages.length : 0,
    }))
    return {
      stats: { totalStudents: students.length, totalMessages: messages.length, totalConversations: messages.length ? 1 : 0, activeToday: 1 },
      students,
      topStudents: students,
      recentConversations: messages.length ? [{ id: 'demo-conversation', student: students[0], started_at: messages[0].created_at, preview: messages.at(-1).content }] : [],
    }
  }

  if (path.startsWith('/teacher-history')) return { messages: readMessages() }
  throw new Error('Demo işlemi bulunamadı.')
}
