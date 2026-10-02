'use server'
import { getProfile } from '@/lib/db'
import { table } from '@/prisma/db'
import { redirect } from 'next/navigation'

export async function getPosts() {
  return await table.Posts.orderBy(post => post.createdAt.desc()).all()
}

export async function createPost(formData: FormData) {
  const profile = await getProfile()
  const content = formData.get('content') as string
  await table.Posts.create({
    content,
    userId: profile?.id
  })

  redirect('/')
}
