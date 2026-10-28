import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import SectionPhoto from '../components/SectionPhoto'
import { useInView } from '../three/useInView'
import { Crane, GlbTower, Ground, Lights, Tower, TOTAL_FLOORS, useOptionalModel } from '../three/parts'

// The 3D viewer. The page state below (built, structure, facade) drives the scene.
function Scene({ built, structure, facade }) {
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
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.3} intensity={0.7} mipmapBlur radius={0.5} />
      </EffectComposer>
    </Canvas>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-gold-500"
      />
      {label}
    </label>
  )
}

export default function Showcase() {
  const [built, setBuilt] = useState(TOTAL_FLOORS)
  const [structure, setStructure] = useState(true)
  const [facade, setFacade] = useState(true)
  const [playing, setPlaying] = useState(false)

  // Play: rebuild the tower floor by floor from the ground up.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setBuilt((b) => {
        if (b >= TOTAL_FLOORS) {
          setPlaying(false)
          return b
        }
        return b + 1
      })
    }, 200)
    return () => clearInterval(id)
  }, [playing])

  const play = () => {
    setBuilt(0)
    setPlaying(true)
  }

  return (
    <section className="relative overflow-hidden bg-navy-900 pt-16 pb-16">
      <SectionPhoto src="/images/hero-bg-tower-dusk.jpg" grid />
      <div className="relative mx-auto max-w-7xl px-5">
        <h1 className="font-display text-5xl font-extrabold text-white uppercase md:text-6xl">
          Al Habeeb Tower
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          A 30-storey concept. Drag to look around, or scrub the slider to watch it go up floor by floor.
        </p>

        <div className="mt-8 h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-navy-950 shadow-2xl">
          <Scene built={built} structure={structure} facade={facade} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl bg-white/5 p-5 backdrop-blur">
          <div className="flex min-w-[240px] flex-1 items-center gap-4">
            <label htmlFor="floors" className="text-sm font-semibold text-white">
              Floors built
            </label>
            <input
              id="floors"
              type="range"
              min="0"
              max={TOTAL_FLOORS}
              value={built}
              onChange={(e) => {
                setPlaying(false)
                setBuilt(Number(e.target.value))
              }}
              className="flex-1 accent-gold-500"
            />
            <span className="w-14 text-right text-sm tabular-nums text-slate-300">
              {built} / {TOTAL_FLOORS}
            </span>
          </div>

          <Toggle label="Steel frame" checked={structure} onChange={setStructure} />
          <Toggle label="Glass facade" checked={facade} onChange={setFacade} />

          <button
            type="button"
            onClick={playing ? () => setPlaying(false) : play}
            className="rounded-md bg-gold-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
          >
            {playing ? 'Pause' : 'Watch it built'}
          </button>
        </div>

        <div className="mt-12">
          <p className="text-sm font-semibold tracking-[0.25em] text-glow uppercase">Concept render</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">An early look at the real design</h2>
          <video
            src="/Videos/tower.mp4"
            controls
            muted
            loop
            playsInline
            className="mt-5 w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl"
          />
        </div>
      </div>
    </section>
  )
}