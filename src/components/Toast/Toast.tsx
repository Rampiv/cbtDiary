import { useEffect, useRef, useState } from 'react'
import './Toast.scss'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

// Хук для доступа к актуальному значению пропса без перезапуска эффектов
function useLatest<T>(value: T) {
  const ref = useRef(value)
  // eslint-disable-next-line react-hooks/refs
  ref.current = value
  return ref
}

export const Toast = ({ message, type = 'success', duration = 500, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const onCloseRef = useLatest(onClose)

  // role/aria-live зависят от типа — success/info = polite, error = assertive
  const role = type === 'error' ? 'alert' : 'status'
  const ariaLive = type === 'error' ? 'assertive' : 'polite'

  useEffect(() => {
    let closed = false

    const hideTimer = setTimeout(() => {
      setIsVisible(false)
      const closeTimer = setTimeout(() => {
        if (!closed) {
          onCloseRef.current()
        }
      }, 100)

      return () => clearTimeout(closeTimer)
    }, duration)

    return () => {
      closed = true
      clearTimeout(hideTimer)
    }
    // — onCloseRef is a ref, adding it would restart the timer on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  return (
    <div
      className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''}`}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="toast__content">
        <svg
          className="toast__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          focusable="false"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="toast__message">{message}</span>
      </div>
    </div>
  )
}
