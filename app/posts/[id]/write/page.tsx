import { getPost, getProfile } from '@/lib/db'
import MarkdownEditor from '@/components/MarkdownEditor'
import { notFound } from 'next/navigation'
import { updatePost } from '@/serverActions/post'

export default async function WritePage({
  params
}: PageProps<'/posts/[id]/write'>) {
  const { id } = await params
  const [post, profile] = await Promise.all([getPost(id), getProfile()])
  if (!post || post.userId !== profile?.id) notFound()

  return (
    <form action={updatePost}>
      <input
        type="hidden"
        name="postId"
        value={post.id}
      />
      <MarkdownEditor content={post.content} />
      <button type="submit">저장</button>
    </form>
  )
}
