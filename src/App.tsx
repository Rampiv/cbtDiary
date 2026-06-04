import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { ref, onValue } from 'firebase/database'
import { auth, db } from './firebase/config'
import { AuthPage } from './pages/AuthPage'
import { Layout, Loader } from './components'
import './App.scss'
import { DiaryPage, FAQPage, HelpfulPage, ProfilePage } from './pages'
import type { DiaryPage as DiaryPageType } from './types/diary'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<DiaryPageType[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Загрузка списка страниц для ProfilePage
  useEffect(() => {
    if (!user) {
      setPages([])
      return
    }

    const pagesRef = ref(db, `users/${user.uid}/diary`)
    const unsubscribe = onValue(pagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const pagesList = Object.values(data) as DiaryPageType[]
        setPages(pagesList.sort((a, b) => a.createdAt - b.createdAt))
      } else {
        setPages([])
      }
    })

    return () => unsubscribe()
  }, [user])

  if (loading) {
    return <Loader />
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />

        <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" replace />}>
          <Route index element={<DiaryPage />} />
          <Route path="FAQ" element={<FAQPage />} />
          <Route path="profile" element={<ProfilePage pages={pages} />} />
          <Route path="helpful" element={<HelpfulPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
