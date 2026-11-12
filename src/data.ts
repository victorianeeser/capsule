import type { GarmentKind } from './ui'

/** Sample closet for the design build — no real data yet (Supabase comes later). */
export type Item = { id: string; name: string; kind: GarmentKind; category: string }

export const CLOSET: Item[] = [
  { id: 'knit', name: 'Cream knit sweater', kind: 'knit', category: 'Tops' },
  { id: 'tee', name: 'Black tee', kind: 'top', category: 'Tops' },
  { id: 'blazer', name: 'Brown blazer', kind: 'outerwear', category: 'Outerwear' },
  { id: 'trousers', name: 'Wide-leg trousers', kind: 'bottom', category: 'Bottoms' },
  { id: 'jeans', name: 'Dark jeans', kind: 'jeans', category: 'Bottoms' },
  { id: 'dress', name: 'Slip dress', kind: 'dress', category: 'Dresses' },
  { id: 'trench', name: 'Tan trench coat', kind: 'outerwear', category: 'Outerwear' },
  { id: 'loafers', name: 'Black loafers', kind: 'shoes', category: 'Shoes' },
  { id: 'tee2', name: 'Striped tee', kind: 'top', category: 'Tops' },
  { id: 'jeans2', name: 'Black jeans', kind: 'jeans', category: 'Bottoms' },
  { id: 'knit2', name: 'Oat cardigan', kind: 'knit', category: 'Tops' },
  { id: 'dress2', name: 'Midi dress', kind: 'dress', category: 'Dresses' },
]

export const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes']

export const TOMORROW = {
  label: 'Thursday, Nov 12',
  weather: '42° / 35° · rain',
  reason: '42° and rain, so we added your trench.',
  outfit: ['outerwear', 'knit', 'bottom', 'shoes'] as GarmentKind[],
}
