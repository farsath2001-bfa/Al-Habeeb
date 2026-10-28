import { Link } from 'react-router-dom'
import { fallbackServices, site } from '../data/site'
import FloatingDock from './FloatingDock'
import Icon from './Icon'
import RingCarousel from './RingCarousel'

const companyLinks = [
  { label: 'About Us', to: '/#about' },
  { label: '3D Showcase', to: '/#showcase' },
  { label: 'Projects', to: '/projects' },
  { label: 'Get a Quote', to: '/#contact' },
]

// Photos that spin around in the ring (files are in public/images)
const ringImages = [
  { src: '/images/ring-holo-office.jpg', alt: 'Engineers reviewing a holographic tower model' },
  { src: '/images/ring-night-tower.jpg', alt: 'Al Habeeb tower under construction at night' },
  { src: '/images/site-progress.jpg', alt: 'Commercial tower rising on site' },
  { src: '/images/ring-site-team.jpg', alt: 'Site team reviewing the drawings' },
  { src: '/images/tower-facade-view.jpg', alt: 'Glass façade installation' },
  { src: '/images/tower-model-desk.jpg', alt: 'Scale model of an Al Habeeb tower' },
]

const colTitle = 'font-display text-xl font-bold tracking-wide text-white uppercase'
const linkClass = 'text-sm text-slate-400 transition hover:text-gold-400'

export default function Footer() {
  const socialItems = site.social.map((s) => ({
    title: s.title,
    href: s.href,
    icon: <Icon name={s.icon} className="h-full w-full" />,
  }))

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-slate-300">
      {/* soft glows in the background (like the blurred shapes in the reference design) */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-glow/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-1/4 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />

      {/* ---------- Top band: call to action + rotating photo ring ---------- */}
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-4xl leading-tight font-extrabold text-white uppercase md:text-5xl">
            Ready to build with <span className="text-gold-400">{site.name}</span>?
          </h2>
          <p className="mt-4 max-w-lg text-slate-400">
            Tell us about your villa, tower or renovation. Our engineers will reply within one working day with
            next steps.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              to="/#contact"
              className="rounded-lg bg-gold-500 px-6 py-3 font-semibold text-navy-950 shadow-lg shadow-black/30 transition hover:bg-gold-400"
            >
              Request a quote
            </Link>
            <a
              href={`mailto:${site.email}`}
              className="rounded-lg border border-white/25 px-6 py-3 font-semibold text-white transition hover:border-glow hover:text-glow"
            >
              {site.email}
            </a>
          </div>
        </div>

        <RingCarousel images={ringImages} />
      </div>

      {/* ---------- Main footer columns ---------- */}
      <div className="relative mx-auto grid max-w-7xl gap-10 border-t border-white/10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          {/* The logo has dark text, so it sits on a white card on the dark footer */}
          <div className="inline-block rounded-lg bg-white p-3">
            <img src="/images/logo.png" alt={site.fullName} className="h-16 w-auto" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-slate-400">{site.tagline}</p>

          {/* Social media floating dock: move the mouse over the icons */}
          <div className="mt-6 pt-8">
            <FloatingDock items={socialItems} />
          </div>
        </div>

        <div>
          <h3 className={colTitle}>Services</h3>
          <ul className="mt-4 space-y-2.5">
            {fallbackServices.map((s) => (
              <li key={s.id}>
                <Link to="/services" className={linkClass}>
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={colTitle}>Company</h3>
          <ul className="mt-4 space-y-2.5">
            {companyLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={colTitle}>Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <Icon name="mail" className="h-4 w-4 shrink-0 text-gold-400" /> {site.email}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="phone" className="h-4 w-4 shrink-0 text-gold-400" /> {site.phone}
            </li>
            {site.offices.map((o) => (
              <li key={o} className="flex items-center gap-2">
                <Icon name="pin" className="h-4 w-4 shrink-0 text-gold-400" /> {o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- Bottom bar ---------- */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.fullName}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link to="/services" className="hover:text-gold-400">
              Services
            </Link>
            <Link to="/projects" className="hover:text-gold-400">
              Projects
            </Link>
            <Link to="/#contact" className="hover:text-gold-400">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}