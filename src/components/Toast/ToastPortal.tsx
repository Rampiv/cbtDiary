import { createPortal } from 'react-dom'
import { Toast } from './Toast'

interface ToastPortalProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export const ToastPortal = (props: ToastPortalProps) => {
  return createPortal(<Toast {...props} />, document.body)
}