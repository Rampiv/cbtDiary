import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ProfilePage } from './ProfilePage'
import type { DiaryPage } from '../../types/diary'
import { reauthenticateWithCredential, updatePassword, type User, type UserCredential } from 'firebase/auth'

// Mock Firebase auth
const mockUser = { email: 'test@example.com' }
const authState = { currentUser: mockUser as { email: string } | null }

vi.mock('../../firebase/config', () => ({
  get auth() { return authState },
}))

// Mock Firebase auth functions
vi.mock('firebase/auth', () => ({
  EmailAuthProvider: {
    credential: vi.fn(() => ({ providerId: 'password', userId: 'test' })),
  },
  reauthenticateWithCredential: vi.fn().mockResolvedValue(undefined),
  updatePassword: vi.fn().mockResolvedValue(undefined),
}))

// Mock useTheme
const mockToggleTheme = vi.fn()
const themeState = { theme: 'light' as 'light' | 'dark' }

vi.mock('../../contexts', () => ({
  get useTheme() {
    return () => ({ theme: themeState.theme, toggleTheme: mockToggleTheme })
  },
}))

// Mock CustomSelect
vi.mock('../../components/CustomSelect', () => ({
  CustomSelect: ({ value, onChange, options = [], placeholder, 'aria-label': ariaLabel }: {
    value: string
    onChange: (value: string) => void
    options?: { value: string; label: string }[]
    placeholder?: string
    'aria-label'?: string
  }) => (
    <div data-testid="custom-select" data-value={value} aria-label={ariaLabel || placeholder}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-testid={`option-${opt.value}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}))

// Mock ToastPortal
vi.mock('../../components', () => ({
  ToastPortal: ({ message, type, onClose }: { message: string; type: string; onClose: () => void }) => (
    <div data-testid="toast" role="alert" data-type={type}>
      <span>{message}</span>
      <button type="button" onClick={onClose}>Закрыть</button>
    </div>
  ),
}))

// Mock docxGenerator
vi.mock('../../utils/docxGenerator', () => ({
  generateAllPagesDocx: vi.fn().mockResolvedValue(undefined),
  generatePageDocx: vi.fn().mockResolvedValue(undefined),
}))

import { generateAllPagesDocx, generatePageDocx } from '../../utils/docxGenerator'

const mockGenerateAll = vi.mocked(generateAllPagesDocx)
const mockGeneratePage = vi.mocked(generatePageDocx)

const mockPages: DiaryPage[] = [
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
    thoughts: [],
    thoughtWorks: [],
  },
]

const renderProfilePage = (pages: DiaryPage[] = mockPages) =>
  render(<ProfilePage pages={pages} sortedPages={[...pages].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))} />)

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    themeState.theme = 'light'
    authState.currentUser = mockUser
    vi.mocked(generateAllPagesDocx).mockReset().mockResolvedValue(undefined)
    vi.mocked(generatePageDocx).mockReset().mockResolvedValue(undefined)
    vi.mocked(reauthenticateWithCredential).mockReset().mockResolvedValue({ user: mockUser as unknown as User } as UserCredential)
    vi.mocked(updatePassword).mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the page container', () => {
      renderProfilePage()
      const main = document.querySelector('[role="main"]')
      expect(main).toBeInTheDocument()
    })

    it('should render user email', () => {
      renderProfilePage()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should render profile section title', () => {
      renderProfilePage()
      expect(screen.getByRole('heading', { name: 'Профиль' })).toBeInTheDocument()
    })

    it('should render theme section', () => {
      renderProfilePage()
      expect(screen.getByRole('heading', { name: 'Тема оформления' })).toBeInTheDocument()
    })

    it('should render password change form', () => {
      renderProfilePage()
      expect(screen.getByRole('heading', { name: 'Смена пароля' })).toBeInTheDocument()
    })

    it('should render all three password fields', () => {
      renderProfilePage()
      const inputs = document.querySelectorAll('.profile-page__input')
      expect(inputs.length).toBe(3)
    })

    it('should render submit button', () => {
      renderProfilePage()
      expect(screen.getByRole('button', { name: 'Изменить пароль' })).toBeInTheDocument()
    })

    it('should render export section', () => {
      renderProfilePage()
      expect(screen.getByRole('heading', { name: 'Экспорт в docx' })).toBeInTheDocument()
    })

    it('should render download all button', () => {
      renderProfilePage()
      expect(screen.getByRole('button', { name: /Скачать все страницы/ })).toBeInTheDocument()
    })

    it('should render download selected button', () => {
      renderProfilePage()
      expect(screen.getByRole('button', { name: 'Скачать выбранную страницу' })).toBeInTheDocument()
    })

    it('should render legal section', () => {
      renderProfilePage()
      expect(screen.getByRole('heading', { name: 'Правовая информация' })).toBeInTheDocument()
    })

    it('should render privacy link', () => {
      renderProfilePage()
      expect(screen.getByRole('link', { name: /Политика конфиденциальности/ })).toBeInTheDocument()
    })

    it('should show empty state when no pages', () => {
      renderProfilePage([])
      expect(screen.getByText(/У вас пока нет записей для экспорта/)).toBeInTheDocument()
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="main" on page container with aria-label', () => {
      renderProfilePage()
      const main = document.querySelector('[role="main"]')
      expect(main).toHaveAttribute('aria-label', 'Профиль пользователя')
    })

    it('should have aria-required on password inputs', () => {
      renderProfilePage()
      const inputs = document.querySelectorAll('.profile-page__input')
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('aria-required', 'true')
      })
    })

    it('should have aria-checked on theme switch', () => {
      renderProfilePage()
      const toggle = document.querySelector('[role="switch"]')
      expect(toggle).toBeInTheDocument()
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('should have aria-label on theme switch', () => {
      renderProfilePage()
      const toggle = document.querySelector('[role="switch"]')
      expect(toggle).toHaveAttribute('aria-label', 'Переключить тему')
    })

    it('should have aria-label on download all button', () => {
      renderProfilePage()
      const btn = document.querySelector('.profile-page__download-all')
      expect(btn).toHaveAttribute('aria-label', 'Скачать все страницы (2)')
    })

    it('should have aria-label on download selected button', () => {
      renderProfilePage()
      const btn = document.querySelector('.profile-page__download-selected')
      expect(btn).toHaveAttribute('aria-label', 'Скачать выбранную страницу')
    })

    it('should have id attributes on password inputs', () => {
      renderProfilePage()
      expect(document.getElementById('current-password')).toBeInTheDocument()
      expect(document.getElementById('new-password')).toBeInTheDocument()
      expect(document.getElementById('confirm-password')).toBeInTheDocument()
    })

    it('should have labels with htmlFor on password fields', () => {
      renderProfilePage()
      const labels = document.querySelectorAll('label[for]')
      expect(labels.length).toBe(3)
    })

    it('should render progress bar with full aria attributes when generating', async () => {
      mockGenerateAll.mockImplementation(() => new Promise(r => setTimeout(r, 1000)))
      renderProfilePage()
      fireEvent.click(screen.getByRole('button', { name: /Скачать все страницы/ }))
      await waitFor(() => {
        const pb = document.querySelector('[role="progressbar"]')
        expect(pb).toHaveAttribute('aria-valuenow', '0')
        expect(pb).toHaveAttribute('aria-valuemin', '0')
        expect(pb).toHaveAttribute('aria-valuemax', '2')
        expect(pb).toHaveAttribute('aria-label', 'Прогресс экспорта')
      })
    })

    it('should announce progress via aria-live', async () => {
      mockGenerateAll.mockImplementation(() => new Promise(r => setTimeout(r, 1000)))
      renderProfilePage()
      fireEvent.click(screen.getByRole('button', { name: /Скачать все страницы/ }))
      await waitFor(() => {
        expect(
          document.querySelector('.profile-page__download-all span[aria-live="polite"]'),
        ).toBeInTheDocument()
      })
    })

    it('should have role="status" on empty message', () => {
      renderProfilePage([])
      const empty = document.querySelector('[role="status"]')
      expect(empty).toBeInTheDocument()
    })

    it('should have aria-label on privacy link', () => {
      renderProfilePage()
      const link = document.querySelector('.profile-page__privacy-link')
      expect(link).toHaveAttribute('aria-label')
    })

    it('should have aria-label on password toggle button', () => {
      renderProfilePage()
      const toggleBtn = document.querySelector('.profile-page__toggle-password')
      expect(toggleBtn).toHaveAttribute('aria-label', 'Показать пароль')
    })

    it('should have proper heading hierarchy', () => {
      renderProfilePage()
      const h2s = document.querySelectorAll('h2')
      expect(h2s.length).toBe(5)
    })

    it('should have aria-labelledby pointing to existing heading in each section', () => {
      renderProfilePage()
      const sections = document.querySelectorAll('.profile-page__section')
      expect(sections.length).toBeGreaterThan(0)
      sections.forEach((section) => {
        const labelledBy = section.getAttribute('aria-labelledby')
        expect(labelledBy).toBeTruthy()
        expect(section.querySelector(`#${labelledBy}`)).toBeInTheDocument()
      })
    })
  })

  // ── Theme toggle ───────────────────────────────────────────────────

  describe('Theme toggle', () => {
    it('should call toggleTheme when switch is clicked', () => {
      renderProfilePage()
      const toggle = document.querySelector('[role="switch"]')!
      fireEvent.click(toggle)
      expect(mockToggleTheme).toHaveBeenCalled()
    })

    it('should reflect dark theme on switch', () => {
      themeState.theme = 'dark'
      renderProfilePage()
      const toggle = document.querySelector('[role="switch"]')!
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })
  })

  // ── Password form ──────────────────────────────────────────────────

  describe('Password form', () => {
    it('should show error toast when new password is too short', () => {
      renderProfilePage()
      fireEvent.change(document.getElementById('current-password')!, { target: { value: 'pass123' } })
      fireEvent.change(document.getElementById('new-password')!, { target: { value: '123' } })
      fireEvent.change(document.getElementById('confirm-password')!, { target: { value: '123' } })
      fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }))

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveAttribute('data-type', 'error')
      expect(toast).toHaveTextContent('Пароль должен содержать минимум 6 символов')
    })

    it('should show error toast when passwords do not match', () => {
      renderProfilePage()
      fireEvent.change(document.getElementById('current-password')!, { target: { value: 'pass123' } })
      fireEvent.change(document.getElementById('new-password')!, { target: { value: 'newpass1' } })
      fireEvent.change(document.getElementById('confirm-password')!, { target: { value: 'different' } })
      fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }))

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveAttribute('data-type', 'error')
      expect(toast).toHaveTextContent('Пароли не совпадают')
    })

    it('should show success toast and clear fields on successful password change', async () => {
      renderProfilePage()
      const current = document.getElementById('current-password') as HTMLInputElement
      const newP = document.getElementById('new-password') as HTMLInputElement
      const confirm = document.getElementById('confirm-password') as HTMLInputElement
      fireEvent.change(current, { target: { value: 'pass123' } })
      fireEvent.change(newP, { target: { value: 'newpass1' } })
      fireEvent.change(confirm, { target: { value: 'newpass1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }))

      await waitFor(() => {
        const toast = screen.getByTestId('toast')
        expect(toast).toHaveAttribute('data-type', 'success')
        expect(toast).toHaveTextContent('Пароль успешно изменён')
      })
      expect(current.value).toBe('')
      expect(newP.value).toBe('')
      expect(confirm.value).toBe('')
    })

    it('should disable submit button while loading and re-enable after', async () => {
      vi.mocked(updatePassword).mockImplementation(() => new Promise<void>(r => setTimeout(r, 100)))
      renderProfilePage()
      fireEvent.change(document.getElementById('current-password')!, { target: { value: 'pass123' } })
      fireEvent.change(document.getElementById('new-password')!, { target: { value: 'newpass1' } })
      fireEvent.change(document.getElementById('confirm-password')!, { target: { value: 'newpass1' } })

      fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Изменение...' })).toBeDisabled()
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Изменить пароль' })).not.toBeDisabled()
      })
    })

    it('should toggle password visibility', () => {
      renderProfilePage()
      const currentInput = document.getElementById('current-password')!
      const toggleBtn = document.querySelector('.profile-page__toggle-password')!

      expect(currentInput).toHaveAttribute('type', 'password')
      fireEvent.click(toggleBtn)
      expect(currentInput).toHaveAttribute('type', 'text')
      expect(toggleBtn).toHaveAttribute('aria-label', 'Скрыть пароль')
    })

    it('should show error toast on wrong current password', async () => {
      vi.mocked(reauthenticateWithCredential).mockRejectedValueOnce({ code: 'auth/wrong-password' })
      renderProfilePage()
      fireEvent.change(document.getElementById('current-password')!, { target: { value: 'bad' } })
      fireEvent.change(document.getElementById('new-password')!, { target: { value: 'newpass1' } })
      fireEvent.change(document.getElementById('confirm-password')!, { target: { value: 'newpass1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }))
      await waitFor(() => {
        const toast = screen.getByTestId('toast')
        expect(toast).toHaveAttribute('data-type', 'error')
        expect(toast).toHaveTextContent('Неверный текущий пароль')
      })
    })

    it('should show error toast on weak password', async () => {
      vi.mocked(reauthenticateWithCredential).mockResolvedValueOnce({ user: mockUser as unknown as User } as UserCredential)
      vi.mocked(updatePassword).mockRejectedValueOnce({ code: 'auth/weak-password' })
      renderProfilePage()
      fireEvent.change(document.getElementById('current-password')!, { target: { value: 'pass123' } })
      fireEvent.change(document.getElementById('new-password')!, { target: { value: 'newpass1' } })
      fireEvent.change(document.getElementById('confirm-password')!, { target: { value: 'newpass1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }))
      await waitFor(() => {
        const toast = screen.getByTestId('toast')
        expect(toast).toHaveAttribute('data-type', 'error')
        expect(toast).toHaveTextContent('Пароль слишком простой')
      })
    })

    it('should show generic error toast on unknown error', async () => {
      vi.mocked(reauthenticateWithCredential).mockResolvedValueOnce({ user: mockUser as unknown as User } as UserCredential)
      vi.mocked(updatePassword).mockRejectedValueOnce({ code: 'auth/network-request-failed' })
      renderProfilePage()
      fireEvent.change(document.getElementById('current-password')!, { target: { value: 'pass123' } })
      fireEvent.change(document.getElementById('new-password')!, { target: { value: 'newpass1' } })
      fireEvent.change(document.getElementById('confirm-password')!, { target: { value: 'newpass1' } })
      fireEvent.click(screen.getByRole('button', { name: 'Изменить пароль' }))
      await waitFor(() => {
        const toast = screen.getByTestId('toast')
        expect(toast).toHaveAttribute('data-type', 'error')
        expect(toast).toHaveTextContent('Ошибка смены пароля')
      })
    })
  })

  // ── Export ───────────────────────────────────────────────────────────

  describe('Export', () => {
    it('should call generateAllPagesDocx when download all is clicked', async () => {
      renderProfilePage()
      const downloadBtn = screen.getByRole('button', { name: /Скачать все страницы/ })
      fireEvent.click(downloadBtn)

      await waitFor(() => {
        expect(mockGenerateAll).toHaveBeenCalled()
      })
    })

    it('should call generatePageDocx with selected page and its index', async () => {
      renderProfilePage()
      fireEvent.click(screen.getByTestId('option-page-2'))
      fireEvent.click(screen.getByRole('button', { name: 'Скачать выбранную страницу' }))

      await waitFor(() => {
        expect(mockGeneratePage).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'page-2' }),
          0,
        )
      })
    })

    it('should pass correct index for second page', async () => {
      renderProfilePage()
      fireEvent.click(screen.getByTestId('option-page-1'))
      fireEvent.click(screen.getByRole('button', { name: 'Скачать выбранную страницу' }))

      await waitFor(() => {
        expect(mockGeneratePage).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'page-1' }),
          1,
        )
      })
    })

    it('should show success toast after exporting selected page', async () => {
      renderProfilePage()
      fireEvent.click(screen.getByTestId('option-page-2'))
      fireEvent.click(screen.getByRole('button', { name: 'Скачать выбранную страницу' }))

      await waitFor(() => {
        const toast = screen.getByTestId('toast')
        expect(toast).toHaveAttribute('data-type', 'success')
        expect(toast).toHaveTextContent('Документ создан')
      })
    })

    it('should show error toast when generateAllPagesDocx fails', async () => {
      mockGenerateAll.mockRejectedValueOnce(new Error('fail'))
      renderProfilePage()
      fireEvent.click(screen.getByRole('button', { name: /Скачать все страницы/ }))
      await waitFor(() => {
        const toast = screen.getByTestId('toast')
        expect(toast).toHaveAttribute('data-type', 'error')
        expect(toast).toHaveTextContent('Ошибка экспорта')
      })
    })

    it('should show error toast when generatePageDocx fails', async () => {
      mockGeneratePage.mockRejectedValueOnce(new Error('fail'))
      renderProfilePage()
      fireEvent.click(screen.getByTestId('option-page-2'))
      fireEvent.click(screen.getByRole('button', { name: 'Скачать выбранную страницу' }))
      await waitFor(() => {
        const toast = screen.getByTestId('toast')
        expect(toast).toHaveAttribute('data-type', 'error')
        expect(toast).toHaveTextContent('Ошибка создания документа')
      })
    })

    it('should hide progress bar after export completes', async () => {
      mockGenerateAll.mockResolvedValueOnce(undefined)
      renderProfilePage()
      fireEvent.click(screen.getByRole('button', { name: /Скачать все страницы/ }))

      await waitFor(() => {
        expect(document.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
      })
    })

    it('should disable download selected button when no page selected', () => {
      renderProfilePage()
      expect(screen.getByRole('button', { name: 'Скачать выбранную страницу' })).toBeDisabled()
    })

    it('should not render export buttons when no pages', () => {
      renderProfilePage([])
      const downloadBtn = document.querySelector('.profile-page__download-all')
      expect(downloadBtn).not.toBeInTheDocument()
    })
  })

  // ── Privacy link ────────────────────────────────────────────────────

  describe('Privacy link', () => {
    it('should link to /privacy', () => {
      renderProfilePage()
      const link = document.querySelector('.profile-page__privacy-link')
      expect(link).toHaveAttribute('href', '/privacy')
    })
  })
})
