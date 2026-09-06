'use server'

import { revalidatePath } from 'next/cache'

// Invalidate the ISR cache for a specific trip's public share view and
// its OG image. Called from client mutations that flip is_public or
// change fields the share view or OG unfurl renders (title,
// destinations, dates, cover).
//
// Scoped to the specific id so we don't invalidate every other trip's
// cached page. Both paths listed explicitly because revalidatePath
// doesn't cascade to sibling routes under the same [id] segment.
export async function revalidateTripShareView(tripId: string): Promise<void> {
  revalidatePath(`/trip/${tripId}`)
  revalidatePath(`/trip/${tripId}/opengraph-image`)
}
