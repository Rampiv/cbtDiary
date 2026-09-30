import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Accordion } from './Accordion'

describe('Accordion', () => {
  it('should render title', () => {
    render(<Accordion title="Test Title">Content</Accordion>)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    render(
      <Accordion title="Title" description="Test description">
        Content
      </Accordion>
    )
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should be closed by default', () => {
    const { container } = render(
      <Accordion title="Title">Content</Accordion>
    )
    const accordion = container.querySelector('.accordion')
    expect(accordion).not.toHaveClass('accordion--open')
  })

  it('should be open when defaultOpen is true', () => {
    const { container } = render(
      <Accordion title="Title" defaultOpen={true}>
        Content
      </Accordion>
    )
    const accordion = container.querySelector('.accordion')
    expect(accordion).toHaveClass('accordion--open')
  })

  it('should toggle content visibility on header click', () => {
    const { container } = render(
      <Accordion title="Title">Content</Accordion>
    )
    const accordion = container.querySelector('.accordion') as HTMLElement
    const header = container.querySelector('.accordion__header') as HTMLElement

    // Initially closed
    expect(accordion).not.toHaveClass('accordion--open')

    // Click to open
    fireEvent.click(header)
    expect(accordion).toHaveClass('accordion--open')

    // Click to close
    fireEvent.click(header)
    expect(accordion).not.toHaveClass('accordion--open')
  })

  it('should render children', () => {
    render(
      <Accordion title="Title">
        <div data-testid="child">Child content</div>
      </Accordion>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
