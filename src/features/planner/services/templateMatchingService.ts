import { getBucketList, BucketListItem } from './bucketListService'
import { TRIP_TEMPLATES, TripTemplate } from '../data/tripTemplates'

export interface TemplateMatch {
  template: TripTemplate
  overlapCount: number
  matchedPlaces: string[]
}

// Ranks templates by how many bucket items they overlap. An item counts
// as matching a template if either:
//   - the template's destination and the item's place_location are a
//     case-insensitive substring match in either direction (catches
//     "El Nido" saved vs "Palawan" template destination), OR
//   - the template's highlights include a case-insensitive match against
//     the item's place_name (catches "Big Lagoon" saved vs
//     "Big Lagoon" highlight)
//
// Not a recommender. Overlap count is the whole signal per the build plan.
export async function findTopTemplateMatch(): Promise<TemplateMatch | null> {
  const bucket = await getBucketList()
  if (bucket.length === 0) return null

  const matches: TemplateMatch[] = []
  for (const template of TRIP_TEMPLATES) {
    const matchedPlaces = matchingPlacesFor(template, bucket)
    if (matchedPlaces.length > 0) {
      matches.push({
        template,
        overlapCount: matchedPlaces.length,
        matchedPlaces,
      })
    }
  }

  if (matches.length === 0) return null

  matches.sort((a, b) => {
    if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount
    if (b.template.duration !== a.template.duration) {
      return b.template.duration - a.template.duration
    }
    return a.template.slug.localeCompare(b.template.slug)
  })

  return matches[0]
}

function matchingPlacesFor(
  template: TripTemplate,
  bucket: BucketListItem[]
): string[] {
  const dest = template.destination.trim().toLowerCase()
  const highlights = template.highlights.map((h) => h.trim().toLowerCase())

  const hits: string[] = []
  for (const item of bucket) {
    const loc = (item.place_location ?? '').trim().toLowerCase()
    const name = item.place_name.trim().toLowerCase()

    const destinationMatch =
      loc.length > 0 && (loc.includes(dest) || dest.includes(loc))
    const highlightMatch = highlights.some(
      (h) => name.includes(h) || h.includes(name)
    )

    if (destinationMatch || highlightMatch) {
      hits.push(item.place_name)
    }
  }
  return hits
}
