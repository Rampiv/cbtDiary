import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import './AuthPage.scss'
import { auth } from '../../firebase/config'
import DiaryIcon from '../../assets/image/DiaryIcon.svg'

export const AuthPage = () => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Некорректный формат email'
      case 'auth/user-not-found':
        return 'Пользователь с таким email не найден'
      case 'auth/wrong-password':
        return 'Неверный пароль'
      case 'auth/email-already-in-use':
        return 'Этот email уже зарегистрирован'
      case 'auth/weak-password':
        return 'Пароль должен содержать минимум 6 символов'
      case 'auth/invalid-credential':
        return 'Неверный email или пароль'
      case 'auth/popup-closed-by-user':
        return 'Окно авторизации было закрыто'
      default:
        return 'Произошла ошибка. Попробуйте позже.'
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)
    const provider = new GoogleAuthProvider()

    try {
      await signInWithPopup(auth, provider)
    } catch (err: any) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="auth__wrapper">
      <div className="auth__card">
        <div className={`auth__card-inner ${isFlipped ? 'auth__card-inner--flipped' : ''}`}>
          {/* ЛИЦЕВАЯ СТОРОНА — Описание */}
          <div className="auth__card-front">
            <div className="auth__front-content">
              <img src={DiaryIcon} alt="Дневник мыслей" className="auth__front-icon" />
              <h1 className="auth__front-title">Дневник мыслей</h1>
              <p className="auth__front-description">
                {/* Здесь ваше описание */}
                Место для вашего описания приложения. Расскажите пользователям, что это за дневник,
                какие возможности он предоставляет и почему им стоит попробовать.
              </p>
              <button
                type="button"
                className="auth__front-btn"
                onClick={handleFlip}
              >
                Авторизация
              </button>
            </div>
          </div>

          {/* ОБРАТНАЯ СТОРОНА — Форма авторизации */}
          <div className="auth__card-back">
            <div className="auth__back-header">
              <button
                type="button"
                className="auth__back-btn"
                onClick={handleFlip}
                aria-label="Назад"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </button>
              <h2 className="auth__back-title">
                {isLogin ? 'С возвращением!' : 'Создайте аккаунт'}
              </h2>
            </div>

            <div className="auth__tabs">
              <button
                className={isLogin ? 'auth__tab auth__tab--active' : 'auth__tab'}
                onClick={() => {
                  setIsLogin(true)
                  setError(null)
                }}
                type="button"
              >
                Вход
              </button>
              <button
                className={!isLogin ? 'auth__tab auth__tab--active' : 'auth__tab'}
                onClick={() => {
                  setIsLogin(false)
                  setError(null)
                }}
                type="button"
              >
                Регистрация
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth__form">
              <div className="auth__field">
                <label htmlFor="email" className="auth__label">
                  Email
                </label>
                <input
                  id="email"
                  className="auth__input"
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="auth__field">
                <label htmlFor="password" className="auth__label">
                  Пароль
                </label>
                <div className="auth__input-wrapper">
                  <input
                    id="password"
                    className="auth__input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth__toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="auth__error">{error}</div>}

              <button
                type="submit"
                className={`auth__submit ${loading ? 'auth__submit--loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>

            <div className="auth__divider">
              <span className="auth__divider-text">или</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              className={`auth__social-btn ${loading ? 'auth__social-btn--disabled' : ''}`}
              disabled={loading}
              type="button"
            >
              <svg className="auth__social-icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Продолжить через Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}