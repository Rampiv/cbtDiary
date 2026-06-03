import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase/config'
import { AuthPage } from './pages/AuthPage'
import { Layout, Loader } from './components'
import './App.scss'
import { DiaryPage, FAQPage, Greeting } from './pages'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <Loader />
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />

        <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" replace />}>
          <Route index element={<Greeting />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="FAQ" element={<FAQPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
