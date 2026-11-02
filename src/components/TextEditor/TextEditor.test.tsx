import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import { TextEditor } from './TextEditor'
import { useEditor } from '@tiptap/react'

// ── Моки Tiptap ─────────────────────────────────────────────────────

const mockToggleBold = vi.fn(() => ({ run: vi.fn() }))
const mockToggleItalic = vi.fn(() => ({ run: vi.fn() }))
const mockToggleUnderline = vi.fn(() => ({ run: vi.fn() }))
const mockFocus = vi.fn(() => ({
  toggleBold: mockToggleBold,
  toggleItalic: mockToggleItalic,
  toggleUnderline: mockToggleUnderline,
}))
const mockChain = vi.fn(() => ({ focus: mockFocus }))
const mockIsActive = vi.fn((name: string) => name === 'bold')
const mockGetJSON = vi.fn(() => ({ type: 'doc', content: [] }))
const mockSetContent = vi.fn()

let mockEditor: {
  isActive: typeof mockIsActive
  chain: typeof mockChain
  getJSON: typeof mockGetJSON
  commands: { setContent: typeof mockSetContent }
} | null

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: () => null,
}))

// ── Хелперы ─────────────────────────────────────────────────────────

const useEditorMock = useEditor as unknown as ReturnType<typeof vi.fn>

function getEditorOptions() {
  return useEditorMock.mock.calls[0][0] as {
    content: unknown
    onUpdate: (args: { editor: { getJSON: () => unknown } }) => void
    onBlur: () => void
    editorProps: { attributes: Record<string, string> }
  }
}

function getToolbarButtons(): HTMLElement[] {
  const toolbar = screen.getByRole('toolbar')
  return [
    within(toolbar).getByRole('button', { name: 'Жирный' }),
    within(toolbar).getByRole('button', { name: 'Курсив' }),
    within(toolbar).getByRole('button', { name: 'Подчёркнутый' }),
  ]
}

function makeEditor(getJsonImpl: () => unknown) {
  return { getJSON: getJsonImpl }
}

// ── Тесты ───────────────────────────────────────────────────────────

describe('TextEditor', () => {
  const mockOnChange = vi.fn()
  const mockOnBlur = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsActive.mockReturnValue(false)
    mockGetJSON.mockReturnValue({ type: 'doc', content: [] })
    mockEditor = {
      isActive: mockIsActive,
      chain: mockChain,
      getJSON: mockGetJSON,
      commands: { setContent: mockSetContent },
    }
  })

  afterEach(() => {
    cleanup()
    mockOnChange.mockClear()
    mockOnBlur.mockClear()
  })

  // ── Rendering ──────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the editor container', () => {
      render(<TextEditor content={null} onChange={mockOnChange} placeholder="Введите текст..." />)
      expect(document.querySelector('.text-editor')).toBeInTheDocument()
    })

    it('should render toolbar with 3 formatting buttons', () => {
      render(<TextEditor content={null} onChange={mockOnChange} placeholder="Введите текст..." />)
      expect(getToolbarButtons()).toHaveLength(3)
    })

    it('should render editor content area', () => {
      render(<TextEditor content={null} onChange={mockOnChange} placeholder="Введите текст..." />)
      expect(document.querySelector('.editor-content')).toBeInTheDocument()
    })

    it('should render with initial content', () => {
      const initialContent = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
      }
      render(<TextEditor content={initialContent} onChange={mockOnChange} />)
      expect(document.querySelector('.text-editor')).toBeInTheDocument()
    })

    it('should return null when useEditor returns null', () => {
      mockEditor = null
      const { container } = render(<TextEditor content={null} onChange={mockOnChange} />)
      expect(container).toBeEmptyDOMElement()
    })
  })

  // ── Toolbar buttons ────────────────────────────────────────────────

  describe('Toolbar buttons', () => {
    it('should render bold button with Ж label', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      expect(getToolbarButtons()[0]).toHaveTextContent('Ж')
    })

    it('should render italic button with К label', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      expect(getToolbarButtons()[1]).toHaveTextContent('К')
    })

    it('should render underline button with П label', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      expect(getToolbarButtons()[2]).toHaveTextContent('П')
    })

    it('should apply is-active class when bold is active', () => {
      mockIsActive.mockImplementation((name: string) => name === 'bold')
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const [bold, italic, underline] = getToolbarButtons()
      expect(bold).toHaveClass('is-active')
      expect(italic).not.toHaveClass('is-active')
      expect(underline).not.toHaveClass('is-active')
    })

    it('should apply is-active class when italic is active', () => {
      mockIsActive.mockImplementation((name: string) => name === 'italic')
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const [bold, italic, underline] = getToolbarButtons()
      expect(bold).not.toHaveClass('is-active')
      expect(italic).toHaveClass('is-active')
      expect(underline).not.toHaveClass('is-active')
    })

    it('should apply is-active class when underline is active', () => {
      mockIsActive.mockImplementation((name: string) => name === 'underline')
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const [bold, italic, underline] = getToolbarButtons()
      expect(bold).not.toHaveClass('is-active')
      expect(italic).not.toHaveClass('is-active')
      expect(underline).toHaveClass('is-active')
    })
  })

  // ── A11y attributes ────────────────────────────────────────────────

  describe('A11y attributes', () => {
    it('should have role="toolbar" and aria-label on toolbar', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const toolbar = screen.getByRole('toolbar')
      expect(toolbar).toHaveAttribute('role', 'toolbar')
      expect(toolbar).toHaveAttribute('aria-label', 'Форматирование текста')
    })

    it('should have correct aria-labels on buttons', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      expect(screen.getByRole('button', { name: 'Жирный' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Курсив' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Подчёркнутый' })).toBeInTheDocument()
    })

    it('should have aria-pressed="false" for inactive formats', () => {
      mockIsActive.mockReturnValue(false)
      render(<TextEditor content={null} onChange={mockOnChange} />)
      getToolbarButtons().forEach((btn) => {
        expect(btn).toHaveAttribute('aria-pressed', 'false')
      })
    })

    it.each([
      ['bold', 0],
      ['italic', 1],
      ['underline', 2],
    ] as const)('should have aria-pressed="true" only for active "%s"', (name, activeIndex) => {
      mockIsActive.mockImplementation((n: string) => n === name)
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const buttons = getToolbarButtons()
      buttons.forEach((btn, i) => {
        expect(btn).toHaveAttribute('aria-pressed', i === activeIndex ? 'true' : 'false')
      })
    })

    it('should set editorProps attributes with provided placeholder', () => {
      render(<TextEditor content={null} onChange={mockOnChange} placeholder="Введите текст..." />)
      const attrs = getEditorOptions().editorProps.attributes
      expect(attrs['aria-label']).toBe('Введите текст...')
      expect(attrs['role']).toBe('textbox')
      expect(attrs['aria-multiline']).toBe('true')
      expect(attrs['data-placeholder']).toBe('Введите текст...')
    })

    it('should use default aria-label and empty data-placeholder when placeholder is not provided', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const attrs = getEditorOptions().editorProps.attributes
      expect(attrs['aria-label']).toBe('Редактор текста')
      expect(attrs['data-placeholder']).toBe('')
    })
  })

  // ── Toolbar interaction ────────────────────────────────────────────

  describe('Toolbar interaction', () => {
    it('should call toggleBold on bold click', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      screen.getByRole('button', { name: 'Жирный' }).click()
      expect(mockToggleBold).toHaveBeenCalledTimes(1)
    })

    it('should call toggleItalic on italic click', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      screen.getByRole('button', { name: 'Курсив' }).click()
      expect(mockToggleItalic).toHaveBeenCalledTimes(1)
    })

    it('should call toggleUnderline on underline click', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      screen.getByRole('button', { name: 'Подчёркнутый' }).click()
      expect(mockToggleUnderline).toHaveBeenCalledTimes(1)
    })

    it('should call chain().focus() before toggle', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      screen.getByRole('button', { name: 'Жирный' }).click()
      expect(mockChain).toHaveBeenCalledTimes(1)
      expect(mockFocus).toHaveBeenCalledTimes(1)
    })
  })

  // ── onChange / onBlur ──────────────────────────────────────────────

  describe('onChange behavior', () => {
    it('should call onChange when editor content changes', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const { onUpdate } = getEditorOptions()
      const json = { type: 'doc', content: [{ type: 'text', text: 'Test' }] }
      onUpdate({ editor: makeEditor(() => json) })
      expect(mockOnChange).toHaveBeenCalledWith(json)
    })

    it('should call onChange with updated content on each update', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const { onUpdate } = getEditorOptions()
      const json1 = { type: 'doc', content: [{ type: 'text', text: 'First' }] }
      const json2 = { type: 'doc', content: [{ type: 'text', text: 'Second' }] }
      onUpdate({ editor: makeEditor(() => json1) })
      onUpdate({ editor: makeEditor(() => json2) })
      expect(mockOnChange).toHaveBeenCalledTimes(2)
      expect(mockOnChange).toHaveBeenLastCalledWith(json2)
    })

    it('should sanitize JSON before passing to onChange (no onclick)', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const { onUpdate } = getEditorOptions()
      const dirty = {
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { onclick: 'evil', className: 'keep' } }],
      }
      onUpdate({ editor: makeEditor(() => dirty) })
      const emitted = mockOnChange.mock.calls[0][0]
      expect(emitted.content[0].attrs ?? {}).not.toHaveProperty('onclick')
      expect(emitted.content[0].attrs).toHaveProperty('className', 'keep')
    })

    it('should not pass undefined in marks attrs (Firebase-safe)', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      const { onUpdate } = getEditorOptions()
      const json = {
        type: 'doc',
        content: [
          {
            type: 'text',
            text: 'x',
            marks: [{ type: 'bold', attrs: undefined }, { type: 'italic' }],
          },
        ],
      }
      onUpdate({ editor: makeEditor(() => json) })
      const emitted = mockOnChange.mock.calls[0][0]
      const marks = emitted.content[0].marks
      expect(marks[0]).not.toHaveProperty('attrs')
      expect(marks[1]).not.toHaveProperty('attrs')
    })
  })

  describe('onBlur behavior', () => {
    it('should call onBlur when editor loses focus', () => {
      render(<TextEditor content={null} onChange={mockOnChange} onBlur={mockOnBlur} />)
      getEditorOptions().onBlur()
      expect(mockOnBlur).toHaveBeenCalledTimes(1)
    })

    it('should NOT throw when onBlur is not provided', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      expect(() => getEditorOptions().onBlur()).not.toThrow()
    })
  })

  // ── sanitizeAttrs (через изменение content prop) ───────────────────

  describe('sanitizeAttrs', () => {
    it('should strip on* attributes (case-insensitive)', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const dirtyContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { onclick: 'alert(1)', ONERROR: 'alert(2)', className: 'keep' },
          },
        ],
      }
      rerender(<TextEditor content={dirtyContent} onChange={mockOnChange} />)
      expect(mockSetContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [
            expect.objectContaining({
              attrs: { className: 'keep' },
            }),
          ],
        }),
        { emitUpdate: false },
      )
    })

    it('should strip javascript: protocol from href and src', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const dirtyContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { href: ' JavaScript: alert(1)', src: 'javascript:void(0)' },
          },
        ],
      }
      rerender(<TextEditor content={dirtyContent} onChange={mockOnChange} />)

      const [setContentArg] = mockSetContent.mock.calls[0]
      const paragraph = setContentArg.content[0]
      // attrs либо отсутствует, либо не содержит href/src
      expect(paragraph.attrs ?? {}).not.toHaveProperty('href')
      expect(paragraph.attrs ?? {}).not.toHaveProperty('src')
    })

    it('should keep safe https href/src and sanitize style', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const safeContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: {
              href: 'https://ok.com',
              src: 'https://ok.com/a.png',
              style: 'color: red; background: url(javascript:alert(1))',
            },
          },
        ],
      }
      rerender(<TextEditor content={safeContent} onChange={mockOnChange} />)

      const [setContentArg] = mockSetContent.mock.calls[0]
      const attrs = setContentArg.content[0].attrs
      expect(attrs.href).toBe('https://ok.com')
      expect(attrs.src).toBe('https://ok.com/a.png')
      // background не в allowlist, url() отброшен — остаётся только color
      expect(attrs.style).toBe('color: red')
    })

    it('should leave non-href/src/style string attributes untouched', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const content = {
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { 'data-x': 'v', class: 'c', id: 'i' } }],
      }
      rerender(<TextEditor content={content} onChange={mockOnChange} />)
      expect(mockSetContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [
            expect.objectContaining({
              attrs: { 'data-x': 'v', class: 'c', id: 'i' },
            }),
          ],
        }),
        { emitUpdate: false },
      )
    })

    it('should keep non-string attrs (number, null)', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const content = {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 2, foo: null } }],
      }
      rerender(<TextEditor content={content} onChange={mockOnChange} />)
      expect(mockSetContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: [
            expect.objectContaining({
              attrs: { level: 2, foo: null },
            }),
          ],
        }),
        { emitUpdate: false },
      )
    })

    it('should remove undefined values from attrs', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const content = {
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { foo: undefined, bar: 'ok' } }],
      }
      rerender(<TextEditor content={content} onChange={mockOnChange} />)

      const [setContentArg] = mockSetContent.mock.calls[0]
      const attrs = setContentArg.content[0].attrs
      expect(attrs).not.toHaveProperty('foo')
      expect(attrs.bar).toBe('ok')
    })
  })

  // ── sanitizeContent (рекурсия + marks) ─────────────────────────────

  describe('sanitizeContent', () => {
    it('should recursively sanitize nested content arrays', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const dirty = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { onclick: 'evil' },
            content: [
              { type: 'text', text: 'a', attrs: { onclick: 'evil2' } },
              { type: 'text', text: 'b', attrs: { onclick: 'evil3' } },
            ],
          },
        ],
      }
      rerender(<TextEditor content={dirty} onChange={mockOnChange} />)
      const [setContentArg] = mockSetContent.mock.calls[0]
      const paragraph = setContentArg.content[0]
      expect(paragraph.attrs ?? {}).not.toHaveProperty('onclick')
      expect(paragraph.content[0].attrs ?? {}).not.toHaveProperty('onclick')
      expect(paragraph.content[1].attrs ?? {}).not.toHaveProperty('onclick')
    })

    it('should sanitize marks attrs (e.g. link href)', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const dirty = {
        type: 'doc',
        content: [
          {
            type: 'text',
            text: 'link',
            marks: [
              { type: 'link', attrs: { href: 'javascript:alert(1)' } },
              { type: 'bold', attrs: { onclick: 'evil' } },
            ],
          },
        ],
      }
      rerender(<TextEditor content={dirty} onChange={mockOnChange} />)

      const [setContentArg] = mockSetContent.mock.calls[0]
      const marks = setContentArg.content[0].marks
      expect(marks[0].attrs ?? {}).not.toHaveProperty('href')
      expect(marks[1].attrs ?? {}).not.toHaveProperty('onclick')
    })

    it('should not crash on content: null / undefined', () => {
      expect(() => {
        render(<TextEditor content={null} onChange={mockOnChange} />)
      }).not.toThrow()
    })
  })

  // ── deepClone: no mutation ─────────────────────────────────────────

  describe('deepClone (no mutation of input)', () => {
    it('should NOT mutate the original content object', () => {
      const original = {
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { onclick: 'evil' } }],
      }

      const { rerender } = render(<TextEditor content={original} onChange={mockOnChange} />)

      rerender(
        <TextEditor
          content={{
            ...original,
            content: [{ ...original.content[0], attrs: { onclick: 'evil', extra: 1 } }],
          }}
          onChange={mockOnChange}
        />,
      )

      expect(original.content[0].attrs).toEqual({ onclick: 'evil' })
    })
  })

  // ── useEffect sync content -> setContent ───────────────────────────

  describe('useEffect: content -> setContent', () => {
    it('should NOT call setContent on initial mount', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)
      expect(mockSetContent).not.toHaveBeenCalled()
    })

    it('should call setContent when content prop changes', () => {
      const { rerender } = render(<TextEditor content={null} onChange={mockOnChange} />)
      const next = { type: 'doc', content: [{ type: 'paragraph' }] }
      rerender(<TextEditor content={next} onChange={mockOnChange} />)
      expect(mockSetContent).toHaveBeenCalledTimes(1)
      expect(mockSetContent.mock.calls[0][1]).toEqual({ emitUpdate: false })
    })

    it('should pass sanitized content to setContent', () => {
      const { rerender } = render(
        <TextEditor content={{ type: 'doc', content: [] }} onChange={mockOnChange} />,
      )
      const dirty = {
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { onclick: 'evil' } }],
      }
      rerender(<TextEditor content={dirty} onChange={mockOnChange} />)

      const [setContentArg] = mockSetContent.mock.calls[0]
      const paragraph = setContentArg.content[0]
      expect(paragraph.attrs ?? {}).not.toHaveProperty('onclick')
    })

    it('should not call setContent if content equals last emitted (echo protection)', () => {
      render(<TextEditor content={null} onChange={mockOnChange} />)

      const emitted = { type: 'doc', content: [{ type: 'text', text: 'x' }] }
      getEditorOptions().onUpdate({ editor: makeEditor(() => emitted) })

      const { rerender } = render(<TextEditor content={emitted} onChange={mockOnChange} />)
      rerender(<TextEditor content={emitted} onChange={mockOnChange} />)

      expect(mockSetContent).not.toHaveBeenCalled()
    })

    it('should set empty doc when content becomes null', () => {
      const initial = { type: 'doc', content: [{ type: 'paragraph' }] }
      const { rerender } = render(<TextEditor content={initial} onChange={mockOnChange} />)
      rerender(<TextEditor content={null} onChange={mockOnChange} />)

      const [setContentArg] = mockSetContent.mock.calls[0]
      expect(setContentArg).toEqual({ type: 'doc', content: [] })
    })
  })
})