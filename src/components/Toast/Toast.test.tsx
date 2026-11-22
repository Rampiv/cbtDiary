import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnClose.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  // ── Rendering ────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render message', () => {
      render(<Toast message="Test message" onClose={mockOnClose} />)
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    it('should have success type by default', () => {
      const { container } = render(<Toast message="Test" onClose={mockOnClose} />)
      expect(container.firstChild).toHaveClass('toast--success')
    })

    it('should have error type when specified', () => {
      const { container } = render(<Toast message="Test" type="error" onClose={mockOnClose} />)
      expect(container.firstChild).toHaveClass('toast--error')
    })

    it('should have info type when specified', () => {
      const { container } = render(<Toast message="Test" type="info" onClose={mockOnClose} />)
      expect(container.firstChild).toHaveClass('toast--info')
    })

    it('should be visible initially', () => {
      const { container } = render(<Toast message="Test" onClose={mockOnClose} />)
      expect(container.firstChild).toHaveClass('toast--visible')
    })

    it('should render icon', () => {
      const { container } = render(<Toast message="Test" onClose={mockOnClose} />)
      expect(container.querySelector('.toast__icon')).toBeInTheDocument()
    })
  })

  // ── A11y attributes ─────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="status" and aria-live="polite" for success', () => {
      const { container } = render(<Toast message="OK" type="success" onClose={mockOnClose} />)
      const toast = container.firstChild as HTMLElement
      expect(toast).toHaveAttribute('role', 'status')
      expect(toast).toHaveAttribute('aria-live', 'polite')
      expect(toast).toHaveAttribute('aria-atomic', 'true')
    })

    it('should have role="status" and aria-live="polite" for info', () => {
      const { container } = render(<Toast message="Info" type="info" onClose={mockOnClose} />)
      const toast = container.firstChild as HTMLElement
      expect(toast).toHaveAttribute('role', 'status')
      expect(toast).toHaveAttribute('aria-live', 'polite')
    })

    it('should have role="alert" and aria-live="assertive" for error', () => {
      const { container } = render(<Toast message="Error" type="error" onClose={mockOnClose} />)
      const toast = container.firstChild as HTMLElement
      expect(toast).toHaveAttribute('role', 'alert')
      expect(toast).toHaveAttribute('aria-live', 'assertive')
      expect(toast).toHaveAttribute('aria-atomic', 'true')
    })

    it('should have aria-hidden="true" on SVG icon', () => {
      const { container } = render(<Toast message="Test" onClose={mockOnClose} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('focusable', 'false')
    })
  })

  // ── Hide after duration ─────────────────────────────────────────────

  describe('Hide after duration', () => {
    it('should remove toast--visible after duration', async () => {
      const { container } = render(<Toast message="Test" duration={100} onClose={mockOnClose} />)
      const toast = container.firstChild as HTMLElement

      expect(toast).toHaveClass('toast--visible')

      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(toast).not.toHaveClass('toast--visible')
    })

    it('should call onClose after duration + 100ms animation', async () => {
      render(<Toast message="Test" duration={100} onClose={mockOnClose} />)

      // After duration — not yet closed
      await act(async () => {
        vi.advanceTimersByTime(100)
      })
      expect(mockOnClose).not.toHaveBeenCalled()

      // After animation — closed
      await act(async () => {
        vi.advanceTimersByTime(100)
      })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should NOT call onClose before duration', () => {
      render(<Toast message="Test" duration={1000} onClose={mockOnClose} />)
      vi.advanceTimersByTime(500)
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  // ── Unmount before duration ─────────────────────────────────────────

  describe('Unmount before duration', () => {
    it('should NOT call onClose when unmounted before duration', () => {
      const { unmount } = render(<Toast message="Test" duration={1000} onClose={mockOnClose} />)
      unmount()
      vi.advanceTimersByTime(2000)
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  // ── onClose identity (useLatest) ────────────────────────────────────

  describe('onClose identity (useLatest)', () => {
    it('should call the latest onClose when re-rendered with new function', async () => {
      const onClose1 = vi.fn()
      const onClose2 = vi.fn()

      const { rerender } = render(
        <Toast message="Test" duration={100} onClose={onClose1} />
      )

      // Re-render with new onClose before timer fires
      rerender(<Toast message="Test" duration={100} onClose={onClose2} />)

      // Timer fires — should call onClose2, not onClose1
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      expect(onClose1).not.toHaveBeenCalled()
      expect(onClose2).toHaveBeenCalledTimes(1)
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should call onClose exactly once', async () => {
      render(<Toast message="Test" duration={100} onClose={mockOnClose} />)
      await act(async () => {
        vi.advanceTimersByTime(300)
      })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should work with custom duration', async () => {
      render(<Toast message="Test" duration={500} onClose={mockOnClose} />)
      expect(mockOnClose).not.toHaveBeenCalled()

      await act(async () => {
        vi.advanceTimersByTime(400)
      })
      expect(mockOnClose).not.toHaveBeenCalled()

      await act(async () => {
        vi.advanceTimersByTime(200)
      })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should work with duration=0', async () => {
      render(<Toast message="Test" duration={0} onClose={mockOnClose} />)

      await act(async () => {
        vi.advanceTimersByTime(0)
      })
      expect(mockOnClose).not.toHaveBeenCalled()

      await act(async () => {
        vi.advanceTimersByTime(150)
      })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})
