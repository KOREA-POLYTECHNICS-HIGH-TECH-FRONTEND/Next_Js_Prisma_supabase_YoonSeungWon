import { createComment } from '@/serverActions/comment'

interface Props {
  postId: string
}

export default function CommentForm({ postId }: Props) {
  return (
    <form action={createComment}>
      <input
        type="hidden"
        name="postId"
        value={postId}
      />
      <input
        type="text"
        name="content"
      />
      <button type="submit">작성</button>
    </form>
  )
}
