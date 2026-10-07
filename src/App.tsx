import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { ref, onValue, set } from 'firebase/database'
import { auth, db } from './firebase/config'
import { AuthPage } from './pages/AuthPage'
import { Layout, Loader } from './components'
import './App.scss'
import { DiaryPage, FAQPage, HelpfulPage, ProfilePage, PrivacyPage, CognitiveDistortionsPage } from './pages'
import type { DiaryPage as DiaryPageType } from './types/diary'
import { PagesContext } from './contexts/PagesContext'

// Theme context
type Theme = 'light' | 'dark'
interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<DiaryPageType[]>([])
  const [theme, setTheme] = useState<Theme>('light')

  // Загрузка темы из localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      // Определяем тему по системным настройкам
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Функция переключения темы
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)

    // Сохраняем тему в Firebase
    if (user) {
      set(ref(db, `users/${user.uid}/settings/theme`), newTheme)
    }
  }

  // Загрузка темы из Firebase при авторизации
  useEffect(() => {
    if (!user) return

    const settingsRef = ref(db, `users/${user.uid}/settings`)
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val()
      if (data?.theme === 'light' || data?.theme === 'dark') {
        setTheme(data.theme)
        document.documentElement.setAttribute('data-theme', data.theme)
      }
    })

    return () => unsubscribe()
  }, [user])

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация state при смене пользователя
      setPages([])
      return
    }

    const pagesRef = ref(db, `users/${user.uid}/diary`)
    const unsubscribe = onValue(pagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const pagesList = Object.values(data) as DiaryPageType[]
        // Сортируем по убыванию (свежие сверху)
        setPages(pagesList.sort((a, b) => b.createdAt - a.createdAt))
      } else {
        console.log('App no pages found')
        setPages([])
      }
    })

    return () => unsubscribe()
  }, [user])

  // Сортируем страницы для передачи в ProfilePage
  const sortedPages = pages.sort((a, b) => b.createdAt - a.createdAt)

  if (loading) {
    return <Loader />
  }

  return (
    <Router>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <PagesContext.Provider value={{ pages, refreshPages: () => {} }}>
          <Routes>
            <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />

            <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" replace />}>
              <Route index element={<DiaryPage />} />
              <Route path="FAQ" element={<FAQPage />} />
              <Route path="profile" element={<ProfilePage pages={pages} sortedPages={sortedPages} />} />
              <Route path="helpful" element={<HelpfulPage />} />
              <Route path="helpful/cognitive-distortions" element={<CognitiveDistortionsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
            </Route>
          </Routes>
        </PagesContext.Provider>
      </ThemeContext.Provider>
    </Router>
  )
}

export default App
