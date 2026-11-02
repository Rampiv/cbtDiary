import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Моки на уровне файла (требование vitest)
const createMockEditor = () => ({
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
})

const mockEditor = createMockEditor()
const useEditorMock = vi.fn().mockReturnValue(mockEditor)

vi.mock('@tiptap/react', () => ({
  useEditor: useEditorMock,
  EditorContent: () => null,
}))

vi.mock('dompurify', () => ({
  default: {
    sanitize: (str: string) => str,
  },
}))

// Динамический импорт — моки применяются выше через vi.mock
import type { EditorContentNode } from '../../types/diary'

describe('ReadOnlyContent', () => {
  beforeEach(() => {
    vi.resetModules()
    useEditorMock.mockReturnValue(mockEditor)
  })

  const sampleContent: EditorContentNode = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello world' }],
      },
    ],
  }

  // ── Rendering ───────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render when content is provided', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={sampleContent} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should render when content is null', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={null} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should render when content is undefined', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={undefined} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should render empty container for empty content object', async () => {
      const emptyContent: EditorContentNode = { type: 'doc', content: [] }
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={emptyContent} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  // ── A11y attributes ─────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="article"', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={sampleContent} />)
      expect(screen.getByRole('article')).toHaveAttribute('role', 'article')
    })

    it('should have aria-label="Содержимое записи"', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={sampleContent} />)
      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-label',
        'Содержимое записи',
      )
    })

    it('should have aria-readonly="true"', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={sampleContent} />)
      expect(screen.getByRole('article')).toHaveAttribute(
        'aria-readonly',
        'true',
      )
    })
  })

  // ── Editor configuration ────────────────────────────────────────────

  describe('Editor configuration', () => {
    it('should create editor with editable: false', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={sampleContent} />)
      expect(useEditorMock).toHaveBeenCalledWith(
        expect.objectContaining({ editable: false }),
      )
    })

    it('should pass content to editor', async () => {
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={sampleContent} />)
      expect(useEditorMock).toHaveBeenCalledWith(
        expect.objectContaining({ content: sampleContent }),
      )
    })
  })

  // ── Sanitization ────────────────────────────────────────────────────

  describe('Sanitization', () => {
    it('should render without crashing on XSS payload in text', async () => {
      const xssContent: EditorContentNode = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '<script>alert(1)</script>' }],
          },
        ],
      }
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={xssContent} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should render without crashing on XSS payload in attributes', async () => {
      const xssAttrContent: EditorContentNode = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { style: 'javascript:alert(1)' },
            content: [{ type: 'text', text: 'test' }],
          },
        ],
      }
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={xssAttrContent} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should handle deeply nested content', async () => {
      const nestedContent: EditorContentNode = {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Deep nested text',
                  },
                ],
              },
            ],
          },
        ],
      }
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={nestedContent} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should not crash with empty string text', async () => {
      const emptyText: EditorContentNode = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }],
          },
        ],
      }
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={emptyText} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should render with content containing only whitespace', async () => {
      const wsContent: EditorContentNode = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '   ' }],
          },
        ],
      }
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={wsContent} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should handle content with mixed text and nested nodes', async () => {
      const mixedContent: EditorContentNode = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Heading' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Body text' }],
          },
        ],
      }
      const { ReadOnlyContent: RC } = await import('./ReadOnlyContent')
      render(<RC content={mixedContent} />)
      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })
})
