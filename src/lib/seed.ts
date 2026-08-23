export function seededInt(id: string, min: number, max: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  const range = max - min
  return min + (Math.abs(hash) % range)
}
