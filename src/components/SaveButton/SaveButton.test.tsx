import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveButton } from './SaveButton'

describe('SaveButton', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  // ── Rendering ────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the button', () => {
      render(<SaveButton hasChanges={false} isSaving={false} onClick={mockOnClick} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have active class when hasChanges is true', () => {
      const { container } = render(
        <SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />
      )
      const button = container.querySelector('.save-button')
      expect(button).toHaveClass('save-button--active')
    })

    it('should not have active class when hasChanges is false', () => {
      const { container } = render(
        <SaveButton hasChanges={false} isSaving={false} onClick={mockOnClick} />
      )
      const button = container.querySelector('.save-button')
      expect(button).not.toHaveClass('save-button--active')
    })
  })

  // ── Disabled state ──────────────────────────────────────────────────

  describe('Disabled state', () => {
    it('should be disabled when hasChanges is false', () => {
      const { container } = render(
        <SaveButton hasChanges={false} isSaving={false} onClick={mockOnClick} />
      )
      const button = container.querySelector('.save-button') as HTMLButtonElement
      expect(button.disabled).toBe(true)
    })

    it('should be disabled when isSaving is true', () => {
      const { container } = render(
        <SaveButton hasChanges={true} isSaving={true} onClick={mockOnClick} />
      )
      const button = container.querySelector('.save-button') as HTMLButtonElement
      expect(button.disabled).toBe(true)
    })

    it('should be enabled when hasChanges is true and isSaving is false', () => {
      const { container } = render(
        <SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />
      )
      const button = container.querySelector('.save-button') as HTMLButtonElement
      expect(button.disabled).toBe(false)
    })
  })

  // ── Interaction ─────────────────────────────────────────────────────

  describe('Interaction', () => {
    it('should call onClick when clicked', () => {
      render(<SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should NOT call onClick when disabled', () => {
      render(<SaveButton hasChanges={false} isSaving={false} onClick={mockOnClick} />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should NOT call onClick when isSaving', () => {
      render(<SaveButton hasChanges={true} isSaving={true} onClick={mockOnClick} />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  // ── A11y attributes ─────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have aria-label matching the button state', () => {
      render(<SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Сохранить изменения')
    })

    it('should have correct aria-label when hasChanges is false', () => {
      render(<SaveButton hasChanges={false} isSaving={false} onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Все изменения сохранены')
    })

    it('should have aria-busy="true" when isSaving', () => {
      render(<SaveButton hasChanges={true} isSaving={true} onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should NOT have aria-busy when not saving', () => {
      render(<SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button).not.toHaveAttribute('aria-busy')
    })

    it('should have aria-hidden="true" on SVG icon', () => {
      const { container } = render(
        <SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />
      )
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('focusable', 'false')
    })

    it('should have both aria-label and title with the same text', () => {
      render(<SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Сохранить изменения')
      expect(button).toHaveAttribute('title', 'Сохранить изменения')
    })
  })
})
