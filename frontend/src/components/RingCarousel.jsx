// A round, auto-rotating 3D photo ring (pure CSS - no library needed).
// The photos sit around a circle and the whole ring spins slowly. Hover = pause.
// The sizes and the speed are in src/index.css (search for ".ring").

export default function RingCarousel({ images }) {
  return (
    <div className="ring-scene" aria-label="Al Habeeb project photos">
      <div className="ring-tilt">
        <div className="ring" style={{ '--n': images.length }}>
          {images.map((img, i) => (
            <figure key={img.src} className="ring-card" style={{ '--i': i }}>
              <img src={img.src} alt={img.alt} draggable="false" />
            </figure>
          ))}
        </div>
      </div>
      {/* glowing "floor" under the ring */}
      <div className="ring-floor" />
    </div>
  )
}