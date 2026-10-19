import { supabase, getUserSafe } from '@/lib/supabase'

export interface AdminStats {
  totalUsers: number
  totalTrips: number
  totalPlaces: number
  publicTrips: number
  pendingReports: number
  newUsersThisWeek: number
  newTripsThisWeek: number
}

export interface ContentReport {
  id: string
  reporter_id: string
  content_type: 'trip' | 'comment' | 'review' | 'user'
  content_id: string
  reason: string
  details?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by?: string
  reviewed_at?: string
  action_taken?: string
  created_at: string
  reporter?: {
    username: string | null
    email: string | null
  }
}

export type PartnerProductType = 'activity' | 'stay' | 'transfer' | 'addon'

export interface PartnerProduct {
  id: string
  place_id: string | null
  destination_id: string | null
  partner: string
  product_name: string | null
  product_type: PartnerProductType
  price_from: number | null
  includes: string | null
  deeplink: string
  priority: number
  active: boolean
  verified_at: string | null
}

export interface AdminPlaceQueueRow {
  id: string
  name: string
  slug: string | null
  status: 'draft' | 'published' | 'needs_review'
  verified_at: string | null
  destination_id: string | null
  destination_name: string | null
  completeness: number        // 0–100
  stale: boolean              // verified_at > 6 months OR null
}

export type PlaceQueueSort = 'completeness' | 'name' | 'verified_at'

export const PLACE_CATEGORY_OPTIONS = [
  'beach',
  'lagoon',
  'waterfall',
  'viewpoint',
  'heritage',
  'food',
  'activity',
  'stay',
] as const
export type PlaceCategory = typeof PLACE_CATEGORY_OPTIONS[number]

/**
 * Shared comparator so the UI, the queue sort control, and any future
 * caller all tie-break the same way. Primary key varies by sort choice;
 * name asc is the tiebreak everywhere so order is deterministic when
 * 253 rows all sit at 0% completeness (the state right now).
 */
export function placeQueueComparator(sort: PlaceQueueSort) {
  return (a: AdminPlaceQueueRow, b: AdminPlaceQueueRow): number => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'verified_at': {
        // Nulls (never verified) go last so freshly-verified places
        // float to the top of the newest list.
        const av = a.verified_at ? new Date(a.verified_at).getTime() : -Infinity
        const bv = b.verified_at ? new Date(b.verified_at).getTime() : -Infinity
        if (av !== bv) return bv - av
        return a.name.localeCompare(b.name)
      }
      case 'completeness':
      default:
        if (a.completeness !== b.completeness) return a.completeness - b.completeness
        return a.name.localeCompare(b.name)
    }
  }
}

export interface AdminDestinationQueueRow {
  id: string
  name: string
  slug: string
  region: string | null
  status: 'draft' | 'published' | 'needs_review'
  verified_at: string | null
  min_viable_days: number | null
  travel_times: Record<string, number> | null
  completeness: number
  stale: boolean
}

export const DESTINATION_COMPLETENESS_FIELDS = [
  'summary',
  'description',
  'getting_there',
  'best_months',
  'typical_days',
  'budget_low',
  'budget_mid',
  'budget_high',
  'min_viable_days',
  'travel_times',
  'tips_three_plus',
  'source_urls_present',
  'verified_at',
] as const

const DESTINATION_FIELD_LABEL: Record<typeof DESTINATION_COMPLETENESS_FIELDS[number], string> = {
  summary: 'summary',
  description: 'description',
  getting_there: 'getting there',
  best_months: 'best months',
  typical_days: 'typical days',
  budget_low: 'budget low',
  budget_mid: 'budget mid',
  budget_high: 'budget high',
  min_viable_days: 'min viable days',
  travel_times: 'travel times (Manila or Cebu)',
  tips_three_plus: '3+ tips',
  source_urls_present: 'source URLs',
  verified_at: 'verification stamp',
}

function destinationFieldSatisfied(field: typeof DESTINATION_COMPLETENESS_FIELDS[number], row: any): boolean {
  switch (field) {
    case 'tips_three_plus':
      return Array.isArray(row.tips) && row.tips.length >= 3
    case 'source_urls_present':
      return Array.isArray(row.source_urls) && row.source_urls.length > 0
    case 'best_months':
      return Array.isArray(row.best_months) && row.best_months.length > 0
    case 'travel_times':
      return (
        row.travel_times &&
        typeof row.travel_times === 'object' &&
        Object.keys(row.travel_times).length > 0
      )
    default:
      return row[field] !== null && row[field] !== undefined && row[field] !== ''
  }
}

export function destinationCompletenessPercent(row: any): number {
  const points = DESTINATION_COMPLETENESS_FIELDS.reduce(
    (n, f) => n + (destinationFieldSatisfied(f, row) ? 1 : 0),
    0,
  )
  return Math.round((points / DESTINATION_COMPLETENESS_FIELDS.length) * 100)
}

export function destinationMissingFields(row: any): string[] {
  return DESTINATION_COMPLETENESS_FIELDS.filter((f) => !destinationFieldSatisfied(f, row)).map(
    (f) => DESTINATION_FIELD_LABEL[f],
  )
}

/**
 * Destinations' thin-page bar centres on Smart Build's needs: without
 * min_viable_days and at least one travel_times hub, the suggestion
 * engine has nothing to rank on. Plus the shared trust floor (getting
 * there + 3 tips) so the public page isn't paper-thin.
 */
export function destinationPublishBlockers(row: any): string[] {
  const blockers: string[] = []
  if (!destinationFieldSatisfied('getting_there', row)) blockers.push('getting there')
  if (!destinationFieldSatisfied('min_viable_days', row)) blockers.push('min viable days')
  if (!destinationFieldSatisfied('travel_times', row)) blockers.push('at least one travel time entry')
  if (!destinationFieldSatisfied('tips_three_plus', row)) blockers.push('3 or more tips')
  return blockers
}

/**
 * Share the same shape used by the queue + the form completeness meter.
 * Each field is weighted equally. Three "mandatory for publish" fields
 * (3 tips, fee info, getting_there) are tracked separately and gate the
 * thin-page check — step 5 wires that in. For now this is a progress
 * indicator the VA uses to pick the worst place next.
 */
export const PLACE_COMPLETENESS_FIELDS = [
  'slug',
  'destination_id',
  'summary',
  'getting_there',
  'nearest_hub',
  'duration_minutes',
  'best_months',
  'part_of_tour',
  'fee_or_free',          // entrance_fee IS NOT NULL OR fee_notes mentions 'free'
  'tips_three_plus',      // tips.length >= 3
  'source_urls_present',  // source_urls.length > 0
  'verified_at',
] as const

const COMPLETENESS_FIELD_LABEL: Record<typeof PLACE_COMPLETENESS_FIELDS[number], string> = {
  slug: 'slug',
  destination_id: 'destination',
  summary: 'summary',
  getting_there: 'getting there',
  nearest_hub: 'nearest hub',
  duration_minutes: 'duration',
  best_months: 'best months',
  part_of_tour: 'part of tour',
  fee_or_free: 'fee info',
  tips_three_plus: '3+ tips',
  source_urls_present: 'source URLs',
  verified_at: 'verification stamp',
}

function fieldSatisfied(field: typeof PLACE_COMPLETENESS_FIELDS[number], row: any): boolean {
  switch (field) {
    case 'fee_or_free':
      if (row.entrance_fee !== null && row.entrance_fee !== undefined) return true
      if (typeof row.fee_notes === 'string' && /free/i.test(row.fee_notes)) return true
      return false
    case 'tips_three_plus':
      return Array.isArray(row.tips) && row.tips.length >= 3
    case 'source_urls_present':
      return Array.isArray(row.source_urls) && row.source_urls.length > 0
    case 'best_months':
      return Array.isArray(row.best_months) && row.best_months.length > 0
    default:
      return !!row[field]
  }
}

export function placeCompletenessPercent(row: any): number {
  const points = PLACE_COMPLETENESS_FIELDS.reduce(
    (n, field) => n + (fieldSatisfied(field, row) ? 1 : 0),
    0,
  )
  return Math.round((points / PLACE_COMPLETENESS_FIELDS.length) * 100)
}

/**
 * Human-readable labels for every spec field that isn't yet filled.
 * Powers the completeness meter + helps the VA see what's left.
 */
export function placeMissingFields(row: any): string[] {
  return PLACE_COMPLETENESS_FIELDS.filter((f) => !fieldSatisfied(f, row)).map(
    (f) => COMPLETENESS_FIELD_LABEL[f],
  )
}

/**
 * Thin-page bar from docs/places-spec.md §1 / §3. A place can't be
 * flipped to 'published' until all three are satisfied — hundreds of
 * thin pages would drag the whole domain down.
 */
export function placePublishBlockers(row: any): string[] {
  const blockers: string[] = []
  if (!fieldSatisfied('tips_three_plus', row)) blockers.push('3 or more tips')
  if (!fieldSatisfied('fee_or_free', row)) blockers.push('fee info (set entrance_fee, or write "free" in fee notes)')
  if (!fieldSatisfied('getting_there', row)) blockers.push('getting there')
  return blockers
}

export interface AdminUser {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  is_admin: boolean
  is_moderator: boolean
  is_banned: boolean
  ban_reason?: string
  created_at: string
  trips_count?: number
}

export const adminService = {
  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    const user = await getUserSafe()
    if (!user) return false

    const { data } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single()

    return data?.is_admin || data?.is_moderator || false
  },

  /**
   * Can the current user edit curated content (places, destinations,
   * partner_products)? True for admins/moderators OR dedicated editors.
   * Editors are RLS-scoped to the content tables only — the admin layout
   * also hides admin-only routes from them.
   */
  async canEditPlaces(): Promise<boolean> {
    const user = await getUserSafe()
    if (!user) return false

    const { data } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator, is_editor')
      .eq('id', user.id)
      .single()

    return data?.is_admin || data?.is_moderator || data?.is_editor || false
  },

  /**
   * True for users with ONLY the editor bit (not admin, not moderator).
   * Used in the admin layout to filter nav items.
   */
  async isEditorOnly(): Promise<boolean> {
    const user = await getUserSafe()
    if (!user) return false

    const { data } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator, is_editor')
      .eq('id', user.id)
      .single()

    if (!data) return false
    return !!data.is_editor && !data.is_admin && !data.is_moderator
  },

  /**
   * Get dashboard stats
   */
  async getStats(): Promise<AdminStats> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [
      usersResult,
      tripsResult,
      placesResult,
      publicTripsResult,
      reportsResult,
      newUsersResult,
      newTripsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('itineraries').select('id', { count: 'exact', head: true }),
      supabase.from('places').select('id', { count: 'exact', head: true }),
      supabase.from('itineraries').select('id', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
      supabase.from('itineraries').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
    ])

    return {
      totalUsers: usersResult.count || 0,
      totalTrips: tripsResult.count || 0,
      totalPlaces: placesResult.count || 0,
      publicTrips: publicTripsResult.count || 0,
      pendingReports: reportsResult.count || 0,
      newUsersThisWeek: newUsersResult.count || 0,
      newTripsThisWeek: newTripsResult.count || 0,
    }
  },

  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 20, search?: string): Promise<{ users: AdminUser[]; total: number }> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return { users: [], total: 0 }
    }

    return { users: data || [], total: count || 0 }
  },

  /**
   * Update user admin status
   */
  async updateUserRole(userId: string, role: 'admin' | 'moderator' | 'user'): Promise<boolean> {
    const updates: any = {
      is_admin: role === 'admin',
      is_moderator: role === 'moderator',
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (!error) {
      await this.logActivity('update_role', 'user', userId, { newRole: role })
    }

    return !error
  },

  /**
   * Ban/unban user
   */
  async toggleBan(userId: string, ban: boolean, reason?: string): Promise<boolean> {
    const updates: any = {
      is_banned: ban,
      ban_reason: ban ? reason : null,
      banned_at: ban ? new Date().toISOString() : null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (!error) {
      await this.logActivity(ban ? 'ban_user' : 'unban_user', 'user', userId, { reason })
    }

    return !error
  },

  /**
   * Get content reports
   */
  async getReports(status?: string): Promise<ContentReport[]> {
    let query = supabase
      .from('content_reports')
      .select(`
        *,
        reporter:profiles!content_reports_reporter_id_fkey(username, email)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return []
    }

    return (data || []).map((r: any) => ({
      ...r,
      reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
    }))
  },

  /**
   * Update report status
   */
  async updateReport(reportId: string, status: string, actionTaken?: string): Promise<boolean> {
    const user = await getUserSafe()

    const { error } = await supabase
      .from('content_reports')
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        action_taken: actionTaken,
      })
      .eq('id', reportId)

    if (!error) {
      await this.logActivity('review_report', 'report', reportId, { status, actionTaken })
    }

    return !error
  },

  /**
   * Get all trips for moderation
   */
  async getTrips(page: number = 1, limit: number = 20, publicOnly?: boolean): Promise<{ trips: any[]; total: number }> {
    let query = supabase
      .from('itineraries')
      .select(`
        *,
        user:profiles!itineraries_user_id_fkey(username, first_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (publicOnly) {
      query = query.eq('is_public', true)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching trips:', error)
      return { trips: [], total: 0 }
    }

    const trips = (data || []).map((t: any) => ({
      ...t,
      user: Array.isArray(t.user) ? t.user[0] : t.user,
    }))

    return { trips, total: count || 0 }
  },

  /**
   * Delete trip (admin action)
   */
  async deleteTrip(tripId: string): Promise<boolean> {
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', tripId)

    if (!error) {
      await this.logActivity('delete_trip', 'trip', tripId, {})
    }

    return !error
  },

  /**
   * Get all places
   */
  async getPlaces(page: number = 1, limit: number = 20): Promise<{ places: any[]; total: number }> {
    const { data, count, error } = await supabase
      .from('places')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Error fetching places:', error)
      return { places: [], total: 0 }
    }

    return { places: data || [], total: count || 0 }
  },

  /**
   * Queue for /admin/places — returns places with destination name,
   * completeness %, and a staleness flag. Supports the spec filters.
   */
  async getPlaceQueue(opts: {
    destinationId?: string
    status?: 'draft' | 'published' | 'needs_review'
    incomplete?: boolean       // < 100%
    stale?: boolean            // verified_at older than 6 months OR never verified
    search?: string            // name OR location ilike '%<q>%'
    category?: string          // places.category exact match
    sort?: PlaceQueueSort      // default 'completeness'
  } = {}): Promise<AdminPlaceQueueRow[]> {
    let query = supabase
      .from('places')
      .select(`
        id, name, slug, status, verified_at, is_active,
        destination_id, category, location, summary, entrance_fee, fee_notes, duration_minutes,
        getting_there, nearest_hub, best_months, part_of_tour,
        tips, source_urls,
        destination:destinations(id, name)
      `)

    if (opts.destinationId) query = query.eq('destination_id', opts.destinationId)
    if (opts.status) query = query.eq('status', opts.status)
    if (opts.category) query = query.eq('category', opts.category)
    if (opts.search) {
      // ilike match on name OR location, URL-safe via supabase's or()
      const q = opts.search.replace(/[%,()]/g, '').trim()
      if (q) {
        query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching place queue:', error)
      return []
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    let rows: AdminPlaceQueueRow[] = (data || []).map((p: any) => {
      const completeness = placeCompletenessPercent(p)
      const stale = !p.verified_at || new Date(p.verified_at) < sixMonthsAgo
      const dest = Array.isArray(p.destination) ? p.destination[0] : p.destination
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        verified_at: p.verified_at,
        destination_id: p.destination_id,
        destination_name: dest?.name ?? null,
        completeness,
        stale,
      }
    })

    if (opts.incomplete) rows = rows.filter((r) => r.completeness < 100)
    if (opts.stale) rows = rows.filter((r) => r.stale)

    rows.sort(placeQueueComparator(opts.sort ?? 'completeness'))

    return rows
  },

  /**
   * Minimal destination list for the queue + form filter dropdowns.
   */
  async getDestinationsForFilter(): Promise<{ id: string; name: string; slug: string }[]> {
    const { data, error } = await supabase
      .from('destinations')
      .select('id, name, slug')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching destinations:', error)
      return []
    }
    return data || []
  },

  /**
   * Create/update place
   */
  async savePlace(place: any): Promise<boolean> {
    if (place.id) {
      const { error } = await supabase
        .from('places')
        .update(place)
        .eq('id', place.id)

      if (!error) {
        await this.logActivity('update_place', 'place', place.id, {})
      }
      return !error
    } else {
      const { error } = await supabase
        .from('places')
        .insert(place)

      if (!error) {
        await this.logActivity('create_place', 'place', 'new', { name: place.name })
      }
      return !error
    }
  },

  /**
   * Fetch a single place by id — used by the /admin/places/[id] form.
   */
  async getPlaceById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      console.error('Error fetching place:', error)
      return null
    }
    return data
  },

  /**
   * Create a new draft place. Returns the new id, or null on error.
   */
  async createDraftPlace(fields: { name: string; location: string }): Promise<string | null> {
    const { data, error } = await supabase
      .from('places')
      .insert({
        name: fields.name,
        location: fields.location,
        status: 'draft',
        is_active: false,       // not visible on Discover until the editor flips it
      })
      .select('id')
      .single()
    if (error) {
      console.error('Error creating draft place:', error)
      return null
    }
    await this.logActivity('create_place', 'place', data.id, { name: fields.name })
    return data.id
  },

  /**
   * Save an in-progress place — writes the spec columns + leaves is_active
   * alone. Publish flipping (status='published') is routed through
   * publishPlace() which runs the thin-page guard.
   */
  async savePlaceDraft(id: string, fields: Record<string, any>): Promise<boolean> {
    const { error } = await supabase
      .from('places')
      .update(fields)
      .eq('id', id)
    if (error) {
      console.error('Error saving place:', error)
      return false
    }
    await this.logActivity('update_place', 'place', id, { fields: Object.keys(fields) })
    return true
  },

  /**
   * Flip a place to 'published' once the thin-page bar is cleared. Also
   * sets is_active = true so the row appears on Discover.
   * Returns { ok, blockers } — the blockers list is only non-empty when
   * the bar fails, letting the UI render the exact miss.
   */
  async publishPlace(id: string): Promise<{ ok: boolean; blockers: string[] }> {
    const place = await this.getPlaceById(id)
    if (!place) return { ok: false, blockers: ['place not found'] }
    const blockers = placePublishBlockers(place)
    if (blockers.length > 0) return { ok: false, blockers }

    const { error } = await supabase
      .from('places')
      .update({ status: 'published', is_active: true })
      .eq('id', id)
    if (error) {
      console.error('Error publishing place:', error)
      return { ok: false, blockers: ['database error'] }
    }
    await this.logActivity('publish_place', 'place', id, {})
    return { ok: true, blockers: [] }
  },

  /**
   * Back to draft. Leaves is_active alone — the admin may still want
   * the row visible on Discover as an unpublished listing.
   */
  async unpublishPlace(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('places')
      .update({ status: 'draft' })
      .eq('id', id)
    if (error) {
      console.error('Error unpublishing place:', error)
      return false
    }
    await this.logActivity('unpublish_place', 'place', id, {})
    return true
  },

  /**
   * Partner products repeater backing. Each row is its own INSERT /
   * UPDATE / DELETE because partner_products is a separate table.
   */
  async getPartnerProductsForPlace(placeId: string): Promise<PartnerProduct[]> {
    const { data, error } = await supabase
      .from('partner_products')
      .select('*')
      .eq('place_id', placeId)
      .order('priority', { ascending: false })
      .order('id', { ascending: true })
    if (error) {
      console.error('Error fetching partner products:', error)
      return []
    }
    return (data as PartnerProduct[]) || []
  },

  async savePartnerProduct(product: Partial<PartnerProduct> & { place_id: string }): Promise<string | null> {
    const payload = {
      place_id: product.place_id,
      destination_id: product.destination_id ?? null,
      partner: product.partner,
      product_name: product.product_name ?? null,
      product_type: product.product_type,
      price_from: product.price_from ?? null,
      includes: product.includes ?? null,
      deeplink: product.deeplink,
      priority: product.priority ?? 0,
      active: product.active ?? true,
    }
    if (product.id) {
      const { error } = await supabase.from('partner_products').update(payload).eq('id', product.id)
      if (error) {
        console.error('Error updating partner product:', error)
        return null
      }
      return product.id
    }
    const { data, error } = await supabase
      .from('partner_products')
      .insert(payload)
      .select('id')
      .single()
    if (error || !data) {
      console.error('Error creating partner product:', error)
      return null
    }
    return data.id
  },

  async deletePartnerProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from('partner_products').delete().eq('id', id)
    return !error
  },

  /**
   * Stamp verified_at = now, verified_by = user email. The /admin/review
   * staleness queue (step 8) drops this row once verified_at is fresh.
   */
  async markPlaceVerified(id: string, verifiedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('places')
      .update({ verified_at: new Date().toISOString(), verified_by: verifiedBy })
      .eq('id', id)
    if (error) {
      console.error('Error marking place verified:', error)
      return false
    }
    await this.logActivity('verify_place', 'place', id, { verifiedBy })
    return true
  },

  async markPartnerProductVerified(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('partner_products')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', id)
    return !error
  },

  /**
   * Staleness queue for /admin/review. Returns places + destinations
   * whose verified_at is older than 6 months OR has never been stamped.
   * Oldest first — the editor re-verifies top down.
   */
  async getStaleContent(): Promise<{
    places: { id: string; name: string; verified_at: string | null; destination_name: string | null }[]
    destinations: { id: string; name: string; verified_at: string | null }[]
  }> {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const cutoff = sixMonthsAgo.toISOString()

    const [placesResult, destinationsResult] = await Promise.all([
      supabase
        .from('places')
        .select('id, name, verified_at, destination:destinations(name)')
        .or(`verified_at.is.null,verified_at.lt.${cutoff}`)
        .order('verified_at', { ascending: true, nullsFirst: true }),
      supabase
        .from('destinations')
        .select('id, name, verified_at')
        .or(`verified_at.is.null,verified_at.lt.${cutoff}`)
        .order('verified_at', { ascending: true, nullsFirst: true }),
    ])

    const places = (placesResult.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      verified_at: p.verified_at,
      destination_name: Array.isArray(p.destination) ? p.destination[0]?.name ?? null : p.destination?.name ?? null,
    }))
    const destinations = (destinationsResult.data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      verified_at: d.verified_at,
    }))
    return { places, destinations }
  },

  async markDestinationVerified(id: string, verifiedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('destinations')
      .update({ verified_at: new Date().toISOString(), verified_by: verifiedBy })
      .eq('id', id)
    if (error) return false
    await this.logActivity('verify_destination', 'destination', id, { verifiedBy })
    return true
  },

  // --- Destinations CRUD -----------------------------------------------

  async getDestinationQueue(opts: {
    status?: 'draft' | 'published' | 'needs_review'
    incomplete?: boolean
    stale?: boolean
  } = {}): Promise<AdminDestinationQueueRow[]> {
    let query = supabase.from('destinations').select('*').order('name', { ascending: true })
    if (opts.status) query = query.eq('status', opts.status)
    const { data, error } = await query
    if (error) {
      console.error('Error fetching destination queue:', error)
      return []
    }
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    let rows: AdminDestinationQueueRow[] = (data || []).map((d: any) => {
      const completeness = destinationCompletenessPercent(d)
      const stale = !d.verified_at || new Date(d.verified_at) < sixMonthsAgo
      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        region: d.region,
        status: d.status,
        verified_at: d.verified_at,
        min_viable_days: d.min_viable_days,
        travel_times: d.travel_times,
        completeness,
        stale,
      }
    })
    if (opts.incomplete) rows = rows.filter((r) => r.completeness < 100)
    if (opts.stale) rows = rows.filter((r) => r.stale)
    rows.sort((a, b) => a.completeness - b.completeness)
    return rows
  },

  async getDestinationById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      console.error('Error fetching destination:', error)
      return null
    }
    return data
  },

  async createDraftDestination(fields: { name: string; slug: string }): Promise<string | null> {
    const { data, error } = await supabase
      .from('destinations')
      .insert({ name: fields.name, slug: fields.slug, status: 'draft' })
      .select('id')
      .single()
    if (error || !data) {
      console.error('Error creating destination:', error)
      return null
    }
    await this.logActivity('create_destination', 'destination', data.id, { name: fields.name })
    return data.id
  },

  async saveDestinationDraft(id: string, fields: Record<string, any>): Promise<boolean> {
    const { error } = await supabase
      .from('destinations')
      .update(fields)
      .eq('id', id)
    if (error) {
      console.error('Error saving destination:', error)
      return false
    }
    await this.logActivity('update_destination', 'destination', id, { fields: Object.keys(fields) })
    return true
  },

  async publishDestination(id: string): Promise<{ ok: boolean; blockers: string[] }> {
    const dest = await this.getDestinationById(id)
    if (!dest) return { ok: false, blockers: ['destination not found'] }
    const blockers = destinationPublishBlockers(dest)
    if (blockers.length > 0) return { ok: false, blockers }
    const { error } = await supabase
      .from('destinations')
      .update({ status: 'published' })
      .eq('id', id)
    if (error) return { ok: false, blockers: ['database error'] }
    await this.logActivity('publish_destination', 'destination', id, {})
    return { ok: true, blockers: [] }
  },

  async unpublishDestination(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('destinations')
      .update({ status: 'draft' })
      .eq('id', id)
    if (error) return false
    await this.logActivity('unpublish_destination', 'destination', id, {})
    return true
  },

  /**
   * Minimal place list for the sequencing pickers (pairs_with /
   * not_same_day_as). Includes destination name so the editor can
   * disambiguate same-named places across destinations.
   */
  async getPlacesForPicker(): Promise<{ id: string; name: string; destination_name: string | null }[]> {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, destination:destinations(name)')
      .order('name', { ascending: true })
    if (error) {
      console.error('Error fetching places for picker:', error)
      return []
    }
    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      destination_name: Array.isArray(p.destination) ? p.destination[0]?.name ?? null : p.destination?.name ?? null,
    }))
  },

  /**
   * Delete place
   */
  async deletePlace(placeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId)

    if (!error) {
      await this.logActivity('delete_place', 'place', placeId, {})
    }

    return !error
  },

  /**
   * Toggle place featured status
   */
  async toggleFeatured(placeId: string, featured: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('places')
      .update({ is_featured: featured })
      .eq('id', placeId)

    return !error
  },

  /**
   * Log admin activity
   */
  async logActivity(action: string, targetType?: string, targetId?: string, details?: any): Promise<void> {
    const user = await getUserSafe()
    if (!user) return

    await supabase.from('admin_activity_log').insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    })
  },

  /**
   * Get activity log
   */
  async getActivityLog(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select(`
        *,
        admin:profiles!admin_activity_log_admin_id_fkey(username, first_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activity log:', error)
      return []
    }

    return (data || []).map((l: any) => ({
      ...l,
      admin: Array.isArray(l.admin) ? l.admin[0] : l.admin,
    }))
  },
}
