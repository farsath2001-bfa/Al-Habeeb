import { Component, lazy, Suspense } from 'react'

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

export function Hero3D() {
  return (
    <Boundary>
      <Suspense fallback={<Loading />}>
        <HeroScene />
      </Suspense>
    </Boundary>
  )
}

export function Showcase3D(props) {
  return (
    <Boundary>
      <Suspense fallback={<Loading />}>
        <ShowcaseScene {...props} />
      </Suspense>
    </Boundary>
  )
}
