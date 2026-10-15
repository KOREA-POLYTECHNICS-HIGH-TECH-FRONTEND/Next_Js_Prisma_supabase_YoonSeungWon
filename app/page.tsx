import { getPosts } from '@/lib/db'
import PostItem from '@/components/PostItem'
import Link from 'next/link'

export default async function HomePage() {
  const posts = await getPosts()
  return (
    <main>
      {posts.map(post => {
        return (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}>
            <PostItem post={post} />
          </Link>
        )
      })}
    </main>
  )
}
