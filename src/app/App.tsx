import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Shell } from './Shell'
import { Home } from '../features/home/Home'
import { Drinks } from '../features/drinks/Drinks'
import { Ship } from '../features/ship/Ship'
import { Stats } from '../features/stats/Stats'
import { Badges } from '../features/badges/Badges'
import { Log } from '../features/log/Log'

function Soon({ title }: { title: string }) {
  return (
    <div className="wrap page">
      <div className="glass card">
        <div className="eyebrow">{title}</div>
        <p className="muted t-body" style={{ marginTop: 6 }}>Being rebuilt in the Liquid Sea Glass pass.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/drinks" element={<Drinks />} />
          <Route path="/ship" element={<Ship />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/log" element={<Log />} />
          <Route path="*" element={<Soon title="Not found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
