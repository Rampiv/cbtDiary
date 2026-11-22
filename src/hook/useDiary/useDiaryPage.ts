import { useState, useEffect, useRef, useCallback } from 'react'
import { ref, onValue } from 'firebase/database'
import { db, auth } from '../../firebase/config'
import type { DiaryPage } from '../../types/diary'
import { createEmptyDiaryPage } from '../../types/diary'

export interface UseDiaryPageApi {
  page: DiaryPage | null
  isPageLoading: boolean
  hasChanges: boolean
  pageRef: React.RefObject<DiaryPage | null>
  hasChangesRef: React.RefObject<boolean>
  currentPageIdRef: React.RefObject<string | null>
  setPage: React.Dispatch<React.SetStateAction<DiaryPage | null>>
  setIsPageLoading: React.Dispatch<React.SetStateAction<boolean>>
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
  resetState: () => void
}

export const useDiaryPage = (pageId: string): UseDiaryPageApi => {
  const [page, setPage] = useState<DiaryPage | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const pageRef = useRef<DiaryPage | null>(null)
  const hasChangesRef = useRef(false)
  const currentPageIdRef = useRef<string | null>(null)

  // Синхронно обновляем refs при изменении state
  useEffect(() => {
    hasChangesRef.current = hasChanges
  }, [hasChanges])

  //  — синхронная мутация ref для хранения актуального pageId (стандартный React-паттерн, как в useReducer)
  // eslint-disable-next-line react-hooks/refs
  currentPageIdRef.current = pageId

  const resetState = useCallback(() => {
    setPage(null)
    setHasChanges(false)
  }, [])

  useEffect(() => {
    const userId = auth.currentUser?.uid

    if (!userId || !pageId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetState()
      pageRef.current = null
      hasChangesRef.current = false
      return
    }

    setIsPageLoading(true)
    resetState()
    pageRef.current = null
    hasChangesRef.current = false

    const dbPath = `users/${userId}/diary/${pageId}`
    const pageRefDb = ref(db, dbPath)

    const unsubscribe = onValue(
      pageRefDb,
      (snapshot) => {
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
      },
      (error) => {
        console.error(`Ошибка загрузки страницы ${pageId}:`, error)
        pageRef.current = null
        hasChangesRef.current = false
        setIsPageLoading(false)
      }
    )

    return () => unsubscribe()
  }, [pageId, resetState])

  return {
    page,
    isPageLoading,
    hasChanges,
    pageRef,
    hasChangesRef,
    currentPageIdRef,
    setPage,
    setIsPageLoading,
    setHasChanges,
    resetState,
  }
}
