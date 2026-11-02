import { useState, useId, type ReactNode } from 'react'
import './Accordion.scss'

interface AccordionProps {
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
}

export const Accordion = ({ title, description, children, defaultOpen = false }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className={`accordion ${isOpen ? 'accordion--open' : ''}`}>
      <button
        type="button"
        className="accordion__header"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="accordion__header-content">
          <h3 className="accordion__title" id={`${contentId}-title`}>{title}</h3>
          {description && <p className="accordion__description">{description}</p>}
        </div>
        <svg
          className="accordion__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        className="accordion__content"
        id={contentId}
        role="region"
        aria-labelledby={`${contentId}-title`}
        aria-hidden={!isOpen}
        hidden={!isOpen}
      >
        <div className="accordion__body">{children}</div>
      </div>
    </div>
  )
}