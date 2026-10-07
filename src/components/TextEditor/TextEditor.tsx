import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'
import { useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import type { EditorContentNode } from '../../types/diary'
import './TextEditor.scss'

const extensions = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    listItem: false,
    underline: false,
  }),
  BulletList.extend({
    addInputRules() {
      return []
    },
  }),
  OrderedList.extend({
    addInputRules() {
      return []
    },
  }),
  ListItem,
  Underline,
  TextStyle.configure(),
  Color.configure(),
]

// Санитизация атрибутов (не текста!)
const sanitizeAttrs = (attrs: Record<string, unknown>): Record<string, unknown> => {
  if (!attrs) return attrs

  const sanitizedAttrs: Record<string, unknown> = {}
  for (const key in attrs) {
    const value = attrs[key]

    // Пропускаем event-обработчики
    if (key.toLowerCase().startsWith('on')) continue

    if (typeof value === 'string') {
      // Запрещаем javascript: протоколы
      if (value.toLowerCase().trim().startsWith('javascript:')) continue

      // Санитизируем только атрибуты, которые могут содержать HTML/URL
      if (key === 'href' || key === 'src' || key === 'style') {
        sanitizedAttrs[key] = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })
      } else {
        sanitizedAttrs[key] = value
      }
    } else {
      sanitizedAttrs[key] = value
    }
  }
  return sanitizedAttrs
}

// Рекурсивная санитизация JSON-контента Tiptap
const sanitizeContent = (node: EditorContentNode): EditorContentNode => {
  if (!node) return node

  // Санитизируем только атрибуты
  if (node.attrs) {
    node.attrs = sanitizeAttrs(node.attrs)
  }

  // Рекурсивно обрабатываем дочерние узлы
  if (node.content && Array.isArray(node.content)) {
    node.content = node.content.map(sanitizeContent)
  }

  return node
}

// Глубокое клонирование перед санитизацией, чтобы не мутировать оригинал
const deepClone = <T,>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T
  const cloned = {} as Record<string, unknown>
  for (const key in obj) {
    cloned[key] = deepClone((obj as Record<string, unknown>)[key])
  }
  return cloned as T
}

interface TextEditorProps {
  content: EditorContentNode | null
  onChange: (json: EditorContentNode | null) => void
  onBlur?: () => void
  placeholder?: string
  editorId?: string
}

export const TextEditor = ({ content, onChange, onBlur, placeholder }: TextEditorProps) => {
  const lastEmittedRef = useRef<EditorContentNode | null>(null)
  const isInitialMount = useRef(true)

  const editor = useEditor({
    extensions,
    content: content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      lastEmittedRef.current = json
      onChange(json)
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        'data-placeholder': placeholder || '',
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    if (isInitialMount.current) {
      lastEmittedRef.current = content
      isInitialMount.current = false
      return
    }

    const newContentStr = JSON.stringify(content)
    const lastEmittedStr = JSON.stringify(lastEmittedRef.current)

    if (newContentStr === lastEmittedStr) {
      return
    }

    const sanitizedContent = content ? sanitizeContent(deepClone(content)) : content
    lastEmittedRef.current = sanitizedContent
    editor.commands.setContent(sanitizedContent || { type: 'doc', content: [] }, {
      emitUpdate: false,
    })
  }, [editor, content])

  if (!editor) return null

  return (
    <div className="text-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          <b>Ж</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          <i>К</i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
        >
          <u>П</u>
        </button>
      </div>
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
