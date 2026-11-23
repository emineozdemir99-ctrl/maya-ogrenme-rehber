import { useEffect, useMemo, useState } from 'react'
import { api, formatDate } from '../lib/api.js'
import { Logo } from '../components/Logo.jsx'

export function TeacherDashboard({ user, onLogout }) {
  const [data, setData] = useState(null)
  const [weekData, setWeekData] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/teacher-dashboard').then(setData).catch((err) => setError(err.message))
    api('/teacher-week-progress').then(setWeekData).catch(() => {})
  }, [])

  const students = useMemo(() => {
    const query = search.toLocaleLowerCase('tr-TR')
    return (data?.students || []).filter((s) => `${s.full_name} ${s.student_no} ${s.class_name}`.toLocaleLowerCase('tr-TR').includes(query))
  }, [data, search])

  const openStudent = async (student) => {
    setSelected(student)
    setHistory([])
    setHistoryLoading(true)
    try {
      const result = await api(`/teacher-history?studentId=${encodeURIComponent(student.id)}`)
      setHistory(result.messages)
    } catch (err) {
      setError(err.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Logo />
        <nav><a className="active" href="#genel">⌂ <span>Genel Bakış</span></a><a href="#ogrenciler">♙ <span>Öğrenciler</span></a></nav>
        <div className="sidebar-user"><div className="avatar">{user.username?.[0]?.toUpperCase()}</div><div><strong>{user.username}</strong><span>Öğretmen</span></div><button onClick={onLogout} title="Çıkış">↪</button></div>
      </aside>
      <main className="dashboard-main">
        <header><div><p className="eyebrow">ÖĞRETMEN PANELİ</p><h1>Genel Bakış</h1><p>Öğrencilerinizin Maya ile öğrenme yolculuğunu izleyin.</p></div><div className="date-chip">{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date())}</div></header>
        {error && <div className="alert">{error}</div>}
        {!data ? <div className="center-note">Veriler hazırlanıyor…</div> : <>
          <section className="stats" id="genel">
            <Stat label="Toplam öğrenci" value={data.stats.totalStudents} icon="♙" />
            <Stat label="Toplam mesaj" value={data.stats.totalMessages} icon="✦" />
            <Stat label="Toplam sohbet" value={data.stats.totalConversations} icon="◌" />
            <Stat label="Bugün aktif" value={data.stats.activeToday} icon="↗" />
          </section>
          {weekData?.week && <section className="card" style={{ marginBottom: 20, padding: 20 }}>
            <h2>1. Hafta · {weekData.week.title}</h2>
            <p>Kazanım: {weekData.week.learning_outcome} · Durum: {weekData.week.is_open ? 'Açık' : 'Kapalı'}</p>
            {!weekData.configured ? <p>12 soruluk haftalık etkinlik havuzu henüz hazır değil.</p> :
              <div className="table-wrap"><table><thead><tr><th>Öğrenci no.</th><th>Sınıf</th><th>Tamamlanan</th><th>Deneme</th><th>İpucu</th><th>Bağımsız doğru*</th></tr></thead>
                <tbody>{weekData.students.map(s => <tr key={s.student_no}><td>{s.student_no}</td><td>{s.class_name}</td><td>{s.completed ?? 0}/12</td><td>{s.attempts}</td><td>{s.hints_used}</td><td>{s.independent_successes}</td></tr>)}</tbody>
              </table><p style={{ padding: 10 }}>*Yapay zekâ tarafından tahmini sınıflandırmadır; başarı testi puanı değildir.</p></div>}
          </section>}
          <section className="dashboard-grid">
            <div className="card" id="ogrenciler">
              <div className="card-heading"><div><h2>Öğrenciler</h2><p>Bir öğrencinin sohbetlerini görüntüleyin.</p></div><input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Öğrenci ara…" /></div>
              <div className="table-wrap"><table><thead><tr><th>Öğrenci</th><th>Sınıf</th><th>Mesaj</th><th>Son giriş</th><th /></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><strong>{student.full_name}</strong><span>#{student.student_no}</span></td><td><span className="class-chip">{student.class_name}</span></td><td>{student.message_count}</td><td>{formatDate(student.last_login_at)}</td><td><button className="link-button" onClick={() => openStudent(student)}>Görüntüle →</button></td></tr>)}</tbody></table>{students.length === 0 && <div className="empty">Eşleşen öğrenci bulunamadı.</div>}</div>
            </div>
            <div className="card activity-card"><div className="card-heading"><div><h2>En aktif öğrenciler</h2><p>Mesaj sayısına göre</p></div></div>{data.topStudents.map((student, index) => <div className="rank" key={student.id}><b>{index + 1}</b><div><strong>{student.full_name}</strong><span>{student.class_name}</span></div><em>{student.message_count} mesaj</em></div>)}</div>
          </section>
          <section className="card recent-card"><div className="card-heading"><div><h2>Son yapılan sohbetler</h2><p>Öğrencilerin en güncel etkileşimleri</p></div></div><div className="recent-list">{data.recentConversations.map((item) => <button key={item.id} onClick={() => openStudent(item.student)}><div className="avatar small">{item.student.full_name[0]}</div><div><strong>{item.student.full_name}</strong><span>{item.preview || 'Yeni sohbet'}</span></div><time>{formatDate(item.started_at)}</time></button>)}</div></section>
        </>}
      </main>

      {selected && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><section className="history-modal" role="dialog" aria-modal="true" aria-label={`${selected.full_name} sohbet geçmişi`}><header><div><p className="eyebrow">SOHBET GEÇMİŞİ</p><h2>{selected.full_name}</h2><p>#{selected.student_no} · {selected.class_name} · {selected.message_count} mesaj</p></div><button onClick={() => setSelected(null)} aria-label="Kapat">×</button></header><div className="history-messages">{historyLoading ? <div className="center-note">Sohbetler yükleniyor…</div> : history.length ? history.map((m) => <article className={`history-message ${m.role}`} key={m.id}><div><strong>{m.role === 'assistant' ? 'Maya' : selected.full_name}</strong><time>{formatDate(m.created_at)}</time></div><p>{m.content}</p></article>) : <div className="empty">Bu öğrencinin henüz mesajı yok.</div>}</div></section></div>}
    </div>
  )
}

function Stat({ label, value, icon }) {
  return <article className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value.toLocaleString('tr-TR')}</strong></div></article>
}
