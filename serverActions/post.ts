'use server'
import { getProfile } from '@/lib/db'
import { table } from '@/prisma/db'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const profile = await getProfile()
  const content = formData.get('content') as string
  await table.Posts.create({
    content,
    userId: profile?.id
  })

  redirect('/')
}

export async function updatePost(formData: FormData) {
  const profile = await getProfile()
  const content = formData.get('content') as string
  const postId = formData.get('postId') as string
  if (!profile || !content || !postId) return

  await table.Posts.where({
    id: BigInt(postId),
    userId: profile.id
  }).update({
    content
  })

  redirect(`/posts/${postId}`)
}

export async function deletePost(formData: FormData) {
  const profile = await getProfile()
  const postId = formData.get('postId') as string
  if (!profile || !postId) return

  await table.Posts.where({
    id: BigInt(postId),
    userId: profile.id
  }).delete()

  redirect('/')
}
