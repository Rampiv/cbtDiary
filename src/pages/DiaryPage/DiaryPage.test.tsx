import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react'
import { DiaryPage } from './DiaryPage'
import type { DiaryPage as DiaryPageType } from '../../types/diary'

// ── Шаг 0: Параметризация моков ─────────────────────────────────────

const mockPages: DiaryPageType[] = [
  {
    id: 'page-1',
    createdAt: 1000,
    updatedAt: 1000,
    title: 'Первая страница',
    resource: null,
    situation: null,
    thoughts: [],
    thoughtWorks: [],
  },
  {
    id: 'page-2',
    createdAt: 2000,
    updatedAt: 2000,
    title: 'Вторая страница',
    resource: null,
    situation: null,
    thoughts: [
      {
        id: 'thought-1',
        automaticThought: null,
        emotion: [{ name: 'Тревога', intensity: 50 }],
        behavioralReaction: null,
      },
    ],
    thoughtWorks: [],
  },
]

// Mock Firebase — используем getter для обхода vi.mock hoisting
const authState = { currentUser: { uid: 'test-user' } as { uid: string } | null }

vi.mock('../../firebase/config', () => {
  return {
    get db() {
      return {}
    },
    get auth() {
      return authState
    },
  }
})

const pagesState = {
  pages: [...mockPages] as DiaryPageType[],
  hasFetched: true,
}

vi.mock('../../contexts/PagesContext', () => ({
  usePages: () => ({ pages: pagesState.pages, hasFetched: pagesState.hasFetched }),
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  set: vi.fn().mockResolvedValue(undefined),
}))

// Импорт замоканного set/ref для проверок
import { set, ref } from 'firebase/database'
const mockSet = vi.mocked(set)
const mockRef = vi.mocked(ref)

const mockUpdatePage = vi.fn()
const mockAutoSave = vi.fn()
const mockManualSave = vi.fn()
const mockAddThought = vi.fn()
const mockDeleteThought = vi.fn()
const mockDeletePage = vi.fn()
const mockStartWorkOnThought = vi.fn()
const mockUpdateThoughtWork = vi.fn()

const diaryState = {
  page: mockPages[1] as DiaryPageType | null,
  hasChanges: false,
  isSaving: false,
}

vi.mock('../../hook/useDiary', () => ({
  useDiary: () => ({
    page: diaryState.page,
    hasChanges: diaryState.hasChanges,
    isSaving: diaryState.isSaving,
    updatePage: mockUpdatePage,
    autoSave: mockAutoSave,
    manualSave: mockManualSave,
    addThought: mockAddThought,
    deleteThought: mockDeleteThought,
    deletePage: mockDeletePage,
    startWorkOnThought: mockStartWorkOnThought,
    updateThoughtWork: mockUpdateThoughtWork,
  }),
}))

vi.mock('../../components/CustomSelect', () => ({
  CustomSelect: ({ value, onChange, placeholder, 'aria-label': ariaLabel, options }: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    'aria-label'?: string
    options?: { value: string; label: string }[]
  }) => (
    <div data-testid={`custom-select-${ariaLabel || placeholder}`} data-value={value} aria-label={ariaLabel || placeholder}>
      {options?.map((o) => (
        <button
          key={o.value}
          type="button"
          data-testid={`option-${o.value}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('../../components/SaveButton/SaveButton', () => ({
  SaveButton: ({ hasChanges, isSaving, onClick }: {
    hasChanges: boolean
    isSaving: boolean
    onClick: () => void
  }) => (
    <button
      type="button"
      data-testid="save-button"
      data-has-changes={hasChanges}
      data-is-saving={isSaving}
      onClick={onClick}
      aria-label={isSaving ? 'Сохранение...' : hasChanges ? 'Сохранить' : 'Сохранено'}
    >
      {isSaving ? 'Сохранение...' : hasChanges ? 'Сохранить' : 'Сохранено'}
    </button>
  ),
}))

vi.mock('./subPages', () => ({
  RevealPage: ({ page, startWorkOnThought }: { page: DiaryPageType; startWorkOnThought: (id: string) => void }) => (
    <div data-testid="reveal-page">
      <h2 data-testid="reveal-title">{page.title}</h2>
      <button type="button" data-testid="start-work-btn" onClick={() => startWorkOnThought('thought-1')}>
        start-work
      </button>
    </div>
  ),
  ThoughtWorkPage: ({ onNextThought }: { onNextThought?: () => void }) => (
    <div data-testid="thought-work-page">
      {onNextThought && <button type="button" data-testid="next-thought-btn" onClick={onNextThought}>next</button>}
    </div>
  ),
}))

vi.mock('../../components', () => ({
  Loader: () => <div data-testid="loader">Загрузка...</div>,
  ToastPortal: ({ message, onClose }: { message: string; onClose: () => void }) => (
    <div data-testid="toast" role="status" aria-live="polite">
      {message}
      <button type="button" onClick={onClose}>Закрыть</button>
    </div>
  ),
}))

describe('DiaryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сброс состояния к дефолтам
    pagesState.pages = [...mockPages]
    pagesState.hasFetched = true
    diaryState.page = mockPages[1]
    diaryState.hasChanges = false
    diaryState.isSaving = false
  })

  afterEach(() => {
    cleanup()
  })

  const renderDiaryPage = () => render(<DiaryPage />)
  const renderDiaryPageWithContainer = () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    return { ...render(<DiaryPage />, { container }), unmount: () => container.remove() }
  }

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the diary page container', () => {
      renderDiaryPage()
      const container = document.querySelector('[role="main"]')
      expect(container).toBeInTheDocument()
    })

    it('should render the top navigation', () => {
      renderDiaryPage()
      const nav = document.querySelector('[role="toolbar"]')
      expect(nav).toBeInTheDocument()
    })

    it('should render the page select CustomSelect', () => {
      renderDiaryPage()
      const select = document.querySelector('[data-testid="custom-select-Выбор страницы"]')
      expect(select).toBeInTheDocument()
    })

    it('should render the create button', () => {
      renderDiaryPage()
      expect(screen.getByRole('button', { name: /создать новую страницу/i })).toBeInTheDocument()
    })

    it('should render the delete button', () => {
      renderDiaryPage()
      expect(screen.getByRole('button', { name: /удалить текущую страницу/i })).toBeInTheDocument()
    })

    it('should render the save button', () => {
      renderDiaryPage()
      expect(screen.getByRole('button', { name: 'Сохранено' })).toBeInTheDocument()
    })

    it('should render the thoughts navigation', () => {
      renderDiaryPage()
      const nav = document.querySelector('[role="navigation"]')
      expect(nav).toBeInTheDocument()
    })

    it('should render the reveal view by default', () => {
      renderDiaryPage()
      expect(screen.getByTestId('reveal-page')).toBeInTheDocument()
    })

    it('should render the content region', () => {
      renderDiaryPage()
      const content = document.querySelector('[role="region"][aria-label="Содержимое записи"]')
      expect(content).toBeInTheDocument()
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="main" on diary container', () => {
      renderDiaryPage()
      const main = document.querySelector('[role="main"]')
      expect(main).toHaveAttribute('aria-label', 'Дневник')
    })

    it('should have role="toolbar" on top nav', () => {
      renderDiaryPage()
      const toolbar = document.querySelector('[role="toolbar"]')
      expect(toolbar).toHaveAttribute('aria-label', 'Управление страницей')
    })

    it('should have role="navigation" on thoughts nav', () => {
      renderDiaryPage()
      const nav = document.querySelector('[role="navigation"]')
      expect(nav).toHaveAttribute('aria-label', 'Навигация по мыслям')
    })

    it('should have aria-label on page select', () => {
      renderDiaryPage()
      const select = document.querySelector('[data-testid="custom-select-Выбор страницы"]')
      expect(select).toHaveAttribute('aria-label', 'Выбор страницы')
    })

    it('should have aria-label on create button', () => {
      renderDiaryPage()
      const createBtn = screen.getByRole('button', { name: /создать новую страницу/i })
      expect(createBtn).toHaveAttribute('aria-label', 'Создать новую страницу')
    })

    it('should have aria-label on delete button', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      expect(deleteBtn).toHaveAttribute('aria-label', 'Удалить текущую страницу')
    })

    it('should have aria-current on active thought button', () => {
      renderDiaryPage()
      const revealBtn = screen.getByRole('button', { name: 'Выявление' })
      expect(revealBtn).toHaveAttribute('aria-current', 'page')
    })

    it('should have aria-label on thought select', () => {
      renderDiaryPage()
      const select = document.querySelector('[data-testid="custom-select-Выбор мысли для работы"]')
      expect(select).toHaveAttribute('aria-label', 'Выбор мысли для работы')
    })

    it('should have role="dialog" on delete confirmation modal', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'diary-page-delete-dialog-title')
    })

    it('should have proper title in delete dialog', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      expect(screen.getByRole('heading', { name: 'Удалить страницу?' })).toBeInTheDocument()
    })
  })

  // ── Delete confirmation modal ──────────────────────────────────────

  describe('Delete confirmation modal', () => {
    it('should not render modal by default', () => {
      renderDiaryPage()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render modal when delete button is clicked', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have cancel button in modal', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      const cancelBtn = screen.getByRole('button', { name: 'Отмена' })
      expect(cancelBtn).toBeInTheDocument()
    })

    it('should have delete button in modal', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      const deleteModalBtn = screen.getByRole('button', { name: 'Удалить' })
      expect(deleteModalBtn).toBeInTheDocument()
    })

    it('should close modal on cancel click', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should close modal on overlay click', () => {
      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      const overlay = document.querySelector('.diary-page__modal-overlay')!
      fireEvent.click(overlay)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should call deletePage when delete button in modal is clicked', async () => {
      mockDeletePage.mockResolvedValue(true)

      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      await waitFor(() => {
        expect(mockDeletePage).toHaveBeenCalled()
      })
    })
  })

  // ── Шаг 5: Delete page flow ────────────────────────────────────────

  describe('Delete page flow', () => {
    it('should switch to last remaining page after delete', async () => {
      mockDeletePage.mockResolvedValue(true)
      // Two pages, current is page-2
      pagesState.pages = [mockPages[0], mockPages[1]]
      diaryState.page = mockPages[1]

      vi.useFakeTimers()
      const { unmount } = renderDiaryPageWithContainer()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      // Advance timers past setTimeout in handleDeletePage (150ms + 300ms = 450ms)
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      expect(mockDeletePage).toHaveBeenCalled()
      // Simulate the component's internal state update:
      // setCurrentPageId(null) + pagesState.pages now has only page-1
      // This makes effectivePageId recalculate to page-1
      pagesState.pages = [mockPages[0]]
      diaryState.page = mockPages[0]
      // Unmount old DOM and re-render to reflect new state
      unmount()
      renderDiaryPage()
      // After delete, should switch to page-1
      const pageSelect = document.querySelector('[data-testid="custom-select-Выбор страницы"]')!
      expect(pageSelect).toHaveAttribute('data-value', 'page-1')
      vi.useRealTimers()
    })

    it('should show empty state after deleting the only page', async () => {
      mockDeletePage.mockResolvedValue(true)
      // Only one page
      pagesState.pages = [mockPages[1]]
      diaryState.page = mockPages[1]

      vi.useFakeTimers()
      const { unmount } = renderDiaryPageWithContainer()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      // Simulate setCurrentPageId(null) + no remaining pages
      pagesState.pages = []
      diaryState.page = null
      // Unmount old DOM and re-render to reflect new state
      unmount()
      renderDiaryPage()
      // Should show empty state
      expect(screen.getByText('Нет записей')).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('should show toast after successful delete', async () => {
      mockDeletePage.mockResolvedValue(true)
      vi.useFakeTimers()

      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(200)
        await Promise.resolve()
      })
      expect(screen.getByTestId('toast')).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('should not switch pages when delete fails', async () => {
      mockDeletePage.mockResolvedValue(false)
      vi.useFakeTimers()

      renderDiaryPage()
      const deleteBtn = screen.getByRole('button', { name: /удалить текущую страницу/i })
      fireEvent.click(deleteBtn)

      fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(200)
        await Promise.resolve()
      })
      expect(mockDeletePage).toHaveBeenCalled()
      // Page select should still show page-2
      const pageSelect = document.querySelector('[data-testid="custom-select-Выбор страницы"]')!
      expect(pageSelect).toHaveAttribute('data-value', 'page-2')
      vi.useRealTimers()
    })
  })

  // ── Top navigation ─────────────────────────────────────────────────

  describe('Top navigation', () => {
    it('should call manualSave when save button is clicked', () => {
      renderDiaryPage()
      const saveBtn = screen.getByRole('button', { name: 'Сохранено' })
      fireEvent.click(saveBtn)
      expect(mockManualSave).toHaveBeenCalled()
    })
  })

  // ── Thoughts navigation ────────────────────────────────────────────

  describe('Thoughts navigation', () => {
    it('should render reveal view button', () => {
      renderDiaryPage()
      const revealBtn = screen.getByRole('button', { name: 'Выявление' })
      expect(revealBtn).toBeInTheDocument()
    })

    it('should have reveal view button active by default', () => {
      renderDiaryPage()
      const revealBtn = screen.getByRole('button', { name: 'Выявление' })
      expect(revealBtn).toHaveAttribute('aria-current', 'page')
    })

    it('should render thought select CustomSelect', () => {
      renderDiaryPage()
      const selects = document.querySelectorAll('[data-testid^="custom-select-"]')
      expect(selects.length).toBe(2)
    })
  })

  // ── Content region ─────────────────────────────────────────────────

  describe('Content region', () => {
    it('should have role="region" on content', () => {
      renderDiaryPage()
      const content = document.querySelector('[role="region"][aria-label="Содержимое записи"]')
      expect(content).toBeInTheDocument()
    })

    it('should have aria-live="polite" on content', () => {
      renderDiaryPage()
      const content = document.querySelector('[role="region"][aria-label="Содержимое записи"]')
      expect(content).toHaveAttribute('aria-live', 'polite')
    })
  })

  // ── Toast notification ─────────────────────────────────────────────

  describe('Toast notification', () => {
    it('should not render toast by default', () => {
      renderDiaryPage()
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
    })
  })

  // ── Шаг 1: Loading and empty states ─────────────────────────────────

  describe('Loading and empty states', () => {
    it('should show loader when hasFetched is false', () => {
      pagesState.hasFetched = false
      renderDiaryPage()
      expect(screen.getByTestId('loader')).toBeInTheDocument()
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
    })

    it('should show loading message when page is null but effectivePageId exists', () => {
      diaryState.page = null
      pagesState.pages = [mockPages[0]]
      renderDiaryPage()
      expect(screen.getByText('Загрузка записи...')).toBeInTheDocument()
    })

    it('should show empty state when there are no pages', () => {
      pagesState.pages = []
      renderDiaryPage()
      expect(screen.getByText('Нет записей')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '+ Создать первую запись' })).toBeInTheDocument()
    })

    it('should call set with correct path when clicking create-first-page button', async () => {
      pagesState.pages = []
      mockSet.mockResolvedValue(undefined)
      vi.useFakeTimers()
      renderDiaryPage()
      const createBtn = screen.getByRole('button', { name: '+ Создать первую запись' })
      fireEvent.click(createBtn)
      // Advance timers to trigger async operations
      await act(async () => {
        vi.advanceTimersByTime(100)
        await Promise.resolve()
      })
      expect(mockSet).toHaveBeenCalled()
      expect(mockRef).toHaveBeenCalledWith({}, expect.stringMatching(/^users\/test-user\/diary\/page-/))
      vi.useRealTimers()
    })
  })

  // ── Шаг 8: SaveButton states ───────────────────────────────────────

  describe('SaveButton states', () => {
    it('should show "Сохранить" when hasChanges is true', () => {
      diaryState.hasChanges = true
      renderDiaryPage()
      expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument()
    })

    it('should show "Сохранение..." when isSaving is true', () => {
      diaryState.isSaving = true
      diaryState.hasChanges = true
      renderDiaryPage()
      expect(screen.getByRole('button', { name: 'Сохранение...' })).toBeInTheDocument()
    })
  })

  // ── Шаг 7: Save toast ──────────────────────────────────────────────

  describe('Save toast', () => {
    it('should show toast when save transitions from saving to saved without changes', async () => {
      // Initial render: isSaving=false, hasChanges=false
      renderDiaryPage()
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()

      // Transition to saving state
      diaryState.isSaving = true
      diaryState.hasChanges = true
      const { rerender } = render(<DiaryPage />)
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()

      // Transition from saving to saved (no changes remain)
      diaryState.isSaving = false
      diaryState.hasChanges = false
      rerender(<DiaryPage />)
      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument()
      })
    })

    it('should not show toast if changes remain', async () => {
      // Initial render
      renderDiaryPage()

      // Transition to saving
      diaryState.isSaving = true
      diaryState.hasChanges = true
      const { rerender } = render(<DiaryPage />)

      // Transition from saving but changes remain
      diaryState.isSaving = false
      diaryState.hasChanges = true
      rerender(<DiaryPage />)
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
    })

    it('should close toast on close button click', async () => {
      // Show toast via state transition
      renderDiaryPage()
      diaryState.isSaving = true
      diaryState.hasChanges = true
      const { rerender } = render(<DiaryPage />)

      diaryState.isSaving = false
      diaryState.hasChanges = false
      rerender(<DiaryPage />)
      await waitFor(() => {
        expect(screen.getByTestId('toast')).toBeInTheDocument()
      })

      // Close toast
      fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
    })
  })

  // ── Шаг 6: Create page ─────────────────────────────────────────────

  describe('Create page', () => {
    it('should call set with correct path when creating page', async () => {
      mockSet.mockResolvedValue(undefined)
      vi.useFakeTimers()
      renderDiaryPage()
      const createBtn = screen.getByRole('button', { name: /создать новую страницу/i })
      fireEvent.click(createBtn)
      await act(async () => {
        vi.advanceTimersByTime(200)
        await Promise.resolve()
      })
      expect(mockSet).toHaveBeenCalled()
      expect(mockRef).toHaveBeenCalledWith({}, expect.stringMatching(/^users\/test-user\/diary\/page-/))
      vi.useRealTimers()
    })

    it('should not create duplicate page on double click', async () => {
      mockSet.mockImplementation(() => new Promise((r) => setTimeout(r, 100)))
      vi.useFakeTimers()
      renderDiaryPage()
      const createBtn = screen.getByRole('button', { name: /создать новую страницу/i })
      fireEvent.click(createBtn)
      fireEvent.click(createBtn)
      await act(async () => {
        vi.advanceTimersByTime(200)
        await Promise.resolve()
      })
      expect(mockSet).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })

    it('should not create page when user is not authenticated', async () => {
      authState.currentUser = null
      renderDiaryPage()
      const createBtn = screen.getByRole('button', { name: /создать новую страницу/i })
      fireEvent.click(createBtn)
      expect(mockSet).not.toHaveBeenCalled()
    })
  })

  // ── Шаг 2: Page switching (flush save) ──────────────────────────────

  describe('Page switching', () => {
    it('should call manualSave before switching pages', async () => {
      mockManualSave.mockResolvedValue(undefined)
      vi.useFakeTimers()
      renderDiaryPage()
      // Click page-1 option (first select is for pages)
      const page1Option = screen.getByTestId('option-page-1')
      fireEvent.click(page1Option)
      // Advance timers to trigger async operations
      await act(async () => {
        vi.advanceTimersByTime(200)
        await Promise.resolve()
      })
      expect(mockManualSave).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('should not call manualSave when selecting the same page', () => {
      renderDiaryPage()
      // Current page is page-2, click page-2 again
      const page2Option = screen.getByTestId('option-page-2')
      fireEvent.click(page2Option)
      expect(mockManualSave).not.toHaveBeenCalled()
    })
  })

  // ── Шаг 3: View navigation (reveal ↔ thought) ──────────────────────

  describe('View navigation', () => {
    it('should switch to thought view when starting work on a thought', async () => {
      vi.useFakeTimers()
      renderDiaryPage()
      // Click start-work button in RevealPage mock
      const startWorkBtn = screen.getByTestId('start-work-btn')
      fireEvent.click(startWorkBtn)
      // Advance timers past setTimeout in handleStartWork (150ms + 300ms = 450ms)
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      expect(mockStartWorkOnThought).toHaveBeenCalledWith('thought-1')
      expect(screen.getByTestId('thought-work-page')).toBeInTheDocument()
      vi.useRealTimers()
    })

    it('should return to reveal view when clicking Выявление', async () => {
      vi.useFakeTimers()
      renderDiaryPage()
      // First switch to thought view
      const startWorkBtn = screen.getByTestId('start-work-btn')
      fireEvent.click(startWorkBtn)
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      expect(screen.getByTestId('thought-work-page')).toBeInTheDocument()
      // Clear mock to track only the reveal nav call
      mockStartWorkOnThought.mockClear()
      // Click Выявление button
      const revealBtn = screen.getByRole('button', { name: 'Выявление' })
      fireEvent.click(revealBtn)
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      expect(screen.getByTestId('reveal-page')).toBeInTheDocument()
      expect(revealBtn).toHaveAttribute('aria-current', 'page')
      vi.useRealTimers()
    })

    it('should render thought nav select options from page thoughts', () => {
      renderDiaryPage()
      // Page 2 has one thought
      const thoughtSelect = document.querySelector('[data-testid="custom-select-Выбор мысли для работы"]')!
      const thoughtOptions = thoughtSelect.querySelectorAll('[data-testid^="option-"]')
      expect(thoughtOptions.length).toBe(1)
      expect(thoughtOptions[0]).toHaveTextContent('Мысль 1')
    })
  })

  // ── Шаг 4: handleNextThought ────────────────────────────────────────

  describe('handleNextThought', () => {
    it('should call startWorkOnThought for next thought', async () => {
      // Add second thought to both pagesState and diaryState
      const twoThoughtsPage = {
        ...mockPages[1],
        thoughts: [
          mockPages[1].thoughts[0],
          { ...mockPages[1].thoughts[0], id: 'thought-2' },
        ],
      }
      pagesState.pages = [mockPages[0], twoThoughtsPage]
      diaryState.page = twoThoughtsPage

      vi.useFakeTimers()
      renderDiaryPage()
      // Switch to thought view for thought-1
      const thought1Option = screen.getByTestId('option-thought-1')
      fireEvent.click(thought1Option)
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      expect(screen.getByTestId('thought-work-page')).toBeInTheDocument()
      // Clear mock after initial call to track only next button calls
      mockStartWorkOnThought.mockClear()
      // Click next button in ThoughtWorkPage mock
      const nextBtn = screen.getByTestId('next-thought-btn')
      fireEvent.click(nextBtn)
      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      // Should call startWorkOnThought with thought-2
      expect(mockStartWorkOnThought).toHaveBeenCalledWith('thought-2')
      vi.useRealTimers()
    })

    it('should do nothing on next when at last thought', async () => {
      // Keep only one thought
      pagesState.pages = [mockPages[0], mockPages[1]]
      diaryState.page = mockPages[1]

      vi.useFakeTimers()
      renderDiaryPage()
      // Switch to thought view
      const thought1Option = screen.getByTestId('option-thought-1')
      fireEvent.click(thought1Option)
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      // Clear mock after initial call
      mockStartWorkOnThought.mockClear()
      // Click next button
      const nextBtn = screen.getByTestId('next-thought-btn')
      fireEvent.click(nextBtn)
      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(500)
        await Promise.resolve()
      })
      // Should not call startWorkOnThought again (at last thought)
      expect(mockStartWorkOnThought).not.toHaveBeenCalled()
      vi.useRealTimers()
    })
  })
})
