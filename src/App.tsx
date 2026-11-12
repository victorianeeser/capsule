import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { SignIn, Routine, City, FirstPieces } from './screens/Onboarding'
import { Home, HomeMorning } from './screens/Home'
import { PlannerDay, PlannerMonth, AddOutfit, Canvas, AddClothes, OutfitDetails, OffDay, PlanWeek } from './screens/Planner'
import { Closet, AddItems, TagItem, ItemDetail, Audit } from './screens/Closet'
import { Shop, SearchResult, WouldThisGo, Gaps, Wishlist } from './screens/Shop'
import { Settings } from './screens/Settings'

/** Every screen, grouped like the Figma Wireframes rows. Used for routes. */
export const SCREENS: { group: string; items: [string, string, () => React.JSX.Element][] }[] = [
  { group: 'Sign in & onboarding', items: [['Sign in', '/', SignIn], ['Weekly routine', '/onboarding/routine', Routine], ['Home city', '/onboarding/city', City], ['First pieces', '/onboarding/pieces', FirstPieces]] },
  { group: 'Home', items: [['Home · morning', '/home', HomeMorning], ['Home · evening', '/home/evening', Home]] },
  {
    group: 'Planner',
    items: [
      ['Day', '/planner', PlannerDay], ['Month', '/planner/month', PlannerMonth], ['Add outfit', '/planner/add', AddOutfit], ['Canvas', '/planner/canvas', Canvas],
      ['Add clothes', '/planner/add-clothes', AddClothes], ['Outfit details', '/planner/details', OutfitDetails], ['Off day', '/planner/off-day', OffDay], ['Plan the week', '/planner/week', PlanWeek],
    ],
  },
  { group: 'Closet', items: [['Closet', '/closet', Closet], ['Add items', '/closet/add', AddItems], ['Tag item', '/closet/tag', TagItem], ['Item detail', '/closet/item', ItemDetail], ['Audit', '/closet/audit', Audit]] },
  { group: 'Shop (from Home)', items: [['Shop', '/shop', Shop], ['Search result', '/shop/search', SearchResult], ['Would this go with', '/shop/would', WouldThisGo], ['Gaps', '/shop/gaps', Gaps], ['Wishlist', '/shop/wishlist', Wishlist]] },
  { group: 'Settings (from Home)', items: [['Settings', '/settings', Settings]] },
]

/** Desktop demo: shrink the 390×844 phone to fit the browser window (never enlarge). */
function useFitPhone() {
  useEffect(() => {
    const fit = () => {
      const pad = 48
      const z = window.innerWidth < 600 ? 1 : Math.min(1, (window.innerHeight - pad) / 864, (window.innerWidth - pad) / 410)
      document.documentElement.style.setProperty('--phone-zoom', String(Math.max(z, 0.4)))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
}

export default function App() {
  useFitPhone()
  return (
    <div className="stage">
      <div className="phone">
        <Routes>
          {SCREENS.flatMap((g) => g.items).map(([, path, C]) => (
            <Route key={path} path={path} element={<C />} />
          ))}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </div>
  )
}
