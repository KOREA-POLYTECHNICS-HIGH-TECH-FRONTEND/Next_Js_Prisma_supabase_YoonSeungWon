import 'server-only'
import { table } from '@/prisma/db'
import { createClient } from './supabase/server'
import type { Temporal } from 'temporal-polyfill'
import { comment } from '@uiw/react-md-editor'

export type Profile = Awaited<ReturnType<typeof getProfile>>
export type Post = Awaited<ReturnType<typeof getPosts>>[number]
export type Comment = Awaited<ReturnType<typeof getComments>>[number]

export function formatDate(instant: Temporal.Instant) {
  return instant.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export async function getUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub || null
}

export async function getProfile() {
  const userId = await getUserId()
  if (!userId) return null

  const row = await table.Profiles.select(
    'id',
    'username',
    'avatarUrl',
    'role'
  ).first({ id: userId })

  if (!row) return null

  return {
    ...row,
    avatarUrl: row.avatarUrl || '/default-avatar.png'
  }
}

export async function getPosts() {
  const posts = await table.Posts.include('user')
    .orderBy(post => post.createdAt.desc())
    .all()
  return posts.map(post => ({
    ...post,
    id: String(post.id),
    createdAt: formatDate(post.createdAt),
    user: {
      ...post.user,
      avatarUrl: post.user.avatarUrl || '/default-avatar.png',
      createdAt: formatDate(post.user.createdAt)
    }
  }))
}

export async function getPost(postId: string) {
  const post = await table.Posts.include('user').first({ id: BigInt(postId) })
  if (!post) return null

  return {
    ...post,
    id: String(post.id),
    createdAt: formatDate(post.createdAt),
    user: {
      ...post.user,
      avatarUrl: post.user.avatarUrl || '/default-avatar.png',
      createdAt: formatDate(post.user.createdAt)
    }
  }
}

export async function getComments(postId: string) {
  const comments = await table.Comments.where({
    postId: BigInt(postId)
  })
    .include('user')
    .orderBy(comment => comment.createdAt.desc())
    .all()

  return comments.map(comment => ({
    ...comment,
    id: String(comment.id),
    postId,
    createdAt: formatDate(comment.createdAt),
    user: {
      ...comment.user,
      avatarUrl: comment.user.avatarUrl || '/default-avatar.png',
      createdAt: formatDate(comment.user.createdAt)
    }
  }))
}
