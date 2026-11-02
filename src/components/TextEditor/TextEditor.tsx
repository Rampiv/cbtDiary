import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'
import { useEffect, useRef } from 'react'
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

// ── Безопасность ─────────────────────────────────────────────────────

const MAX_DEPTH = 100

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

const ALLOWED_CSS_PROPS = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
])

/**
 * Нормализует строку перед проверкой протокола:
 * убирает control-символы, юникод-пробелы и схлопывает whitespace.
 * Без этого `java\tscript:` / `java\nscript:` / `\u0000javascript:`
 * проходят проверку `startsWith('javascript:')`.
 */
const normalizeForProtocolCheck = (value: string): string =>
  value
    .replace(
      // eslint-disable-next-line no-control-regex
      /[\u0000-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g,
      ''
    )
    .replace(/\s+/g, '')
    .toLowerCase()

const isSafeUrl = (value: string): boolean => {
  const trimmed = value.trim()
  if (!trimmed) return false

  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return true
  }

  const normalized = normalizeForProtocolCheck(trimmed)

  try {
    const parsed = new URL(normalized, 'https://example.com')
    return ALLOWED_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}

const sanitizeStyle = (value: string): string => {
  const safeDeclarations: string[] = []

  for (const declaration of value.split(';')) {
    const [rawProp, ...rest] = declaration.split(':')
    if (!rawProp || rest.length === 0) continue

    const prop = rawProp.trim().toLowerCase()
    const val = rest.join(':').trim()

    if (!ALLOWED_CSS_PROPS.has(prop)) continue
    if (/url\s*\(|expression\s*\(|@import|javascript:/i.test(val)) continue
    if (val.length > 200) continue

    safeDeclarations.push(`${prop}: ${val}`)
  }

  return safeDeclarations.join('; ')
}

/**
 * Санитизирует атрибуты узла.
 * - удаляет `undefined`-значения (Firebase не принимает undefined);
 * - удаляет `on*`-обработчики;
 * - удаляет запрещённые ключи (`__proto__` и др.);
 * - проверяет протоколы `href`/`src` по allowlist;
 * - для `style` — allowlist CSS-свойств.
 *
 * Возвращает обычный объект (не Object.create(null)) —
 * Firebase SDK вызывает hasOwnProperty на значениях.
 */
const sanitizeAttrs = (attrs: Record<string, unknown>): Record<string, unknown> => {
  if (!attrs) return attrs

  const sanitizedAttrs: Record<string, unknown> = {}

  for (const key of Object.keys(attrs)) {
    if (FORBIDDEN_KEYS.has(key)) continue

    const lowerKey = key.toLowerCase()
    if (lowerKey.startsWith('on')) continue

    const value = attrs[key]

    // Firebase не принимает undefined — пропускаем.
    if (value === undefined) continue

    if (typeof value !== 'string') {
      sanitizedAttrs[key] = value
      continue
    }

    if (key === 'href' || key === 'src') {
      if (!isSafeUrl(value)) continue
      sanitizedAttrs[key] = value
      continue
    }

    if (key === 'style') {
      const safe = sanitizeStyle(value)
      if (safe) sanitizedAttrs[key] = safe
      continue
    }

    sanitizedAttrs[key] = value
  }

  return sanitizedAttrs
}

/**
 * Рекурсивно санитизирует JSON-контент TipTap.
 * Не добавляет `attrs`, если он undefined или пуст после санитизации —
 * Firebase не принимает undefined ни в одном поле.
 */
const sanitizeContent = (node: EditorContentNode, depth = 0): EditorContentNode => {
  if (!node) return node
  if (depth > MAX_DEPTH) {
    return { type: 'paragraph' } as EditorContentNode
  }

  const result: EditorContentNode = { ...node }

  // attrs узла — только если есть и не пуст после санитизации.
  if (result.attrs) {
    const safe = sanitizeAttrs(result.attrs)
    if (Object.keys(safe).length > 0) {
      result.attrs = safe
    } else {
      delete result.attrs
    }
  }

  // marks — там может быть link с href; attrs не должен быть undefined.
  if (Array.isArray(result.marks)) {
    result.marks = result.marks.map((mark) => {
      const cleanedMark: typeof mark = { ...mark }
      if (mark.attrs) {
        const safe = sanitizeAttrs(mark.attrs)
        if (Object.keys(safe).length > 0) {
          cleanedMark.attrs = safe
        } else {
          delete cleanedMark.attrs
        }
      } else {
        // Не тащим attrs: undefined.
        delete cleanedMark.attrs
      }
      return cleanedMark
    })
  }

  if (Array.isArray(result.content)) {
    result.content = result.content.map((child) => sanitizeContent(child, depth + 1))
  }

  return result
}

/**
 * Рекурсивно удаляет `undefined` из объекта/массива.
 * Финальная страховка перед отправкой в Firebase.
 *
 * Возвращает обычный объект (не Object.create(null)) —
 * Firebase SDK вызывает hasOwnProperty на значениях.
 */
const removeUndefined = <T,>(obj: T, depth = 0): T => {
  if (depth > MAX_DEPTH) return obj
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => removeUndefined(item, depth + 1)) as unknown as T
  }
  const source = obj as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_KEYS.has(key)) continue
    const v = source[key]
    if (v === undefined) continue
    result[key] = removeUndefined(v, depth + 1)
  }
  return result as T
}

/**
 * Глубокое клонирование без prototype pollution.
 * Пропускает undefined, чтобы не тащить их дальше.
 *
 * Возвращает обычный объект (не Object.create(null)) —
 * Firebase SDK вызывает hasOwnProperty на значениях.
 */
const deepClone = <T,>(obj: T, depth = 0): T => {
  if (depth > MAX_DEPTH) return obj
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => deepClone(item, depth + 1)) as unknown as T
  }
  const source = obj as Record<string, unknown>
  const cloned: Record<string, unknown> = {}
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_KEYS.has(key)) continue
    const v = source[key]
    if (v === undefined) continue
    cloned[key] = deepClone(v, depth + 1)
  }
  return cloned as T
}

// ── Компонент ────────────────────────────────────────────────────────

interface TextEditorProps {
  content: EditorContentNode | null
  onChange: (json: EditorContentNode | null) => void
  onBlur?: () => void
  placeholder?: string
}

export const TextEditor = ({ content, onChange, onBlur, placeholder }: TextEditorProps) => {
  const lastEmittedRef = useRef<EditorContentNode | null>(null)
  const isInitialMount = useRef(true)

  const editor = useEditor({
    extensions,
    content: content || { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      // Санитизация + удаление undefined — Firebase не принимает undefined.
      const json = removeUndefined(
        sanitizeContent(deepClone(editor.getJSON() as EditorContentNode))
      )
      lastEmittedRef.current = json
      onChange(json)
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        'data-placeholder': placeholder || '',
        'aria-label': placeholder || 'Редактор текста',
        role: 'textbox',
        'aria-multiline': 'true',
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

    if (newContentStr === lastEmittedStr) return

    const sanitizedContent = content
      ? removeUndefined(sanitizeContent(deepClone(content)))
      : content

    lastEmittedRef.current = sanitizedContent
    editor.commands.setContent(sanitizedContent || { type: 'doc', content: [] }, {
      emitUpdate: false,
    })
  }, [editor, content])

  if (!editor) return null

  return (
    <div className="text-editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Форматирование текста">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          aria-pressed={editor.isActive('bold')}
          aria-label="Жирный"
          title="Жирный"
        >
          <b>Ж</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          aria-pressed={editor.isActive('italic')}
          aria-label="Курсив"
          title="Курсив"
        >
          <i>К</i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          aria-pressed={editor.isActive('underline')}
          aria-label="Подчёркнутый"
          title="Подчёркнутый"
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