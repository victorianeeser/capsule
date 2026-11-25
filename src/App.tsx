import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Welcome, Routine, City, FirstPieces } from './screens/Onboarding'
import { Home, HomeEvening, Favorites } from './screens/Home'
import { PlannerDay, PlannerMonth, AddOutfit, Canvas, AddClothes, OutfitDetails, OffDay, PlanWeek, OutfitColors } from './screens/Planner'
import { Closet, AddItems, TagItem, ItemDetail, Audit } from './screens/Closet'
import { Shop, SearchResult, WouldThisGo, Gaps, Wishlist, NewWish } from './screens/Shop'
import { Settings } from './screens/Settings'
import { useStore } from './lib/store'
import { MotionProvider } from './lib/motion'
import { useTheme } from './lib/theme'

const ROUTES: [string, () => React.JSX.Element][] = [
  ['/onboarding/routine', Routine], ['/onboarding/city', City], ['/onboarding/pieces', FirstPieces],
  ['/home', Home], ['/home/evening', HomeEvening], ['/favorites', Favorites],
  ['/planner', PlannerDay], ['/planner/month', PlannerMonth], ['/planner/add', AddOutfit], ['/planner/canvas', Canvas],
  ['/planner/add-clothes', AddClothes], ['/planner/details', OutfitDetails], ['/planner/off-day', OffDay], ['/planner/week', PlanWeek], ['/planner/colors', OutfitColors],
  ['/closet', Closet], ['/closet/add', AddItems], ['/closet/tag', TagItem], ['/closet/tag/:id', TagItem], ['/closet/item/:id', ItemDetail], ['/closet/audit', Audit],
  ['/shop', Shop], ['/shop/search', SearchResult], ['/shop/would', WouldThisGo], ['/shop/gaps', Gaps], ['/shop/wishlist', Wishlist], ['/shop/wishlist/new', NewWish],
  ['/settings', Settings],
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
  const { state } = useStore()
  useTheme(state.profile.theme)
  return (
    <div className="stage">
      <div className="phone">
        <MotionProvider>
        <Routes>
          <Route path="/" element={state.profile.onboarded ? <Navigate to="/home" replace /> : <Welcome />} />
          {ROUTES.map(([path, C]) => <Route key={path} path={path} element={<C />} />)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </MotionProvider>
      </div>
    </div>
  )
}
