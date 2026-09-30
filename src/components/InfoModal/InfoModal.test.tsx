import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoModal } from './InfoModal'

describe('InfoModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <InfoModal isOpen={false} onClose={mockOnClose} title="Test">
        Content
      </InfoModal>
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render when isOpen is true', () => {
    render(
      <InfoModal isOpen={true} onClose={mockOnClose} title="Test">
        Content
      </InfoModal>
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should render title', () => {
    render(
      <InfoModal isOpen={true} onClose={mockOnClose} title="My Title">
        Content
      </InfoModal>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('should render children', () => {
    render(
      <InfoModal isOpen={true} onClose={mockOnClose} title="Test">
        <div data-testid="child">Child content</div>
      </InfoModal>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <InfoModal isOpen={true} onClose={mockOnClose} title="Test">
        Content
      </InfoModal>
    )
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is clicked', () => {
    const { container } = render(
      <InfoModal isOpen={true} onClose={mockOnClose} title="Test">
        Content
      </InfoModal>
    )
    const overlay = container.querySelector('.info-modal__overlay')
    fireEvent.click(overlay!)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onClose when content is clicked', () => {
    const { container } = render(
      <InfoModal isOpen={true} onClose={mockOnClose} title="Test">
        <div data-testid="content" onClick={(e) => e.stopPropagation()}>
          Content
        </div>
      </InfoModal>
    )
    const content = container.querySelector('.info-modal__content')
    fireEvent.click(content!)
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
