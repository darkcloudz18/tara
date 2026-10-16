'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Globe, Lock, Plus, Trash2, ShieldCheck } from 'lucide-react'
import {
  adminService,
  destinationCompletenessPercent,
  destinationMissingFields,
  destinationPublishBlockers,
} from '@/features/admin/services/adminService'
import { useToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const COMMON_HUBS = ['manila', 'cebu', 'davao', 'clark', 'iloilo']

type TravelHub = { hub: string; minutes: number }

export default function AdminDestinationEditPage() {
  const params = useParams<{ id: string }>()
  const { success, error } = useToast()
  const { user } = useUser()

  const [destination, setDestination] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!params.id) return
    adminService
      .getDestinationById(params.id)
      .then((d) => setDestination(d ? withRaw(d) : null))
      .finally(() => setLoading(false))
  }, [params.id])

  const update = (patch: Record<string, any>) =>
    setDestination((d: any) => ({ ...d, ...patch }))

  const persistCurrentDraft = async (): Promise<boolean> => {
    if (!destination) return false
    const fields = {
      name: destination.name,
      slug: emptyToNull(destination.slug),
      region: emptyToNull(destination.region),
      summary: emptyToNull(destination.summary),
      description: emptyToNull(destination.description),
      getting_there: emptyToNull(destination.getting_there),
      best_months: Array.isArray(destination.best_months) ? destination.best_months : null,
      typical_days: numericOrNull(destination.typical_days),
      budget_low: numericOrNull(destination.budget_low),
      budget_mid: numericOrNull(destination.budget_mid),
      budget_high: numericOrNull(destination.budget_high),
      min_viable_days: numericOrNull(destination.min_viable_days),
      travel_times: travelTimesFromRaw(destination.travel_times_raw ?? objectToTravelRaw(destination.travel_times)),
      tips: Array.isArray(destination.tips) ? destination.tips.filter((t: string) => t && t.trim()) : null,
      source_urls: parseSourceUrls(destination.source_urls_raw ?? arrayToTextarea(destination.source_urls)),
    }
    const ok = await adminService.saveDestinationDraft(destination.id, fields)
    if (!ok) return false
    const fresh = await adminService.getDestinationById(destination.id)
    if (fresh) setDestination(withRaw(fresh))
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    const ok = await persistCurrentDraft()
    setSaving(false)
    if (ok) success('Destination saved')
    else error('Failed to save')
  }

  const handlePublish = async () => {
    if (!destination) return
    setPublishing(true)
    const saved = await persistCurrentDraft()
    if (!saved) {
      setPublishing(false)
      error('Failed to save before publishing')
      return
    }
    const result = await adminService.publishDestination(destination.id)
    setPublishing(false)
    if (!result.ok) {
      error(`Can't publish: needs ${result.blockers.join(', ')}`)
      return
    }
    success('Destination published')
    const fresh = await adminService.getDestinationById(destination.id)
    if (fresh) setDestination(withRaw(fresh))
  }

  const handleUnpublish = async () => {
    if (!destination) return
    setPublishing(true)
    const ok = await adminService.unpublishDestination(destination.id)
    setPublishing(false)
    if (!ok) {
      error('Failed to unpublish')
      return
    }
    success('Reverted to draft')
    const fresh = await adminService.getDestinationById(destination.id)
    if (fresh) setDestination(withRaw(fresh))
  }

  const handleMarkVerified = async () => {
    if (!destination || !user?.email) {
      error('Need to be signed in to verify')
      return
    }
    setVerifying(true)
    const saved = await persistCurrentDraft()
    if (!saved) {
      setVerifying(false)
      error('Failed to save before verifying')
      return
    }
    const ok = await adminService.markDestinationVerified(destination.id, user.email)
    setVerifying(false)
    if (!ok) {
      error('Failed to mark verified')
      return
    }
    success('Marked verified')
    const fresh = await adminService.getDestinationById(destination.id)
    if (fresh) setDestination(withRaw(fresh))
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!destination) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-gray-500">Destination not found.</p>
        <Link href="/admin/destinations" className="text-teal-600 underline">Back to queue</Link>
      </div>
    )
  }

  const sourceUrlsRaw = destination.source_urls_raw ?? arrayToTextarea(destination.source_urls)
  const travelTimesRaw: TravelHub[] = destination.travel_times_raw ?? objectToTravelRaw(destination.travel_times)

  const effective = {
    ...destination,
    source_urls: parseSourceUrls(sourceUrlsRaw) ?? [],
    travel_times: travelTimesFromRaw(travelTimesRaw),
  }
  const completeness = destinationCompletenessPercent(effective)
  const missing = destinationMissingFields(effective)
  const blockers = destinationPublishBlockers(effective)
  const canPublish = blockers.length === 0
  const isPublished = destination.status === 'published'
  const meterColor =
    completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sticky top-0 bg-gray-100 dark:bg-gray-950 py-2 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/destinations" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg" aria-label="Back to queue">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{destination.name || 'Untitled destination'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status: {destination.status} · Last verified {destination.verified_at ? new Date(destination.verified_at).toLocaleDateString() : 'never'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || publishing || verifying}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          <button
            onClick={handleMarkVerified}
            disabled={saving || publishing || verifying}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Mark verified
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
              title={canPublish ? 'Publish this destination' : `Needs ${blockers.join(', ')}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Completeness */}
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
            Live on <span className="font-mono">/destinations/{destination.slug ?? '—'}</span>
          </p>
        )}
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Basics */}
        <Group title="Basics">
          <Field label="Name">
            <input className={inputClass} value={destination.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label="Slug" hint="URL path for /destinations/[slug]. Lowercase, hyphens.">
            <input className={inputClass} value={destination.slug ?? ''} onChange={(e) => update({ slug: e.target.value })} placeholder="el-nido" />
          </Field>
          <Field label="Region" hint='e.g. "Palawan"'>
            <input className={inputClass} value={destination.region ?? ''} onChange={(e) => update({ region: e.target.value })} />
          </Field>
          <Field label="Summary" hint="One sentence, used in cards and meta description.">
            <input className={inputClass} value={destination.summary ?? ''} onChange={(e) => update({ summary: e.target.value })} />
          </Field>
          <Field label="Description" hint="Two or three paragraphs.">
            <textarea className={textareaClass} rows={5} value={destination.description ?? ''} onChange={(e) => update({ description: e.target.value })} />
          </Field>
        </Group>

        {/* Smart Build — the Task 17 ranking inputs */}
        <Group title="Smart Build" hint="Without these two fields the suggestion engine has nothing to rank on.">
          <Field label="Minimum viable days" hint="Below this, don't suggest it. El Nido 4, Boracay 2, Bohol 2, Siargao 3, Baguio 1.">
            <input
              className={inputClass}
              type="number"
              min={1}
              value={destination.min_viable_days ?? ''}
              onChange={(e) => update({ min_viable_days: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </Field>
          <Field label="Travel times" hint="Door-to-door minutes from each origin hub. Flight + transfer + wait, not flight duration.">
            <TravelTimesRepeater
              hubs={travelTimesRaw}
              onChange={(next) => update({ travel_times_raw: next })}
            />
          </Field>
        </Group>

        {/* Getting there + duration */}
        <Group title="Getting there">
          <Field label="Getting there" hint="From Manila / Cebu. Concrete steps, costs, durations.">
            <textarea className={textareaClass} rows={4} value={destination.getting_there ?? ''} onChange={(e) => update({ getting_there: e.target.value })} />
          </Field>
          <Field label="Typical days" hint='e.g. "most people spend 3-4 days"'>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={destination.typical_days ?? ''}
              onChange={(e) => update({ typical_days: e.target.value === '' ? null : Number(e.target.value) })}
            />
          </Field>
          <Field label="Best months">
            <div className="flex flex-wrap gap-2">
              {MONTHS.map((label, i) => {
                const month = i + 1
                const selected = Array.isArray(destination.best_months) && destination.best_months.includes(month)
                return (
                  <button
                    type="button"
                    key={month}
                    onClick={() => {
                      const prev: number[] = Array.isArray(destination.best_months) ? destination.best_months : []
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
        </Group>

        {/* Budget bands */}
        <Group title="Budget bands" hint="PHP per person per day. What the band actually buys.">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Low">
              <input className={inputClass} type="number" value={destination.budget_low ?? ''} onChange={(e) => update({ budget_low: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Mid">
              <input className={inputClass} type="number" value={destination.budget_mid ?? ''} onChange={(e) => update({ budget_mid: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="High">
              <input className={inputClass} type="number" value={destination.budget_high ?? ''} onChange={(e) => update({ budget_high: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
          </div>
        </Group>

        {/* Tips */}
        <Group title="Tips" hint="Non-obvious things that save money, time, or regret. Three minimum before publish.">
          <TipsRepeater
            tips={Array.isArray(destination.tips) ? destination.tips : []}
            onChange={(next) => update({ tips: next })}
          />
        </Group>

        {/* Sources */}
        <Group title="Sources" hint="One URL per line. Every substantive fact needs a source.">
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
      </div>
    </div>
  )
}

// --- Travel times repeater ----------------------------------------------

function TravelTimesRepeater({
  hubs,
  onChange,
}: {
  hubs: TravelHub[]
  onChange: (next: TravelHub[]) => void
}) {
  const [newHub, setNewHub] = useState('')
  const [newMinutes, setNewMinutes] = useState('')

  const existingHubs = new Set(hubs.map((h) => h.hub))

  const addHub = (hub?: string, minutes?: number) => {
    const h = (hub ?? newHub).trim().toLowerCase()
    const m = minutes ?? Number(newMinutes)
    if (!h || !Number.isFinite(m) || m <= 0) return
    if (existingHubs.has(h)) return
    onChange([...hubs, { hub: h, minutes: m }])
    setNewHub('')
    setNewMinutes('')
  }

  const removeHub = (hub: string) => {
    onChange(hubs.filter((h) => h.hub !== hub))
  }

  const updateMinutes = (hub: string, minutes: number) => {
    onChange(hubs.map((h) => (h.hub === hub ? { ...h, minutes } : h)))
  }

  return (
    <div className="space-y-3">
      {hubs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No travel times yet. Add at least one — Manila is the usual starting point.
        </p>
      ) : (
        <ul className="space-y-2">
          {hubs.map((h) => (
            <li key={h.hub} className="flex items-center gap-2">
              <span className="w-24 text-sm text-gray-700 dark:text-gray-300 capitalize">{h.hub}</span>
              <input
                className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                type="number"
                min={1}
                value={h.minutes}
                onChange={(e) => updateMinutes(h.hub, Number(e.target.value))}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">minutes door-to-door</span>
              <button type="button" onClick={() => removeHub(h.hub)} className="p-1 text-gray-400 hover:text-rose-600" aria-label={`Remove ${h.hub}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          placeholder="Hub (e.g. manila)"
          value={newHub}
          onChange={(e) => setNewHub(e.target.value)}
          list="hub-suggestions"
        />
        <datalist id="hub-suggestions">
          {COMMON_HUBS.filter((h) => !existingHubs.has(h)).map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
        <input
          className="w-28 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          placeholder="Minutes"
          type="number"
          min={1}
          value={newMinutes}
          onChange={(e) => setNewMinutes(e.target.value)}
        />
        <button
          type="button"
          onClick={() => addHub()}
          disabled={!newHub.trim() || !newMinutes}
          className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add hub
        </button>
      </div>
    </div>
  )
}

// --- Tips repeater (same shape as the places form) ----------------------

function TipsRepeater({ tips, onChange }: { tips: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const addTip = () => {
    const t = draft.trim()
    if (!t) return
    onChange([...tips, t])
    setDraft('')
  }
  const updateTip = (i: number, v: string) => onChange(tips.map((x, idx) => (idx === i ? v : x)))
  const removeTip = (i: number) => onChange(tips.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      {tips.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tips yet.
        </p>
      ) : (
        <ol className="space-y-2 list-decimal pl-6">
          {tips.map((tip, i) => (
            <li key={i}>
              <div className="flex items-start gap-2">
                <input value={tip} onChange={(e) => updateTip(i, e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
                <button type="button" onClick={() => removeTip(i)} className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Remove tip">
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
          placeholder='e.g. "Fly Caticlan (MPH), not Kalibo — Kalibo adds ~2hrs by van."'
          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        />
        <button type="button" onClick={addTip} disabled={!draft.trim()} className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50">
          <Plus className="w-4 h-4" />
          Add tip
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{tips.length} / 3 minimum for publish</p>
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
  const list = raw.split('\n').map((s) => s.trim()).filter((s) => s.length > 0)
  return list.length > 0 ? list : null
}

function objectToTravelRaw(obj: any): TravelHub[] {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj)
    .filter(([, m]) => typeof m === 'number')
    .map(([hub, minutes]) => ({ hub, minutes: minutes as number }))
}

function travelTimesFromRaw(raw: TravelHub[]): Record<string, number> | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  return raw.reduce<Record<string, number>>((acc, { hub, minutes }) => {
    if (hub && Number.isFinite(minutes) && minutes > 0) acc[hub] = minutes
    return acc
  }, {})
}

function withRaw(d: any): any {
  return {
    ...d,
    source_urls_raw: arrayToTextarea(d.source_urls),
    travel_times_raw: objectToTravelRaw(d.travel_times),
  }
}
