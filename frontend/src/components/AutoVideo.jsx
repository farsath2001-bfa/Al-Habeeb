import { useEffect, useRef } from 'react'

// A silent looping video that only plays while it is on screen,
// and stays still for visitors who asked their device to reduce motion.
export default function AutoVideo(props) {
  const ref = useRef(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    })
    io.observe(video)
    return () => io.disconnect()
  }, [])

  return <video ref={ref} muted loop playsInline preload="metadata" {...props} />
}
