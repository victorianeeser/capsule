import type { GarmentKind } from '../ui'

export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'
export type Warmth = 'light' | 'mid' | 'warm'
export type DressLevel = 'casual' | 'work' | 'going-out' | 'athletic'
export type Context = 'work' | 'weekend' | 'both'
export type ItemStatus = 'active' | 'donate' | 'replace'
export type DayType = 'work' | 'off'
export type Activity = 'Brunch' | 'Errands' | 'Going out' | 'Gym' | 'Lounging' | 'Game day'

export interface Item {
  id: string
  name: string
  category: Category
  color: string
  warmth: Warmth
  dressLevel: DressLevel
  context: Context
  delicate: boolean
  status: ItemStatus
  tagged: boolean
  imageId?: string        // photo stored on this device (IndexedDB)
  processing?: boolean    // background removal still running
  demoKind?: GarmentKind  // demo items use a silhouette instead of a photo
  createdAt: string
}

export interface Placed { itemId: string; x: number; y: number; s: number }

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
}

/** In-progress outfit while moving through Add outfit → Canvas → Details. */
export interface Draft { date: string; itemIds: string[]; layout?: Placed[]; occasion?: string; note?: string; editingId?: string; reason?: string; suggested?: boolean }

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
}

export const CATEGORY_LABEL: Record<Category, string> = { top: 'Tops', bottom: 'Bottoms', dress: 'Dresses', outerwear: 'Outerwear', shoes: 'Shoes', accessory: 'Accessories' }
export const CATEGORY_ONE: Record<Category, string> = { top: 'Top', bottom: 'Bottom', dress: 'Dress', outerwear: 'Outerwear', shoes: 'Shoes', accessory: 'Accessory' }
export const DRESS_LABEL: Record<DressLevel, string> = { casual: 'Casual', work: 'Work', 'going-out': 'Going out', athletic: 'Athletic' }
export const WARMTH_LABEL: Record<Warmth, string> = { light: 'Light', mid: 'Mid', warm: 'Warm' }
export const CONTEXT_LABEL: Record<Context, string> = { work: 'Work', weekend: 'Weekend', both: 'Both' }
export const COLORS = ['Black', 'White', 'Cream', 'Gray', 'Brown', 'Tan', 'Navy', 'Blue', 'Denim', 'Green', 'Red', 'Pink', 'Purple', 'Yellow', 'Pattern']
export const ACTIVITIES: Activity[] = ['Brunch', 'Errands', 'Going out', 'Gym', 'Lounging', 'Game day']

/** Fallback silhouette for items without a photo. */
export const KIND_FOR: Record<Category, GarmentKind> = { top: 'top', bottom: 'bottom', dress: 'dress', outerwear: 'outerwear', shoes: 'shoes', accessory: 'knit' }
