import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDiary } from './useDiary'

// Моки для Firebase
const mockSet = vi.fn()
const mockOnValue = vi.fn()
const mockRemove = vi.fn()
let mockCurrentUser: { uid: string } | null = { uid: 'test-user-123' }

vi.mock('../firebase/config', () => ({
  auth: {
    get currentUser() { return mockCurrentUser },
    onAuthStateChanged: vi.fn(),
  },
  db: {},
}))

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn((ref, callback) => {
    mockOnValue(ref, callback)
    return vi.fn() // unsubscribe
  }),
  off: vi.fn(),
  set: vi.fn((ref, data) => {
    mockSet(ref, data)
    return Promise.resolve()
  }),
  remove: vi.fn((ref) => {
    mockRemove(ref)
    return Promise.resolve()
  }),
}))

describe('useDiary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockCurrentUser = { uid: 'test-user-123' }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with null page when no pageId', async () => {
    const { result } = renderHook(() => useDiary(''))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(result.current.page).toBeNull()
      })
    })

    expect(result.current.page).toBeNull()
  })

  it('should have hasChanges set to false initially', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(result.current.hasChanges).toBe(false)
      })
    })

    expect(result.current.hasChanges).toBe(false)
  })

  it('should have isSaving set to false initially', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(result.current.isSaving).toBe(false)
      })
    })

    expect(result.current.isSaving).toBe(false)
  })

  it('should return page data when loaded from Firebase', async () => {
    const mockPage = {
      id: 'page-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resource: null,
      situation: null,
      thoughts: [],
      thoughtWorks: [],
    }

    const unsubscribeMock = vi.fn()
    vi.mocked(mockOnValue).mockImplementation((_ref, callback) => {
      // Симулируем немедленный callback с данными
      callback({ val: () => mockPage })
      return unsubscribeMock
    })

    const { result } = renderHook(() => useDiary('page-1'))

    await act(async () => {
      await vi.waitFor(() => {
        expect(result.current.page).not.toBeNull()
      }, { timeout: 2000 })
    })

    expect(result.current.page).toEqual(mockPage)
  })

  it('should provide updatePage function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.updatePage).toBe('function')
      })
    })
  })

  it('should provide autoSave function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.autoSave).toBe('function')
      })
    })
  })

  it('should provide manualSave function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.manualSave).toBe('function')
      })
    })
  })

  it('should provide addThought function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.addThought).toBe('function')
      })
    })
  })

  it('should provide deleteThought function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.deleteThought).toBe('function')
      })
    })
  })

  it('should provide deletePage function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.deletePage).toBe('function')
      })
    })
  })

  it('should provide startWorkOnThought function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.startWorkOnThought).toBe('function')
      })
    })
  })

  it('should provide updateThoughtWork function', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(typeof result.current.updateThoughtWork).toBe('function')
      })
    })
  })

  it('should return correct interface structure', async () => {
    const { result } = renderHook(() => useDiary('page-1'))
    
    await act(async () => {
      await vi.waitFor(() => {
        expect(result.current).toHaveProperty('page')
        expect(result.current).toHaveProperty('hasChanges')
        expect(result.current).toHaveProperty('isSaving')
        expect(result.current).toHaveProperty('updatePage')
        expect(result.current).toHaveProperty('autoSave')
        expect(result.current).toHaveProperty('manualSave')
        expect(result.current).toHaveProperty('addThought')
        expect(result.current).toHaveProperty('deleteThought')
        expect(result.current).toHaveProperty('deletePage')
        expect(result.current).toHaveProperty('startWorkOnThought')
        expect(result.current).toHaveProperty('updateThoughtWork')
      })
    })
  })
})
