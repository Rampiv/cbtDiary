import { useLayoutEffect, useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { ref, set, get } from 'firebase/database'
import { auth, db } from '../firebase/config'
import { ThemeContext } from './ThemeContext'
import type { Theme } from './types'

// ── Синхронная инициализация темы (до первого рендера) ──────────────

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// ── Provider ────────────────────────────────────────────────────────

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [userId, setUserId] = useState<string | null>(null)
  const userIdRef = useRef(userId)
  const themeRef = useRef(theme)

  // Синхронизируем refs
  useEffect(() => { userIdRef.current = userId }, [userId])
  useEffect(() => { themeRef.current = theme }, [theme])

  // ── useLayoutEffect — синхронно до paint ──────────────────────────

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // ── toggleTheme стабилен (пустые зависимости, userId из ref) ─────

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('theme', next)

      const uid = userIdRef.current
      if (uid) {
        set(ref(db, `users/${uid}/settings/theme`), next).catch((e) =>
          console.error('Ошибка сохранения темы:', e)
        )
      }

      return next
    })
  }, [])

  // ── value стабилен через useMemo ─────────────────────────────────

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  // ── onAuthStateChanged → userId ───────────────────────────────────

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid ?? null)
    })
    return unsubAuth
  }, [])

  // ОДНОРАЗОВАЯ загрузка темы из Firebase через get().
  // Сравниваем с текущей темой через ref (не через замыкание).
  // Если Firebase отличается — синхронизируем localStorage.
  useEffect(() => {
    if (!userId) return

    get(ref(db, `users/${userId}/settings`))
      .then((snapshot) => {
        const data = snapshot.val()
        const firebaseTheme = data?.theme as Theme | null
        if (firebaseTheme !== 'light' && firebaseTheme !== 'dark') return

        if (firebaseTheme !== themeRef.current) {
          setTheme(firebaseTheme)
          localStorage.setItem('theme', firebaseTheme)
        }
      })
      .catch((error) => {
        console.error('Ошибка загрузки темы из Firebase:', error)
      })
  }, [userId])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
