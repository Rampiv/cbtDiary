import { useState, type ReactNode } from 'react'
import './Accordion.scss'

interface AccordionProps {
  title: string
  description?: string
  children: ReactNode
  defaultOpen?: boolean
}

export const Accordion = ({ title, description, children, defaultOpen = false }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`accordion ${isOpen ? 'accordion--open' : ''}`}>
      <button
        type="button"
        className="accordion__header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="accordion__header-content">
          <h3 className="accordion__title">{title}</h3>
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
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className="accordion__content">
        <div className="accordion__body">{children}</div>
      </div>
    </div>
  )
}