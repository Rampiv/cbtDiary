import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { BulletList } from '@tiptap/extension-bullet-list'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { ListItem } from '@tiptap/extension-list-item'
import { useEffect, useRef } from 'react'
import './TextEditor.scss'


// Подавление предупреждений о дублировании расширений
const originalWarn = console.warn
console.warn = function (...args) {
  if (args[0]?.includes?.('Duplicate extension names found')) {
    return
  }
  originalWarn.apply(console, args)
}

const CustomBulletList = BulletList.extend({
  addInputRules() {
    return []
  },
})

const CustomOrderedList = OrderedList.extend({
  addInputRules() {
    return []
  },
})

const extensions = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    listItem: false,
  }),
  CustomBulletList,
  CustomOrderedList,
  ListItem,
  Underline.configure(),
  TextStyle.configure(),
  Color.configure(),
]

interface TextEditorProps {
  content: any
  onChange: (json: any) => void
  onBlur?: () => void
  placeholder?: string
  editorId?: string
}

export const TextEditor = ({ content, onChange, onBlur, placeholder }: TextEditorProps) => {
  const lastEmittedRef = useRef<any>(null)
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

    lastEmittedRef.current = content
    editor.commands.setContent(content)
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