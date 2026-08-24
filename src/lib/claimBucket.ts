import { getSupabase } from './supabase'
import { clearAnonId } from './anonId'

// Reassign any anon-owned bucket items to the newly authenticated user,
// then clear the localStorage anon_id so future saves route via user_id.
// Idempotent: repeated calls after a successful claim match zero rows.
export async function claimAnonBucket(userId: string): Promise<void> {
  if (typeof window === 'undefined') return
  const anonId = localStorage.getItem('tara-anon-id')
  if (!anonId) return

  const client = getSupabase()
  const { error } = await client
    .from('bucket_list')
    .update({ user_id: userId, anon_id: null })
    .eq('anon_id', anonId)
    .is('user_id', null)

  if (error) {
    console.error('Failed to claim anon bucket:', error)
    return
  }

  clearAnonId()
  // Reset the one-time save-toast flag so the fresh signed-in state
  // starts clean if the user later signs out and browses anonymously.
  localStorage.removeItem('tara-first-save-toast-shown')
}
