import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useInView } from './useInView'
import { Crane, GlbTower, Ground, Lights, Tower, TOTAL_FLOORS, useOptionalModel } from './parts'

// Interactive 3D viewer. The parent page controls the props with a slider
// and buttons - a nice example of "React state drives the 3D scene".
export default function ShowcaseScene({ built, structure, facade }) {
  const hasModel = useOptionalModel()
  const [viewRef, visible] = useInView()
  // glass panels trail the steel frame by 3 floors while building
  const clad = built >= TOTAL_FLOORS ? TOTAL_FLOORS : Math.max(0, built - 3)

  return (
    <div ref={viewRef} className="h-full w-full">
    <Canvas frameloop={visible ? 'always' : 'never'} dpr={[1, 1.5]} camera={{ position: [20, 10.5, 23], fov: 36 }} gl={{ alpha: true }}>
      <fog attach="fog" args={['#070f26', 32, 64]} />
      <Lights />
      {hasModel ? (
        <GlbTower />
      ) : (
        <Tower built={built} clad={clad} structure={structure} facade={facade} />
      )}
      {!hasModel && built < TOTAL_FLOORS && <Crane built={built} />}
      <Ground />
      <OrbitControls
        target={[0, 5.8, 0]}
        enablePan={false}
        minDistance={8}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
    </div>
  )
}