export interface Profile {
  id: string
  username: string
  avatarUrl: string
  role: 'admin' | 'user'
  createAt: string
}
