import { createContext, useContext } from 'react'
import type { DiaryPage as DiaryPageType } from '../types/diary'

interface PagesContextType {
  pages: DiaryPageType[]
  hasFetched: boolean
  refreshPages: () => void
}

export const PagesContext = createContext<PagesContextType>({
  pages: [],
  hasFetched: false,
  refreshPages: () => {},
})

export const usePages = () => useContext(PagesContext)
