import { useState, useEffect, useCallback, useRef } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { db, auth } from '../firebase/config'
import type { DiaryPage, ThoughtWork } from '../types/diary'
import { createEmptyDiaryPage, createEmptyThoughtWork } from '../types/diary'
import { decryptData, encryptData } from '../utils/crypto'

interface UseDiaryOptions {
  encryptionEnabled?: boolean
  encryptionPassword?: string
}

export const useDiary = (pageId: string, options: UseDiaryOptions = {}) => {
  const { encryptionEnabled = false, encryptionPassword = '' } = options
  const [page, setPage] = useState<DiaryPage | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageRef = useRef<DiaryPage | null>(null)
  const justSavedRef = useRef(false)
  const prevDecryptedRef = useRef<string>('')

  // Расшифровка данных из Firebase
  const decryptPageData = useCallback(
    async (data: DiaryPage, password: string): Promise<DiaryPage> => {
      if (!data._encrypted) return data

      try {
        const decrypted = (await decryptData(
          data._encrypted.encrypted,
          data._encrypted.salt,
          data._encrypted.iv,
          password
        )) as DiaryPage

        const rest = decrypted
        delete rest._encrypted
        return rest
      } catch (error) {
        console.error('Ошибка расшифровки:', error)
        throw error
      }
    },
    []
  )

  // Шифрование данных перед сохранением в Firebase
  const encryptPageData = useCallback(
    async (data: DiaryPage, password: string): Promise<DiaryPage> => {
      try {
        const { encrypted, salt, iv } = await encryptData(data, password)
        return {
          id: data.id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          resource: null,
          situation: null,
          thoughts: [],
          thoughtWorks: [],
          _encrypted: {
            encrypted,
            salt,
            iv,
            version: 1,
          },
        }
      } catch (error) {
        console.error('Ошибка шифрования:', error)
        throw error
      }
    },
    []
  )

  // Загрузка данных из Firebase
  useEffect(() => {
    const userId = auth.currentUser?.uid
    if (!userId || !pageId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(null)
      setHasChanges(false)
      setIsSaving(false)
      prevDecryptedRef.current = ''
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    setPage(null)
    setHasChanges(false)
    setIsSaving(false)
    justSavedRef.current = false
    prevDecryptedRef.current = ''

    const pageRefDb = ref(db, `users/${userId}/diary/${pageId}`)
    const unsubscribe = onValue(pageRefDb, async (snapshot) => {
      // Пропускаем onValue если только что сохранили мы сами
      if (justSavedRef.current) {
        justSavedRef.current = false
        return
      }

      const data = snapshot.val()
      if (data) {
        let processedData = data as DiaryPage

        // Расшифровка если включено
        if (encryptionEnabled && encryptionPassword) {
          try {
            processedData = await decryptPageData(processedData, encryptionPassword)
          } catch (error) {
            console.error('Не удалось расшифровать данные:', error)
            return
          }
        }

        // Сравниваем с предыдущим расшифрованным значением
        const currentStr = JSON.stringify(processedData)
        if (currentStr === prevDecryptedRef.current) {
          // Данные не изменились — не обновляем state
          return
        }

        prevDecryptedRef.current = currentStr
        setPage(processedData)
        setHasChanges(false)
      } else {
        const newPage = createEmptyDiaryPage(pageId)
        prevDecryptedRef.current = JSON.stringify(newPage)
        setPage(newPage)
        setHasChanges(false)
      }
    })

    return () => unsubscribe()
  }, [pageId, encryptionEnabled, encryptionPassword, decryptPageData])

  // Сохранение в Firebase
  const saveToFirebase = useCallback(async () => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const currentData = pageRef.current
    if (!currentData) return

    setIsSaving(true)
    try {
      let dataToSave = currentData

      // Шифрование если включено
      if (encryptionEnabled && encryptionPassword) {
        dataToSave = await encryptPageData(currentData, encryptionPassword)
      }

      const dbRef = ref(db, `users/${userId}/diary/${pageId}`)
      const updatedData = { ...dataToSave, updatedAt: Date.now() }
      await set(dbRef, updatedData)

      // Помечаем что мы только что сохранили
      justSavedRef.current = true

      setHasChanges(false)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      justSavedRef.current = false
    } finally {
      setIsSaving(false)
    }
  }, [pageId, encryptionEnabled, encryptionPassword, encryptPageData])

  // Обновление страницы
  const updatePage = useCallback((updater: (prev: DiaryPage) => DiaryPage) => {
    setPage((prev) => {
      if (!prev) return prev
      const updated = updater(prev)
      pageRef.current = updated
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
        saveToFirebase()
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
    saveToFirebase()
  }, [saveToFirebase])

  // Мгновенное сохранение
  const autoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (hasChanges) {
      saveToFirebase()
    }
  }, [hasChanges, saveToFirebase])

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
