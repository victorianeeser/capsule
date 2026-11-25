import { useEffect, useState } from 'react'

/** Tiny app-wide toast: call toast('Colors saved') from anywhere; <Toaster /> shows it for a moment. */
type Listener = (msg: string) => void
const listeners = new Set<Listener>()
export const toast = (msg: string) => listeners.forEach((l) => l(msg))

export function Toaster() {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const show: Listener = (text) => { clearTimeout(timer); setMsg({ text, id: Date.now() }); timer = setTimeout(() => setMsg(null), 2200) }
    listeners.add(show)
    return () => { listeners.delete(show); clearTimeout(timer) }
  }, [])
  if (!msg) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-50 flex justify-center" role="status" aria-live="polite">
      <div key={msg.id} className="toast-in flex items-center gap-2 rounded-full bg-text px-4 py-2.5 text-[13px] font-medium text-bg shadow-overlay">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 12.5l4 4 8-9" /></svg>
        {msg.text}
      </div>
    </div>
  )
}
