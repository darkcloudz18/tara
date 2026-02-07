import { supabase } from '@/lib/supabase'
import { BucketListItem } from './bucketListService'
import { itineraryService } from './itineraryService'
import { dayService } from './dayService'
import { activityService } from './activityService'

const MIGRATION_FLAG_KEY = 'bucket_list_migrated'

export interface MigrationResult {
  success: boolean
  itineraryId?: string
  itemsMigrated: number
  error?: string
}

/**
 * Check if user has already migrated their bucket list
 */
export async function hasMigrated(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', MIGRATION_FLAG_KEY)
    .single()

  return data?.value === 'true'
}

/**
 * Mark user as having completed migration
 */
async function setMigrationFlag(userId: string): Promise<void> {
  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      key: MIGRATION_FLAG_KEY,
      value: 'true',
      updated_at: new Date().toISOString(),
    })
}

/**
 * Get all bucket list items for a user
 */
async function getUserBucketListItems(userId: string): Promise<BucketListItem[]> {
  const { data, error } = await supabase
    .from('bucket_list')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Group bucket list items by location
 */
function groupByLocation(items: BucketListItem[]): Map<string, BucketListItem[]> {
  const grouped = new Map<string, BucketListItem[]>()

  items.forEach((item) => {
    const location = item.place_location || 'Unknown'
    const existing = grouped.get(location) || []
    grouped.set(location, [...existing, item])
  })

  return grouped
}

/**
 * Migrate user's bucket list items to a "My Saved Places" trip
 */
export async function migrateBucketListToTrip(userId: string): Promise<MigrationResult> {
  try {
    // Check if already migrated
    const alreadyMigrated = await hasMigrated(userId)
    if (alreadyMigrated) {
      return { success: true, itemsMigrated: 0 }
    }

    // Get bucket list items
    const bucketItems = await getUserBucketListItems(userId)

    // If no items, mark as migrated and return
    if (bucketItems.length === 0) {
      await setMigrationFlag(userId)
      return { success: true, itemsMigrated: 0 }
    }

    // Group items by location
    const grouped = groupByLocation(bucketItems)
    const locations = Array.from(grouped.keys())

    // Create "My Saved Places" itinerary
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + locations.length - 1)

    const itinerary = await itineraryService.create(userId, {
      title: 'My Saved Places',
      description: 'Places migrated from your bucket list',
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      destinations: locations,
      is_public: false,
    })

    // Create a day for each location and add activities
    let dayNumber = 1
    let totalMigrated = 0

    for (const [location, items] of grouped) {
      const dayDate = new Date(today)
      dayDate.setDate(dayDate.getDate() + dayNumber - 1)

      // Create day
      const day = await dayService.create({
        itinerary_id: itinerary.id,
        day_number: dayNumber,
        date: dayDate.toISOString().split('T')[0],
        title: location,
      })

      // Add items as activities
      for (const item of items) {
        await activityService.create({
          day_id: day.id,
          title: item.place_name,
          location: item.place_location || '',
          place_type: item.place_category || undefined,
          estimated_cost: item.place_estimated_cost || undefined,
          notes: item.notes || undefined,
        })
        totalMigrated++
      }

      dayNumber++
    }

    // Mark migration as complete
    await setMigrationFlag(userId)

    return {
      success: true,
      itineraryId: itinerary.id,
      itemsMigrated: totalMigrated,
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return {
      success: false,
      itemsMigrated: 0,
      error: error.message,
    }
  }
}

/**
 * Run migration if needed (call this on planner page load)
 */
export async function runMigrationIfNeeded(): Promise<MigrationResult | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const alreadyMigrated = await hasMigrated(user.id)
  if (alreadyMigrated) return null

  return migrateBucketListToTrip(user.id)
}
