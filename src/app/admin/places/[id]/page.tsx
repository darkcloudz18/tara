'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Globe, Lock, Plus, Trash2, Check } from 'lucide-react'
import {
  adminService,
  placeCompletenessPercent,
  placeMissingFields,
  placePublishBlockers,
  PartnerProduct,
  PartnerProductType,
} from '@/features/admin/services/adminService'
import { useToast } from '@/contexts/ToastContext'

// Full-page editor for a single place. Grouped per spec:
// Basics · Practical · Getting there · Sequencing · Sources.
// Step 5 wires the completeness meter + the thin-page publish gate.
// Step 6 upgrades Tips + Partner products to real repeaters.
// Step 7 adds Mark verified + searchable sequencing pickers.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Destination {
  id: string
  name: string
  slug: string
}

export default function AdminPlaceEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { success, error } = useToast()

  const [place, setPlace] = useState<any | null>(null)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [partnerProducts, setPartnerProducts] = useState<PartnerProduct[]>([])

  useEffect(() => {
    if (!params.id) return
    Promise.all([
      adminService.getPlaceById(params.id),
      adminService.getDestinationsForFilter(),
      adminService.getPartnerProductsForPlace(params.id),
    ])
      .then(([p, dests, products]) => {
        setPlace(p)
        setDestinations(dests)
        setPartnerProducts(products)
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const update = (patch: Record<string, any>) => setPlace((p: any) => ({ ...p, ...patch }))

  const persistCurrentDraft = async (): Promise<boolean> => {
    if (!place) return false
    const fields = {
      name: place.name,
      slug: emptyToNull(place.slug),
      destination_id: emptyToNull(place.destination_id),
      category: emptyToNull(place.category),
      summary: emptyToNull(place.summary),
      description: emptyToNull(place.description),
      entrance_fee: numericOrNull(place.entrance_fee),
      fee_notes: emptyToNull(place.fee_notes),
      duration_minutes: numericOrNull(place.duration_minutes),
      booking_required: !!place.booking_required,
      booking_notes: emptyToNull(place.booking_notes),
      best_months: Array.isArray(place.best_months) ? place.best_months : null,
      best_time_of_day: emptyToNull(place.best_time_of_day),
      getting_there: emptyToNull(place.getting_there),
      nearest_hub: emptyToNull(place.nearest_hub),
      part_of_tour: emptyToNull(place.part_of_tour),
      tips: Array.isArray(place.tips) ? place.tips.filter((t: string) => t && t.trim()) : null,
      source_urls: parseSourceUrls(place.source_urls_raw ?? arrayToTextarea(place.source_urls)),
    }
    const ok = await adminService.savePlaceDraft(place.id, fields)
    if (!ok) return false
    const fresh = await adminService.getPlaceById(place.id)
    if (fresh) setPlace({ ...fresh, source_urls_raw: arrayToTextarea(fresh.source_urls) })
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    const ok = await persistCurrentDraft()
    setSaving(false)
    if (ok) success('Place saved')
    else error('Failed to save place')
  }

  const handlePublish = async () => {
    if (!place) return
    setPublishing(true)
    // Save first so the server sees the latest fields before gate-checking.
    const saved = await persistCurrentDraft()
    if (!saved) {
      setPublishing(false)
      error('Failed to save before publishing')
      return
    }
    const result = await adminService.publishPlace(place.id)
    setPublishing(false)
    if (!result.ok) {
      error(`Can't publish: needs ${result.blockers.join(', ')}`)
      return
    }
    success('Place published')
    const fresh = await adminService.getPlaceById(place.id)
    if (fresh) setPlace({ ...fresh, source_urls_raw: arrayToTextarea(fresh.source_urls) })
  }

  const handleUnpublish = async () => {
    if (!place) return
    setPublishing(true)
    const ok = await adminService.unpublishPlace(place.id)
    setPublishing(false)
    if (!ok) {
      error('Failed to unpublish')
      return
    }
    success('Reverted to draft')
    const fresh = await adminService.getPlaceById(place.id)
    if (fresh) setPlace({ ...fresh, source_urls_raw: arrayToTextarea(fresh.source_urls) })
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!place) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-gray-500">Place not found.</p>
        <Link href="/admin/places" className="text-teal-600 underline">Back to queue</Link>
      </div>
    )
  }

  const sourceUrlsRaw = place.source_urls_raw ?? arrayToTextarea(place.source_urls)

  // Live-recompute: reflect in-progress Sources textarea even before save.
  const effectivePlace = {
    ...place,
    source_urls: parseSourceUrls(sourceUrlsRaw) ?? [],
  }
  const completeness = placeCompletenessPercent(effectivePlace)
  const missing = placeMissingFields(effectivePlace)
  const blockers = placePublishBlockers(effectivePlace)
  const canPublish = blockers.length === 0
  const isPublished = place.status === 'published'
  const meterColor =
    completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sticky top-0 bg-gray-100 dark:bg-gray-950 py-2 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/places"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
            aria-label="Back to queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{place.name || 'Untitled place'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status: {place.status} · Last verified {place.verified_at ? new Date(place.verified_at).toLocaleDateString() : 'never'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || publishing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          {isPublished ? (
            <button
              onClick={handleUnpublish}
              disabled={saving || publishing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Unpublish
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={saving || publishing || !canPublish}
              title={canPublish ? 'Publish this place' : `Needs ${blockers.join(', ')}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Completeness meter */}
      <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Completeness</h2>
          <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{completeness}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${meterColor} transition-all`} style={{ width: `${completeness}%` }} />
        </div>
        {missing.length > 0 && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-600 dark:text-gray-300">Needs:</span> {missing.join(', ')}
          </p>
        )}
        {!isPublished && blockers.length > 0 && (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
            <span className="font-medium">Can't publish yet:</span> {blockers.join(', ')}
          </p>
        )}
        {isPublished && (
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            Live on <span className="font-mono">/places/{place.slug ?? '—'}</span>
          </p>
        )}
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Basics */}
        <Group title="Basics">
          <Field label="Name">
            <input className={inputClass} value={place.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Slug" hint="URL path for /places/[slug]. Lowercase, hyphens.">
            <input className={inputClass} value={place.slug ?? ''} onChange={(e) => update({ slug: e.target.value })} placeholder="big-lagoon" />
          </Field>
          <Field label="Destination">
            <select className={inputClass} value={place.destination_id ?? ''} onChange={(e) => update({ destination_id: e.target.value })}>
              <option value="">—</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select className={inputClass} value={place.category ?? ''} onChange={(e) => update({ category: e.target.value })}>
              <option value="">—</option>
              {['beach', 'lagoon', 'waterfall', 'viewpoint', 'heritage', 'food', 'activity', 'stay'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Summary" hint="One sentence, used in cards and meta description.">
            <input className={inputClass} value={place.summary ?? ''} onChange={(e) => update({ summary: e.target.value })} />
          </Field>
          <Field label="Description" hint="Two or three paragraphs. Write it yourself — never copy partner text.">
            <textarea className={textareaClass} rows={5} value={place.description ?? ''} onChange={(e) => update({ description: e.target.value })} />
          </Field>
        </Group>

        {/* Practical */}
        <Group title="Practical">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Entrance fee (₱)" hint="Leave blank if unknown. 0 means explicitly free. Null beats wrong.">
              <input
                className={inputClass}
                type="number"
                step="any"
                value={place.entrance_fee ?? ''}
                onChange={(e) => update({ entrance_fee: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Duration (minutes)" hint="Typical visit length.">
              <input
                className={inputClass}
                type="number"
                value={place.duration_minutes ?? ''}
                onChange={(e) => update({ duration_minutes: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Fee notes" hint='e.g. "plus ₱200 paddleboat permit, paid on site, cash"'>
            <input className={inputClass} value={place.fee_notes ?? ''} onChange={(e) => update({ fee_notes: e.target.value })} />
          </Field>
          <Field label="Booking required?">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={!!place.booking_required}
                onChange={(e) => update({ booking_required: e.target.checked })}
              />
              Must be booked ahead
            </label>
          </Field>
          <Field label="Booking notes" hint='e.g. "permits capped daily, sells out in peak season"'>
            <input className={inputClass} value={place.booking_notes ?? ''} onChange={(e) => update({ booking_notes: e.target.value })} />
          </Field>
          <Field label="Best months">
            <div className="flex flex-wrap gap-2">
              {MONTHS.map((label, i) => {
                const month = i + 1
                const selected = Array.isArray(place.best_months) && place.best_months.includes(month)
                return (
                  <button
                    type="button"
                    key={month}
                    onClick={() => {
                      const prev: number[] = Array.isArray(place.best_months) ? place.best_months : []
                      const next = selected ? prev.filter((m) => m !== month) : [...prev, month].sort((a, b) => a - b)
                      update({ best_months: next })
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs border ${
                      selected
                        ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="Best time of day" hint='e.g. "early morning for the light"'>
            <input className={inputClass} value={place.best_time_of_day ?? ''} onChange={(e) => update({ best_time_of_day: e.target.value })} />
          </Field>
        </Group>

        {/* Getting there */}
        <Group title="Getting there">
          <Field label="Nearest hub" hint='e.g. "El Nido town"'>
            <input className={inputClass} value={place.nearest_hub ?? ''} onChange={(e) => update({ nearest_hub: e.target.value })} />
          </Field>
          <Field label="Getting there" hint="From nearest_hub. Concrete steps: tricycle, boat, cost, duration.">
            <textarea className={textareaClass} rows={4} value={place.getting_there ?? ''} onChange={(e) => update({ getting_there: e.target.value })} />
          </Field>
        </Group>

        {/* Sequencing */}
        <Group title="Sequencing" hint="Searchable pickers for pairs_with and not_same_day_as land in step 7.">
          <Field label="Part of tour" hint='Groups stops into one trip, e.g. "El Nido Tour A"'>
            <input className={inputClass} value={place.part_of_tour ?? ''} onChange={(e) => update({ part_of_tour: e.target.value })} />
          </Field>
        </Group>

        {/* Tips */}
        <Group
          title="Tips"
          hint="Non-obvious things that save money, time, or regret. Three minimum before publish."
        >
          <TipsRepeater
            tips={Array.isArray(place.tips) ? place.tips : []}
            onChange={(next) => update({ tips: next })}
          />
        </Group>

        {/* Sources */}
        <Group title="Sources" hint="One URL per line. Every substantive fact needs a source — the trust block on /places/[slug] renders these.">
          <Field label="Source URLs">
            <textarea
              className={textareaClass}
              rows={5}
              value={sourceUrlsRaw}
              onChange={(e) => update({ source_urls_raw: e.target.value })}
              placeholder={'https://elnido.gov.ph/...\nhttps://tourism.gov.ph/...'}
            />
          </Field>
        </Group>

        {/* Partner products */}
        <Group
          title="Partner products"
          hint="Attach here while you research. A partner is authoritative for its own product — never a source for place facts."
        >
          <PartnerProductsRepeater
            placeId={place.id}
            products={partnerProducts}
            onChange={setPartnerProducts}
            toast={{ success, error }}
          />
        </Group>

        <div className="pt-2 pb-10 text-sm text-gray-500 dark:text-gray-400">
          Searchable pickers for pairs_with / not_same_day_as and the Mark
          verified stamp land in step 7 of Task 15.
        </div>
      </div>
    </div>
  )
}

// --- Tips repeater -------------------------------------------------------

function TipsRepeater({
  tips,
  onChange,
}: {
  tips: string[]
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const addTip = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onChange([...tips, trimmed])
    setDraft('')
  }

  const updateTip = (index: number, value: string) => {
    const next = [...tips]
    next[index] = value
    onChange(next)
  }

  const removeTip = (index: number) => {
    onChange(tips.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {tips.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tips yet. 3-star reviews on Klook / Agoda / TripAdvisor and recurring questions in Facebook groups are the usual source.
        </p>
      ) : (
        <ol className="space-y-2 list-decimal pl-6">
          {tips.map((tip, i) => (
            <li key={i}>
              <div className="flex items-start gap-2">
                <input
                  value={tip}
                  onChange={(e) => updateTip(i, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeTip(i)}
                  className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Remove tip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTip()
            }
          }}
          placeholder="e.g. Big Lagoon needs a separate paddleboat permit — capped daily."
          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
        />
        <button
          type="button"
          onClick={addTip}
          disabled={!draft.trim()}
          className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add tip
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{tips.length} / 3 minimum for publish</p>
    </div>
  )
}

// --- Partner products repeater ------------------------------------------

type PartnerDraft = Partial<PartnerProduct> & { place_id: string; _localKey?: string }

function PartnerProductsRepeater({
  placeId,
  products,
  onChange,
  toast,
}: {
  placeId: string
  products: PartnerProduct[]
  onChange: (next: PartnerProduct[]) => void
  toast: { success: (m: string) => void; error: (m: string) => void }
}) {
  const [drafts, setDrafts] = useState<PartnerDraft[]>([])
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const existingSaved = new Set(products.map((p) => p.id))

  const addRow = () => {
    const key = `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setDrafts((d) => [
      ...d,
      {
        _localKey: key,
        place_id: placeId,
        partner: 'klook',
        product_type: 'activity',
        active: true,
      },
    ])
  }

  const updateDraft = (key: string, patch: Partial<PartnerDraft>) => {
    setDrafts((d) => d.map((row) => (row._localKey === key ? { ...row, ...patch } : row)))
  }

  const updateExisting = (id: string, patch: Partial<PartnerProduct>) => {
    onChange(products.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const saveDraft = async (key: string) => {
    const draft = drafts.find((d) => d._localKey === key)
    if (!draft) return
    if (!draft.partner || !draft.product_type || !draft.deeplink) {
      toast.error('partner, type, and deeplink are required')
      return
    }
    setSavingKey(key)
    const id = await adminService.savePartnerProduct(draft)
    setSavingKey(null)
    if (!id) {
      toast.error('Failed to save product')
      return
    }
    const fresh = await adminService.getPartnerProductsForPlace(placeId)
    onChange(fresh)
    setDrafts((d) => d.filter((row) => row._localKey !== key))
    toast.success('Partner product saved')
  }

  const saveExisting = async (product: PartnerProduct) => {
    setSavingKey(product.id)
    // place_id is nullable in the DB (a product can attach to a destination
    // instead) but on this form we're always attaching to the current place.
    const id = await adminService.savePartnerProduct({ ...product, place_id: placeId })
    setSavingKey(null)
    if (!id) {
      toast.error('Failed to save product')
      return
    }
    toast.success('Partner product updated')
  }

  const deleteExisting = async (product: PartnerProduct) => {
    if (!confirm(`Delete this ${product.partner} product?`)) return
    const ok = await adminService.deletePartnerProduct(product.id)
    if (!ok) {
      toast.error('Failed to delete')
      return
    }
    onChange(products.filter((p) => p.id !== product.id))
    toast.success('Partner product deleted')
  }

  const removeDraft = (key: string) => {
    setDrafts((d) => d.filter((row) => row._localKey !== key))
  }

  return (
    <div className="space-y-3">
      {products.length === 0 && drafts.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No partner products yet. Attach a Klook / Agoda / 12Go listing if there's one for this place.
        </p>
      )}

      {products.map((p) => (
        <PartnerProductRow
          key={p.id}
          row={p}
          existing
          saving={savingKey === p.id}
          onChange={(patch) => updateExisting(p.id, patch)}
          onSave={() => saveExisting(p)}
          onDelete={() => deleteExisting(p)}
        />
      ))}

      {drafts.map((d) => (
        <PartnerProductRow
          key={d._localKey!}
          row={d as any}
          existing={false}
          saving={savingKey === d._localKey}
          onChange={(patch) => updateDraft(d._localKey!, patch as any)}
          onSave={() => saveDraft(d._localKey!)}
          onDelete={() => removeDraft(d._localKey!)}
        />
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Plus className="w-4 h-4" />
        Add partner product
      </button>
    </div>
  )
}

function PartnerProductRow({
  row,
  existing,
  saving,
  onChange,
  onSave,
  onDelete,
}: {
  row: PartnerProduct | PartnerDraft
  existing: boolean
  saving: boolean
  onChange: (patch: Partial<PartnerProduct>) => void
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <select
          value={row.partner ?? 'klook'}
          onChange={(e) => onChange({ partner: e.target.value })}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        >
          <option value="klook">Klook</option>
          <option value="agoda">Agoda</option>
          <option value="12go">12Go</option>
          <option value="airalo">Airalo</option>
        </select>
        <select
          value={row.product_type ?? 'activity'}
          onChange={(e) => onChange({ product_type: e.target.value as PartnerProductType })}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        >
          <option value="activity">Activity</option>
          <option value="stay">Stay</option>
          <option value="transfer">Transfer</option>
          <option value="addon">Add-on</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={row.active ?? true}
            onChange={(e) => onChange({ active: e.target.checked })}
          />
          Active
        </label>
      </div>

      <input
        value={row.product_name ?? ''}
        onChange={(e) => onChange({ product_name: e.target.value })}
        placeholder="Product name as listed by the partner"
        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <input
          type="number"
          step="any"
          value={row.price_from ?? ''}
          onChange={(e) =>
            onChange({ price_from: e.target.value === '' ? null : Number(e.target.value) })
          }
          placeholder="Price from (₱)"
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        />
        <input
          value={row.includes ?? ''}
          onChange={(e) => onChange({ includes: e.target.value })}
          placeholder='Includes — e.g. "transport + lunch + guide"'
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        />
      </div>

      <input
        value={row.deeplink ?? ''}
        onChange={(e) => onChange({ deeplink: e.target.value })}
        placeholder="https://www.klook.com/en-PH/activity/... (clean URL, no affiliate ID)"
        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono"
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {existing && 'verified_at' in row && row.verified_at
            ? `Last verified ${new Date(row.verified_at).toLocaleDateString()}`
            : existing
            ? 'Not verified yet'
            : 'New — not saved'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            {existing ? 'Delete' : 'Discard'}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'

const textareaClass = inputClass + ' leading-relaxed'

function emptyToNull(v: any): any {
  return v === '' || v === undefined ? null : v
}

function numericOrNull(v: any): number | null {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function arrayToTextarea(a: any): string {
  return Array.isArray(a) ? a.join('\n') : ''
}

function parseSourceUrls(raw: string): string[] | null {
  if (typeof raw !== 'string') return null
  const list = raw
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  return list.length > 0 ? list : null
}
