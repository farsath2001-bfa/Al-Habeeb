import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Services from './pages/Services'
import { lazy, Suspense } from 'react'



const Showcase = lazy(() => import('./pages/Showcase'))
const Admin = lazy(() => import('./pages/Admin'))

// Scroll to the top when changing page (or to the #section in the address).
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Navbar />
      <main>
  <Suspense fallback={<div className="py-32 text-center text-slate-500">Loading…</div>}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/showcase" element={<Showcase />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Home />} />
    </Routes>
  </Suspense>
</main>
      <Footer />
    </>
  )
}