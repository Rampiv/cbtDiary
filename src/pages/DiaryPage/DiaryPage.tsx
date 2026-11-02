import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ref, set } from 'firebase/database'
import { db, auth } from '../../firebase/config'
import { SaveButton } from '../../components/SaveButton/SaveButton'
import { CustomSelect } from '../../components/CustomSelect'
import { createEmptyDiaryPage } from '../../types/diary'
import './DiaryPage.scss'
import { useDiary } from '../../hook/useDiary'
import { RevealPage, ThoughtWorkPage } from './subPages'
import { Loader, ToastPortal } from '../../components'
import { usePages } from '../../contexts/PagesContext'

export const DiaryPage = () => {
  const { pages, hasFetched } = usePages()
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [activeThoughtId, setActiveThoughtId] = useState<string | null>(null)
  const [view, setView] = useState<'reveal' | 'thought'>('reveal')
  const [showToast, setShowToast] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevIsSavingRef = useRef<boolean>(false)
  const manualSaveRef = useRef<(() => Promise<void>) | null>(null)
  const isCreatingRef = useRef(false)

  // ── Сортировка по createdAt (стабильная) ───────────────────────────

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    [pages]
  )

  // ── Вычисляемый ID текущей страницы ────────────────────────────────

  const effectivePageId = useMemo(() => {
    if (currentPageId && pages.some((p) => p.id === currentPageId)) {
      return currentPageId
    }
    return sortedPages[sortedPages.length - 1]?.id ?? null
  }, [currentPageId, pages, sortedPages])

  // ── Создание страницы в Firebase (только запись, без setState) ──────

  const createPageInDb = useCallback(async (): Promise<string | null> => {
    if (isCreatingRef.current) return null
    isCreatingRef.current = true
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return null
      const newId = `page-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
      const newPage = createEmptyDiaryPage(newId)
      await set(ref(db, `users/${userId}/diary/${newId}`), newPage)
      return newId
    } finally {
      isCreatingRef.current = false
    }
  }, [])

  // ── Переключение страницы с flush-сохранением ──────────────────────

  const switchToPage = useCallback(
    async (pageId: string) => {
      if (pageId === effectivePageId) return
      if (manualSaveRef.current) await manualSaveRef.current()
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentPageId(pageId)
        setView('reveal')
        setActiveThoughtId(null)
        setContentKey((prev) => prev + 1)
        setTimeout(() => {
          setIsTransitioning(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 300)
      }, 150)
    },
    [effectivePageId]
  )

  // ── Обработчик кнопки «+ Создать» ─────────────────────────────────

  const handleCreatePage = useCallback(async () => {
    try {
      const newId = await createPageInDb()
      if (newId) await switchToPage(newId)
    } catch (error) {
      console.error('Ошибка создания страницы:', error)
    }
  }, [createPageInDb, switchToPage])

  const {
    page,
    hasChanges,
    isSaving,
    updatePage,
    autoSave,
    manualSave,
    addThought,
    deleteThought,
    deletePage,
    startWorkOnThought,
    updateThoughtWork,
  } = useDiary(effectivePageId || '')

  // Сохраняем manualSave в ref для await перед переключением

  useEffect(() => {
    manualSaveRef.current = manualSave
  }, [manualSave])

  // Показ уведомления о сохранении

  useEffect(() => {
    const prevSaving = prevIsSavingRef.current
    prevIsSavingRef.current = isSaving

    if (prevSaving === true && isSaving === false && hasChanges === false) {
      setShowToast(true)
    }
  }, [isSaving, hasChanges])

  const handleDeletePage = useCallback(async () => {
    if (!effectivePageId) return
    const remainingPages = sortedPages.filter((p) => p.id !== effectivePageId)

    setShowDeleteConfirm(false)
    setShowToast(true)

    const deleted = await deletePage()
    if (!deleted) return

    // Если остались страницы — переключаемся на последнюю
    if (remainingPages.length > 0) {
      await switchToPage(remainingPages[remainingPages.length - 1].id)
    } else {
      setCurrentPageId(null)
    }
  }, [effectivePageId, sortedPages, switchToPage, deletePage])

  const handleSelectPage = useCallback(
    (pageId: string) => {
      switchToPage(pageId)
    },
    [switchToPage]
  )

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

  // ── Состояния загрузки / пустого списка ────────────────────────────

  if (!hasFetched) {
    return <Loader />
  }

  if (!page && effectivePageId) {
    return (
      <div className="diary-page">
        <div className="diary-page__empty">
          <h2>Загрузка записи...</h2>
        </div>
      </div>
    )
  }

  if (!effectivePageId) {
    return (
      <div className="diary-page">
        <div className="diary-page__empty">
          <h2>Нет записей</h2>
          <button type="button" className="diary-page__create-btn-small" onClick={handleCreatePage}>
            + Создать первую запись
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="diary-page">
      {showToast && <ToastPortal message="Сохранено" onClose={() => setShowToast(false)} />}

      {/* Верхняя панель */}
      <div className="diary-page__top-nav">
        <div className="diary-page__top-nav-left">
          {/* CustomSelect для выбора страницы */}
          <CustomSelect
            value={effectivePageId || ''}
            onChange={handleSelectPage}
            options={sortedPages.map((p, index) => ({
              value: p.id,
              label: `Страница ${index + 1}: ${p.title || 'Без названия'}`,
            }))}
            placeholder="Выберите страницу..."
          />
          <button type="button" className="diary-page__create-btn-small" onClick={handleCreatePage}>
            + Создать
          </button>
          <button
            type="button"
            className="diary-page__delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Удалить страницу
          </button>
        </div>
        {/* Кнопка сохранения — правый верхний угол */}
        <div className="diary-page__save-wrapper">
          <SaveButton hasChanges={hasChanges} isSaving={isSaving} onClick={manualSave} />
        </div>
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

      {/* Навигация по мыслям */}
      <div className="diary-page__thoughts-nav">
        <button
          type="button"
          className={`diary-page__thought-btn ${view === 'reveal' ? 'diary-page__thought-btn--active' : ''}`}
          onClick={handleRevealNav}
        >
          Выявление
        </button>
        <CustomSelect
          value={activeThoughtId || ''}
          onChange={handleThoughtNav}
          options={
            page?.thoughts
              ? page.thoughts.map((thought, index) => ({
                  value: thought.id,
                  label: `Мысль ${index + 1}`,
                }))
              : []
          }
          placeholder="Выберите мысль..."
        />
      </div>

      {/* Контент с fade-эффектом */}
      <div
        className={`diary-page__content ${isTransitioning ? 'diary-page__content--fade-out' : ''}`}
      >
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
