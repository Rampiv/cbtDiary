import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { ContentCard } from './HelpfulPage'
import { HelpfulPage, contentCards } from './HelpfulPage'

// Mock react-router-dom — Link
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, 'aria-label': ariaLabel }: {
    children: React.ReactNode
    to: string
    className?: string
    'aria-label'?: string
  }) => (
    <a href={to} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}))

describe('HelpfulPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderPage = () => render(<HelpfulPage />)

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the page title', () => {
      renderPage()
      expect(screen.getByRole('heading', { name: 'Полезное' })).toBeInTheDocument()
    })

    it('should render the description paragraph', () => {
      renderPage()
      expect(screen.getByText(/Здесь вы найдёте полезные материалы/)).toBeInTheDocument()
    })

    it('should render all content cards', () => {
      renderPage()
      const cards = document.querySelectorAll('.helpful-page__card')
      expect(cards.length).toBe(contentCards.length)
    })

    it('should render all card titles as h3', () => {
      renderPage()
      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings.map((h) => h.textContent)).toEqual(contentCards.map((c) => c.title))
    })

    it('should render all card descriptions', () => {
      renderPage()
      contentCards.forEach((card) => {
        expect(screen.getByText(card.description, { exact: true })).toBeInTheDocument()
      })
    })

    it('should render card type label for every card', () => {
      renderPage()
      const typeLabels: Record<ContentCard['type'], string> = {
        article: 'Статья',
        test: 'Тест',
        material: 'Материал',
      }
      contentCards.forEach((card) => {
        const count = contentCards.filter((c) => c.type === card.type).length
        expect(screen.getAllByText(typeLabels[card.type])).toHaveLength(count)
      })
    })

    it('should render card icons', () => {
      renderPage()
      const icons = document.querySelectorAll('.helpful-page__card-icon')
      expect(icons.length).toBe(contentCards.length)
    })

    it('should render card arrow SVGs', () => {
      renderPage()
      const arrows = document.querySelectorAll('.helpful-page__card-arrow')
      expect(arrows.length).toBe(contentCards.length)
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="main" on page container', () => {
      renderPage()
      const main = document.querySelector('[role="main"]')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'Полезные материалы')
    })

    it('should have nav with aria-label for card sections', () => {
      renderPage()
      const nav = document.querySelector('nav[aria-label="Разделы полезных материалов"]')
      expect(nav).toBeInTheDocument()
    })

    it('should render cards inside nav', () => {
      renderPage()
      const nav = document.querySelector('nav[aria-label="Разделы полезных материалов"]')
      const cards = nav?.querySelectorAll('.helpful-page__card')
      expect(cards?.length).toBe(contentCards.length)
    })

    it('should have aria-label on each card link', () => {
      renderPage()
      const links = document.querySelectorAll('.helpful-page__card-link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('aria-label')
      })
    })

    it('should have role="article" on each card', () => {
      renderPage()
      const cards = document.querySelectorAll('.helpful-page__card[role="article"]')
      expect(cards.length).toBe(contentCards.length)
    })

    it('should have aria-hidden on card icons', () => {
      renderPage()
      const icons = document.querySelectorAll('.helpful-page__card-icon[aria-hidden="true"]')
      expect(icons.length).toBe(contentCards.length)
    })

    it('should have aria-hidden on card arrows', () => {
      renderPage()
      const arrows = document.querySelectorAll('.helpful-page__card-arrow[aria-hidden="true"]')
      expect(arrows.length).toBe(contentCards.length)
    })

    it('should have focusable="false" on card arrows', () => {
      renderPage()
      const arrows = document.querySelectorAll('.helpful-page__card-arrow[focusable="false"]')
      expect(arrows.length).toBe(contentCards.length)
    })

    it('should have proper heading hierarchy', () => {
      renderPage()
      const h1 = document.querySelector('h1')
      const h3s = document.querySelectorAll('h3')
      expect(h1).toBeInTheDocument()
      expect(h3s.length).toBe(contentCards.length)
    })

    it('should have exactly one h1', () => {
      renderPage()
      expect(document.querySelectorAll('h1')).toHaveLength(1)
    })

    it('should have correct href on card links', () => {
      renderPage()
      contentCards.forEach((card) => {
        const link = document.querySelector(`a[href="${card.link}"]`)
        expect(link).toBeInTheDocument()
      })
    })

    it('should set card link aria-label to title + description', () => {
      renderPage()
      const card = document.querySelector(`a[href="${contentCards[0].link}"]`)
      expect(card).toHaveAttribute('aria-label', `${contentCards[0].title} — ${contentCards[0].description}`)
    })
  })

  // ── Content verification ───────────────────────────────────────────

  describe('Content verification', () => {
    it('should render correct card for cognitive distortions', () => {
      renderPage()
      expect(screen.getByText('Когнитивные искажения')).toBeInTheDocument()
      expect(screen.getByText(/13 основных когнитивных искажений/)).toBeInTheDocument()
    })
  })
})
