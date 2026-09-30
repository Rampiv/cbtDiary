import { useState, useEffect } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import { auth, db } from '../../firebase/config'
import { ToastPortal } from '../../components'
import type { DiaryPage } from '../../types/diary'
import './ProfilePage.scss'
import { generateAllPagesDocx, generatePageDocx } from '../../utils/docxGenerator'
import { encryptData, decryptData } from '../../utils/crypto'

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

  // Состояние шифрования
  const [encryptionEnabled, setEncryptionEnabled] = useState(false)
  const [encryptionPassword, setEncryptionPassword] = useState('')
  const [confirmEncryptionPassword, setConfirmEncryptionPassword] = useState('')
  const [showEncryptionPassword, setShowEncryptionPassword] = useState(false)
  const [isReEncrypting, setIsReEncrypting] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisablePassword, setShowDisablePassword] = useState(false)

  // Загрузка состояния шифрования
  useEffect(() => {
    const saved = localStorage.getItem('encryptionEnabled')
    if (saved === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEncryptionEnabled(true)
    }
    // Загружаем пароль шифрования из localStorage
    const savedPassword = localStorage.getItem('encryptionPassword')
    if (savedPassword) {
      setEncryptionPassword(savedPassword)
    }
  }, [])

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

      // Если шифрование включено, перешифровываем данные
      if (encryptionEnabled && encryptionPassword) {
        await handleReEncryptPages(encryptionPassword, newPassword)
        setEncryptionPassword(newPassword)
      }

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

  // Включение шифрования
  const handleEnableEncryption = async () => {
    if (encryptionPassword.length < 6) {
      setToast({ message: 'Пароль должен содержать минимум 6 символов', type: 'error' })
      return
    }

    if (encryptionPassword !== confirmEncryptionPassword) {
      setToast({ message: 'Пароли не совпадают', type: 'error' })
      return
    }

    // Проверяем пароль через Firebase
    if (!user?.email) return
    try {
      const credential = EmailAuthProvider.credential(user.email, encryptionPassword)
      await reauthenticateWithCredential(user, credential)

      // Пароль верный, включаем шифрование
      setEncryptionEnabled(true)
      localStorage.setItem('encryptionEnabled', 'true')
      localStorage.setItem('encryptionPassword', encryptionPassword)
      setToast({ message: 'Шифрование включено', type: 'success' })
      setEncryptionPassword(encryptionPassword) // сохраняем в state
      setConfirmEncryptionPassword('')
    } catch {
      setToast({ message: 'Неверный пароль от аккаунта', type: 'error' })
    }
  }

  // Выключение шифрования с перешифровкой данных
  const handleDisableEncryption = async () => {
    if (!encryptionEnabled || !disablePassword) {
      setToast({ message: 'Введите пароль для расшифровки', type: 'error' })
      return
    }

    setIsReEncrypting(true)
    try {
      // Проверяем пароль
      if (!user?.email) return
      const credential = EmailAuthProvider.credential(user.email, disablePassword)
      await reauthenticateWithCredential(user, credential)

      // Расшифровываем все зашифрованные страницы
      const decryptedPages: DiaryPage[] = []

      for (const page of pages) {
        if (page._encrypted) {
          const decryptedPage = (await decryptData(
            page._encrypted.encrypted,
            page._encrypted.salt,
            page._encrypted.iv,
            disablePassword
          )) as DiaryPage
          decryptedPages.push(decryptedPage)
        } else {
          decryptedPages.push(page)
        }
      }

      // Сохраняем расшифрованные данные
      for (const decryptedPage of decryptedPages) {
        const pageRef = ref(db, `users/${user.uid}/diary/${decryptedPage.id}`)
        await set(pageRef, {
          ...decryptedPage,
          updatedAt: Date.now(),
        })
      }

      // Выключаем шифрование
      setEncryptionEnabled(false)
      localStorage.setItem('encryptionEnabled', 'false')
      localStorage.removeItem('encryptionPassword')
      setEncryptionPassword('')
      setDisablePassword('')
      setToast({ message: 'Шифрование отключено, данные расшифрованы', type: 'success' })
    } catch {
      setToast({ message: 'Неверный пароль или ошибка при расшифровке', type: 'error' })
    } finally {
      setIsReEncrypting(false)
    }
  }

  // Перешифрование данных при смене пароля
  const handleReEncryptPages = async (oldPassword: string, newPassword: string) => {
    setIsReEncrypting(true)
    try {
      const updatedPages: DiaryPage[] = []

      for (const page of pages) {
        // Расшифровываем старыми данными
        if (page._encrypted) {
          const decryptedPage = (await decryptData(
            page._encrypted.encrypted,
            page._encrypted.salt,
            page._encrypted.iv,
            oldPassword
          )) as DiaryPage

          // Шифруем новым паролем
          const { encrypted, salt, iv } = await encryptData(decryptedPage, newPassword)

          updatedPages.push({
            ...decryptedPage,
            _encrypted: { encrypted, salt, iv, version: 1 },
            resource: null,
            situation: null,
            thoughts: [],
            thoughtWorks: [],
          })
        } else {
          updatedPages.push(page)
        }
      }

      // Сохраняем перешифрованные данные
      for (const updatedPage of updatedPages) {
        const pageRef = ref(db, `users/${user?.uid}/diary/${updatedPage.id}`)
        await set(pageRef, updatedPage)
      }

      setToast({ message: 'Данные перешифрованы', type: 'success' })
    } catch {
      setToast({ message: 'Ошибка перешифрования данных', type: 'error' })
    } finally {
      setIsReEncrypting(false)
    }
  }

  const handleDownloadPage = async (page: DiaryPage, index: number) => {
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

      {/* Шифрование данных */}
      <section className="profile-page__section">
        <h2 className="profile-page__section-title">Шифрование данных</h2>
        <div className="profile-page__encryption-info">
          <p>
            Включите шифрование для защиты ваших записей. Данные будут зашифрованы на вашем устройстве
            и недоступны даже администратору приложения.
          </p>
          <p className="profile-page__warning">
            ⚠️ Если вы забудете пароль, данные будут потеряны безвозвратно.
          </p>
        </div>

        {!encryptionEnabled && (
          <div className="profile-page__encryption-form">
            <div className="profile-page__field">
              <label className="profile-page__label">Пароль от аккаунта</label>
              <div className="profile-page__input-wrapper">
                <input
                  type={showEncryptionPassword ? 'text' : 'password'}
                  className="profile-page__input"
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  placeholder="Введите пароль от аккаунта"
                  disabled={isLoading || isReEncrypting}
                />
                <button
                  type="button"
                  className="profile-page__toggle-password"
                  onClick={() => setShowEncryptionPassword(!showEncryptionPassword)}
                >
                  {showEncryptionPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="profile-page__field">
              <label className="profile-page__label">Подтвердите пароль</label>
              <input
                type={showEncryptionPassword ? 'text' : 'password'}
                className="profile-page__input"
                value={confirmEncryptionPassword}
                onChange={(e) => setConfirmEncryptionPassword(e.target.value)}
                placeholder="Повторите пароль"
                disabled={isLoading || isReEncrypting}
              />
            </div>

            <button
              type="button"
              className="profile-page__submit profile-page__submit--encryption"
              onClick={handleEnableEncryption}
              disabled={isLoading || isReEncrypting}
            >
              {isReEncrypting ? 'Проверка...' : 'Включить шифрование'}
            </button>
          </div>
        )}

        {encryptionEnabled && (
          <div className="profile-page__encryption-status">
            <p>✅ Данные зашифрованы. Пароль для шифрования совпадает с паролем аккаунта.</p>
            <p className="profile-page__hint">
              Для смены пароля используйте форму выше — пароль шифрования обновится автоматически.
            </p>
            <div className="profile-page__disable-form">
              <div className="profile-page__field">
                <label className="profile-page__label">Пароль для расшифровки</label>
                <div className="profile-page__input-wrapper">
                  <input
                    type={showDisablePassword ? 'text' : 'password'}
                    className="profile-page__input"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Введите пароль для выключения шифрования"
                    disabled={isLoading || isReEncrypting}
                  />
                  <button
                    type="button"
                    className="profile-page__toggle-password"
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                  >
                    {showDisablePassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="profile-page__submit profile-page__submit--disable"
                onClick={handleDisableEncryption}
                disabled={isLoading || isReEncrypting || !disablePassword}
              >
                {isReEncrypting ? 'Расшифровка...' : 'Выключить шифрование'}
              </button>
            </div>
          </div>
        )}
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
