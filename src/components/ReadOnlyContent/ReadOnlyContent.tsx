import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import './ReadOnlyContent.scss'
import { useEffect } from 'react'
import DOMPurify from 'dompurify'
import type { EditorContentNode } from '../../types/diary'

interface ReadOnlyContentProps {
  content: EditorContentNode | null | undefined
}

// Рекурсивная санитизация JSON-контента
const sanitizeContent = (node: EditorContentNode): EditorContentNode => {
  if (!node) return node

  if (node.text) {
    node.text = DOMPurify.sanitize(node.text, { ALLOWED_TAGS: [] })
  }

  if (node.attrs) {
    const sanitizedAttrs: Record<string, unknown> = {}
    for (const key in node.attrs) {
      const value = node.attrs[key]
      if (typeof value === 'string') {
        if (key.toLowerCase().startsWith('on')) continue
        if (value.toLowerCase().trim().startsWith('javascript:')) continue
        sanitizedAttrs[key] = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })
      } else {
        sanitizedAttrs[key] = value
      }
    }
    node.attrs = sanitizedAttrs
  }

  if (node.content && Array.isArray(node.content)) {
    node.content = node.content.map(sanitizeContent)
  }

  return node
}

const deepClone = <T,>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T
  const cloned = {} as Record<string, unknown>
  for (const key in obj) {
    cloned[key] = deepClone((obj as Record<string, unknown>)[key])
  }
  return cloned as T
}

export const ReadOnlyContent = ({ content }: ReadOnlyContentProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content: content,
    editable: false,
  })

  useEffect(() => {
    if (!editor) return

    // Санитизация входящего контента
    const sanitizedContent = content ? sanitizeContent(deepClone(content)) : { type: 'doc', content: [] }
    editor.commands.setContent(sanitizedContent)
  }, [editor, content])

  if (!editor) return null

  return (
    <div className="read-only-content">
      <EditorContent editor={editor} />
    </div>
  )
}
