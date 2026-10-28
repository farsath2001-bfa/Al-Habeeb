import { useEffect, useState } from 'react'

// Full-width background photo slider for the hero section (like a slow, silent video).
// Pure CSS cross-fade + a slow "Ken Burns" zoom - no gif / video file needed, so it loads fast.
// Change the photos or the timing in src/data/site.js (site.heroBackgrounds) and SLIDE_MS below.
const SLIDE_MS = 6000

export default function HeroSlider({ images }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const id = setInterval(() => setI((n) => (n + 1) % images.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [images.length])

  return (
    <div className="hero-slider" aria-hidden="true">
      {images.map((img, idx) => (
        <div
          key={img.src}
          className={`hero-slide ${idx === i ? 'hero-slide-active' : ''}`}
          style={{ backgroundImage: `url(${img.src})` }}
        />
      ))}
      {/* darkens the photos so the white text on top stays easy to read */}
      <div className="hero-slider-overlay" />
    </div>
  )
}