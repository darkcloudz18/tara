import BucketClient from './BucketClient'

// Anonymous-first: the /bucket view reads localStorage anon_id and hits
// Supabase directly from the browser. Server render has no way to know
// the visitor's anon_id, so the page is fully client-rendered.
export const dynamic = 'force-dynamic'

export default function BucketPage() {
  return <BucketClient />
}
