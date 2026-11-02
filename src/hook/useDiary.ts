import { useState, useEffect, useCallback, useRef } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { db, auth } from '../firebase/config'
import type { DiaryPage, ThoughtWork } from '../types/diary'
import { createEmptyDiaryPage, createEmptyThoughtWork } from '../types/diary'

export const useDiary = (pageId: string) => {
  const [page, setPage] = useState<DiaryPage | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageRef = useRef<DiaryPage | null>(null)
  const hasChangesRef = useRef(false)
  const currentPageIdRef = useRef<string | null>(null)

  // Сброс состояния при смене pageId

  const resetState = useCallback(() => {
    setPage(null)
    setHasChanges(false)
    setIsSaving(false)
    setIsPageLoading(false)
  }, [])

  // Загрузка данных из Firebase

  useEffect(() => {
    currentPageIdRef.current = pageId
    const userId = auth.currentUser?.uid

    if (!userId || !pageId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetState()
      pageRef.current = null
      hasChangesRef.current = false
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    setIsPageLoading(true)
    resetState()
    pageRef.current = null
    hasChangesRef.current = false

    const dbPath = `users/${userId}/diary/${pageId}`
    const pageRefDb = ref(db, dbPath)

    const unsubscribe = onValue(pageRefDb, (snapshot) => {
      if (currentPageIdRef.current !== pageId) return

      const data = snapshot.val()
      if (data) {
        const processedData = data as DiaryPage
        setPage(processedData)
        if (!hasChangesRef.current) {
          pageRef.current = processedData
          setHasChanges(false)
        }
      } else {
        const newPage = createEmptyDiaryPage(pageId)
        setPage(newPage)
        pageRef.current = newPage
        setHasChanges(false)
      }
      setIsPageLoading(false)
    }, (error) => {
      console.error(`Ошибка загрузки страницы ${pageId}:`, error)
      pageRef.current = null
      hasChangesRef.current = false
      setIsPageLoading(false)
    })

    return () => unsubscribe()
  }, [pageId, resetState])

  // Сохранение в Firebase

  const saveToFirebase = useCallback(async (data: DiaryPage, id: string) => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    setIsSaving(true)
    try {
      const dbRef = ref(db, `users/${userId}/diary/${id}`)
      const updatedData = { ...data, createdAt: data.createdAt, updatedAt: Date.now() }
      await set(dbRef, updatedData)
      hasChangesRef.current = false
      setHasChanges(false)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Ручное и мгновенное сохранение

  const manualSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (pageRef.current) {
      await saveToFirebase(pageRef.current, pageId)
    }
  }, [pageId, saveToFirebase])

  const autoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (hasChangesRef.current && pageRef.current) {
      hasChangesRef.current = false
      saveToFirebase(pageRef.current, pageId)
    }
  }, [pageId, saveToFirebase])

  // Обновление страницы

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

  // Удаление страницы

  const deletePage = useCallback(async () => {
    const userId = auth.currentUser?.uid
    if (!userId || !pageId) return

    try {
      const dbPageRef = ref(db, `users/${userId}/diary/${pageId}`)
      await remove(dbPageRef)
      pageRef.current = null
      hasChangesRef.current = false
      return true
    } catch (error) {
      console.error('Ошибка удаления страницы:', error)
      return false
    }
  }, [pageId])

  // Добавление мысли

  const addThought = useCallback(() => {
    updatePage((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        thoughts: [
          ...(prev.thoughts || []),
          {
            id: `thought-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            automaticThought: null,
            emotion: [],
            behavioralReaction: null,
          },
        ],
      }
    })
  }, [updatePage])

  // Удаление мысли

  const deleteThought = useCallback(
    (thoughtId: string) => {
      updatePage((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          thoughts: (prev.thoughts || []).filter((t) => t.id !== thoughtId),
          thoughtWorks: (prev.thoughtWorks || []).filter((w) => w.thoughtId !== thoughtId),
        }
      })
    },
    [updatePage]
  )

  // Начало работы с мыслью

  const startWorkOnThought = useCallback(
    (thoughtId: string) => {
      updatePage((prev) => {
        if (!prev) return prev

        const existingWork = prev.thoughtWorks?.find((w) => w.thoughtId === thoughtId)
        if (existingWork) return prev

        const newWork = createEmptyThoughtWork(thoughtId)
        const thought = prev.thoughts?.find((t) => t.id === thoughtId)
        if (thought?.automaticThought) {
          const textContent = thought.automaticThought.content?.[0]?.content
          if (textContent && Array.isArray(textContent)) {
            const text = textContent.map((c: { text?: string }) => c.text || '').join('')
            newWork.reformulation.originalThought = text
          }
        }

        return {
          ...prev,
          thoughtWorks: [...(prev.thoughtWorks || []), newWork],
        }
      })
    },
    [updatePage]
  )

  // Обновление работы с мыслью

  const updateThoughtWork = useCallback(
    (thoughtId: string, updater: (work: ThoughtWork) => ThoughtWork) => {
      updatePage((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          thoughtWorks: (prev.thoughtWorks || []).map((work) =>
            work.thoughtId === thoughtId ? updater(work) : work
          ),
        }
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
