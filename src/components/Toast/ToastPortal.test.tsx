import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ToastPortal } from './ToastPortal'

describe('ToastPortal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  // ── Portal contract ────────────────────────────────────────────────

  it('should render in document.body, parent container empty', () => {
    const { container } = render(<ToastPortal message="Hello" onClose={mockOnClose} />)

    // Parent container should be empty (portal renders elsewhere)
    expect(container.innerHTML).toBe('')

    // Toast should be in document.body
    const bodyToast = document.body.querySelector('.toast')
    expect(bodyToast).toBeInTheDocument()
  })

  // ── Props passthrough ──────────────────────────────────────────────

  it('should pass all props through to Toast', () => {
    render(
      <ToastPortal message="Error toast" type="error" duration={300} onClose={mockOnClose} />
    )

    // Message text
    expect(screen.getByText('Error toast')).toBeInTheDocument()

    // type="error" → role="alert" (from Toast)
    const toast = document.body.querySelector('.toast')
    expect(toast).toHaveAttribute('role', 'alert')
    expect(toast).toHaveAttribute('aria-live', 'assertive')
    expect(toast).toHaveClass('toast--error')
  })

  it('should pass success type correctly', () => {
    render(<ToastPortal message="OK" type="success" onClose={mockOnClose} />)

    const toast = document.body.querySelector('.toast')
    expect(toast).toHaveAttribute('role', 'status')
    expect(toast).toHaveAttribute('aria-live', 'polite')
    expect(toast).toHaveClass('toast--success')
  })

  // ── Cleanup ────────────────────────────────────────────────────────

  it('should remove toast from body on unmount', () => {
    const { unmount } = render(
      <ToastPortal message="Test" type="info" onClose={mockOnClose} />
    )

    expect(document.body.querySelector('.toast')).toBeInTheDocument()

    unmount()

    expect(document.body.querySelector('.toast')).not.toBeInTheDocument()
  })
})
