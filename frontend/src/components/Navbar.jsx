import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'

const links = [
  { label: 'About', to: '/#about' },
  { label: 'Services', to: '/services' },
  { label: '3D Showcase', to: '/showcase' },
  { label: 'Projects', to: '/projects' },
  { label: 'Contact', to: '/#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [pathname])

  const isActive = (to) => !to.includes('#') && pathname === to

  const linkClass = (to) =>
    `text-sm font-medium transition hover:text-gold-500 ${isActive(to) ? 'text-gold-500' : 'text-navy-800'}`

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2">
        <Link to="/" className="flex items-center gap-2" aria-label="Al Habeeb - home">
          <img src="/images/logo.png" alt="Al Habeeb Construction & Engineering" className="h-14 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className={linkClass(l.to)} aria-current={isActive(l.to) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <Link
            to="/#contact"
            className="rounded-md bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gold-500"
          >
            Get a Quote
          </Link>
        </nav>

        <button
          className="rounded-md p-2 text-navy-800 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-slate-200 bg-white px-5 pb-4 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block border-b border-slate-100 py-3 font-medium ${
                isActive(l.to) ? 'text-gold-500' : 'text-navy-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
