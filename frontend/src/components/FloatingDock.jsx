import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'

// A macOS-style "floating dock": icons grow when the mouse gets close to them.
// Based on the Aceternity UI FloatingDock, rewritten in plain JSX (no TypeScript / shadcn needed).
//
// Usage:
//   <FloatingDock items={[{ title: 'Instagram', icon: <Icon name="instagram" />, href: '#' }]} />

export default function FloatingDock({ items, className = '' }) {
  const mouseX = useMotionValue(Infinity) // Infinity = mouse is not over the dock

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`flex h-16 w-fit items-end gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 pb-3 backdrop-blur ${className}`}
    >
      {items.map((item) => (
        <DockIcon key={item.title} mouseX={mouseX} {...item} />
      ))}
    </motion.div>
  )
}

function DockIcon({ mouseX, title, icon, href }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)

  // distance between the mouse and the centre of this icon
  const distance = useTransform(mouseX, (val) => {
    const box = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - box.x - box.width / 2
  })

  // near the mouse = big (46px box -> 80px), far away = small
  const size = useSpring(useTransform(distance, [-150, 0, 150], [38, 74, 38]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })
  const iconSize = useSpring(useTransform(distance, [-150, 0, 150], [18, 36, 18]), {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  return (
    <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label={title}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full bg-white/10 text-slate-200 transition-colors hover:bg-gold-500 hover:text-navy-950"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 2, x: '-50%' }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border border-white/10 bg-navy-900 px-2 py-0.5 text-xs whitespace-pre text-white"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div style={{ width: iconSize, height: iconSize }} className="flex items-center justify-center">
          {icon}
        </motion.div>
      </motion.div>
    </a>
  )
}