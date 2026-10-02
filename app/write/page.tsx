'use client'

import MarkdownEditor from '@/components/MarkdownEditor'
import { createPost } from '@/serverActions/post'

export default function WritePage() {
  return (
    <>
      <form action={createPost}>
        <MarkdownEditor />
        <button type="submit">저장</button>
      </form>
    </>
  )
}
