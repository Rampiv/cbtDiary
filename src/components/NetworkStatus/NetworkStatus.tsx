import { useNetworkStatus } from '../../hook/useNetworkStatus'
import './NetworkStatus.scss'

export const NetworkStatus = () => {
  const isOnline = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="network-status" role="status" aria-live="polite">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>Нет подключения к интернету. Изменения сохранятся автоматически при восстановлении связи.</span>
    </div>
  )
}
