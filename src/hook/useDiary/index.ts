import { useCallback } from 'react'
import { ref, remove } from 'firebase/database'
import { db, auth } from '../../firebase/config'
import type { DiaryPage, ThoughtWork } from '../../types/diary'
import { useDiaryPage } from './useDiaryPage'
import { useDiarySave } from './useDiarySave'
import {
  addThoughtReducer,
  deleteThoughtReducer,
  startWorkOnThoughtReducer,
  updateThoughtWorkReducer,
} from './reducers'

export const useDiary = (pageId: string) => {
  // ── Страница ─────────────────────────────────────────────────────

  const pageApi = useDiaryPage(pageId)
  const { page, isPageLoading, hasChanges, pageRef, hasChangesRef, currentPageIdRef, setPage, setHasChanges } = pageApi

  // ── Сохранение ───────────────────────────────────────────────────

  const saveApi = useDiarySave({ pageRef, hasChangesRef, currentPageIdRef, setHasChanges })
  const { isSaving, manualSave, autoSave } = saveApi

  // ── Обновление страницы (одна точка мутации) ─────────────────────

  const updatePage = useCallback((updater: (prev: DiaryPage) => DiaryPage) => {
    const prev = pageRef.current
    if (!prev) return
    if (prev.id !== currentPageIdRef.current) return

    const next = updater(prev)
    pageRef.current = next
    hasChangesRef.current = true
    setPage(next)
    setHasChanges(true)
  }, [])

  // ── Удаление страницы ────────────────────────────────────────────

  const deletePage = useCallback(async () => {
    const userId = auth.currentUser?.uid
    if (!userId || !pageId) return

    try {
      const dbPageRef = ref(db, `users/${userId}/diary/${pageId}`)
      await remove(dbPageRef)
      // Не вызываем setPage(null) — DiaryPage сам пересчитает effectivePageId
      // и useDiary перезагрузится с новым pageId
      pageRef.current = null
      hasChangesRef.current = false
      setHasChanges(false)
      return true
    } catch (error) {
      console.error('Ошибка удаления страницы:', error)
      return false
    }
  }, [pageId])

  // ── Мутации через reducers ───────────────────────────────────────

  const addThought = useCallback(() => {
    updatePage((prev) => {
      if (!prev) return prev
      return addThoughtReducer(prev)
    })
  }, [updatePage])

  const deleteThought = useCallback(
    (thoughtId: string) => {
      updatePage((prev) => {
        if (!prev) return prev
        return deleteThoughtReducer(prev, thoughtId)
      })
    },
    [updatePage]
  )

  const startWorkOnThought = useCallback(
    (thoughtId: string) => {
      updatePage((prev) => {
        if (!prev) return prev
        return startWorkOnThoughtReducer(prev, thoughtId)
      })
    },
    [updatePage]
  )

  const updateThoughtWork = useCallback(
    (thoughtId: string, updater: (work: ThoughtWork) => ThoughtWork) => {
      updatePage((prev) => {
        if (!prev) return prev
        return updateThoughtWorkReducer(prev, thoughtId, updater)
      })
    },
    [updatePage]
  )

  return {
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
  }
}
