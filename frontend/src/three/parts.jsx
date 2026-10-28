import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Grid, Lightformer, MeshReflectorMaterial, useGLTF } from '@react-three/drei'

// ---------------------------------------------------------------------------
// A realistic glass office tower, generated in code (no model file needed).
//
//  - The facade is a canvas texture: glass panes, aluminium mullions, dark
//    spandrel bands and randomly lit windows (so it looks alive at dusk).
//  - Glass uses reflective materials + an environment (light panels), so it
//    picks up sky and sun reflections like real curtain wall glazing.
//  - Construction stages: steel frame first, glass panels follow a few floors
//    behind, then the crown, antenna and a working tower crane.
//
// Want an exact building instead? Put a .glb file at  public/models/tower.glb
// and it replaces this tower automatically (see useOptionalModel / GlbTower).
// Units: 1 scene unit ~ 10 metres.
// ---------------------------------------------------------------------------

export const FLOOR_H = 0.36 // one storey
export const TOTAL_FLOORS = 30
const BAY = 0.3 // width of one window bay
const PODIUM_FLOORS = 3
const PODIUM_H = PODIUM_FLOORS * FLOOR_H

// Tower "tiers": it gets slimmer as it rises (bw/bd = number of bays wide/deep)
const TIERS = [
  { from: 0, to: 16, bw: 8, bd: 6 },
  { from: 16, to: 24, bw: 7, bd: 5 },
  { from: 24, to: 30, bw: 5, bd: 4 },
]
const PODIUM = { bw: 15, bd: 11 }

const tierOf = (i) => TIERS.find((t) => i >= t.from && i < t.to)
const towerFloors = Array.from({ length: TOTAL_FLOORS }, (_, i) => {
  const t = tierOf(i)
  return { i, y: PODIUM_H + i * FLOOR_H, bw: t.bw, bd: t.bd }
})

// Small seeded random generator: same result every time (no flicker between renders)
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Facade textures
// ---------------------------------------------------------------------------
function makeFacade(bays, variant) {
  const cw = 40
  const ch = 48
  const w = bays * cw
  const map = document.createElement('canvas')
  map.width = w
  map.height = ch
  const glow = document.createElement('canvas')
  glow.width = w
  glow.height = ch
  const g = map.getContext('2d')
  const e = glow.getContext('2d')
  e.fillStyle = '#000'
  e.fillRect(0, 0, w, ch)

  const rnd = mulberry32(variant * 7919 + bays * 104729)
  const glassH = Math.round(ch * 0.74)

  for (let b = 0; b < bays; b++) {
    const x = b * cw
    const hue = 205 + (rnd() - 0.5) * 12
    const light = 30 + rnd() * 12
    const grad = g.createLinearGradient(0, 0, 0, glassH)
    grad.addColorStop(0, `hsl(${hue},55%,${light + 14}%)`)
    grad.addColorStop(1, `hsl(${hue + 4},60%,${light - 6}%)`)
    g.fillStyle = grad
    g.fillRect(x, 0, cw, glassH)
    g.fillStyle = '#1a2841' // spandrel panel (the solid band between floors)
    g.fillRect(x, glassH, cw, ch - glassH)

    if (rnd() < 0.34) {
      // a lit window
      const warm = rnd() < 0.78
      e.globalAlpha = 0.55 + rnd() * 0.4
      e.fillStyle = warm ? `hsl(${38 + rnd() * 14},95%,${62 + rnd() * 12}%)` : 'hsl(200,70%,82%)'
      e.fillRect(x + 3, 4, cw - 6, glassH - 8)
      e.globalAlpha = 1
    }
    g.fillStyle = '#b4bfce' // vertical aluminium mullion
    g.fillRect(x, 0, 2, ch)
  }
  g.fillStyle = '#b4bfce'
  g.fillRect(w - 2, 0, 2, ch)
  g.fillRect(0, glassH, w, 3) // transom
  g.fillRect(0, 0, w, 2)

  const finish = (canvas) => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }
  return { map: finish(map), glow: finish(glow) }
}

// Creates (and remembers) one glass material per bay-count + variant.
function useFacadeMaterials() {
  return useMemo(() => {
    const cache = new Map()
    return (bays, variant) => {
      const key = `${bays}-${variant}`
      if (!cache.has(key)) {
        const t = makeFacade(bays, variant)
        cache.set(
          key,
          new THREE.MeshPhysicalMaterial({
            map: t.map,
            emissiveMap: t.glow,
            emissive: new THREE.Color('#ffffff'),
            emissiveIntensity: 1.25,
            metalness: 0.6,
            roughness: 0.1,
            envMapIntensity: 2.4,
            clearcoat: 0.6,
            clearcoatRoughness: 0.12,
          }),
        )
      }
      return cache.get(key)
    }
  }, [])
}

// ---------------------------------------------------------------------------
// Structural frame: slabs, columns and beams drawn with "instancing"
// (one draw call for hundreds of identical boxes = fast on old laptops)
// ---------------------------------------------------------------------------
const M = (x, y, z, sx, sy, sz) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion(),
    new THREE.Vector3(sx, sy, sz),
  )

function buildFrame() {
  const sets = { slab: [], steel: [], gold: [], beam: [] }
  const counts = { slab: [], steel: [], gold: [], beam: [] } // counts[type][n] = items when n floors are built

  const addFloor = (y, bw, bd, isTower) => {
    const W = bw * BAY
    const D = bd * BAY
    sets.slab.push(M(0, y + 0.025, 0, W + 0.08, 0.05, D + 0.08))
    const cy = y + FLOOR_H / 2 + 0.025
    const xs = []
    for (let k = 0; k <= bw; k += 2) xs.push(k)
    if (xs[xs.length - 1] !== bw) xs.push(bw)
    for (const k of xs) {
      const corner = k === 0 || k === bw
      for (const sz of [-1, 1]) {
        const m = M(-W / 2 + k * BAY, cy, sz * (D / 2), 0.045, FLOOR_H, 0.045)
        ;(corner && isTower ? sets.gold : sets.steel).push(m)
      }
    }
    for (let k = 2; k < bd; k += 2) {
      for (const sx of [-1, 1]) sets.steel.push(M(sx * (W / 2), cy, -D / 2 + k * BAY, 0.045, FLOOR_H, 0.045))
    }
    const by = y + FLOOR_H - 0.02
    for (const sz of [-1, 1]) sets.beam.push(M(0, by, sz * (D / 2), W, 0.035, 0.035))
    for (const sx of [-1, 1]) sets.beam.push(M(sx * (W / 2), by, 0, 0.035, 0.035, D))
  }

  for (let k = 0; k < PODIUM_FLOORS; k++) addFloor(k * FLOOR_H, PODIUM.bw, PODIUM.bd, false)
  const snap = () => Object.keys(sets).forEach((key) => counts[key].push(sets[key].length))
  snap() // n = 0 floors built: only the podium
  for (const f of towerFloors) {
    addFloor(f.y, f.bw, f.bd, true)
    snap()
  }
  return { sets, counts }
}

function Inst({ items, count, children }) {
  const ref = useRef()
  useLayoutEffect(() => {
    items.forEach((m, i) => ref.current.setMatrixAt(i, m))
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, Math.max(items.length, 1)]}
      count={count}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      {children}
    </instancedMesh>
  )
}

// One floor of glass on all four sides
function FloorSkin({ y, bw, bd, i, mat }) {
  const W = bw * BAY
  const D = bd * BAY
  const h = FLOOR_H - 0.05
  const cy = y + 0.05 + h / 2
  const front = mat(bw, (i * 5) % 6)
  const back = mat(bw, (i * 5 + 1) % 6)
  const right = mat(bd, (i * 5 + 2) % 6)
  const left = mat(bd, (i * 5 + 3) % 6)
  return (
    <group>
      <mesh position={[0, cy, D / 2]} material={front}>
        <planeGeometry args={[W, h]} />
      </mesh>
      <mesh position={[0, cy, -D / 2]} rotation-y={Math.PI} material={back}>
        <planeGeometry args={[W, h]} />
      </mesh>
      <mesh position={[W / 2, cy, 0]} rotation-y={Math.PI / 2} material={right}>
        <planeGeometry args={[D, h]} />
      </mesh>
      <mesh position={[-W / 2, cy, 0]} rotation-y={-Math.PI / 2} material={left}>
        <planeGeometry args={[D, h]} />
      </mesh>
    </group>
  )
}

const gold = { color: '#d4a62a', metalness: 0.85, roughness: 0.3 }

// ---------------------------------------------------------------------------
// The tower
//   built = how many floors of steel frame are up
//   clad  = how many floors already have glass (defaults to built)
// ---------------------------------------------------------------------------
export function Tower({ built = TOTAL_FLOORS, clad, structure = true, facade = true }) {
  const cladded = Math.min(clad ?? built, built)
  const mat = useFacadeMaterials()
  const frame = useMemo(() => buildFrame(), [])
  const done = built >= TOTAL_FLOORS
  const finished = done && cladded >= TOTAL_FLOORS
  const topY = PODIUM_H + built * FLOOR_H
  const podW = PODIUM.bw * BAY
  const podD = PODIUM.bd * BAY

  const frameCount = (key) => frame.counts[key][structure ? built : 0]

  // safety net around the floors that have a frame but no glass yet
  const netFloors = structure && facade ? built - cladded : 0
  const netTier = tierOf(Math.max(0, Math.min(built - 1, TOTAL_FLOORS - 1)))

  return (
    <group>
      {/* Steel frame */}
      <Inst items={frame.sets.slab} count={frameCount('slab')}>
        <meshStandardMaterial color="#a4acba" metalness={0.15} roughness={0.7} envMapIntensity={0.5} />
      </Inst>
      <Inst items={frame.sets.steel} count={frameCount('steel')}>
        <meshStandardMaterial color="#6b7686" metalness={0.7} roughness={0.45} />
      </Inst>
      <Inst items={frame.sets.beam} count={frameCount('beam')}>
        <meshStandardMaterial color="#e0761d" metalness={0.5} roughness={0.5} />
      </Inst>
      {/* Gold corner fins (brand colour) */}
      <Inst items={frame.sets.gold} count={frame.counts.gold[built]}>
        <meshStandardMaterial {...gold} />
      </Inst>

      {/* Concrete core */}
      {built > 0 && (
        <mesh position={[0, (PODIUM_H + built * FLOOR_H) / 2, 0]}>
          <boxGeometry args={[0.8, PODIUM_H + built * FLOOR_H, 0.6]} />
          <meshStandardMaterial color="#7d8798" roughness={0.9} />
        </mesh>
      )}

      {/* Podium (3-storey base) */}
      {facade &&
        [0, 1, 2].map((k) => (
          <FloorSkin key={k} y={k * FLOOR_H} bw={PODIUM.bw} bd={PODIUM.bd} i={k + 40} mat={mat} />
        ))}
      <mesh position={[0, PODIUM_H + 0.03, 0]}>
        <boxGeometry args={[podW + 0.24, 0.07, podD + 0.24]} />
        <meshStandardMaterial color="#6c7587" roughness={0.65} metalness={0.2} envMapIntensity={0.5} />
      </mesh>
      {/* Entrance canopy with gold edge */}
      <mesh position={[0, 0.66, podD / 2 + 0.42]}>
        <boxGeometry args={[1.9, 0.05, 0.9]} />
        <meshStandardMaterial color="#e9edf3" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.66, podD / 2 + 0.88]}>
        <boxGeometry args={[1.9, 0.07, 0.03]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.33, podD / 2 + 0.8]}>
          <cylinderGeometry args={[0.03, 0.03, 0.66, 12]} />
          <meshStandardMaterial {...gold} />
        </mesh>
      ))}

      {/* Glass curtain wall */}
      {facade &&
        towerFloors
          .slice(0, cladded)
          .map((f) => <FloorSkin key={f.i} y={f.y} bw={f.bw} bd={f.bd} i={f.i} mat={mat} />)}

      {/* Gold bands where the tower steps in */}
      {[16, 24].map((i) => {
        if (built < i) return null
        const t = tierOf(i - 1)
        return (
          <mesh key={i} position={[0, PODIUM_H + i * FLOOR_H + 0.02, 0]}>
            <boxGeometry args={[t.bw * BAY + 0.16, 0.07, t.bd * BAY + 0.16]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        )
      })}

      {/* Green safety screen on the floors still under construction */}
      {netFloors > 0 && (
        <mesh position={[0, PODIUM_H + (cladded + netFloors / 2) * FLOOR_H, 0]}>
          <boxGeometry args={[netTier.bw * BAY + 0.1, netFloors * FLOOR_H, netTier.bd * BAY + 0.1]} />
          <meshStandardMaterial color="#2f8f56" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      )}

      {/* Crown, gold ring and antenna once the tower is complete */}
      {finished && (
        <group position={[0, topY, 0]}>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[1.62, 0.06, 1.32]} />
            <meshStandardMaterial {...gold} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.2, 0.5, 0.9]} />
            <meshStandardMaterial color="#243149" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.57, 0]}>
            <boxGeometry args={[1.3, 0.05, 1.0]} />
            <meshStandardMaterial {...gold} emissive="#d4a62a" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.012, 0.035, 1.6, 10]} />
            <meshStandardMaterial color="#c9d2de" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.22, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#ff2b2b" emissive="#ff2b2b" emissiveIntensity={3} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Tower crane (lattice steel look + a glass panel hanging from the hook)
// ---------------------------------------------------------------------------
function makeLattice() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const g = c.getContext('2d')
  g.strokeStyle = '#f2b40c'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(3, 0)
  g.lineTo(3, 64)
  g.moveTo(61, 0)
  g.lineTo(61, 64)
  g.stroke()
  g.lineWidth = 4
  g.beginPath()
  g.moveTo(0, 2)
  g.lineTo(64, 2)
  g.moveTo(0, 62)
  g.lineTo(64, 62)
  g.moveTo(3, 3)
  g.lineTo(61, 61)
  g.moveTo(61, 3)
  g.lineTo(3, 61)
  g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function Rod({ from, to, r = 0.008, color = '#aab4c3' }) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  const len = dir.length()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  const mid = a.clone().add(b).multiplyScalar(0.5)
  return (
    <mesh position={mid} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.5} />
    </mesh>
  )
}

export function Crane({ built = TOTAL_FLOORS, position = [3.5, 0, -2.7] }) {
  const jib = useRef()
  const top = PODIUM_H + built * FLOOR_H
  const mastH = Math.max(top + 1.0, 2.2)
  const lattice = useMemo(() => makeLattice(), [])
  const mastTex = useMemo(() => {
    const t = lattice.clone()
    t.repeat.set(1, mastH / 0.16)
    t.needsUpdate = true
    return t
  }, [lattice, mastH])
  const jibTex = useMemo(() => {
    const t = lattice.clone()
    t.repeat.set(4.6 / 0.14, 1)
    t.needsUpdate = true
    return t
  }, [lattice])
  const counterTex = useMemo(() => {
    const t = lattice.clone()
    t.repeat.set(1.5 / 0.14, 1)
    t.needsUpdate = true
    return t
  }, [lattice])

  useFrame((_, dt) => {
    if (jib.current) jib.current.rotation.y += dt * 0.1
  })
  const lat = (map) => ({ map, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.4, roughness: 0.6 })

  return (
    <group position={position}>
      {/* foundation + mast */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.5]} />
        <meshStandardMaterial color="#8a93a3" roughness={0.9} />
      </mesh>
      <mesh position={[0, mastH / 2, 0]}>
        <boxGeometry args={[0.16, mastH, 0.16]} />
        <meshStandardMaterial {...lat(mastTex)} />
      </mesh>
      <mesh position={[0, mastH + 0.05, 0]}>
        <boxGeometry args={[0.24, 0.16, 0.24]} />
        <meshStandardMaterial color="#3a4152" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* rotating part */}
      <group ref={jib} position={[0, mastH + 0.2, 0]}>
        <mesh position={[2.0, 0.08, 0]}>
          <boxGeometry args={[4.6, 0.14, 0.14]} />
          <meshStandardMaterial {...lat(jibTex)} />
        </mesh>
        <mesh position={[-0.75, 0.08, 0]}>
          <boxGeometry args={[1.5, 0.14, 0.14]} />
          <meshStandardMaterial {...lat(counterTex)} />
        </mesh>
        <mesh position={[-1.35, -0.06, 0]}>
          <boxGeometry args={[0.32, 0.24, 0.3]} />
          <meshStandardMaterial color="#8a93a3" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.07, 0.75, 0.07]} />
          <meshStandardMaterial color="#f2b40c" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.28, -0.05, 0.16]}>
          <boxGeometry args={[0.22, 0.2, 0.18]} />
          <meshStandardMaterial color="#e8edf5" metalness={0.3} roughness={0.4} />
        </mesh>
        <Rod from={[0, 0.85, 0]} to={[4.2, 0.13, 0]} />
        <Rod from={[0, 0.85, 0]} to={[-1.4, 0.13, 0]} />

        {/* trolley, cable and a glass panel being lifted */}
        <mesh position={[3.0, 0.0, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.18]} />
          <meshStandardMaterial color="#3a4152" metalness={0.5} roughness={0.5} />
        </mesh>
        <Rod from={[3.0, -0.03, 0]} to={[3.0, -1.2, 0]} r={0.006} />
        <mesh position={[3.0, -1.25, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.1]} />
          <meshStandardMaterial color="#f2b40c" />
        </mesh>
        <mesh position={[3.0, -1.45, 0]}>
          <boxGeometry args={[0.02, 0.28, 0.36]} />
          <meshStandardMaterial color="#5aa2dd" metalness={0.8} roughness={0.15} envMapIntensity={1.6} />
        </mesh>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Surroundings: neighbouring buildings with lit windows, plaza, trees
// ---------------------------------------------------------------------------
export function City({ count = 30 }) {
  const blocks = useMemo(() => {
    const rand = mulberry32(2026)
    const list = []
    while (list.length < count) {
      const x = (rand() - 0.5) * 30
      const z = (rand() - 0.5) * 30
      if (Math.hypot(x, z) < 8) continue // keep the area around the hero tower clear
      const w = 0.9 + rand() * 1.3
      const floors = 3 + Math.floor(rand() * 11)
      const h = floors * 0.3
      const bays = Math.max(2, Math.round(w / 0.22))
      const t = makeFacade(bays, list.length + 100)
      const side = (tex) => {
        const c = tex.clone()
        c.wrapT = THREE.RepeatWrapping
        c.repeat.set(1, floors)
        c.needsUpdate = true
        return c
      }
      const wall = new THREE.MeshStandardMaterial({
        map: side(t.map),
        emissiveMap: side(t.glow),
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 1.1,
        metalness: 0.5,
        roughness: 0.35,
        envMapIntensity: 1,
      })
      const roof = new THREE.MeshStandardMaterial({ color: '#1c2a45', roughness: 0.8 })
      list.push({ x, z, w, h, mats: [wall, wall, roof, roof, wall, wall] })
    }
    return list
  }, [count])

  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} material={b.mats}>
          <boxGeometry args={[b.w, b.h, b.w]} />
        </mesh>
      ))}
    </group>
  )
}

function Trees() {
  const trees = useMemo(() => {
    const rand = mulberry32(77)
    return Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2 + 0.1
      const r = 6.0 + rand() * 0.6
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.8 + rand() * 0.5 }
    })
  }, [])
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.3, 6]} />
            <meshStandardMaterial color="#4b3826" roughness={1} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.2, 12, 10]} />
            <meshStandardMaterial color="#1f6b45" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Ground() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]}>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial color="#080f20" roughness={1} envMapIntensity={0.1} />
      </mesh>
      {/* paved plaza around the tower - polished stone, picks up a soft reflection of the tower and sky */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <circleGeometry args={[5.6, 64]} />
        <MeshReflectorMaterial
          resolution={512}
          mirror={0.35}
          mixBlur={0.6}
          mixStrength={1.4}
          blur={[200, 80]}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#0c1526"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]}>
        <ringGeometry args={[5.5, 5.65, 64]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[40, 40]}
        cellSize={0.6}
        sectionSize={3}
        cellColor="#0f2a55"
        sectionColor="#1c4b8a"
        cellThickness={0.6}
        fadeDistance={26}
        fadeStrength={1.5}
        infiniteGrid
      />
      <ContactShadows
        position={[0, 0.008, 0]}
        opacity={0.5}
        scale={14}
        blur={2}
        far={8}
        resolution={256}
        color="#000814"
      />
      <Trees />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Lighting: sun + sky glow, plus light panels the glass can reflect
// ---------------------------------------------------------------------------
export function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} color="#9db8ff" />
      <directionalLight position={[9, 12, 7]} intensity={2.0} color="#ffd9a8" />
      <directionalLight position={[-8, 6, -6]} intensity={0.6} color="#6fa8ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#bcd8ff" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={[24, 24, 1]} />
        <Lightformer form="rect" intensity={4} color="#ffcf99" position={[11, 3, 6]} scale={[10, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2} color="#7fb1ff" position={[-11, 4, -4]} scale={[12, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[0, 3, -12]} scale={[18, 6, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  )
}

// ---------------------------------------------------------------------------
// Optional: use a real 3D model (.glb) if you provide one
//   Put the file at  frontend/public/models/tower.glb
// ---------------------------------------------------------------------------
export function useOptionalModel(url = '/models/tower.glb') {
  const [found, setFound] = useState(false)
  useEffect(() => {
    let off = false
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') || ''
        // a missing file returns the website's index.html, which is not a model
        if (!off && r.ok && !type.includes('text/html')) setFound(true)
      })
      .catch(() => {})
    return () => {
      off = true
    }
  }, [url])
  return found
}

function GlbModel({ url }) {
  const { scene } = useGLTF(url)
  const obj = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    c.scale.setScalar(13 / (size.y || 1)) // make it ~13 units tall
    c.updateMatrixWorld(true)
    box.setFromObject(c)
    const center = box.getCenter(new THREE.Vector3())
    c.position.set(-center.x, -box.min.y, -center.z)
    return c
  }, [scene])
  return <primitive object={obj} />
}

export function GlbTower({ url = '/models/tower.glb' }) {
  return (
    <Suspense fallback={null}>
      <GlbModel url={url} />
    </Suspense>
  )
}