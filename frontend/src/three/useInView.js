import { useEffect, useRef, useState } from 'react'

// Tells you whether an element is on screen. The 3D scenes use it to stop
// drawing frames while scrolled out of view, which saves battery and keeps old laptops cool.
export function useInView() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible]
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
