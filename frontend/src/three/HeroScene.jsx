import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { prefersReducedMotion, useInView } from './useInView'
import { City, Crane, GlbTower, Ground, Lights, Tower, TOTAL_FLOORS, useOptionalModel } from './parts'

// The hero tower builds itself when the page opens:
// the steel frame goes up first, the glass follows a few floors behind.
export default function HeroScene() {
  const [p, setP] = useState({ built: 0, clad: 0 })
  const hasModel = useOptionalModel()
  const [viewRef, visible] = useInView()

  useEffect(() => {
    const id = setInterval(() => {
      setP((s) => {
        if (s.clad >= TOTAL_FLOORS) {
          clearInterval(id)
          return s
        }
        const built = Math.min(TOTAL_FLOORS, s.built + 1)
        const clad = built >= TOTAL_FLOORS ? s.clad + 1 : Math.max(0, built - 3)
        return { built, clad }
      })
    }, 130)
    return () => clearInterval(id)
  }, [])

  const working = p.clad < TOTAL_FLOORS

  return (
    <div ref={viewRef} className="h-full w-full">
    <Canvas
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ position: [21, 11, 24], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={['#08183a', 30, 62]} />
      <Lights />
      {hasModel ? <GlbTower /> : <Tower built={p.built} clad={p.clad} />}
      {working && !hasModel && <Crane built={p.built} />}
      <City />
      <Ground />
      <OrbitControls
        target={[0, 5.8, 0]}
        autoRotate={!prefersReducedMotion()}
        autoRotateSpeed={0.6}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3.6}
        maxPolarAngle={Math.PI / 2.1}
      />
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.3} intensity={0.7} mipmapBlur radius={0.5} />
      </EffectComposer>
    </Canvas>
    </div>
  )
}