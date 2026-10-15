import type { Post } from '@/lib/db'
import Markdown from '@/components/Markdown'
import Image from 'next/image'

interface Props {
  post: Post
}

export default function PostItem({ post }: Props) {
  return (
    <div className="border-b border-gray-200 p-10">
      <div className="flex items-center gap-2">
        <Image
          src={post.user.avatarUrl}
          alt={post.user.username}
          width={30}
          height={30}
        />
        {post.user.username} / {post.createdAt}
      </div>
      <Markdown key={post.id}>{post.content}</Markdown>
    </div>
  )
}
