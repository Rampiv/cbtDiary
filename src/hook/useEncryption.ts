import { useState, useCallback } from 'react'
import { encryptData, decryptData } from '../utils/crypto'
import type { DiaryPage } from '../types/diary'

export interface EncryptionState {
  isEnabled: boolean
  isDecrypting: boolean
  isEncrypting: boolean
  error: string | null
}

export interface UseEncryptionReturn extends EncryptionState {
  encryptPage: (page: DiaryPage, password: string) => Promise<DiaryPage>
  decryptPage: (page: DiaryPage, password: string) => Promise<DiaryPage>
  verifyPassword: (password: string) => Promise<boolean>
  clearEncryptionState: () => void
}

// Формат зашифрованной страницы в Firebase
interface EncryptedPageData {
  encrypted: string
  salt: string
  iv: string
  version: number
}

// Версия схемы шифрования
const ENCRYPTION_VERSION = 1

export const useEncryption = (): UseEncryptionReturn => {
  const [state, setState] = useState<EncryptionState>({
    isEnabled: false,
    isDecrypting: false,
    isEncrypting: false,
    error: null,
  })

  // Проверка пароля через Firebase
  const verifyPassword = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, error: null }))
    return true // Будет реализовано через Firebase
  }, [])

  // Шифрование страницы
  const encryptPage = useCallback(
    async (page: DiaryPage, password: string): Promise<DiaryPage> => {
      setState((prev) => ({ ...prev, isEncrypting: true, error: null }))
      try {
        const { encrypted, salt, iv } = await encryptData(page, password)
        const encryptedPage: DiaryPage = {
          ...page,
          id: page.id,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          resource: null,
          situation: null,
          thoughts: [],
          thoughtWorks: [],
          _encrypted: {
            encrypted,
            salt,
            iv,
            version: ENCRYPTION_VERSION,
          },
        }
        setState((prev) => ({ ...prev, isEncrypting: false }))
        return encryptedPage
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка шифрования данных'
        setState((prev) => ({
          ...prev,
          isEncrypting: false,
          error: errorMessage,
        }))
        throw err
      }
    },
    []
  )

  // Расшифровка страницы
  const decryptPage = useCallback(
    async (page: DiaryPage, password: string): Promise<DiaryPage> => {
      setState((prev) => ({ ...prev, isDecrypting: true, error: null }))
      try {
        const encryptedData = page._encrypted as EncryptedPageData | undefined
        if (!encryptedData) {
          return page
        }

        const decryptedPage = (await decryptData(
          encryptedData.encrypted,
          encryptedData.salt,
          encryptedData.iv,
          password
        )) as DiaryPage

        setState((prev) => ({ ...prev, isDecrypting: false }))
        return decryptedPage
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка расшифровки данных. Проверьте пароль.'
        setState((prev) => ({
          ...prev,
          isDecrypting: false,
          error: errorMessage,
        }))
        throw err
      }
    },
    []
  )

  // Очистка состояния
  const clearEncryptionState = useCallback(() => {
    setState({
      isEnabled: false,
      isDecrypting: false,
      isEncrypting: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    encryptPage,
    decryptPage,
    verifyPassword,
    clearEncryptionState,
  }
}
