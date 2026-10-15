'use client'
import MDEditor from '@uiw/react-md-editor'
import Markdown from '@/components/Markdown'
import { useState } from 'react'

interface Props {
  content?: string
}

export default function MarkdownEditor({ content = '' }: Props) {
  const [value, setValue] = useState(content)

  return (
    <>
      <MDEditor
        value={value}
        onChange={e => setValue(e!)}
        textareaProps={{
          name: 'content'
        }}
        height={600}
        components={{
          preview: src => <Markdown>{src}</Markdown>
        }}
      />
    </>
  )
}
