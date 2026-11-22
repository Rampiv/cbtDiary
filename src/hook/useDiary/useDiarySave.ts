import { useState, useCallback } from 'react'
import { ref, set } from 'firebase/database'
import { db, auth } from '../../firebase/config'
import type { DiaryPage } from '../../types/diary'

export interface UseDiarySaveDeps {
  pageRef: React.MutableRefObject<DiaryPage | null>
  hasChangesRef: React.MutableRefObject<boolean>
  currentPageIdRef: React.MutableRefObject<string | null>
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
}

export interface UseDiarySaveApi {
  isSaving: boolean
  manualSave: () => Promise<void>
  autoSave: () => void
}

export const useDiarySave = (
  deps: UseDiarySaveDeps,
): UseDiarySaveApi => {
  const { pageRef, hasChangesRef, currentPageIdRef, setHasChanges } = deps
  const [isSaving, setIsSaving] = useState(false)

  // saveToFirebase — сбрасывает hasChanges ТОЛЬКО после успешного set
  const saveToFirebase = useCallback(async (data: DiaryPage, id: string) => {
    const userId = auth.currentUser?.uid
    if (!userId) return

    setIsSaving(true)
    try {
      const dbRef = ref(db, `users/${userId}/diary/${id}`)
      // Bug 3: createdAt undefined → Firebase сохранит null. Не добавляем, если нет.
      const updatedData: Record<string, unknown> = { ...data, updatedAt: Date.now() }
      if (data.createdAt) {
        updatedData.createdAt = data.createdAt
      }
      await set(dbRef, updatedData)
      // Bug 4: сбрасываем hasChanges только после успешного set
      hasChangesRef.current = false
      setHasChanges(false)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Bug 6: используем currentPageIdRef.current вместо pageId из замыкания
  const manualSave = useCallback(async () => {
    if (pageRef.current) {
      await saveToFirebase(pageRef.current, currentPageIdRef.current ?? '')
    }
  }, [saveToFirebase])

  // Bug 1: hasChangesRef НЕ сбрасывается здесь — только после успешного saveToFirebase
  const autoSave = useCallback(() => {
    if (hasChangesRef.current && pageRef.current) {
      saveToFirebase(pageRef.current, currentPageIdRef.current ?? '')
    }
  }, [saveToFirebase])

  return {
    isSaving,
    manualSave,
    autoSave,
  }
}
