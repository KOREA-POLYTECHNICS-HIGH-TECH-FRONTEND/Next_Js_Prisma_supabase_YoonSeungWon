'use server'
import { table } from '@/prisma/db'
import { getProfile } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createComment(formData: FormData) {
  const profile = await getProfile()
  const content = formData.get('content') as string
  const postId = formData.get('postId') as string
  if (!profile || !content || !postId) return
  await table.Comments.create({
    content,
    postId: BigInt(postId),
    userId: profile.id
  })
  revalidatePath(`/posts/${postId}`)
}
