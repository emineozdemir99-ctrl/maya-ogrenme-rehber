import { useEffect, useRef, useState } from 'react'
import { api, formatDate } from '../lib/api.js'
import { Logo } from '../components/Logo.jsx'

const WELCOME = { role: 'assistant', content: 'Merhaba! Ben Maya. Bugün hangi matematik konusu üzerine düşünmek istersin? Birlikte adım adım ilerleyebiliriz. 🌱' }

export function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    api('/chat-history').then((data) => {
      setConversationId(data.conversationId)
      setMessages(data.messages.length ? data.messages : [WELCOME])
    }).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, sending])

  const send = async (event) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setError('')
    setMessages((current) => [...current, { role: 'user', content, created_at: new Date().toISOString() }])
    setSending(true)
    try {
      const data = await api('/chat', { method: 'POST', body: JSON.stringify({ content, conversationId }) })
      setConversationId(data.conversationId)
      setMessages((current) => [...current, data.message])
    } catch (err) {
      setError(err.message)
      setMessages((current) => current.filter((message, index) => !(index === current.length - 1 && message.role === 'user' && message.content === content)))
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="app-shell chat-shell">
      <header className="topbar">
        <Logo />
        <div className="topbar__user"><div className="avatar">{user.fullName?.[0]}</div><div><strong>{user.fullName}</strong><span>{user.className}</span></div><button className="ghost-button" onClick={onLogout}>Çıkış</button></div>
      </header>
      <main className="chat-main">
        <div className="chat-heading"><div className="maya-avatar">M</div><div><h1>Maya ile Matematik</h1><p><span className="online-dot" /> Düşünmeye hazırım</p></div></div>
        <section className="messages" aria-live="polite">
          {loading && <div className="center-note">Sohbetin hazırlanıyor…</div>}
          {!loading && messages.map((message, index) => (
            <article className={`message message--${message.role}`} key={`${message.created_at || 'welcome'}-${index}`}>
              {message.role === 'assistant' && <div className="message-avatar">M</div>}
              <div><div className="message-bubble">{message.content}</div>{message.created_at && <time>{formatDate(message.created_at)}</time>}</div>
            </article>
          ))}
          {sending && <article className="message message--assistant"><div className="message-avatar">M</div><div className="message-bubble typing"><i /><i /><i /></div></article>}
          <div ref={bottomRef} />
        </section>
        <div className="composer-wrap">
          {error && <div className="alert" role="alert">{error}</div>}
          <form className="composer" onSubmit={send}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) } }} placeholder="Bir matematik sorusu yaz…" rows="1" maxLength={2000} disabled={sending} aria-label="Mesaj" />
            <button disabled={sending || !input.trim()} aria-label="Gönder">➜</button>
          </form>
          <p>Maya sana ipuçları verir; çözümü sen keşfedersin.</p>
        </div>
      </main>
    </div>
  )
}
