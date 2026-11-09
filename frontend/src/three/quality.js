// Decides how fancy the 3D scenes should be.
// Phones and older laptops start in "low" mode (no reflections, no glow, fewer buildings).
// Any device can also drop to low mode while running if the frame rate falls (see PerformanceMonitor).
export function initialLowQuality() {
  if (typeof window === 'undefined') return false
  const smallScreen = window.innerWidth < 768
  const fewCores = (navigator.hardwareConcurrency || 8) <= 4
  const lowMemory = (navigator.deviceMemory || 8) <= 4
  return smallScreen || fewCores || lowMemory
}
