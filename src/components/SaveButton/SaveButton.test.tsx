import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveButton } from './SaveButton'

describe('SaveButton', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

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

  it('should call onClick when clicked', () => {
    render(<SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should have correct title when has changes', () => {
    const { container } = render(
      <SaveButton hasChanges={true} isSaving={false} onClick={mockOnClick} />
    )
    const button = container.querySelector('.save-button') as HTMLButtonElement
    expect(button.title).toBe('Сохранить изменения')
  })

  it('should have correct title when no changes', () => {
    const { container } = render(
      <SaveButton hasChanges={false} isSaving={false} onClick={mockOnClick} />
    )
    const button = container.querySelector('.save-button') as HTMLButtonElement
    expect(button.title).toBe('Все изменения сохранены')
  })
})
