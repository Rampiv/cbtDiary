import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { FAQPage } from './FAQPage'

// Mock react-router-dom Link
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, target, 'aria-label': ariaLabel, rel }: {
    children: React.ReactNode
    to: string
    target?: string
    'aria-label'?: string
    rel?: string
  }) => (
    <a href={to} target={target} aria-label={ariaLabel} rel={rel}>
      {children}
    </a>
  ),
}))

// Mock Accordion — renders content for testing
vi.mock('../../components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../components')>()
  const MockAccordion = ({ title, children, defaultOpen }: {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
  }) => (
    <div
      className="accordion accordion--open"
      data-testid={`accordion-${title}`}
      data-default-open={defaultOpen ? 'true' : 'false'}
    >
      <button type="button" className="accordion__header" aria-expanded={defaultOpen ? 'true' : 'false'}>
        <h3 className="accordion__title">{title}</h3>
      </button>
      <div className="accordion__content" role="region" aria-labelledby={`${title}-title`}>
        {children}
      </div>
    </div>
  )
  return { ...actual, Accordion: MockAccordion }
})

describe('FAQPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderFAQPage = () => render(<FAQPage />)

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the page title', () => {
      renderFAQPage()
      expect(screen.getByRole('heading', { name: 'Часто задаваемые вопросы' })).toBeInTheDocument()
    })

    it('should render all accordion sections', () => {
      renderFAQPage()
      expect(screen.getByText('Для кого это приложение')).toBeInTheDocument()
      expect(screen.getByText('Как добавить ярлык на главный экран телефона')).toBeInTheDocument()
      expect(screen.getByText('Как работать с дневником')).toBeInTheDocument()
      expect(screen.getByText('Для чего переформулировать мысль')).toBeInTheDocument()
      expect(screen.getByText('Работа автосохранения')).toBeInTheDocument()
      expect(screen.getByText('Выгрузка данных')).toBeInTheDocument()
      expect(screen.getByText('Мобильное приложение Android')).toBeInTheDocument()
      expect(screen.getByText('Обратная связь')).toBeInTheDocument()
      expect(document.querySelectorAll('.accordion').length).toBe(8)
    })

    it('should render guide blocks in "Как добавить ярлык" accordion', () => {
      renderFAQPage()
      expect(screen.getByText('iPhone / iPad (Safari)')).toBeInTheDocument()
      expect(screen.getByText('Android (Chrome)')).toBeInTheDocument()
      expect(screen.getByText('Зачем это нужно?')).toBeInTheDocument()
    })

    it('should render ordered lists in guide', () => {
      renderFAQPage()
      const lists = document.querySelectorAll('ol')
      expect(lists.length).toBe(2)
    })

    it('should render guide notes', () => {
      renderFAQPage()
      expect(screen.getByText(/⚠️ Важно/)).toBeInTheDocument()
      expect(screen.getByText(/💡 В Samsung/)).toBeInTheDocument()
    })

    it('should render Telegram link', () => {
      renderFAQPage()
      expect(screen.getByText('Телеграм')).toBeInTheDocument()
    })

    it('should render email link', () => {
      renderFAQPage()
      expect(screen.getByText('inprikazchikov@bk.ru')).toBeInTheDocument()
    })

    it('should render download link', () => {
      renderFAQPage()
      expect(screen.getByText('Ссылка на скачивание с Яндекс Диска')).toBeInTheDocument()
    })

    it('should render author information', () => {
      renderFAQPage()
      expect(screen.getByText(/Приказчиков Иван Николаевич/)).toBeInTheDocument()
    })

    it('should render non-commercial notice', () => {
      renderFAQPage()
      expect(screen.getByText(/Сайт сделан не для коммерческого использования/)).toBeInTheDocument()
    })
  })

  // ── Download link structure ────────────────────────────────────────

  describe('Download link structure', () => {
    it('should wrap download link text in <u>', () => {
      renderFAQPage()
      const downloadLink = screen.getByText('Ссылка на скачивание с Яндекс Диска')
      expect(downloadLink.closest('u')).toBeInTheDocument()
    })

    it('should not have target on Telegram link', () => {
      renderFAQPage()
      const tg = document.querySelector('a[href="https://t.me/Rampiv"]')
      expect(tg).not.toHaveAttribute('target')
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="main" on page container', () => {
      renderFAQPage()
      const main = document.querySelector('[role="main"]')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'Часто задаваемые вопросы')
    })

    it('should have proper heading hierarchy', () => {
      renderFAQPage()
      const h1 = document.querySelector('h1')
      const h3s = document.querySelectorAll('h3')
      expect(h1).toBeInTheDocument()
      expect(h3s.length).toBeGreaterThan(0)
    })

    it('should have aria-label on Telegram link', () => {
      renderFAQPage()
      const telegramLink = document.querySelector('a[href="https://t.me/Rampiv"]')
      expect(telegramLink).toHaveAttribute('aria-label')
    })

    it('should have aria-label on email link', () => {
      renderFAQPage()
      const emailLink = document.querySelector('a[href="mailto:inprikazchikov@bk.ru"]')
      expect(emailLink).toHaveAttribute('aria-label')
    })

    it('should have aria-label on download link', () => {
      renderFAQPage()
      const downloadLink = document.querySelector('a[href="https://disk.yandex.ru/d/-2XK17za8gusVQ"]')
      expect(downloadLink).toHaveAttribute('aria-label')
    })

    it('should have rel="noopener noreferrer" on external link', () => {
      renderFAQPage()
      const downloadLink = document.querySelector('a[href="https://disk.yandex.ru/d/-2XK17za8gusVQ"]')
      expect(downloadLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should open download link in new tab', () => {
      renderFAQPage()
      const link = document.querySelector('a[href="https://disk.yandex.ru/d/-2XK17za8gusVQ"]')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should have correct mailto href', () => {
      renderFAQPage()
      const emailLink = document.querySelector('a[href="mailto:inprikazchikov@bk.ru"]')
      expect(emailLink).toBeInTheDocument()
    })

    it('should have ordered list items', () => {
      renderFAQPage()
      const items = document.querySelectorAll('ol li')
      expect(items.length).toBe(10)
    })
  })

  // ── Accordion props ────────────────────────────────────────────────

  describe('Accordion props', () => {
    it('should mark "Как работать с дневником" as defaultOpen', () => {
      renderFAQPage()
      const accordion = screen.getByTestId('accordion-Как работать с дневником')
      expect(accordion).toHaveAttribute('data-default-open', 'true')
    })

    it('should not mark other accordions as defaultOpen', () => {
      renderFAQPage()
      const others = [
        'Для кого это приложение',
        'Как добавить ярлык на главный экран телефона',
        'Для чего переформулировать мысль',
        'Работа автосохранения',
        'Выгрузка данных',
        'Мобильное приложение Android',
        'Обратная связь',
      ]
      others.forEach((title) => {
        expect(screen.getByTestId(`accordion-${title}`)).toHaveAttribute('data-default-open', 'false')
      })
    })
  })

  // ── Guide section ──────────────────────────────────────────────────

  describe('Guide section', () => {
    it('should render all guide blocks', () => {
      renderFAQPage()
      const blocks = document.querySelectorAll('.faq-page__guide-block')
      expect(blocks.length).toBe(3)
    })

    it('should render info block about PWA benefits', () => {
      renderFAQPage()
      const infoBlock = document.querySelector('.faq-page__guide-block--info')
      expect(infoBlock).toBeInTheDocument()
    })

    it('should render guide emojis', () => {
      renderFAQPage()
      expect(screen.getByText('🍎')).toBeInTheDocument()
      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.getByText('✨')).toBeInTheDocument()
    })
  })

  // ── Content sections ───────────────────────────────────────────────

  describe('Content sections', () => {
    it('should render diary work instructions', () => {
      renderFAQPage()
      expect(screen.getByText(/Структура записи/)).toBeInTheDocument()
      expect(screen.getByText(/Знаки вопроса/)).toBeInTheDocument()
      expect(screen.getByText(/Ползунки убеждённости/)).toBeInTheDocument()
      expect(screen.getByText(/Удаление строк/)).toBeInTheDocument()
    })

    it('should render reformulation explanation', () => {
      renderFAQPage()
      expect(screen.getByText(/более точную/)).toBeInTheDocument()
    })

    it('should render auto-save explanation', () => {
      renderFAQPage()
      expect(screen.getByText(/Все изменения сохраняются автоматически/)).toBeInTheDocument()
    })

    it('should render export explanation', () => {
      renderFAQPage()
      expect(screen.getByText(/выгрузить страницы дневника/)).toBeInTheDocument()
    })

    it('should render Android app disclaimer', () => {
      renderFAQPage()
      expect(screen.getByText(/не несёт ответственности/)).toBeInTheDocument()
    })
  })
})
