import { useState, useEffect, useCallback, useRef } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { db, auth } from '../firebase/config'
import type { DiaryPage, ThoughtWork } from '../types/diary'
import { createEmptyDiaryPage, createEmptyThoughtWork } from '../types/diary'

export const useDiary = (pageId: string) => {
  const [page, setPage] = useState<DiaryPage | null>(null)
  const [, setSavedPage] = useState<DiaryPage | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Загрузка данных из Firebase + сброс состояния
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId || !pageId) {
      setPage(null)
      setSavedPage(null)
      setHasChanges(false)
      setIsSaving(false)
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    setPage(null)
    setSavedPage(null)
    setHasChanges(false)
    setIsSaving(false)

    const pageRef = ref(db, `users/${userId}/diary/${pageId}`)
    const unsubscribe = onValue(pageRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setPage(data)
        setSavedPage(data)
        setHasChanges(false)
      } else {
        const newPage = createEmptyDiaryPage(pageId)
        setPage(newPage)
        setSavedPage(newPage)
        setHasChanges(false)
      }
    })

    return () => unsubscribe()
  }, [pageId])

  // Сохранение в Firebase
  const saveToFirebase = useCallback(
    async (data: DiaryPage) => {
      const userId = auth.currentUser?.uid
      if (!userId) return

      setIsSaving(true)
      try {
        const pageRef = ref(db, `users/${userId}/diary/${pageId}`)
        const updatedData = { ...data, updatedAt: Date.now() }
        await set(pageRef, updatedData)
        setSavedPage(updatedData)
        setHasChanges(false)
      } catch (error) {
        console.error('Ошибка сохранения:', error)
      } finally {
        setIsSaving(false)
      }
    },
    [pageId]
  )

  // Обновление страницы
  const updatePage = useCallback((updater: (prev: DiaryPage) => DiaryPage) => {
    setPage((prev) => {
      if (!prev) return prev
      const updated = updater(prev)
      setHasChanges(true)
      return updated
    })
  }, [])

  // Автосохранение
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (hasChanges && page) {
      saveTimeoutRef.current = setTimeout(() => {
        saveToFirebase(page)
      }, 1000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [hasChanges, page, saveToFirebase])

  // Ручное сохранение
  const manualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (page) {
      saveToFirebase(page)
    }
  }, [page, saveToFirebase])

  // Мгновенное сохранение
  const autoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (page && hasChanges) {
      saveToFirebase(page)
    }
  }, [page, hasChanges, saveToFirebase])

  // УДАЛЕНИЕ СТРАНИЦЫ
  const deletePage = useCallback(async () => {
    const userId = auth.currentUser?.uid
    if (!userId || !pageId) return

    try {
      const pageRef = ref(db, `users/${userId}/diary/${pageId}`)
      await remove(pageRef)
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
            id: `thought-${(prev.thoughts?.length || 0) + 1}`,
            automaticThought: null,
            emotion: [],
            behavioralReaction: null,
          },
        ],
      }
    })
  }, [updatePage])

  // УДАЛЕНИЕ МЫСЛИ
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
            const text = textContent.map((c: any) => c.text || '').join('')
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