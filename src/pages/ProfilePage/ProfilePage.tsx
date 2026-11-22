import { useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { ToastPortal } from '../../components'
import type { DiaryPage } from '../../types/diary'
import './ProfilePage.scss'
import { generateAllPagesDocx, generatePageDocx } from '../../utils/docxGenerator'
import { useTheme } from '../../contexts'
import { CustomSelect } from '../../components/CustomSelect'

interface ProfilePageProps {
  pages: DiaryPage[]
  sortedPages: DiaryPage[]
}

export const ProfilePage = ({ pages, sortedPages }: ProfilePageProps) => {
  const user = auth.currentUser
  const { theme, toggleTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string>('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return

    if (newPassword.length < 6) {
      setToast({ message: 'Пароль должен содержать минимум 6 символов', type: 'error' })
      return
    }

    if (newPassword !== confirmPassword) {
      setToast({ message: 'Пароли не совпадают', type: 'error' })
      return
    }

    setIsLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      setToast({ message: 'Пароль успешно изменён', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const errorCode = (err as { code?: string }).code
      const errorMessage =
        errorCode === 'auth/wrong-password'
          ? 'Неверный текущий пароль'
          : errorCode === 'auth/weak-password'
            ? 'Пароль слишком простой'
            : 'Ошибка смены пароля'
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadAll = async () => {
    if (pages.length === 0) {
      setToast({ message: 'Нет страниц для экспорта', type: 'error' })
      return
    }

    setIsGenerating(true)
    setProgress({ current: 0, total: pages.length })
    try {
      await generateAllPagesDocx(pages, (current, total) => {
        setProgress({ current, total })
      })
      setToast({ message: 'Документ создан', type: 'success' })
    } catch {
      setToast({ message: 'Ошибка экспорта', type: 'error' })
    } finally {
      setIsGenerating(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const handleDownloadSelected = async () => {
    if (!selectedPageId) {
      setToast({ message: 'Выберите страницу для экспорта', type: 'error' })
      return
    }

    const page = sortedPages.find((p) => p.id === selectedPageId)
    if (!page) {
      setToast({ message: 'Страница не найдена', type: 'error' })
      return
    }

    const index = sortedPages.indexOf(page)
    setIsGenerating(true)
    try {
      await generatePageDocx(page, index)
      setToast({ message: 'Документ создан', type: 'success' })
    } catch {
      setToast({ message: 'Ошибка создания документа', type: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="profile-page" role="main" aria-label="Профиль пользователя">
      {toast && (
        <ToastPortal message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {/* Информация о пользователе */}
      <section className="profile-page__section" aria-labelledby="profile-section-title">
        <h2 id="profile-section-title" className="profile-page__section-title">Профиль</h2>
        <div className="profile-page__info">
          <div className="profile-page__info-row">
            <span className="profile-page__info-label" id="email-label">Email:</span>
            <span className="profile-page__info-value" aria-labelledby="email-label">
              {user?.email || 'Не указан'}
            </span>
          </div>
        </div>
      </section>

      {/* Тема оформления */}
      <section className="profile-page__section" aria-labelledby="theme-section-title">
        <h2 id="theme-section-title" className="profile-page__section-title">Тема оформления</h2>
        <div className="profile-page__theme-toggle">
          <label className="profile-page__toggle-label">
            <span className="profile-page__toggle-text">
              {theme === 'light' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
            </span>
            <button
              type="button"
              className={`profile-page__theme-switch ${theme === 'dark' ? 'profile-page__theme-switch--on' : ''}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Переключить тему"
            >
              <span className="profile-page__theme-switch-slider" />
            </button>
          </label>
          <p className="profile-page__hint">
            Тема сохраняется в вашем браузере и синхронизируется между устройствами.
          </p>
        </div>
      </section>

      {/* Смена пароля */}
      <section className="profile-page__section" aria-labelledby="password-section-title">
        <h2 id="password-section-title" className="profile-page__section-title">Смена пароля</h2>
        <form className="profile-page__form" onSubmit={handleChangePassword} noValidate>
          <div className="profile-page__field">
            <label className="profile-page__label" htmlFor="current-password">Текущий пароль</label>
            <div className="profile-page__input-wrapper">
              <input
                id="current-password"
                type={showPassword ? 'text' : 'password'}
                className="profile-page__input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isLoading}
                aria-required="true"
                aria-describedby="current-password-hint"
              />
              <span id="current-password-hint" className="sr-only">
                Введите текущий пароль для подтверждения
              </span>
              <button
                type="button"
                className="profile-page__toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="profile-page__field">
            <label className="profile-page__label" htmlFor="new-password">Новый пароль</label>
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              className="profile-page__input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
              aria-required="true"
              aria-describedby="new-password-hint"
            />
            <span id="new-password-hint" className="sr-only">
              Минимум 6 символов
            </span>
          </div>

          <div className="profile-page__field">
            <label className="profile-page__label" htmlFor="confirm-password">Подтвердите новый пароль</label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="profile-page__input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
              aria-required="true"
              aria-describedby="confirm-password-hint"
            />
            <span id="confirm-password-hint" className="sr-only">
              Введите пароль ещё раз
            </span>
          </div>

          <button type="submit" className="profile-page__submit" disabled={isLoading}>
            {isLoading ? 'Изменение...' : 'Изменить пароль'}
          </button>
        </form>
      </section>

      {/* Экспорт в docx */}
      <section className="profile-page__section" aria-labelledby="export-section-title">
        <h2 id="export-section-title" className="profile-page__section-title">Экспорт в docx</h2>

        {pages.length === 0 ? (
          <p className="profile-page__empty" role="status" aria-live="polite">
            У вас пока нет записей для экспорта
          </p>
        ) : (
          <>
            <button
              type="button"
              className="profile-page__download-all"
              onClick={handleDownloadAll}
              disabled={isGenerating}
              aria-label={`Скачать все страницы (${pages.length})`}
            >
              {isGenerating ? (
                <>
                  <span aria-live="polite">
                    Создание docx... {progress.current}/{progress.total}
                  </span>
                  <div className="profile-page__progress-bar" role="progressbar" aria-valuenow={progress.current} aria-valuemin={0} aria-valuemax={progress.total} aria-label="Прогресс экспорта">
                    <div
                      className="profile-page__progress-fill"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <>📥 Скачать все страницы ({pages.length})</>
              )}
            </button>

            <div className="profile-page__select-download">
              <CustomSelect
                value={selectedPageId}
                onChange={setSelectedPageId}
                options={sortedPages.map((p, index) => ({
                  value: p.id,
                  label: `Страница ${sortedPages.length - index}${p.title ? ` – ${p.title}` : ''}`,
                }))}
                placeholder="Выберите страницу..."
                aria-label="Выбор страницы для экспорта"
              />
              <button
                type="button"
                className="profile-page__download-selected"
                onClick={handleDownloadSelected}
                disabled={isGenerating || !selectedPageId}
                aria-label="Скачать выбранную страницу"
              >
                📄 Скачать выбранную
              </button>
            </div>
          </>
        )}
      </section>

      {/* Политика конфиденциальности */}
      <section className="profile-page__section profile-page__section--footer" aria-labelledby="legal-section-title">
        <h2 id="legal-section-title" className="profile-page__section-title">Правовая информация</h2>
        <a
          href="/privacy"
          className="profile-page__privacy-link"
          aria-label="Политика конфиденциальности (откроется в новой вкладке)"
        >
          📋 Политика конфиденциальности
        </a>
      </section>
    </div>
  )
}
