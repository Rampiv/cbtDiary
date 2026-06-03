import './SaveButton.scss'

interface SaveButtonProps {
  hasChanges: boolean
  isSaving: boolean
  onClick: () => void
}

export const SaveButton = ({ hasChanges, isSaving, onClick }: SaveButtonProps) => {
  return (
    <button
      type="button"
      className={`save-button ${hasChanges ? 'save-button--active' : ''}`}
      onClick={onClick}
      disabled={!hasChanges || isSaving}
      title={hasChanges ? 'Сохранить изменения' : 'Все изменения сохранены'}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    </button>
  )
}
