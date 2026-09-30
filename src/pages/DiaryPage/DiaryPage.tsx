import { useState, useEffect, useRef } from 'react'
import { onValue, ref, set } from 'firebase/database'
import { db, auth } from '../../firebase/config'
import { SaveButton } from '../../components/SaveButton/SaveButton'
import type { DiaryPage as DiaryPageType } from '../../types/diary'
import { createEmptyDiaryPage } from '../../types/diary'
import './DiaryPage.scss'
import { useDiary } from '../../hook/useDiary'
import { RevealPage, ThoughtWorkPage } from './subPages'
import { ToastPortal } from '../../components'

export const DiaryPage = () => {
  const [pages, setPages] = useState<DiaryPageType[]>([])
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [activeThoughtId, setActiveThoughtId] = useState<string | null>(null)
  const [view, setView] = useState<'reveal' | 'thought'>('reveal')
  const [showToast, setShowToast] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [encryptionEnabled, setEncryptionEnabled] = useState(false)
  const [encryptionPassword, setEncryptionPassword] = useState('')
  const prevIsSavingRef = useRef<boolean>(false)
  const pageCounterRef = useRef(0)

  // Загрузка состояния шифрования
  useEffect(() => {
    const saved = localStorage.getItem('encryptionEnabled')
    if (saved === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEncryptionEnabled(true)
      const password = localStorage.getItem('encryptionPassword') || ''
      setEncryptionPassword(password)
    }
  }, [])

  // Сохранение состояния шифрования
  useEffect(() => {
    localStorage.setItem('encryptionEnabled', String(encryptionEnabled))
    if (encryptionEnabled && encryptionPassword) {
      localStorage.setItem('encryptionPassword', encryptionPassword)
    } else {
      localStorage.removeItem('encryptionPassword')
    }
  }, [encryptionEnabled, encryptionPassword])

  // Загрузка списка страниц
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const pagesRef = ref(db, `users/${userId}/diary`)
    const unsubscribe = onValue(pagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const pagesList = Object.values(data) as DiaryPageType[]
        setPages(pagesList.sort((a, b) => a.createdAt - b.createdAt))
        setCurrentPageId((currentId) => {
          if (!currentId && pagesList.length > 0) {
            return pagesList[0].id
          }
          // Если текущая страница удалена, переключаемся на первую
          if (currentId && !pagesList.find((p) => p.id === currentId)) {
            return pagesList.length > 0 ? pagesList[0].id : null
          }
          return currentId
        })
      } else {
        setPages([])
        setCurrentPageId(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const {
    page,
    hasChanges,
    isSaving,
    isPageLoading,
    updatePage,
    autoSave,
    manualSave,
    addThought,
    deleteThought,
    deletePage,
    startWorkOnThought,
    updateThoughtWork,
  } = useDiary(currentPageId || '', {
    encryptionEnabled,
    encryptionPassword,
  })

  // Показ уведомления о сохранении
  useEffect(() => {
    const prevSaving = prevIsSavingRef.current
    prevIsSavingRef.current = isSaving

    if (prevSaving === true && isSaving === false && hasChanges === false) {
      setShowToast(true)
    }
  }, [isSaving, hasChanges])

  const handleCreatePage = async () => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    pageCounterRef.current += 1
    const newId = `page-${pageCounterRef.current}`
    const newPage = createEmptyDiaryPage(newId)

    try {
      const pageRef = ref(db, `users/${userId}/diary/${newId}`)
      await set(pageRef, newPage)
      handleSelectPage(newId)
    } catch (error) {
      console.error('Ошибка создания страницы:', error)
    }
  }

  const handleDeletePage = async () => {
    if (!currentPageId) return

    const success = await deletePage()
    if (success) {
      setShowDeleteConfirm(false)
      setShowToast(true)
    }
  }

  const handleSelectPage = (pageId: string) => {
    // Запускаем transition
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPageId(pageId)
      setView('reveal')
      setActiveThoughtId(null)
      setContentKey((prev) => prev + 1)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }, 150)
  }

  const handleStartWork = (thoughtId: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      startWorkOnThought(thoughtId)
      setActiveThoughtId(thoughtId)
      setView('thought')
      setContentKey((prev) => prev + 1)
      setTimeout(() => {
        setIsTransitioning(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300)
    }, 150)
  }

  const handleNextThought = () => {
    if (!page || !activeThoughtId) return
    const currentIndex = page.thoughts.findIndex((t) => t.id === activeThoughtId)
    if (currentIndex < page.thoughts.length - 1) {
      const nextThought = page.thoughts[currentIndex + 1]
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveThoughtId(nextThought.id)
        startWorkOnThought(nextThought.id)
        setContentKey((prev) => prev + 1)
        setTimeout(() => {
          setIsTransitioning(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 300)
      }, 150)
    }
  }

  const handleThoughtNav = (thoughtId: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveThoughtId(thoughtId)
      setView('thought')
      startWorkOnThought(thoughtId)
      setContentKey((prev) => prev + 1)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }, 150)
  }

  const handleRevealNav = () => {
    if (view === 'reveal') return
    setIsTransitioning(true)
    setTimeout(() => {
      setView('reveal')
      setActiveThoughtId(null)
      setContentKey((prev) => prev + 1)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }, 150)
  }

  if (!currentPageId || isPageLoading || !page) {
    return (
      <div className="diary-page">
        {showToast && <ToastPortal message="Сохранено" onClose={() => setShowToast(false)} />}
        <div className="diary-page__empty">
          {isPageLoading ? (
            <>
              <h2>Загрузка записи...</h2>
            </>
          ) : (
            <>
              <h2>У вас пока нет записей</h2>
              <span>
                Пожалуйста, ознакомьтесь с инструкцией по работе с дневником в разделе{' '}
                <strong>FAQ</strong>.
              </span>
              <button
                type="button"
                className="diary-page__create-btn"
                onClick={handleCreatePage}
              >
                Создать первую страницу
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="diary-page">
      {showToast && <ToastPortal message="Сохранено" onClose={() => setShowToast(false)} />}
      <div className="diary-page__top-nav">
        <div className="diary-page__top-nav-left">
          <div className="diary-page__pages-list">
            {pages.map((p, index) => (
              <button
                key={p.id}
                type="button"
                className={`diary-page__nav-btn ${
                  currentPageId === p.id ? 'diary-page__nav-btn--active' : ''
                }`}
                onClick={() => handleSelectPage(p.id)}
                title={`Страница ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button type="button" className="diary-page__nav-btn" onClick={handleCreatePage}>
            + Создать страницу
          </button>
          <button
            type="button"
            className="diary-page__nav-btn diary-page__nav-btn--delete"
            onClick={() => setShowDeleteConfirm(true)}
            title="Удалить страницу"
          >
            🗑️
          </button>
        </div>
        <SaveButton hasChanges={hasChanges} isSaving={isSaving} onClick={manualSave} />
      </div>

      {/* Модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="diary-page__modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="diary-page__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Удалить страницу?</h3>
            <p>Это действие нельзя отменить. Все данные страницы будут удалены.</p>
            <div className="diary-page__modal-actions">
              <button
                type="button"
                className="diary-page__modal-btn diary-page__modal-btn--cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="diary-page__modal-btn diary-page__modal-btn--delete"
                onClick={handleDeletePage}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="diary-page__thoughts-nav">
        <button
          type="button"
          className={`diary-page__thought-btn ${
            view === 'reveal' ? 'diary-page__thought-btn--active' : ''
          }`}
          onClick={handleRevealNav}
        >
          Выявление
        </button>
        {page?.thoughts &&
          page.thoughts.map((thought, index) => (
            <button
              key={thought.id}
              type="button"
              className={`diary-page__thought-btn ${
                activeThoughtId === thought.id ? 'diary-page__thought-btn--active' : ''
              }`}
              onClick={() => handleThoughtNav(thought.id)}
            >
              Работа: мысль {index + 1}
            </button>
          ))}
      </div>

      <div className={`diary-page__content ${isTransitioning ? 'diary-page__content--fade-out' : ''}`}>
        <div key={contentKey} className="diary-page__content-inner">
          {view === 'reveal' && (
            <RevealPage
              page={page!}
              updatePage={updatePage}
              autoSave={autoSave}
              addThought={addThought}
              deleteThought={deleteThought}
              startWorkOnThought={handleStartWork}
            />
          )}
          {view === 'thought' && activeThoughtId && (
            <ThoughtWorkPage
              page={page!}
              thoughtId={activeThoughtId}
              updateThoughtWork={updateThoughtWork}
              autoSave={autoSave}
              onNextThought={handleNextThought}
            />
          )}
        </div>
      </div>
    </div>
  )
}
