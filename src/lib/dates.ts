/** Local-date helpers. Dates are stored as yyyy-mm-dd strings in the user's time zone. */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const today = () => iso(new Date())
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d) }
export const dow = (s: string) => parse(s).getDay()
export const weekStart = (s: string) => addDays(s, -dow(s)) // Sunday
export const monday = (s: string) => addDays(s, -((dow(s) + 6) % 7))
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const dayName = (s: string) => DAY[dow(s)]
export const dayShort = (s: string) => DAY[dow(s)].slice(0, 3)
export const fmtLong = (s: string) => { const d = parse(s); return `${DAY[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}` }
export const fmtShort = (s: string) => { const d = parse(s); return `${DAY[d.getDay()].slice(0, 3)}, ${MON[d.getMonth()]} ${d.getDate()}` }
export const fmtMonthDay = (s: string) => { const d = parse(s); return `${MON[d.getMonth()]} ${d.getDate()}` }
export const monthTitle = (y: number, m: number) => `${MONTH[m]} ${y}`
export const relative = (s: string) => {
  const n = daysBetween(s, today())
  if (n === 0) return 'today'
  if (n === 1) return 'yesterday'
  if (n < 7) return `${n} days ago`
  if (n < 60) return `${Math.round(n / 7)} weeks ago`
  return `${Math.round(n / 30)} months ago`
}
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }
