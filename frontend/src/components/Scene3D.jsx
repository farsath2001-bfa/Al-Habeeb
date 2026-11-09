import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'

// The 3D code (three.js) is big, so we load it "lazily": the page text appears
// first and the 3D scene downloads a moment later.
const HeroScene = lazy(() => import('../three/HeroScene'))
const ShowcaseScene = lazy(() => import('../three/ShowcaseScene'))

// If a phone/old laptop cannot run WebGL, show a normal picture instead of a blank page.
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <img
          src="/images/concept-board.jpg"
          alt="Al Habeeb Tower design concept"
          className="h-full w-full object-cover"
        />
      )
    }
    return this.props.children
  }
}

const Loading = () => (
  <div className="flex h-full w-full items-center justify-center text-sm tracking-widest text-glow/70 uppercase">
    Loading 3D model...
  </div>
)

// Waits until the page text and photos have appeared, then starts the heavy 3D scene.
function AfterIdle({ children }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const go = () => setReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(go, 400)
    return () => clearTimeout(t)
  }, [])
  return ready ? children : <Loading />
}

// Builds the children only once the box is about to scroll into view.
function WhenNear({ children }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="h-full w-full">
      {near ? children : <Loading />}
    </div>
  )
}

export function Hero3D() {
  return (
    <Boundary>
      <AfterIdle>
        <Suspense fallback={<Loading />}>
          <HeroScene />
        </Suspense>
      </AfterIdle>
    </Boundary>
  )
}

export function Showcase3D(props) {
  return (
    <Boundary>
      <WhenNear>
        <Suspense fallback={<Loading />}>
          <ShowcaseScene {...props} />
        </Suspense>
      </WhenNear>
    </Boundary>
  )
}
