import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { ref, onValue, get } from 'firebase/database'
import { auth, db } from './firebase/config'
import { AuthPage } from './pages/AuthPage'
import { Layout, Loader } from './components'
import './App.scss'
import {
  DiaryPage,
  FAQPage,
  HelpfulPage,
  ProfilePage,
  PrivacyPage,
  CognitiveDistortionsPage,
} from './pages'
import type { DiaryPage as DiaryPageType } from './types/diary'
import { PagesContext } from './contexts/PagesContext'
import { ThemeProvider } from './contexts'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<DiaryPageType[]>([])
  const [hasFetched, setHasFetched] = useState(false)

  // Авторизация

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Загрузка списка страниц

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация state при смене пользователя
      setPages([])
      setHasFetched(false)
      return
    }

    const pagesRef = ref(db, `users/${user.uid}/diary`)

    // Начальная загрузка (дождётся данных)
    get(pagesRef)
      .then((snapshot) => {
        const data = snapshot.val()
        if (data) {
          const pagesList = Object.entries(data)
            .map(([id, pageData]) => ({ ...(pageData as DiaryPageType), id }))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
          setPages(pagesList)
        } else {
          setPages([])
        }
        setHasFetched(true)
      })
      .catch((error) => {
        console.error('Ошибка загрузки страниц:', error)
        setHasFetched(true)
      })

    // Подписка на обновления
    const unsubscribe = onValue(
      pagesRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const pagesList = Object.entries(data)
            .map(([id, pageData]) => ({ ...(pageData as DiaryPageType), id }))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
          setPages(pagesList)
        } else {
          setPages([])
        }
      },
      (error) => {
        console.error('Ошибка загрузки страниц:', error)
      }
    )

    return () => unsubscribe()
  }, [user])

  // Сортировка для ProfilePage

  const sortedPages = [...pages].sort(
    (a, b) => (b.updatedAt || a.createdAt) - (a.updatedAt || a.createdAt)
  )

  if (loading) {
    return <Loader />
  }

  return (
    <Router>
      <ThemeProvider>
        <PagesContext.Provider value={{ pages, hasFetched, refreshPages: () => {} }}>
          <Routes>
            <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />

            <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" replace />}>
              <Route index element={<DiaryPage />} />
              <Route path="FAQ" element={<FAQPage />} />
              <Route
                path="profile"
                element={<ProfilePage pages={pages} sortedPages={sortedPages} />}
              />
              <Route path="helpful" element={<HelpfulPage />} />
              <Route path="helpful/cognitive-distortions" element={<CognitiveDistortionsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
            </Route>
          </Routes>
        </PagesContext.Provider>
      </ThemeProvider>
    </Router>
  )
}

export default App
