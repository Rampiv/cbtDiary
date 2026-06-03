import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import './ReadOnlyContent.scss'
import { useEffect } from 'react'

interface ReadOnlyContentProps {
  content: any
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
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  if (!editor) return null

  return (
    <div className="read-only-content">
      <EditorContent editor={editor} />
    </div>
  )
}
