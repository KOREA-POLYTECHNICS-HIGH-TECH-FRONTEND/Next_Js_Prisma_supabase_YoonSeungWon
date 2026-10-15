import { getProfile, getPost, getComments } from '@/lib/db'
import { notFound } from 'next/navigation'
import PostItem from '@/components/PostItem'
import Link from 'next/link'
import { deletePost } from '@/serverActions/post'
import CommentItem from '@/components/CommentItem'
import CommentForm from '@/components/CommentForm'

export default async function PostPage({ params }: PageProps<'/posts/[id]'>) {
  const { id } = await params
  const [post, profile, comments] = await Promise.all([
    getPost(id),
    getProfile(),
    getComments(id)
  ])
  if (!post) notFound()

  return (
    <>
      <PostItem post={post} />
      {post.userId === profile?.id && (
        <>
          <Link href={`/posts/${id}/write`}>수정</Link>
          <form action={deletePost}>
            <input
              type="hidden"
              name="postId"
              value={post.id}
            />
            <button type="submit">삭제</button>
          </form>
        </>
      )}
      {profile && <CommentForm postId={id} />}
      <div>
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
          />
        ))}
      </div>
    </>
  )
}
