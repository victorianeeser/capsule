import { useEffect } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
const KEY = 'capsule:theme'

/** Apply Settings → Appearance to <html data-theme>, following the phone when set to "system". */
export function useTheme(pref: ThemePref = 'light') {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1C1A18' : '#FFFFFF')
    }
    apply()
    // Remembered outside IndexedDB so index.html can set it before the first paint (no light flash).
    try { localStorage.setItem(KEY, pref) } catch { /* private mode */ }
    if (pref !== 'system') return
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])
}
