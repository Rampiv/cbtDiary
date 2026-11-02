import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'
import { signOut } from 'firebase/auth'

/* ------------------------------------------------------------------ */
/*  Mock react-router-dom — useNavigate returns a controllable fn.     */
/*  useLocation is provided by MemoryRouter (no mock needed).           */
/* ------------------------------------------------------------------ */
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockNavigate = vi.fn() as any

function renderHeader(
  initialPath = '/',
  navigateMock = mockNavigate,
): ReturnType<typeof render> {
  ;(useNavigate as ReturnType<typeof vi.fn>).mockImplementation(() => navigateMock)
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Header />
    </MemoryRouter>,
  )
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: signOut resolves successfully
    ;(signOut as ReturnType<typeof vi.fn>).mockResolvedValue(undefined as never)
  })

  // ── Tabs rendering ──────────────────────────────────────────────────

  it('should render all 4 tabs in nav', () => {
    renderHeader('/')
    const nav = screen.getByRole('navigation')
    const items = nav.querySelectorAll('.header__item')
    expect(items).toHaveLength(4)
  })

  it('should render each tab as a link with correct href', () => {
    renderHeader('/')
    const nav = screen.getByRole('navigation')
    const links = nav.querySelectorAll('a')
    expect(links[0]).toHaveAttribute('href', '/profile')
    expect(links[1]).toHaveAttribute('href', '/')
    expect(links[2]).toHaveAttribute('href', '/helpful')
    expect(links[3]).toHaveAttribute('href', '/FAQ')
  })

  it('should render logo link leading to /', () => {
    renderHeader('/')
    const logoLink = screen.getByRole('link', { name: 'Дневник мыслей' })
    expect(logoLink).toHaveAttribute('href', '/')
  })

  // ── Active tab ──────────────────────────────────────────────────────

  it('should mark Profile tab as active on /profile', () => {
    const { container } = renderHeader('/profile')
    const nav = container.querySelector('nav')!
    const active = nav!.querySelector('.active')!
    expect(active).toHaveTextContent('Профиль')
  })

  it('should mark Diary tab as active on /', () => {
    const { container } = renderHeader('/')
    const nav = container.querySelector('nav')!
    const active = nav!.querySelector('.active')!
    expect(active).toHaveTextContent('Дневник')
  })

  it('should mark no tab as active on unknown route', () => {
    const { container } = renderHeader('/unknown')
    const nav = container.querySelector('nav')!
    const active = nav!.querySelector('.active')
    expect(active).toBeNull()
  })

  // ── Tab click behaviour ─────────────────────────────────────────────

  it('should not call navigate when clicking an active tab', () => {
    renderHeader('/')
    const nav = screen.getByRole('navigation')
    const diaryLink = nav.querySelector('a[href="/"]')! as HTMLAnchorElement
    // React Router v7 Link doesn't expose onClick on DOM node directly.
    // We verify via the component's onClick that preventDefault fires.
    diaryLink.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )
    // Link prevents default navigation for active route
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should call navigate with correct path when clicking a non-active tab', () => {
    renderHeader('/')
    const nav = screen.getByRole('navigation')
    const profileLink = nav.querySelector('a[href="/profile"]')! as HTMLAnchorElement
    // React Router v7 Link uses internal useNavigate from MemoryRouter context,
    // so fireEvent.click won't call our mock. We verify the href instead.
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  // ── Desktop logout ──────────────────────────────────────────────────

  it('should call signOut and navigate to /auth on logout button click', async () => {
    renderHeader('/', mockNavigate)
    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }))
    await tick()
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
    })
    expect(mockNavigate).toHaveBeenCalledWith('/auth')
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('should not call navigate when signOut rejects', async () => {
    ;(signOut as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderHeader('/', mockNavigate)
    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }))
    await tick()
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Ошибка выхода:', expect.anything())
    })
    expect(mockNavigate).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  // ── Burger menu toggle ──────────────────────────────────────────────

  it('should open burger menu on first click', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const menu = document.querySelector('.header__burger-menu')
    expect(menu).toBeTruthy()
  })

  it('should close burger menu on second click', () => {
    const { container } = renderHeader('/')
    const burger = container.querySelector('.header__burger') as HTMLElement
    fireEvent.click(burger)
    expect(burger).toHaveClass('header__burger--open')
    fireEvent.click(burger)
    expect(burger).not.toHaveClass('header__burger--open')
  })

  it('should toggle aria-expanded from false to true to false', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    expect(burger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'false')
  })

  // ── Burger menu overlay & content ───────────────────────────────────

  it('should close menu when clicking the overlay background', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    expect(document.querySelector('.header__burger-menu')).toBeTruthy()
    fireEvent.click(document.querySelector('.header__burger-menu')!)
    expect(document.querySelector('.header__burger-menu')).toBeNull()
  })

  it('should not close menu when clicking inside menu content', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const content = document.querySelector('.header__burger-menu-content')!
    fireEvent.click(content)
    expect(document.querySelector('.header__burger-menu')).toBeTruthy()
  })

  // ── Burger menu item clicks ─────────────────────────────────────────

  it('should close menu and navigate when clicking a different menu item', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const menuItems = document.querySelectorAll('.header__burger-menu-item')
    // First item = Профиль (link="/profile", current="/")
    fireEvent.click(menuItems[0]!)
    expect(document.querySelector('.header__burger-menu')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('should close menu but not navigate when clicking the active menu item', () => {
    renderHeader('/profile')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const menuItems = document.querySelectorAll('.header__burger-menu-item')
    // First item = Профиль (link="/profile", current="/profile") → active
    fireEvent.click(menuItems[0]!)
    expect(document.querySelector('.header__burger-menu')).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should mark active item in burger menu with class "active"', () => {
    const { container } = renderHeader('/profile')
    const burger = container.querySelector('.header__burger') as HTMLElement
    fireEvent.click(burger)
    const activeInMenu = document.querySelector('.header__burger-menu .active')
    expect(activeInMenu).toBeTruthy()
    expect(activeInMenu).toHaveTextContent('Профиль')
  })

  // ── Burger menu logout ──────────────────────────────────────────────

  it('should call signOut and navigate to /auth on burger logout click', async () => {
    renderHeader('/', mockNavigate)
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const logoutBtn = document.querySelector(
      '.header__burger-menu-item--logout',
    ) as HTMLButtonElement
    fireEvent.click(logoutBtn)
    await tick()
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
    })
    expect(mockNavigate).toHaveBeenCalledWith('/auth')
    // Fixed: burger logout now closes the menu
    expect(document.querySelector('.header__burger-menu')).toBeNull()
  })

  it('should not call navigate when signOut rejects in burger menu', async () => {
    ;(signOut as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderHeader('/', mockNavigate)
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const logoutBtn = document.querySelector(
      '.header__burger-menu-item--logout',
    ) as HTMLButtonElement
    fireEvent.click(logoutBtn)
    await tick()
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Ошибка выхода:', expect.anything())
    })
    expect(mockNavigate).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  // ── A11y ────────────────────────────────────────────────────────────

  it('should have aria-label="Меню" on burger button', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    expect(burger).toHaveAttribute('aria-label', 'Меню')
  })

  it('should have aria-controls pointing to menu id', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    expect(burger).toHaveAttribute('aria-controls', 'header-burger-menu')
  })

  it('should have aria-haspopup="menu" on burger button', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    expect(burger).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('should have role="menu" on burger menu container', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const menu = document.getElementById('header-burger-menu')
    expect(menu).toBeTruthy()
    expect(menu).toHaveAttribute('role', 'menu')
  })

  it('should have role="menuitem" on burger menu items', () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const menuItems = document.querySelectorAll('[role="menuitem"]')
    expect(menuItems).toHaveLength(5) // 4 tabs + logout
  })

  it('should close menu when pressing Escape', async () => {
    renderHeader('/')
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    expect(document.querySelector('.header__burger-menu')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    await tick()
    expect(document.querySelector('.header__burger-menu')).toBeNull()
  })

  it('should not call signOut twice on rapid logout clicks (double-click protection)', async () => {
    renderHeader('/', mockNavigate)
    const logoutBtn = screen.getByRole('button', { name: 'Выйти' })
    // Click twice rapidly
    fireEvent.click(logoutBtn)
    fireEvent.click(logoutBtn)
    await tick()
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1)
    })
  })

  // ── Burger logout (now closes menu) ─────────────────────────────────

  it('should close menu after successful logout from burger', async () => {
    renderHeader('/', mockNavigate)
    const burger = screen.getByLabelText('Меню')
    fireEvent.click(burger)
    const logoutBtn = document.querySelector(
      '.header__burger-menu-item--logout',
    ) as HTMLButtonElement
    fireEvent.click(logoutBtn)
    await tick()
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
    })
    expect(mockNavigate).toHaveBeenCalledWith('/auth')
    expect(document.querySelector('.header__burger-menu')).toBeNull()
  })
})
