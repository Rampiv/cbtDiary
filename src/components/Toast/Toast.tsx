import { useEffect, useRef, useState } from 'react'
import './Toast.scss'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export const Toast = ({ message, type = 'success', duration = 500, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose()
      }, 100)
    }, duration)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [duration, onClose])

  return (
    <div className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''}`}>
      <div className="toast__content">
        <svg
          className="toast__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="toast__message">{message}</span>
      </div>
    </div>
  )
}
