import { useEffect, useRef, useId } from 'react'
import './InfoModal.scss'

/**
 * Возвращает фокусируемые элементы внутри контейнера,
 * исключая disabled, hidden и элементы с tabindex="-1".
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    '[tabindex]:not([tabindex="-1"]):not([disabled]):not([hidden]), ' +
    'button:not([tabindex="-1"]):not([disabled]):not([hidden]), ' +
    '[href]:not([disabled]):not([hidden]), ' +
    'input:not([disabled]):not([hidden]), ' +
    'select:not([disabled]):not([hidden]), ' +
    'textarea:not([disabled]):not([hidden])'

  return Array.from(container.querySelectorAll<HTMLElement>(selector))
}

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const InfoModal = ({ isOpen, onClose, title, children }: InfoModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Keep a stable ref to onClose so focus-effect doesn't re-run
  // when the parent passes a new function identity on each render.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = getFocusableElements(modalRef.current)
        if (focusable.length === 0) return

        const firstFocusable = focusable[0]
        const lastFocusable = focusable[focusable.length - 1]

        if (e.shiftKey) {
          // Shift+Tab on first element wraps to the last
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable.focus()
          }
          // Shift+Tab on last element wraps to the first
          else if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        } else {
          // Tab on last element wraps to the first
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const focusable = getFocusableElements(modalRef.current!)
    if (focusable.length > 0) {
      focusable[0].focus()
    } else {
      modalRef.current!.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="info-modal__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={modalRef}
        className="info-modal__content"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="info-modal__header">
          <h3 id={titleId} className="info-modal__title">
            {title}
          </h3>
        </div>
        <div className="info-modal__body">{children}</div>
        <button
          type="button"
          className="info-modal__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
