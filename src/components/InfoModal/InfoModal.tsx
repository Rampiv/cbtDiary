import './InfoModal.scss'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const InfoModal = ({ isOpen, onClose, title, children }: InfoModalProps) => {
  if (!isOpen) return null

  return (
    <div className="info-modal__overlay" onClick={onClose}>
      <div className="info-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal__header">
          <h3 className="info-modal__title">{title}</h3>
          <button type="button" className="info-modal__close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="info-modal__body">{children}</div>
      </div>
    </div>
  )
}