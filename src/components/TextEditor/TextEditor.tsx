import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import './TextEditor.scss'
import { useEffect, useMemo } from 'react'

interface TextEditorProps {
  content: any
  onChange: (json: any) => void
  onBlur?: () => void
  placeholder?: string
  editorId?: string
}

export const TextEditor = ({
  content,
  onChange,
  onBlur,
  placeholder,
  editorId,
}: TextEditorProps) => {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        underline: false,
      }),
      Underline.configure(),
      TextStyle.configure(),
      Color.configure(),
    ],
    []
  )

  const editor = useEditor({
    extensions,
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
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

    const currentContent = JSON.stringify(editor.getJSON())
    const newContent = JSON.stringify(content || { type: 'doc', content: [] })

    if (currentContent !== newContent) {
      editor.commands.setContent(content)
    }
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
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
        >
          Список
        </button>
      </div>
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
