import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'post-images'

export async function uploadImage(file: File, folder: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`${folder}/${crypto.randomUUID()}`, file)
  if (error) throw new Error(`이미지를 업로드하지 못했습니다. ${error.message}`)
  //return data.path
  const {
    data: { publicUrl }
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)
  return publicUrl
}

export async function removeImage(paths: string[]) {
  const supabase = await createAdminClient()
  supabase.storage.from(BUCKET_NAME).remove(paths)
}
