import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { CognitiveDistortionsPage, distortions } from './CognitiveDistortionsPage'

// Mock react-router-dom — useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}))

import { useNavigate } from 'react-router-dom'

const mockNavigate = vi.fn()

describe('CognitiveDistortionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockImplementation(() => mockNavigate)
  })

  afterEach(() => {
    cleanup()
  })

  const renderPage = () => render(<CognitiveDistortionsPage />)

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the page title', () => {
      renderPage()
      expect(screen.getByRole('heading', { name: 'Когнитивные искажения' })).toBeInTheDocument()
    })

    it('should render the description paragraph', () => {
      renderPage()
      expect(screen.getByText(/Когнитивные искажения — это систематические ошибки/)).toBeInTheDocument()
    })

    it('should render the back button', () => {
      renderPage()
      expect(screen.getByRole('button', { name: 'Вернуться в раздел Полезное' })).toBeInTheDocument()
    })

    it('should render all 13 distortion items', () => {
      renderPage()
      const items = document.querySelectorAll('.cognitive-distortions-page__item')
      expect(items.length).toBe(13)
    })

    it('should render all distortion names', () => {
      renderPage()
      expect(screen.getByText('Предвзятость подтверждения')).toBeInTheDocument()
      expect(screen.getByText('Игнорирование базовых показателей')).toBeInTheDocument()
      expect(screen.getByText('Поляризованное мышление')).toBeInTheDocument()
      expect(screen.getByText('Чрезмерное обобщение')).toBeInTheDocument()
      expect(screen.getByText('Катастрофизация')).toBeInTheDocument()
      expect(screen.getByText('Персонализация')).toBeInTheDocument()
      expect(screen.getByText('Чтение мыслей')).toBeInTheDocument()
      expect(screen.getByText('Эмоциональное мышление')).toBeInTheDocument()
      expect(screen.getByText('Навешивание ярлыков')).toBeInTheDocument()
      expect(screen.getByText('Утверждения «должен»')).toBeInTheDocument()
      expect(screen.getByText('Ошибка контроля')).toBeInTheDocument()
      expect(screen.getByText('Ошибка справедливости')).toBeInTheDocument()
      expect(screen.getByText('Ошибка изменения')).toBeInTheDocument()
    })

    it('should render distortion descriptions', () => {
      renderPage()
      distortions.forEach((d) => {
        expect(screen.getByText(d.text)).toBeInTheDocument()
      })
    })

    it('should render distortion examples', () => {
      renderPage()
      distortions.forEach((d) => {
        expect(screen.getByText(new RegExp(d.example.slice(0, 30)))).toBeInTheDocument()
      })
    })

    it('should render example blocks', () => {
      renderPage()
      const examples = document.querySelectorAll('.cognitive-distortions-page__item-example')
      expect(examples.length).toBe(13)
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="main" on page container', () => {
      renderPage()
      const main = document.querySelector('[role="main"]')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'Когнитивные искажения')
    })

    it('should have aria-label on back button', () => {
      renderPage()
      const backBtn = screen.getByRole('button', { name: 'Вернуться в раздел Полезное' })
      expect(backBtn).toHaveAttribute('aria-label', 'Вернуться в раздел Полезное')
    })

    it('should have role="region" on distortions list', () => {
      renderPage()
      const list = document.querySelector('[role="region"][aria-label="Список когнитивных искажений"]')
      expect(list).toBeInTheDocument()
    })

    it('should have aria-label on each distortion article', () => {
      renderPage()
      const articlesWithNames = document.querySelectorAll('.cognitive-distortions-page__item[aria-label]')
      expect(articlesWithNames.length).toBe(13)
    })

    it('should have role="note" on example blocks', () => {
      renderPage()
      const notes = document.querySelectorAll('[role="note"]')
      expect(notes.length).toBe(13)
    })

    it('should have proper heading hierarchy', () => {
      renderPage()
      const h1 = document.querySelector('h1')
      const h2s = document.querySelectorAll('h2')
      expect(h1).toBeInTheDocument()
      expect(h2s.length).toBe(13)
    })

    it('should have type="button" on back button', () => {
      renderPage()
      const backBtn = screen.getByRole('button', { name: 'Вернуться в раздел Полезное' })
      expect(backBtn).toHaveAttribute('type', 'button')
    })

    it('should set aria-label of each article to distortion name', () => {
      renderPage()
      const article = document.querySelector('.cognitive-distortions-page__item[data-id="catastrophizing"]')
      expect(article).toHaveAttribute('aria-label', 'Катастрофизация')
    })
  })

  // ── Interaction ────────────────────────────────────────────────────

  describe('Interaction', () => {
    it('should not navigate on initial render', () => {
      renderPage()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should navigate to /helpful when back button is clicked', () => {
      renderPage()
      const backBtn = screen.getByRole('button', { name: 'Вернуться в раздел Полезное' })
      fireEvent.click(backBtn)
      expect(mockNavigate).toHaveBeenCalledWith('/helpful')
    })
  })

  // ── Content verification ───────────────────────────────────────────

  describe('Content verification', () => {
    it('should render correct example for catastrophizing', () => {
      renderPage()
      expect(screen.getByText(/На вечеринке закончился лёд/)).toBeInTheDocument()
    })

    it('should render correct example for mind reading', () => {
      renderPage()
      expect(screen.getByText(/Друг не перезвонил/)).toBeInTheDocument()
    })

    it('should render correct example for should statements', () => {
      renderPage()
      expect(screen.getByText(/Я должен был справиться лучше/)).toBeInTheDocument()
    })

    it('should render "Пример:" label in every example block', () => {
      renderPage()
      const examples = document.querySelectorAll('.cognitive-distortions-page__item-example')
      examples.forEach((example) => {
        const strong = example.querySelector('strong')
        expect(strong?.textContent).toBe('Пример:')
      })
    })

    it('should have unique data-id for all distortion articles', () => {
      renderPage()
      const articles = document.querySelectorAll('.cognitive-distortions-page__item')
      const ids = Array.from(articles).map((el) => el.getAttribute('data-id'))
      const unique = new Set(ids)
      expect(unique.size).toBe(13)
      ids.forEach((id) => expect(id).toBeTruthy())
    })
  })
})
