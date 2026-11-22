import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { AuthPage } from './AuthPage'

let mockSignIn: ReturnType<typeof vi.fn>
let mockCreateUser: ReturnType<typeof vi.fn>
let mockSendReset: ReturnType<typeof vi.fn>
let mockAuth: { currentUser: unknown }

vi.mock('../../firebase/config', () => {
  return {
    get auth() {
      return mockAuth
    },
  }
})

vi.mock('firebase/auth', () => {
  return {
    get signInWithEmailAndPassword() {
      return mockSignIn
    },
    get createUserWithEmailAndPassword() {
      return mockCreateUser
    },
    get sendPasswordResetEmail() {
      return mockSendReset
    },
  }
})

describe('AuthPage', () => {
  beforeEach(() => {
    mockSignIn = vi.fn()
    mockCreateUser = vi.fn()
    mockSendReset = vi.fn()
    mockAuth = { currentUser: null }
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the front side by default', () => {
      render(<AuthPage />)
      expect(screen.getByRole('heading', { name: 'Дневник мыслей' })).toBeInTheDocument()
    })

    it('should show front content with icon and description', () => {
      render(<AuthPage />)
      expect(screen.getByAltText('Дневник мыслей')).toBeInTheDocument()
      expect(screen.getByText(/Это приложение создано для людей/)).toBeInTheDocument()
    })

    it('should have a button to go to auth form', () => {
      render(<AuthPage />)
      const btn = screen.getByRole('button', { name: 'Перейти к авторизации' })
      expect(btn).toBeInTheDocument()
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="tablist" on tab container', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const tablist = document.querySelector('[role="tablist"]')
      expect(tablist).toBeInTheDocument()
      expect(tablist).toHaveAttribute('aria-label', 'Авторизация или регистрация')
    })

    it('should have role="tab" and aria-selected on tab buttons', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const tabs = document.querySelectorAll('[role="tab"]')
      expect(tabs).toHaveLength(2)

      expect(tabs[0]).toHaveAttribute('role', 'tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[0]).toHaveAttribute('aria-controls')

      expect(tabs[1]).toHaveAttribute('role', 'tab')
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(tabs[1]).toHaveAttribute('aria-controls')
    })

    it('should have aria-hidden on SVG icons', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const svgs = document.querySelectorAll('svg')
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
        expect(svg).toHaveAttribute('focusable', 'false')
      })
    })

    it('should have aria-required on required fields', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      expect(emailInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('aria-required', 'true')
    })

    it('should have aria-busy on submit button when loading', async () => {
      mockSignIn.mockReturnValue(new Promise(() => {}))

      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

      const loadingButtons = screen.getAllByRole('button', { name: 'Загрузка...' })
      const submitBtn = loadingButtons.find(btn => btn.getAttribute('type') === 'submit')!

      expect(submitBtn).toHaveAttribute('aria-busy', 'true')
      expect(submitBtn).toBeDisabled()
    })

    it('should have role="alert" on error message', async () => {
      mockSignIn.mockRejectedValue({ code: 'auth/wrong-password' })

      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrong' } })
      fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

      await waitFor(() => {
        const errorEl = document.querySelector('[role="alert"]')
        expect(errorEl).toBeInTheDocument()
        expect(errorEl).toHaveTextContent('Неверный пароль')
      })
    })

    it('should have role="status" and aria-live on success message', async () => {
      mockSendReset.mockResolvedValue(undefined)

      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })

      fireEvent.click(screen.getByRole('button', { name: 'Забыли пароль?' }))

      const submitBtn = screen.getByRole('button', { name: 'Отправить ссылку' })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        const statusEl = document.querySelector('[role="status"]')
        expect(statusEl).toBeInTheDocument()
        expect(statusEl).toHaveAttribute('aria-live', 'polite')
        expect(statusEl).toHaveTextContent('test@test.com')
      })
    })

    it('should have autocomplete attributes on inputs', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      expect(emailInput).toHaveAttribute('autocomplete', 'email')
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })

    it('should have aria-label on toggle password button', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const toggleBtn = document.querySelector('.auth__toggle-password')
      expect(toggleBtn).toHaveAttribute('aria-label', 'Показать пароль')
    })
  })

  // ── Interaction ────────────────────────────────────────────────────

  describe('Interaction', () => {
    it('should flip to back side when auth button is clicked', () => {
      render(<AuthPage />)
      expect(screen.getByRole('heading', { name: 'Дневник мыслей' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      expect(screen.getByRole('heading', { name: 'С возвращением!' })).toBeInTheDocument()
    })

    it('should flip back to front when back button is clicked', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      expect(screen.getByRole('heading', { name: 'С возвращением!' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Назад к описанию' }))

      expect(screen.getByRole('heading', { name: 'Дневник мыслей' })).toBeInTheDocument()
    })

    it('should switch between login and register tabs', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      expect(screen.getByRole('heading', { name: 'С возвращением!' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('tab', { name: 'Регистрация', selected: false }))

      expect(screen.getByRole('heading', { name: 'Создайте аккаунт' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('tab', { name: 'Вход', selected: false }))

      expect(screen.getByRole('heading', { name: 'С возвращением!' })).toBeInTheDocument()
    })

    it('should show password when toggle button is clicked', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const passwordInput = document.getElementById('password') as HTMLInputElement
      expect(passwordInput.type).toBe('password')

      fireEvent.click(screen.getByRole('button', { name: 'Показать пароль' }))
      expect(passwordInput.type).toBe('text')

      fireEvent.click(screen.getByRole('button', { name: 'Скрыть пароль' }))
      expect(passwordInput.type).toBe('password')
    })

    it('should enter reset mode when forgot password is clicked', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      fireEvent.click(screen.getByRole('button', { name: 'Забыли пароль?' }))

      expect(screen.getByRole('heading', { name: 'Восстановление пароля' })).toBeInTheDocument()
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('should return to login from reset mode', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))
      fireEvent.click(screen.getByRole('button', { name: 'Забыли пароль?' }))

      expect(screen.getByRole('heading', { name: 'Восстановление пароля' })).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: '← Вернуться ко входу' }))

      expect(screen.getByRole('heading', { name: 'С возвращением!' })).toBeInTheDocument()
    })

    it('should call signInWithEmailAndPassword on login', async () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      await fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

      expect(mockSignIn).toHaveBeenCalledWith(mockAuth, 'test@test.com', 'password123')
    })

    it('should call createUserWithEmailAndPassword on register', async () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))
      fireEvent.click(screen.getByRole('tab', { name: 'Регистрация', selected: false }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'new@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      await fireEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

      expect(mockCreateUser).toHaveBeenCalledWith(mockAuth, 'new@test.com', 'password123')
    })

    it('should call sendPasswordResetEmail on reset', async () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))
      fireEvent.click(screen.getByRole('button', { name: 'Забыли пароль?' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'reset@test.com' } })

      await fireEvent.click(screen.getByRole('button', { name: 'Отправить ссылку' }))

      expect(mockSendReset).toHaveBeenCalledWith(mockAuth, 'reset@test.com')
    })

    it('should show error message on auth failure', async () => {
      mockSignIn.mockRejectedValue({ code: 'auth/invalid-email' })

      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.change(passwordInput, { target: { value: 'pass' } })

      await fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Некорректный формат email')
      })
    })

    it('should disable all inputs during loading', async () => {
      mockSignIn.mockReturnValue(new Promise(() => {}))

      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()

      const loadingButtons = screen.getAllByRole('button', { name: 'Загрузка...' })
      const submitBtn = loadingButtons.find(btn => btn.getAttribute('type') === 'submit')!
      expect(submitBtn).toBeDisabled()
    })

    it('should reset error on new submit', async () => {
      mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' })

      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailInput = document.getElementById('email') as HTMLInputElement
      const passwordInput = document.getElementById('password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrong' } })
      await fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      fireEvent.change(passwordInput, { target: { value: 'correct' } })
      mockSignIn.mockResolvedValue(undefined)
      await fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  // ── A11y edge cases ────────────────────────────────────────────────

  describe('A11y edge cases', () => {
    it('should have form with noValidate attribute', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const form = document.querySelector('form')
      expect(form).toHaveAttribute('noValidate')
    })

    it('should have label elements for inputs', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const emailLabel = document.querySelector('label[for="email"]')
      const passwordLabel = document.querySelector('label[for="password"]')

      expect(emailLabel).toBeInTheDocument()
      expect(emailLabel).toHaveTextContent('Email')
      expect(passwordLabel).toBeInTheDocument()
      expect(passwordLabel).toHaveTextContent('Пароль')
    })

    it('should have proper heading hierarchy', () => {
      render(<AuthPage />)

      const h1 = document.querySelector('h1')
      const h2 = document.querySelector('h2')

      expect(h1).toBeInTheDocument()
      expect(h1).toHaveTextContent('Дневник мыслей')
      expect(h2).toBeInTheDocument()
    })

    it('should have aria-controls on tabs pointing to panel ids', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const tabs = document.querySelectorAll('[role="tab"]')
      expect(tabs[0]).toHaveAttribute('aria-controls', 'auth-login-panel')
      expect(tabs[1]).toHaveAttribute('aria-controls', 'auth-register-panel')
    })

    it('should have proper ids for tabs', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const loginTab = document.getElementById('auth-login-tab')
      const registerTab = document.getElementById('auth-register-tab')

      expect(loginTab).toBeInTheDocument()
      expect(registerTab).toBeInTheDocument()
      expect(loginTab).toHaveAttribute('role', 'tab')
      expect(registerTab).toHaveAttribute('role', 'tab')
    })

    it('should update aria-label on password toggle based on state', () => {
      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))

      const toggleBtn = document.querySelector('.auth__toggle-password') as HTMLButtonElement
      expect(toggleBtn).toHaveAttribute('aria-label', 'Показать пароль')

      fireEvent.click(toggleBtn!)
      expect(toggleBtn).toHaveAttribute('aria-label', 'Скрыть пароль')

      fireEvent.click(toggleBtn!)
      expect(toggleBtn).toHaveAttribute('aria-label', 'Показать пароль')
    })

    it('should have disabled attribute on forgot password button during loading', async () => {
      mockSignIn.mockReturnValue(new Promise(() => {}))

      render(<AuthPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Перейти к авторизации' }))
      fireEvent.click(screen.getByRole('button', { name: 'Забыли пароль?' }))

      const submitBtn = screen.getByRole('button', { name: 'Отправить ссылку' })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        const forgotBtn = screen.getByRole('button', { name: '← Вернуться ко входу' })
        expect(forgotBtn).toBeDisabled()
      })
    })
  })

  // ── Demo mode ──────────────────────────────────────────────────────

  describe('Demo mode', () => {
    it('should render demo mode button on front side', () => {
      render(<AuthPage />)
      const demoBtn = screen.getByRole('button', { name: 'Демо режим' })
      expect(demoBtn).toBeInTheDocument()
    })

    it('should call signInWithEmailAndPassword with demo credentials', async () => {
      render(<AuthPage />)

      const demoBtn = screen.getByRole('button', { name: 'Демо режим' })
      await fireEvent.click(demoBtn)

      expect(mockSignIn).toHaveBeenCalledWith(mockAuth, 'test@test.test', 'testtest')
    })

    it('should disable demo button during loading', async () => {
      mockSignIn.mockReturnValue(new Promise(() => {}))

      render(<AuthPage />)

      const demoBtn = screen.getByRole('button', { name: 'Демо режим' })
      fireEvent.click(demoBtn)

      await waitFor(() => {
        expect(demoBtn).toBeDisabled()
      })
    })

    it('should have aria-busy on demo button when loading', async () => {
      mockSignIn.mockReturnValue(new Promise(() => {}))

      render(<AuthPage />)

      const demoBtn = screen.getByRole('button', { name: 'Демо режим' })
      fireEvent.click(demoBtn)

      await waitFor(() => {
        expect(demoBtn).toHaveAttribute('aria-busy', 'true')
      })
    })

    it('should show error message on demo login failure', async () => {
      mockSignIn.mockRejectedValue({ code: 'auth/user-not-found' })

      render(<AuthPage />)

      const demoBtn = screen.getByRole('button', { name: 'Демо режим' })
      await fireEvent.click(demoBtn)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Пользователь с таким email не найден')
      })
    })
  })
})
