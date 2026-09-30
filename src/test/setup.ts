import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Моки для Firebase
vi.mock('../firebase/config', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
  db: {},
}))

// Моки для antd
vi.mock('antd', () => ({
  Slider: ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    return {
      __value: value,
      __onChange: onChange,
    }
  },
}))

// Моки для Firebase database
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}))

// Моки для Firebase auth
vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  type: vi.fn(),
}))

// Моки для Tiptap
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    isActive: vi.fn(),
    chain: vi.fn(() => ({
      focus: vi.fn(() => ({
        toggleBold: vi.fn(() => {}),
        toggleItalic: vi.fn(() => {}),
        toggleUnderline: vi.fn(() => {}),
      })),
    })),
    getJSON: vi.fn(() => ({ type: 'doc', content: [] })),
    commands: {
      setContent: vi.fn(),
    },
  })),
  EditorContent: () => null,
}))

// Моки для dompurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (str: string) => str,
  },
}))
