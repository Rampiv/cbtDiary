import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { RevealPage } from './RevealPage'
import type { DiaryPage } from '../../../../types/diary'

// Mock antd Slider — компонент виснет в тесте из-за Tiptap
vi.mock('antd', () => ({
  Slider: ({ value, onChange, min, max, tooltip }: {
    value: number
    onChange: (value: number) => void
    min: number
    max: number
    tooltip?: { formatter: (v: number) => string }
  }) => (
    <div data-testid="slider" data-value={value}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {tooltip?.formatter(value)}
    </div>
  ),
}))

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
    {
      id: 'thought-2',
      automaticThought: null,
      emotion: [
        { name: 'Злость', intensity: 50 },
        { name: 'Стыд', intensity: 30 },
      ],
      behavioralReaction: null,
    },
  ],
  thoughtWorks: [],
  ...overrides,
})

describe('RevealPage', () => {
  const mockUpdatePage = vi.fn()
  const mockAutoSave = vi.fn()
  const mockAddThought = vi.fn()
  const mockDeleteThought = vi.fn()
  const mockStartWorkOnThought = vi.fn()
  const mockOnWorkClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  const renderPage = (overrides?: Partial<DiaryPage>) => {
    const page = createMockPage(overrides)
    return render(
      <RevealPage
        page={page}
        updatePage={mockUpdatePage}
        autoSave={mockAutoSave}
        addThought={mockAddThought}
        deleteThought={mockDeleteThought}
        startWorkOnThought={mockStartWorkOnThought}
        onWorkClick={mockOnWorkClick}
      />
    )
  }

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the page title section', () => {
      renderPage()
      expect(screen.getByRole('heading', { name: 'Название страницы' })).toBeInTheDocument()
    })

    it('should render the title input with value', () => {
      renderPage()
      const input = document.getElementById('reveal-page-title-input') as HTMLInputElement
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('Тревога на работе')
    })

    it('should render the resource section', () => {
      renderPage()
      expect(screen.getByRole('heading', { name: 'Ресурс' })).toBeInTheDocument()
    })

    it('should render the identification section', () => {
      renderPage()
      expect(screen.getByRole('heading', { name: 'Выявление' })).toBeInTheDocument()
    })

    it('should render the situation field', () => {
      renderPage()
      const situationLabels = document.querySelectorAll('.reveal-page__label')
      expect(situationLabels[0]).toHaveTextContent('Ситуация')
    })

    it('should render the thoughts table', () => {
      renderPage()
      const table = document.querySelector('table.reveal-page__thoughts-table')
      expect(table).toBeInTheDocument()
    })

    it('should render table headers', () => {
      renderPage()
      const headers = document.querySelectorAll('th .reveal-page__col-header span')
      expect(headers[0]).toHaveTextContent('Автоматическая мысль')
      expect(headers[1]).toHaveTextContent('Эмоциональная реакция')
      expect(headers[2]).toHaveTextContent('Поведенческая реакция')
    })

    it('should render add thought button', () => {
      renderPage()
      const addBtn = screen.getByRole('button', { name: /добавить мысль/i })
      expect(addBtn).toBeInTheDocument()
    })

    it('should render work buttons for each thought', () => {
      renderPage()
      expect(screen.getByRole('button', { name: 'Работать с мыслью 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Работать с мыслью 2' })).toBeInTheDocument()
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have aria-label on title input', () => {
      renderPage()
      const input = document.getElementById('reveal-page-title-input')
      expect(input).toHaveAttribute('aria-label', 'Название страницы')
    })

    it('should have aria-label on situation info button', () => {
      renderPage()
      const situationBtn = document.querySelector('.reveal-page__field .reveal-page__info-btn')
      expect(situationBtn).toHaveAttribute('aria-label', 'Что за ситуация?')
    })

    it('should have scope="col" on table headers', () => {
      renderPage()
      const headers = document.querySelectorAll('th[scope="col"]')
      expect(headers).toHaveLength(3)
    })

    it('should have aria-label on header info buttons', () => {
      renderPage()
      const headerButtons = document.querySelectorAll('.reveal-page__info-btn--header')
      expect(headerButtons[0]).toHaveAttribute('aria-label', 'Что за автоматическая мысль?')
      expect(headerButtons[1]).toHaveAttribute('aria-label', 'Что за эмоциональная реакция?')
      expect(headerButtons[2]).toHaveAttribute('aria-label', 'Что за поведенческая реакция?')
    })

    it('should have aria-label on delete thought buttons', () => {
      renderPage()
      const deleteButtons = document.querySelectorAll('.reveal-page__delete-thought-btn')
      deleteButtons.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-label', 'Удалить мысль')
      })
    })

    it('should have aria-label on emotion remove button', () => {
      renderPage()
      const removeBtns = document.querySelectorAll('.reveal-page__emotion-remove')
      removeBtns.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-label', 'Удалить эмоцию')
      })
    })

    it('should have aria-label on add emotion button', () => {
      renderPage()
      const addEmotionBtn = document.querySelector('.reveal-page__add-emotion-btn')
      expect(addEmotionBtn).toHaveAttribute('aria-label', 'Добавить эмоцию')
    })

    it('should have aria-label on work buttons', () => {
      renderPage()
      const workButtons = document.querySelectorAll('.reveal-page__work-btn')
      expect(workButtons[0]).toHaveAttribute('aria-label', 'Работать с мыслью 1')
      expect(workButtons[1]).toHaveAttribute('aria-label', 'Работать с мыслью 2')
    })

    it('should have aria-label on add thought button', () => {
      renderPage()
      const addBtn = document.querySelector('.reveal-page__add-btn')
      expect(addBtn).toHaveAttribute('aria-label', 'Добавить мысль')
    })

    it('should have aria-label on emotion inputs', () => {
      renderPage()
      const emotionInputs = document.querySelectorAll('.reveal-page__emotion-input')
      expect(emotionInputs[0]).toHaveAttribute('aria-label', 'Название эмоции 1')
      expect(emotionInputs[1]).toHaveAttribute('aria-label', 'Название эмоции 1')
    })
  })

  // ── Delete confirmation dialog ─────────────────────────────────────

  describe('Delete confirmation dialog', () => {
    it('should not render dialog by default', () => {
      renderPage()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('should render dialog when delete is triggered', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'reveal-page-delete-dialog-title')
    })

    it('should have correct title in delete dialog', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      expect(screen.getByRole('heading', { name: 'Удалить мысль?' })).toBeInTheDocument()
    })

    it('should have cancel button in delete dialog', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      expect(cancelBtn).toBeInTheDocument()
    })

    it('should have delete button in delete dialog', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      const deleteDialogBtn = screen.getByRole('button', { name: 'Удалить' })
      expect(deleteDialogBtn).toBeInTheDocument()
    })

    it('should close dialog on cancel click', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('should call deleteThought on confirm', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      expect(mockDeleteThought).toHaveBeenCalledWith('thought-1')
    })

    it('should not call deleteThought on cancel', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

      expect(mockDeleteThought).not.toHaveBeenCalled()
    })

    it('should close dialog on overlay click', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      const overlay = document.querySelector('.reveal-page__modal-overlay')!
      fireEvent.click(overlay)

      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  // ── Info modals ────────────────────────────────────────────────────

  describe('Info modals', () => {
    it('should render situation info modal trigger button', () => {
      renderPage()
      const btn = document.querySelector('.reveal-page__field .reveal-page__info-btn')
      expect(btn).toBeInTheDocument()
    })

    it('should render thought header info button', () => {
      renderPage()
      const btns = document.querySelectorAll('.reveal-page__info-btn--header')
      expect(btns).toHaveLength(3)
    })

    it('should render mobile info buttons in each row', () => {
      renderPage()
      const mobileBtns = document.querySelectorAll('.reveal-page__mobile-header .reveal-page__info-btn')
      // 2 thoughts × 3 columns = 6 mobile info buttons
      expect(mobileBtns).toHaveLength(6)
    })
  })

  // ── Interaction ────────────────────────────────────────────────────

  describe('Interaction', () => {
    it('should call addThought when add button is clicked', () => {
      renderPage()
      const addBtn = screen.getByRole('button', { name: /добавить мысль/i })
      fireEvent.click(addBtn)
      expect(mockAddThought).toHaveBeenCalled()
    })

    it('should call startWorkOnThought when work button is clicked', () => {
      renderPage()
      const workBtn = screen.getByRole('button', { name: 'Работать с мыслью 1' })
      fireEvent.click(workBtn)
      expect(mockStartWorkOnThought).toHaveBeenCalledWith('thought-1')
    })

    it('should call onWorkClick when provided and work button is clicked', () => {
      renderPage()
      const workBtn = screen.getByRole('button', { name: 'Работать с мыслью 1' })
      fireEvent.click(workBtn)
      expect(mockOnWorkClick).toHaveBeenCalledWith('thought-1')
    })

    it('should call deleteThought and close dialog on confirm', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      fireEvent.click(deleteBtns[0])

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      expect(mockDeleteThought).toHaveBeenCalledWith('thought-1')
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('should call deleteThought for second thought', () => {
      renderPage()
      const deleteBtns = document.querySelectorAll('.reveal-page__delete-thought-btn')
      // Click the second thought's first delete button (index 2 = thought-2 mobile)
      fireEvent.click(deleteBtns[2])

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      expect(mockDeleteThought).toHaveBeenCalledWith('thought-2')
    })

    it('should render multiple emotion inputs for thought with multiple emotions', () => {
      renderPage()
      const emotionInputs = document.querySelectorAll('.reveal-page__emotion-input')
      // thought-1: 1 emotion, thought-2: 2 emotions = 3 total
      expect(emotionInputs).toHaveLength(3)
    })

    it('should render emotion remove button only when more than one emotion', () => {
      renderPage({
        thoughts: [
          {
            id: 'thought-1',
            automaticThought: null,
            emotion: [{ name: 'Тревога', intensity: 70 }],
            behavioralReaction: null,
          },
        ],
      })
      const removeBtns = document.querySelectorAll('.reveal-page__emotion-remove')
      expect(removeBtns).toHaveLength(0)
    })

    it('should render emotion remove button when multiple emotions exist', () => {
      renderPage()
      const removeBtns = document.querySelectorAll('.reveal-page__emotion-remove')
      expect(removeBtns).toHaveLength(2)
    })
  })

  // ── Empty state ────────────────────────────────────────────────────

  describe('Empty state', () => {
    it('should render with empty thoughts', () => {
      renderPage({ thoughts: [] })
      const table = document.querySelector('table.reveal-page__thoughts-table')
      expect(table).toBeInTheDocument()
    })

    it('should not render work buttons when no thoughts', () => {
      renderPage({ thoughts: [] })
      expect(screen.queryByRole('button', { name: /Работать с мыслью/i })).toBeNull()
    })

    it('should render with empty title', () => {
      renderPage({ title: '' })
      const input = document.getElementById('reveal-page-title-input') as HTMLInputElement
      expect(input).toHaveValue('')
    })
  })
})
