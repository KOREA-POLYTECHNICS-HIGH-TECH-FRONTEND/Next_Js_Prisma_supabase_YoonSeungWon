import type { Comment } from '@/lib/db'

interface Props {
  comment: Comment
}
export default function CommentItem({ comment }: Props) {
  return (
    <div>
      <div>
        {comment.user.username} / {comment.createdAt}
      </div>
      <div>{comment.content}</div>
    </div>
  )
}
