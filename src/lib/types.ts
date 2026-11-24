import type { GarmentKind } from '../ui'

export type Category = 'top' | 'sweater' | 'bottom' | 'dress' | 'lounge' | 'outerwear' | 'shoes' | 'accessory'
/** Single source of truth for category order across the app. */
export const CATEGORIES: Category[] = ['top', 'sweater', 'bottom', 'dress', 'lounge', 'outerwear', 'shoes', 'accessory']
export type Warmth = 'light' | 'mid' | 'warm'
export type DressLevel = 'casual' | 'work' | 'going-out' | 'athletic'
export type Context = 'work' | 'weekend' | 'both'
export type ItemStatus = 'active' | 'donate' | 'replace'
export type DayType = 'work' | 'off'
export type Activity = 'Brunch' | 'Errands' | 'Going out' | 'Gym' | 'Lounging' | 'Game day'

export interface Item {
  id: string
  name: string
  brand?: string
  size?: string           // S/M/L or 0–12 for bottoms, 8/9/10 for shoes
  quantity?: number       // how many identical ones you own (e.g. 10 leggings); default 1
  category: Category
  colors: string[]        // one or more (e.g. Denim + Black)
  warmth: Warmth
  dressLevels: DressLevel[]  // one or more (e.g. Work + Going out)
  context: Context
  delicate: boolean
  status: ItemStatus
  tagged: boolean
  imageId?: string        // photo stored on this device (IndexedDB)
  processing?: boolean    // background removal still running
  demoKind?: GarmentKind  // demo items use a silhouette instead of a photo
  sourceName?: string     // original photo filename (used to prefill name/brand)
  createdAt: string
}

/** A piece placed on the Canvas. `key` lets the same piece appear twice (layering, a pair of shoes). */
export interface Placed { itemId: string; key?: string; x: number; y: number; s: number; flip?: boolean }

export interface Outfit { id: string; itemIds: string[]; layout?: Placed[]; isFavorite: boolean; createdAt: string }

export interface PlannedOutfit {
  id: string
  date: string            // yyyy-mm-dd
  outfitId: string
  occasion: string        // "Work day · 9–5", "Gym", …
  position: number
  note: string
  suggested?: boolean
  reason?: string
}

export interface PlannedDay { date: string; dayType: DayType; activities: Activity[] }
export interface WearEntry { id: string; itemId: string; outfitId?: string; wornOn: string }
export interface Gap { id: string; label: string; category?: Category; source: 'manual' | 'audit' | 'nudge'; detail?: string; resolved: boolean; createdAt: string }
export interface Wish { id: string; name: string; note: string; price: string; imageId?: string; createdAt: string }

export interface Profile {
  onboarded: boolean
  city: string
  lat: number
  lon: number
  unit: 'F' | 'C'
  routine: DayType[]      // index 0 = Sunday … 6 = Saturday
  workHours: string
  repeatDays: number      // don't repeat a piece within N days
  firstPiecesGoal: number
  theme?: 'light' | 'dark' | 'system'   // Settings → Appearance (default light)
}

/** In-progress outfit while moving through Add outfit → Canvas → Details. */
export interface Draft { date: string; itemIds: string[]; layout?: Placed[]; occasion?: string; note?: string; editingId?: string; reason?: string; suggested?: boolean; favoriteId?: string }

export interface State {
  version: 1
  profile: Profile
  items: Item[]
  outfits: Outfit[]
  planned: PlannedOutfit[]
  days: PlannedDay[]
  wear: WearEntry[]
  gaps: Gap[]
  wishlist: Wish[]
  draft?: Draft
  auditDone: string[]     // item ids reviewed in the current audit pass
  skipped: string[]       // dates marked "No outfit needed"
}

export const CATEGORY_LABEL: Record<Category, string> = { top: 'Tops', sweater: 'Sweaters', bottom: 'Bottoms', dress: 'Dresses', lounge: 'Lounge', outerwear: 'Outerwear', shoes: 'Shoes', accessory: 'Accessories' }
export const CATEGORY_ONE: Record<Category, string> = { top: 'Top', sweater: 'Sweater', bottom: 'Bottom', dress: 'Dress', lounge: 'Lounge', outerwear: 'Outerwear', shoes: 'Shoes', accessory: 'Accessory' }
export const DRESS_LABEL: Record<DressLevel, string> = { casual: 'Casual', work: 'Work', 'going-out': 'Going out', athletic: 'Athletic' }
export const WARMTH_LABEL: Record<Warmth, string> = { light: 'Light', mid: 'Mid', warm: 'Warm' }
export const CONTEXT_LABEL: Record<Context, string> = { work: 'Work', weekend: 'Weekend', both: 'Both' }
export const COLORS = ['Black', 'White', 'Cream', 'Gray', 'Brown', 'Tan', 'Navy', 'Blue', 'Denim', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Pattern']
/** Size choices by category (accessories have none). */
export const SIZES_FOR = (c: Category): string[] => (c === 'shoes' ? ['8', '9', '10'] : c === 'accessory' ? [] : ['S', 'M', 'L'])
/** Bottoms also come in number sizes (jeans 2 4 6 8 …). */
export const NUMBER_SIZES_FOR = (c: Category): string[] => (c === 'bottom' ? ['0', '2', '4', '6', '8', '10', '12'] : [])
export const colorText = (i: Item) => i.colors.join(' & ')
/** How many pieces a list really is, counting quantities (10 leggings = 10). */
export const countPieces = (items: Item[]) => items.reduce((n, i) => n + Math.max(1, i.quantity ?? 1), 0)
export const ACTIVITIES: Activity[] = ['Brunch', 'Errands', 'Going out', 'Gym', 'Lounging', 'Game day']

/** Fallback silhouette for items without a photo. */
export const KIND_FOR: Record<Category, GarmentKind> = { top: 'top', sweater: 'knit', bottom: 'bottom', dress: 'dress', lounge: 'jeans', outerwear: 'outerwear', shoes: 'shoes', accessory: 'knit' }

/** Older saved items had a single dressLevel / color — upgrade them on load. */
export function migrateItem(i: Item & { dressLevel?: DressLevel; color?: string }): Item {
  const { dressLevel, color, ...rest } = i
  return {
    ...rest,
    dressLevels: Array.isArray(i.dressLevels) && i.dressLevels.length ? i.dressLevels : [dressLevel ?? 'casual'],
    colors: Array.isArray(i.colors) ? i.colors : color ? [color] : [],
  }
}
