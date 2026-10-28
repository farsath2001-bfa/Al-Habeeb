// A background photo for a section, with a dark overlay so text on top stays readable.
// Usage:  <section className="relative overflow-hidden ..."> <SectionPhoto src="/images/x.jpg" /> ...text... </section>
// The section needs "relative" (and usually "overflow-hidden"); this fills it from edge to edge.
const OVERLAYS = {
  dark: 'bg-navy-950/82', // header / CTA text on top
  soft: 'bg-navy-900/75', // lighter - photo stays more visible (texture strips)
}

export default function SectionPhoto({ src, overlay = 'dark', grid = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      <div className={`absolute inset-0 ${OVERLAYS[overlay] || OVERLAYS.dark}`} />
      {/* faint blueprint grid over the photo, for the brand look (same as the home hero) */}
      {grid && <div className="blueprint absolute inset-0 opacity-30 [background-color:transparent]" />}
    </div>
  )
}