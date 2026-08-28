import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Shell } from './Shell'
import { Home } from '../features/home/Home'
import { Drinks } from '../features/drinks/Drinks'

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
          <Route path="/ship" element={<Soon title="Ship" />} />
          <Route path="/stats" element={<Soon title="Stats" />} />
          <Route path="/badges" element={<Soon title="Badges" />} />
          <Route path="/log" element={<Soon title="Log" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
