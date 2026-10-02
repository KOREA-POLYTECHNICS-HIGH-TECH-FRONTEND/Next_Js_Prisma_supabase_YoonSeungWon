import MDEditor from '@uiw/react-md-editor'
import Markdown from '@/components/Markdown'
import { useState } from 'react'

export default function MarkdownEditor() {
  const [value, setValue] = useState<string>('# Title')

  return (
    <>
      <MDEditor
        value={value}
        onChange={setValue}
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
