import { createContext, useContext } from 'react'
import type { DiaryPage as DiaryPageType } from '../types/diary'

interface PagesContextType {
  pages: DiaryPageType[]
  refreshPages: () => void
}

export const PagesContext = createContext<PagesContextType>({
  pages: [],
  refreshPages: () => {},
})

export const usePages = () => useContext(PagesContext)
