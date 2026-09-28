import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import './AuthPage.scss'
import { auth } from '../../firebase/config'
import DiaryIcon from '../../assets/image/DiaryIcon.svg'

export const AuthPage = () => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isResetMode, setIsResetMode] = useState(false) // Новый стейт для режима восстановления
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false) // Стейт для успешной отправки письма
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
      case 'auth/missing-email':
        return 'Введите email для восстановления'
      case 'auth/popup-closed-by-user':
        return 'Окно авторизации было закрыто'
      default:
        return 'Произошла ошибка. Попробуйте позже.'
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResetSuccess(false)
    setLoading(true)

    try {
      if (isResetMode) {
        await sendPasswordResetEmail(auth, email)
        setResetSuccess(true)
      } else if (isLogin) {
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  // Сброс режима восстановления при переключении вкладок
  const handleTabChange = (loginMode: boolean) => {
    setIsLogin(loginMode)
    setIsResetMode(false)
    setError(null)
    setResetSuccess(false)
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
                Это приложение создано для людей, которые проходят когнитивно-поведенческую терапию
                (КПТ) или занимаются самонаблюдением. Оно помогает структурировать работу с
                автоматическими мыслями, эмоциями и поведенческими реакциями — ключевыми элементами
                дневника КПТ.
              </p>
              <button type="button" className="auth__front-btn" onClick={handleFlip}>
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
                {isResetMode 
                  ? 'Восстановление пароля' 
                  : isLogin 
                    ? 'С возвращением!' 
                    : 'Создайте аккаунт'}
              </h2>
            </div>

            {/* Табы скрываем в режиме восстановления */}
            {!isResetMode && (
              <div className="auth__tabs">
                <button
                  className={isLogin ? 'auth__tab auth__tab--active' : 'auth__tab'}
                  onClick={() => handleTabChange(true)}
                  type="button"
                >
                  Вход
                </button>
                <button
                  className={!isLogin ? 'auth__tab auth__tab--active' : 'auth__tab'}
                  onClick={() => handleTabChange(false)}
                  type="button"
                >
                  Регистрация
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth__form">
              {/* Сообщение об успехе */}
              {resetSuccess && (
                <div className="auth__success">
                  Ссылка для восстановления пароля отправлена на <strong>{email}</strong>. 
                  Проверьте вашу почту (и папку "Спам").
                </div>
              )}

              {error && <div className="auth__error">{error}</div>}

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

              {/* Поле пароля скрываем в режиме восстановления */}
              {!isResetMode && (
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
                  
                  {/* Ссылка "Забыли пароль?" только на вкладке Вход */}
                  {isLogin && (
                    <button
                      type="button"
                      className="auth__forgot-password"
                      onClick={() => {
                        setIsResetMode(true)
                        setError(null)
                        setResetSuccess(false)
                      }}
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className={`auth__submit ${loading ? 'auth__submit--loading' : ''}`}
                disabled={loading}
              >
                {loading 
                  ? 'Загрузка...' 
                  : isResetMode 
                    ? 'Отправить ссылку' 
                    : isLogin 
                      ? 'Войти' 
                      : 'Зарегистрироваться'}
              </button>

              {/* Кнопка отмены восстановления */}
              {isResetMode && (
                <button
                  type="button"
                  className="auth__cancel-reset"
                  onClick={() => {
                    setIsResetMode(false)
                    setError(null)
                    setResetSuccess(false)
                  }}
                  disabled={loading}
                >
                  ← Вернуться ко входу
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}