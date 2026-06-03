import { useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { ToastPortal } from '../../components'
import type { DiaryPage } from '../../types/diary'
import './ProfilePage.scss'
import { generateAllPagesDocx, generatePageDocx } from '../../utils/docxGenerator'

interface ProfilePageProps {
  pages: DiaryPage[]
}

export const ProfilePage = ({ pages }: ProfilePageProps) => {
  const user = auth.currentUser
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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
    } catch (error: any) {
      const errorMessage =
        error.code === 'auth/wrong-password'
          ? 'Неверный текущий пароль'
          : error.code === 'auth/weak-password'
            ? 'Пароль слишком простой'
            : 'Ошибка смены пароля'
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPage = async (page: DiaryPage, index: number) => {
    setIsGenerating(true)
    try {
      await generatePageDocx(page, index)
      setToast({ message: 'Документ создан', type: 'success' })
    } catch (error) {
      setToast({ message: 'Ошибка создания документа', type: 'error' })
    } finally {
      setIsGenerating(false)
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
    } catch (error) {
      setToast({ message: 'Ошибка экспорта', type: 'error' })
    } finally {
      setIsGenerating(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <div className="profile-page">
      {toast && (
        <ToastPortal message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <h1 className="profile-page__title">Личный кабинет</h1>

      {/* Информация о пользователе */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Профиль</h2>
        <div className="profile-page__info">
          <div className="profile-page__info-row">
            <span className="profile-page__info-label">Email:</span>
            <span className="profile-page__info-value">{user?.email || 'Не указан'}</span>
          </div>
        </div>
      </section>

      {/* Смена пароля */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Смена пароля</h2>
        <form className="profile-page__form" onSubmit={handleChangePassword}>
          <div className="profile-page__field">
            <label className="profile-page__label">Текущий пароль</label>
            <div className="profile-page__input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="profile-page__input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="profile-page__toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="profile-page__field">
            <label className="profile-page__label">Новый пароль</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="profile-page__input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <div className="profile-page__field">
            <label className="profile-page__label">Подтвердите новый пароль</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="profile-page__input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="profile-page__submit" disabled={isLoading}>
            {isLoading ? 'Изменение...' : 'Изменить пароль'}
          </button>
        </form>
      </section>

      {/* Экспорт в PDF */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Экспорт в docx</h2>

        {pages.length === 0 ? (
          <p className="profile-page__empty">У вас пока нет записей для экспорта</p>
        ) : (
          <>
            <button
              type="button"
              className="profile-page__download-all"
              onClick={handleDownloadAll}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span>
                    Создание docx... {progress.current}/{progress.total}
                  </span>
                  <div className="profile-page__progress-bar">
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

            <div className="profile-page__pages-list">
              {pages.map((page, index) => (
                <div key={page.id} className="profile-page__page-item">
                  <div className="profile-page__page-info">
                    <span className="profile-page__page-number">Страница {index + 1}</span>
                    <span className="profile-page__page-date">
                      {new Date(page.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="profile-page__download-btn"
                    onClick={() => handleDownloadPage(page, index)}
                    disabled={isGenerating}
                  >
                    📄 Скачать
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
