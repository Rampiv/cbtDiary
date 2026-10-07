import { useState, useEffect, useRef } from 'react'
import { ref, set } from 'firebase/database'
import { db, auth } from '../../firebase/config'
import { SaveButton } from '../../components/SaveButton/SaveButton'
import { CustomSelect } from '../../components/CustomSelect'
import { createEmptyDiaryPage } from '../../types/diary'
import './DiaryPage.scss'
import { useDiary } from '../../hook/useDiary'
import { RevealPage, ThoughtWorkPage } from './subPages'
import { ToastPortal } from '../../components'
import { usePages } from '../../contexts/PagesContext'

export const DiaryPage = () => {
  const { pages } = usePages()
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [activeThoughtId, setActiveThoughtId] = useState<string | null>(null)
  const [view, setView] = useState<'reveal' | 'thought'>('reveal')
  const [showToast, setShowToast] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevIsSavingRef = useRef<boolean>(false)
  const pageCounterRef = useRef(0)
  const createdPageRef = useRef(false)

  // Создание новой страницы
  const handleCreatePage = async () => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    pageCounterRef.current += 1
    const newId = `page-${pageCounterRef.current}`
    const newPage = createEmptyDiaryPage(newId)

    try {
      const pageRef = ref(db, `users/${userId}/diary/${newId}`)
      await set(pageRef, newPage)
      // Ждём загрузки новой страницы из Firebase
      await new Promise((resolve) => setTimeout(resolve, 300))
      // Сразу переключаемся на новую страницу
      setCurrentPageId(newId)
      setView('reveal')
      setActiveThoughtId(null)
      setContentKey((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Ошибка создания страницы:', error)
    }
  }

  // Сортируем страницы по убыванию (свежие сверху) для DiaryPage
  const sortedPages = [...pages].sort((a, b) => b.createdAt - a.createdAt)

  // Автовыбор первой страницы при загрузке записей
  useEffect(() => {
    if (pages.length > 0 && !currentPageId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- автовыбор страницы при загрузке
      setCurrentPageId(sortedPages[0].id)
    }
  }, [pages.length])

  // Автоматическое создание страницы, если её нет
  useEffect(() => {
    if (pages.length === 0 && auth.currentUser && !createdPageRef.current) {
      createdPageRef.current = true
      handleCreatePage()
    }
  }, [pages.length])

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
  } = useDiary(currentPageId || '')

  // Показ уведомления о сохранении
  useEffect(() => {
    const prevSaving = prevIsSavingRef.current
    prevIsSavingRef.current = isSaving

    if (prevSaving === true && isSaving === false && hasChanges === false) {
      setShowToast(true)
    }
  }, [isSaving, hasChanges])

  const handleDeletePage = async () => {
    if (!currentPageId) return

    const success = await deletePage()
    if (success) {
      setShowDeleteConfirm(false)
      setShowToast(true)
      // Переключаемся на последнюю созданную страницу
      if (sortedPages.length > 1) {
        const remainingPages = sortedPages.filter((p) => p.id !== currentPageId)
        if (remainingPages.length > 0) {
          setIsTransitioning(true)
          setTimeout(() => {
            setCurrentPageId(remainingPages[0].id)
            setView('reveal')
            setActiveThoughtId(null)
            setContentKey((prev) => prev + 1)
            setTimeout(() => {
              setIsTransitioning(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }, 300)
          }, 150)
        }
      }
    }
  }

  const handleSelectPage = (pageId: string) => {
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

  // Если нет страницы — показываем loader
  if (!currentPageId || !page || isPageLoading) {
    return (
      <div className="diary-page">
        <div className="diary-page__empty">
          <h2>Загрузка записи...</h2>
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
            value={currentPageId || ''}
            onChange={handleSelectPage}
            options={sortedPages.map((p, index) => ({
              value: p.id,
              label: `Страница ${sortedPages.length - index}${p.title ? ` – ${p.title}` : ''}`,
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
          className={`diary-page__thought-btn ${view === 'reveal' ? 'diary-page__thought-btn--active' : '' }`}
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
