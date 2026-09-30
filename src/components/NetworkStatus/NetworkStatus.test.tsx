import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { NetworkStatus } from './NetworkStatus'

// Мокаем хук useNetworkStatus
vi.mock('../../hook/useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(),
}))

// Импортируем мокаемый хук
import { useNetworkStatus } from '../../hook/useNetworkStatus'

describe('NetworkStatus', () => {
  const mockedUseNetworkStatus = useNetworkStatus as ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockedUseNetworkStatus.mockClear()
  })

  it('should not render when online', async () => {
    mockedUseNetworkStatus.mockReturnValue(true)
    const { container } = render(<NetworkStatus />)
    await waitFor(() => {
      expect(container.innerHTML).toBe('')
    })
  })

  it('should render warning when offline', async () => {
    mockedUseNetworkStatus.mockReturnValue(false)
    render(<NetworkStatus />)
    await waitFor(() => {
      expect(screen.getByText(/Нет подключения к интернету/i)).toBeInTheDocument()
    })
  })

  it('should have accessibility attributes', async () => {
    mockedUseNetworkStatus.mockReturnValue(false)
    render(<NetworkStatus />)
    await waitFor(() => {
      const element = screen.getByText(/Нет подключения к интернету/i).parentElement
      expect(element).toHaveAttribute('role', 'status')
      expect(element).toHaveAttribute('aria-live', 'polite')
    })
  })

  it('should not render when online after being offline', async () => {
    mockedUseNetworkStatus.mockReturnValue(false)
    const { container, rerender } = render(<NetworkStatus />)
    
    await waitFor(() => {
      expect(screen.getByText(/Нет подключения к интернету/i)).toBeInTheDocument()
    })

    // Simulate going online
    mockedUseNetworkStatus.mockReturnValue(true)
    rerender(<NetworkStatus />)
    
    await waitFor(() => {
      expect(container.innerHTML).toBe('')
    })
  })
})
