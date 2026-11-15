import { get, set, del, keys } from 'idb-keyval'
import type { State } from './types'

/**
 * On-device storage (IndexedDB). The whole app state is one JSON record; photos are
 * stored separately as Blobs so the state stays small. Swapping this module for
 * Supabase later keeps the rest of the app unchanged.
 */
const STATE_KEY = 'capsule:state:v1'
const IMG = 'capsule:img:'

export const loadState = () => get<State>(STATE_KEY)
export const saveState = (s: State) => set(STATE_KEY, s)

export const saveImage = (id: string, blob: Blob) => set(IMG + id, blob)
export const loadImage = (id: string) => get<Blob>(IMG + id)
export const deleteImage = (id: string) => del(IMG + id)

export async function eraseAll() {
  const all = await keys()
  await Promise.all(all.filter((k) => String(k).startsWith('capsule:')).map((k) => del(k)))
}

/** Object-URL cache so each photo is decoded once per session. */
const urls = new Map<string, string>()
const listeners = new Map<string, Set<() => void>>()
export function imageUrl(id: string) { return urls.get(id) }
export async function ensureImageUrl(id: string) {
  if (urls.has(id)) return urls.get(id)!
  const blob = await loadImage(id)
  if (!blob) return undefined
  const u = URL.createObjectURL(blob)
  urls.set(id, u)
  return u
}
export function invalidateImage(id: string) {
  const u = urls.get(id)
  if (u) URL.revokeObjectURL(u)
  urls.delete(id)
  listeners.get(id)?.forEach((f) => f())
}
export function onImageChange(id: string, f: () => void) {
  if (!listeners.has(id)) listeners.set(id, new Set())
  listeners.get(id)!.add(f)
  return () => listeners.get(id)!.delete(f)
}
