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

  it('should not render description when prop is omitted', () => {
    render(<Accordion title="Title">Content</Accordion>)
    expect(screen.queryByText(/Test description/i)).not.toBeInTheDocument()
  })

  it('should be closed by default', () => {
    const { container } = render(<Accordion title="Title">Content</Accordion>)
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
    const { container } = render(<Accordion title="Title">Content</Accordion>)
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

  it('aria-expanded changes on click', () => {
    render(<Accordion title="Title">Content</Accordion>)
    const header = screen.getByRole('button')
    expect(header).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('click on nested element (icon) toggles the accordion', () => {
    const { container } = render(<Accordion title="Title">Content</Accordion>)
    const header = container.querySelector('.accordion__header') as HTMLElement
    const icon = container.querySelector('.accordion__icon') as SVGElement

    // Initially closed
    expect(header).toHaveAttribute('aria-expanded', 'false')

    // Click on the icon (nested inside the button)
    fireEvent.click(icon)
    expect(header).toHaveAttribute('aria-expanded', 'true')

    // Click again to close
    fireEvent.click(icon)
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('defaultOpen + click → close', () => {
    const { container } = render(
      <Accordion title="Title" defaultOpen={true}>
        Content
      </Accordion>
    )
    const accordion = container.querySelector('.accordion') as HTMLElement
    const header = container.querySelector('.accordion__header') as HTMLElement

    // Starts open
    expect(accordion).toHaveClass('accordion--open')
    expect(header).toHaveAttribute('aria-expanded', 'true')

    // Click to close
    fireEvent.click(header)
    expect(accordion).not.toHaveClass('accordion--open')
    expect(header).toHaveAttribute('aria-expanded', 'false')
  })

  it('content is hidden via aria-hidden and hidden attribute when closed', () => {
    const { container } = render(<Accordion title="Title">Content</Accordion>)
    const content = container.querySelector('.accordion__content') as HTMLElement

    // Closed by default
    expect(content).toHaveAttribute('aria-hidden', 'true')
    expect(content).toHaveAttribute('hidden')

    // Open after click
    const header = container.querySelector('.accordion__header') as HTMLElement
    fireEvent.click(header)

    expect(content).toHaveAttribute('aria-hidden', 'false')
    expect(content).not.toHaveAttribute('hidden')
  })

  it('content region has correct aria-labelledby pointing to title', () => {
    render(<Accordion title="My Title">Content</Accordion>)
    const header = screen.getByRole('button')
    const contentId = header.getAttribute('aria-controls')

    expect(contentId).toBeTruthy()

    const content = document.getElementById(contentId!)
    expect(content).toBeInTheDocument()
    expect(content).toHaveAttribute('aria-labelledby', `${contentId}-title`)

    const title = document.getElementById(`${contentId}-title`)
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('My Title')
  })

  it('icon SVG has aria-hidden and focusable attributes', () => {
    const { container } = render(<Accordion title="Title">Content</Accordion>)
    const icon = container.querySelector('.accordion__icon') as SVGElement

    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon).toHaveAttribute('focusable', 'false')
  })
})
