import { getSupabase } from './supabase'
import { clearAnonId } from './anonId'
import { capture } from './analytics'

// Reassign any anon-owned bucket items to the newly authenticated user,
// then clear the localStorage anon_id so future saves route via user_id.
// Idempotent: repeated calls after a successful claim match zero rows.
//
// Instrumentation lets us measure the cross-device orphan problem: a
// user who saved on Phone A and signed up on Phone B will fire
// anon_bucket_claim_ran on B with rowsClaimed=0, and their Phone A
// rows sit orphaned until they later sign in on A. High rates of
// zero-row claims relative to save volume would justify the fuller
// email-link fix (see build-plan followup).
export async function claimAnonBucket(userId: string): Promise<void> {
  if (typeof window === 'undefined') return
  const anonId = localStorage.getItem('tara-anon-id')
  if (!anonId) {
    capture('anon_bucket_claim_ran', { rowsClaimed: 0, hadAnonId: false })
    return
  }

  const client = getSupabase()
  const { data, error } = await client
    .from('bucket_list')
    .update({ user_id: userId, anon_id: null })
    .eq('anon_id', anonId)
    .is('user_id', null)
    .select('id')

  if (error) {
    console.error('Failed to claim anon bucket:', error)
    capture('anon_bucket_claim_failed', { message: error.message })
    return
  }

  capture('anon_bucket_claim_ran', {
    rowsClaimed: data?.length ?? 0,
    hadAnonId: true,
  })

  clearAnonId()
  // Reset the one-time save-toast flag so the fresh signed-in state
  // starts clean if the user later signs out and browses anonymously.
  localStorage.removeItem('tara-first-save-toast-shown')
}
