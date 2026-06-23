import { useState } from 'react'
import { api, isDemoMode } from '../lib/api.js'
import { Logo } from '../components/Logo.jsx'

export function Login({ onLogin }) {
  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api('/auth-login', {
        method: 'POST',
        body: JSON.stringify({ role, identifier: identifier.trim(), password }),
      })
      onLogin(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <Logo />
        <div className="hero-copy">
          <span className="eyebrow">MATEMATİĞİ KEŞFET</span>
          <h1>Her soru, yeni bir düşünme yolu.</h1>
          <p>Maya cevabı söylemek yerine doğru sorularla kendi çözümünü bulmana eşlik eder.</p>
          <div className="math-orbit" aria-hidden="true"><span>π</span><span>÷</span><span>∑</span><span>△</span></div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-logo"><Logo /></div>
          <p className="eyebrow">HOŞ GELDİN</p>
          <h2>Öğrenmeye devam edelim</h2>
          <p className="muted">Hesabına giriş yap ve Maya’yla düşünmeye başla.</p>

          <div className="role-switch" role="tablist" aria-label="Giriş türü">
            <button className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')} type="button">Öğrenci</button>
            <button className={role === 'teacher' ? 'active' : ''} onClick={() => setRole('teacher')} type="button">Öğretmen</button>
          </div>

          {isDemoMode && <div className="demo-note"><strong>Demo modu</strong><span>{role === 'student' ? 'Öğrenci: 101 · Şifre: 1234' : 'Öğretmen: ogretmen · Şifre: Maya2026!'}</span></div>}

          <form onSubmit={submit}>
            <label>{role === 'student' ? 'Öğrenci numarası' : 'Kullanıcı adı'}
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={role === 'student' ? 'Örn. 101' : 'Kullanıcı adınız'} autoComplete="username" required maxLength={50} />
            </label>
            <label>Şifre
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required maxLength={100} />
            </label>
            {error && <div className="alert" role="alert">{error}</div>}
            <button className="primary-button" disabled={loading}>{loading ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
          </form>
          <p className="privacy-note">Giriş bilgileriniz yalnızca okul hesabınızı doğrulamak için kullanılır.</p>
        </div>
      </section>
    </main>
  )
}
