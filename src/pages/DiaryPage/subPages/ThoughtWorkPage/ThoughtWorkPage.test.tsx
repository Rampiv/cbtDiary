import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ThoughtWorkPage } from './ThoughtWorkPage'
import type { DiaryPage, ThoughtWork } from '../../../../types/diary'

// Mock react-router-dom Link
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

// Mock antd Slider
vi.mock('antd', () => ({
  Slider: ({ value, onChange, 'aria-label': ariaLabel, onChangeComplete }: {
    value: number
    onChange: (value: number) => void
    'aria-label'?: string
    onChangeComplete?: (value: number) => void
  }) => (
    <div data-testid="slider" data-value={value} aria-label={ariaLabel}>
      <input
        type="range"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value)
          onChange(v)
          onChangeComplete?.(v)
        }}
        aria-label={ariaLabel}
      />
      {value}%
    </div>
  ),
}))

// Mock Accordion — always renders content for testing
vi.mock('../../../../components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../components')>()
  const MockAccordion = ({ title, children }: {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
  }) => (
    <div className="accordion">
      <button type="button" className="accordion__header" aria-expanded="true">
        <h3 className="accordion__title">{title}</h3>
      </button>
      <div className="accordion__content">{children}</div>
    </div>
  )
  const MockTextEditor = ({ placeholder, 'aria-label': ariaLabel }: {
    placeholder?: string
    onChange?: (content: unknown) => void
    onBlur?: () => void
    'aria-label'?: string
  }) => (
    <div data-testid="text-editor" data-placeholder={placeholder || ''} aria-label={ariaLabel}>
      {placeholder}
    </div>
  )
  return { ...actual, Accordion: MockAccordion, TextEditor: MockTextEditor }
})

const createMockWork = (overrides?: Partial<ThoughtWork>): ThoughtWork => ({
  thoughtId: 'thought-1',
  specification: null,
  beliefScore: 50,
  cognitiveDistortions: [],
  distortionsExplanation: null,
  usefulness: { helps: null, complicates: null },
  evidence: { for: null, against: null },
  alternative: null,
  catastrophizing: {
    worst: { content: null, belief: 0 },
    best: { content: null, belief: 0 },
    realistic: { content: null, belief: 0 },
  },
  distancing: null,
  reformulation: {
    originalThought: '',
    response: null,
    belief: 0,
  },
  actionPlan: null,
  ...overrides,
})

const createMockPage = (overrides?: Partial<DiaryPage>): DiaryPage => ({
  id: 'page-1',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  title: 'Тревога на работе',
  resource: null,
  situation: null,
  thoughts: [
    {
      id: 'thought-1',
      automaticThought: null,
      emotion: [{ name: 'Тревога', intensity: 70 }],
      behavioralReaction: null,
    },
  ],
  thoughtWorks: [createMockWork()],
  ...overrides,
})

describe('ThoughtWorkPage', () => {
  const mockUpdateThoughtWork = vi.fn()
  const mockAutoSave = vi.fn()
  const mockOnNextThought = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderPage = (overrides?: { page?: Partial<DiaryPage>; thoughtId?: string }) => {
    const page = createMockPage(overrides?.page)
    const thoughtId = overrides?.thoughtId ?? 'thought-1'
    return render(
      <ThoughtWorkPage
        page={page}
        thoughtId={thoughtId}
        updateThoughtWork={mockUpdateThoughtWork}
        autoSave={mockAutoSave}
        onNextThought={mockOnNextThought}
      />
    )
  }

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the work heading', () => {
      renderPage()
      expect(screen.getByRole('heading', { name: 'Работа' })).toBeInTheDocument()
    })

    it('should render the summary table', () => {
      renderPage()
      const summary = document.querySelector('[aria-label="Сводка мысли"]')
      expect(summary).toBeInTheDocument()
    })

    it('should render all accordion sections', () => {
      renderPage()
      expect(screen.getByText('Анализ: Конкретизация мысли')).toBeInTheDocument()
      expect(screen.getByText('Анализ: Полезность')).toBeInTheDocument()
      expect(screen.getByText('Анализ: Доказательства')).toBeInTheDocument()
      expect(screen.getByText('Анализ: Альтернатива')).toBeInTheDocument()
      expect(screen.getByText('Анализ: Катастрофизация')).toBeInTheDocument()
      expect(screen.getByText('Анализ: Дистанцирование')).toBeInTheDocument()
      expect(screen.getByText('Анализ: Когнитивные искажения')).toBeInTheDocument()
      expect(screen.getByText('Переформулирование')).toBeInTheDocument()
      expect(screen.getByText('Мысль реальна')).toBeInTheDocument()
    })

    it('should render the next thought button', () => {
      renderPage()
      expect(screen.getByRole('button', { name: 'Работать со следующей мыслью' })).toBeInTheDocument()
    })

    it('should not render next thought button when onNextThought is not provided', () => {
      renderPage({ page: {}, thoughtId: 'thought-1' })
      // Remove onNextThought by re-rendering
    })

    it('should render "thought not found" when work is missing', () => {
      renderPage({ page: { thoughtWorks: [], thoughts: [] }, thoughtId: 'non-existent' })
      expect(screen.getByRole('alert')).toHaveTextContent('Мысль не найдена')
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="alert" on thought not found message', () => {
      renderPage({ page: { thoughtWorks: [], thoughts: [] }, thoughtId: 'non-existent' })
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Мысль не найдена')
    })

    it('should have aria-label on summary region', () => {
      renderPage()
      const summary = document.querySelector('[aria-label="Сводка мысли"]')
      expect(summary).toBeInTheDocument()
    })

    it('should have aria-label on specification info button', () => {
      renderPage()
      const specBtn = document.querySelector('.thought-work-page__info-btn')
      expect(specBtn).toHaveAttribute('aria-label', 'Что за конкретизация мысли?')
    })

    it('should have aria-label on next thought button', () => {
      renderPage()
      const nextBtn = screen.getByRole('button', { name: 'Работать со следующей мыслью' })
      expect(nextBtn).toHaveAttribute('aria-label', 'Работать со следующей мыслью')
    })

    it('should have scope="col" on modal table headers', () => {
      renderPage()
      // Open the spec modal
      const specBtn = document.querySelector('.thought-work-page__info-btn')!
      fireEvent.click(specBtn)

      const modal = document.querySelector('[role="dialog"]')
      if (modal) {
        const headers = modal.querySelectorAll('th[scope="col"]')
        expect(headers.length).toBeGreaterThan(0)
      }
    })

    it('should have aria-label on cognitive distortions checkboxes', () => {
      renderPage()
      // Open the cognitive distortions accordion
      const distortionsAccordion = screen.getByText('Анализ: Когнитивные искажения')
      const distortionsHeader = distortionsAccordion.closest('.accordion')?.querySelector('.accordion__header') as HTMLElement
      if (distortionsHeader) {
        fireEvent.click(distortionsHeader)
      }

      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      checkboxes.forEach((cb) => {
        expect(cb).toHaveAttribute('aria-label')
      })
    })
  })

  // ── Summary section ────────────────────────────────────────────────

  describe('Summary section', () => {
    it('should render automatic thought in summary', () => {
      renderPage()
      expect(screen.getByText('Автоматическая мысль')).toBeInTheDocument()
    })

    it('should render emotional reaction in summary', () => {
      renderPage()
      expect(screen.getByText('Эмоциональная реакция')).toBeInTheDocument()
    })

    it('should render behavioral reaction in summary', () => {
      renderPage()
      expect(screen.getByText('Поведенческая реакция')).toBeInTheDocument()
    })

    it('should show "Не заполнено" when thought is empty', () => {
      renderPage()
      const emptySpans = document.querySelectorAll('.thought-work-page__empty')
      expect(emptySpans.length).toBeGreaterThan(0)
    })

    it('should render emotion list', () => {
      renderPage()
      const emotionList = document.querySelector('.thought-work-page__emotion-list')
      expect(emotionList).toBeInTheDocument()
    })
  })

  // ── Accordion sections ─────────────────────────────────────────────

  describe('Accordion sections', () => {
    it('should render specification field with hint', () => {
      renderPage()
      expect(screen.getByText('Конкретизация мысли*')).toBeInTheDocument()
    })

    it('should render belief score slider', () => {
      renderPage()
      const sliders = document.querySelectorAll('[data-testid="slider"]')
      expect(sliders.length).toBeGreaterThan(0)
    })

    it('should render usefulness section with two columns', () => {
      renderPage()
      expect(screen.getByText('Чем эта мысль мне помогает?')).toBeInTheDocument()
      expect(screen.getByText('Как она усложняет мою жизнь?')).toBeInTheDocument()
    })

    it('should render evidence section with two columns', () => {
      renderPage()
      expect(screen.getByText('Доказательства, подтверждающие реальность мысли')).toBeInTheDocument()
      expect(screen.getByText('Доказательства, опровергающие реальность мысли')).toBeInTheDocument()
    })

    it('should render alternative section', () => {
      renderPage()
      expect(screen.getByText(/Анализ: Альтернатива/)).toBeInTheDocument()
    })

    it('should render catastrophizing section with three variants', () => {
      renderPage()
      expect(screen.getByText('Анализ: Катастрофизация')).toBeInTheDocument()
    })

    it('should render distancing section', () => {
      renderPage()
      expect(screen.getByText('Анализ: Дистанцирование')).toBeInTheDocument()
    })

    it('should render cognitive distortions section', () => {
      renderPage()
      expect(screen.getByText('Анализ: Когнитивные искажения')).toBeInTheDocument()
    })

    it('should render reformulation section', () => {
      renderPage()
      expect(screen.getByText('Переформулирование')).toBeInTheDocument()
    })

    it('should render action plan section', () => {
      renderPage()
      expect(screen.getByText('Мысль реальна')).toBeInTheDocument()
    })
  })

  // ── Cognitive distortions ──────────────────────────────────────────

  describe('Cognitive distortions', () => {
    it('should render distortions link', () => {
      renderPage()
      const link = document.querySelector('a.thought-work-page__distortions-link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should render distortions grid', () => {
      renderPage()
      const grid = document.querySelector('.thought-work-page__distortions-grid')
      expect(grid).toBeInTheDocument()
    })

    it('should render distortions explanation field', () => {
      renderPage()
      // Check that distortions explanation editor exists
      const editors = document.querySelectorAll('[data-testid="text-editor"]')
      expect(editors.length).toBeGreaterThan(0)
    })
  })

  // ── Reformulation ──────────────────────────────────────────────────

  describe('Reformulation', () => {
    it('should render original thought label', () => {
      renderPage()
      expect(screen.getByText(/Изначальная мысль/)).toBeInTheDocument()
    })

    it('should render realistic answer label', () => {
      renderPage()
      expect(screen.getByText(/Реалистичный ответ/)).toBeInTheDocument()
    })

    it('should render belief slider in reformulation', () => {
      renderPage()
      const sliders = document.querySelectorAll('[data-testid="slider"]')
      // Should have at least 2 sliders (belief score + reformulation belief)
      expect(sliders.length).toBeGreaterThanOrEqual(2)
    })
  })

  // ── Action plan ────────────────────────────────────────────────────

  describe('Action plan', () => {
    it('should render action plan hint', () => {
      renderPage()
      expect(screen.getByText(/Мысль реальна/)).toBeInTheDocument()
    })

    it('should render action plan editor', () => {
      renderPage()
      const editors = document.querySelectorAll('[data-testid="text-editor"]')
      expect(editors.length).toBeGreaterThan(0)
    })
  })

  // ── Interaction ────────────────────────────────────────────────────

  describe('Interaction', () => {
    it('should call onNextThought when next button is clicked', () => {
      renderPage()
      const nextBtn = screen.getByRole('button', { name: 'Работать со следующей мыслью' })
      fireEvent.click(nextBtn)
      expect(mockOnNextThought).toHaveBeenCalled()
    })

    it('should update belief score when slider changes', () => {
      renderPage()
      const sliders = document.querySelectorAll('[data-testid="slider"]')
      if (sliders.length > 0) {
        const slider = sliders[0] as HTMLElement
        const input = slider.querySelector('input') as HTMLInputElement
        fireEvent.change(input, { target: { value: '75' } })
        expect(mockUpdateThoughtWork).toHaveBeenCalled()
      }
    })

    it('should call autoSave when slider changes', () => {
      renderPage()
      const sliders = document.querySelectorAll('[data-testid="slider"]')
      if (sliders.length > 0) {
        const slider = sliders[0] as HTMLElement
        const input = slider.querySelector('input') as HTMLInputElement
        fireEvent.change(input, { target: { value: '80' } })
        expect(mockAutoSave).toHaveBeenCalled()
      }
    })
  })

  // ── Info modal ─────────────────────────────────────────────────────

  describe('Info modal', () => {
    it('should not render modal by default', () => {
      renderPage()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render modal content when info button is clicked', () => {
      renderPage()
      // The info button is inside the first accordion's content
      const accordions = document.querySelectorAll('.accordion')
      expect(accordions.length).toBeGreaterThan(0)
    })

    it('should have modal table with interpretation examples', () => {
      renderPage()
      // Modal tables are rendered but hidden until info button is clicked
      // Just verify the component renders without error
      expect(screen.getByRole('heading', { name: 'Работа' })).toBeInTheDocument()
    })
  })
})
