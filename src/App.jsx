import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Login } from './pages/Login.jsx'
import { Chat } from './pages/Chat.jsx'
import { TeacherDashboard } from './pages/TeacherDashboard.jsx'

function getSession() {
  try {
    const token = localStorage.getItem('maya_token')
    const user = JSON.parse(localStorage.getItem('maya_user'))
    return token && user ? user : null
  } catch {
    return null
  }
}

function Guard({ role, user, children }) {
  return user?.role === role ? children : <Navigate to="/giris" replace />
}

export default function App() {
  const [user, setUser] = useState(getSession)
  const navigate = useNavigate()

  useEffect(() => {
    const logout = () => {
      localStorage.removeItem('maya_token')
      localStorage.removeItem('maya_user')
      setUser(null)
      navigate('/giris', { replace: true })
    }
    window.addEventListener('maya:logout', logout)
    return () => window.removeEventListener('maya:logout', logout)
  }, [navigate])

  const onLogin = (data) => {
    localStorage.setItem('maya_token', data.token)
    localStorage.setItem('maya_user', JSON.stringify(data.user))
    setUser(data.user)
    navigate(data.user.role === 'teacher' ? '/ogretmen' : '/sohbet', { replace: true })
  }

  const onLogout = () => window.dispatchEvent(new Event('maya:logout'))

  return (
    <Routes>
      <Route path="/giris" element={user ? <Navigate to={user.role === 'teacher' ? '/ogretmen' : '/sohbet'} /> : <Login onLogin={onLogin} />} />
      <Route path="/sohbet" element={<Guard role="student" user={user}><Chat user={user} onLogout={onLogout} /></Guard>} />
      <Route path="/ogretmen" element={<Guard role="teacher" user={user}><TeacherDashboard user={user} onLogout={onLogout} /></Guard>} />
      <Route path="*" element={<Navigate to={user ? (user.role === 'teacher' ? '/ogretmen' : '/sohbet') : '/giris'} replace />} />
    </Routes>
  )
}
