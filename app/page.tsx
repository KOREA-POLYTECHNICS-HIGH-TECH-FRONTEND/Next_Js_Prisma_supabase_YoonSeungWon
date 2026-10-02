import { getPosts } from '@/serverActions/post'
import Markdown from '@/components/Markdown'

export default async function HomePage() {
  const posts = await getPosts()
  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      {posts.map(post => (
        <Markdown key={post.id}>{post.content}</Markdown>
      ))}
    </main>
  )
}
