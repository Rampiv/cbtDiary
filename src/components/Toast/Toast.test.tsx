import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnClose.mockClear()
  })

  it('should render message', () => {
    render(<Toast message="Test message" onClose={mockOnClose} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('should have success type by default', () => {
    const { container } = render(<Toast message="Test" onClose={mockOnClose} />)
    const toast = container.querySelector('.toast')
    expect(toast).toHaveClass('toast--success')
  })

  it('should have error type when specified', () => {
    const { container } = render(
      <Toast message="Test" type="error" onClose={mockOnClose} />
    )
    const toast = container.querySelector('.toast')
    expect(toast).toHaveClass('toast--error')
  })

  it('should have info type when specified', () => {
    const { container } = render(
      <Toast message="Test" type="info" onClose={mockOnClose} />
    )
    const toast = container.querySelector('.toast')
    expect(toast).toHaveClass('toast--info')
  })

  it('should be visible initially', () => {
    const { container } = render(<Toast message="Test" onClose={mockOnClose} />)
    const toast = container.querySelector('.toast')
    expect(toast).toHaveClass('toast--visible')
  })

  it('should hide after duration and call onClose', async () => {
    const { rerender } = render(<Toast message="Test" duration={100} onClose={mockOnClose} />)
    
    // Advance timers past the duration + animation time
    await act(async () => {
      vi.advanceTimersByTime(200)
      rerender(<Toast message="Test" duration={100} onClose={mockOnClose} />)
    })
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not call onClose before duration', () => {
    render(<Toast message="Test" duration={1000} onClose={mockOnClose} />)
    
    vi.advanceTimersByTime(500)
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should render icon', () => {
    const { container } = render(<Toast message="Test" onClose={mockOnClose} />)
    const icon = container.querySelector('.toast__icon')
    expect(icon).toBeInTheDocument()
  })
})
