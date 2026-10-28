import { useState } from 'react'
import { Link } from 'react-router-dom'
import HeroSlider from '../components/HeroSlider'
import Icon from '../components/Icon'
import ProjectCard from '../components/ProjectCard'
import { Hero3D, Showcase3D } from '../components/Scene3D'
import { fallbackProjects, fallbackServices, heroBackgrounds, site, values } from '../data/site'
import { getProjects, getServices, sendInquiry } from '../lib/api'
import { useApi } from '../lib/useApi'

const TOTAL_FLOORS = 30

function SectionTitle({ eyebrow, title, light = false }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-sm font-semibold tracking-[0.25em] text-gold-500 uppercase">{eyebrow}</p>
      <h2
        className={`mt-2 font-display text-4xl font-extrabold uppercase md:text-5xl ${
          light ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h2>
    </div>
  )
}

/* ------------------------------ HERO ------------------------------ */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-900">
      <HeroSlider images={heroBackgrounds} />
      {/* faint blueprint grid over the photos, for the brand look */}
      <div className="blueprint pointer-events-none absolute inset-0 opacity-40 [background-color:transparent]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-4 px-5 lg:grid-cols-2">
        <div className="rise relative z-10 py-16 lg:py-24">
          <span className="inline-block rounded-full border border-glow/40 px-4 py-1 text-xs font-semibold tracking-[0.25em] text-glow uppercase">
            Construction &amp; Engineering · Est. {site.established}
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] font-extrabold text-white uppercase md:text-7xl">
            Building your vision.
            <span className="block text-gold-400">Innovating for tomorrow.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-300">
            From foundations to façades, {site.name} delivers landmark buildings across{' '}
            {site.offices.join(', ')} with precision engineering and reliable delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="rounded-md bg-gold-500 px-7 py-3.5 font-semibold text-navy-950 transition hover:bg-gold-400"
            >
              Start your project
            </a>
            <a
              href="#showcase"
              className="rounded-md border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:border-glow hover:text-glow"
            >
              Explore in 3D
            </a>
          </div>
        </div>

        {/* 3D tower */}
        <div className="relative h-[420px] lg:h-[620px] [mask-image:radial-gradient(ellipse_at_50%_55%,black_52%,transparent_76%)]">
          <Hero3D />
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs tracking-widest text-glow/60 uppercase">
            Drag to rotate
          </p>
        </div>
      </div>
    </section>
  )
}

/* --------------------------- VALUES STRIP --------------------------- */
function Values() {
  return (
    <section className="bg-navy-800">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
        {values.map((v) => (
          <div key={v.title} className="flex items-center gap-3 text-white">
            <Icon name={v.icon} className="h-8 w-8 shrink-0 text-gold-400" />
            <span className="font-display text-lg font-bold tracking-wide uppercase">{v.title}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* --------------------------- BRAND FILM --------------------------- */
function BrandFilm() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20">
      <div className="mx-auto max-w-5xl px-5">
        <p className="text-sm font-semibold tracking-[0.25em] text-gold-400 uppercase">Our story</p>
        <h2 className="mt-2 font-display text-4xl font-extrabold text-white uppercase md:text-5xl">
          Shaping Dubai's future
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          From the first survey on site to steel rising against the skyline — a short look at how{' '}
          {site.name} builds.
        </p>

        <video
          src="/Videos/habeeb-story.mp4"
          poster="/images/habeeb-story-poster.jpg"
          controls
          playsInline
          preload="metadata"
          className="mt-8 w-full rounded-2xl border border-white/10 shadow-2xl"
        />
      </div>
    </section>
  )
}

/* ------------------------------ ABOUT ------------------------------ */
function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
        {/* Photo collage: scale model on the desk + the brand poster as a small card */}
        <div className="relative pb-16 pr-6 sm:pr-12">
          <img
            src="/images/tower-model-desk.jpg"
            alt="Scale model of an Al Habeeb tower on an engineer's desk"
            loading="lazy"
            className="w-full rounded-2xl shadow-xl"
          />
          <img
            src="/images/brand-poster.jpg"
            alt="Al Habeeb Construction & Engineering - Building a better tomorrow"
            loading="lazy"
            className="absolute right-0 bottom-0 w-1/2 rounded-xl border-4 border-white shadow-2xl"
          />
        </div>
        <div>
          <SectionTitle eyebrow="About us" title="Engineering that stands the test of time" />
          <p className="-mt-4 text-slate-600">
            {site.fullName} combines hands-on construction experience with modern engineering and
            digital design. We plan, engineer and build with 3D coordination from day one, so
            problems are solved on screen before they cost time on site.
          </p>
          <ul className="mt-6 space-y-3 text-slate-700">
            {[
              'BIM / 3D coordination across structure, façade and MEP',
              'In-house structural and façade engineering',
              'Safety-first sites with transparent progress reporting',
              'Sustainable design targeting LEED certification',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- SERVICES ---------------------------- */
function Services({ services }) {
  return (
    <section id="services" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="What we do" title="Our services" />
          <Link
            to="/services"
            className="mb-10 inline-flex items-center gap-2 font-semibold text-navy-800 hover:text-gold-500"
          >
            View all services <Icon name="arrow" className="h-5 w-5" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-gold-500 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-800 text-gold-400">
                <Icon name={s.icon} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold text-navy-900 uppercase">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------- 3D SHOWCASE ------------------------- */
function Toggle({ on, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
        on
          ? 'border-glow bg-glow/15 text-glow'
          : 'border-white/20 text-slate-400 hover:border-white/40'
      }`}
    >
      {children}
    </button>
  )
}

function Showcase() {
  const [built, setBuilt] = useState(TOTAL_FLOORS)
  const [structure, setStructure] = useState(true)
  const [facade, setFacade] = useState(true)
  const percent = Math.round((built / TOTAL_FLOORS) * 100)

  return (
    <section id="showcase" className="blueprint scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <SectionTitle eyebrow="Interactive 3D" title="Watch a tower rise" light />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="h-[460px] overflow-hidden rounded-2xl border border-glow/20 bg-navy-950/60 lg:h-[560px]">
            <Showcase3D built={built} structure={structure} facade={facade} />
          </div>

          <aside className="rounded-2xl border border-white/10 bg-navy-950/60 p-6 text-slate-300">
            <p className="text-xs tracking-[0.25em] text-glow uppercase">Build progress</p>
            <p className="mt-1 font-display text-6xl font-extrabold text-white">{percent}%</p>
            <p className="text-sm">
              Floor {built} of {TOTAL_FLOORS}
            </p>

            <input
              type="range"
              min={0}
              max={TOTAL_FLOORS}
              value={built}
              onChange={(e) => setBuilt(Number(e.target.value))}
              className="mt-5 w-full accent-[#38e1ff]"
              aria-label="Floors built"
            />

            <p className="mt-6 text-xs tracking-[0.25em] text-glow uppercase">Layers</p>
            <div className="mt-2 flex gap-3">
              <Toggle on={structure} onClick={() => setStructure(!structure)}>
                Structure
              </Toggle>
              <Toggle on={facade} onClick={() => setFacade(!facade)}>
                Façade
              </Toggle>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Drag to orbit, scroll to zoom. Use the slider to watch the steel frame rise and the glass follow.
            </p>

            <p className="mt-6 text-xs tracking-[0.25em] text-glow uppercase">Concept render</p>
            <video
              src="/Videos/tower.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-label="Concept render of the Al Habeeb tower"
              className="mt-2 w-full rounded-xl border border-white/10"
            />
          </aside>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- PROJECTS ---------------------------- */
function FeaturedProjects({ projects }) {
  return (
    <section id="projects" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Our work" title="Featured projects" />
          <Link
            to="/projects"
            className="mb-10 inline-flex items-center gap-2 font-semibold text-navy-800 hover:text-gold-500"
          >
            View all projects <Icon name="arrow" className="h-5 w-5" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- CONTACT ----------------------------- */
function Contact({ services }) {
  const empty = { name: '', email: '', phone: '', service: '', message: '' }
  const [form, setForm] = useState(empty)
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [error, setError] = useState('')

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      await sendInquiry(form)
      setStatus('success')
      setForm(empty)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const input =
    'w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30'

  return (
    <section id="contact" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Contact" title="Let's build something great" />
          <p className="-mt-4 text-slate-600">
            Tell us about your project and our team will get back to you shortly.
          </p>
          <ul className="mt-8 space-y-4 text-slate-700">
            <li className="flex items-center gap-3">
              <Icon name="mail" className="h-5 w-5 text-gold-500" /> {site.email}
            </li>
            <li className="flex items-center gap-3">
              <Icon name="phone" className="h-5 w-5 text-gold-500" /> {site.phone}
            </li>
            <li className="flex items-center gap-3">
              <Icon name="pin" className="h-5 w-5 text-gold-500" /> {site.offices.join(' · ')}
            </li>
          </ul>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={input} name="name" placeholder="Your name *" aria-label="Your name" autoComplete="name" required value={form.name} onChange={update} />
            <input className={input} name="email" type="email" placeholder="Email *" aria-label="Email" autoComplete="email" required value={form.email} onChange={update} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={input} name="phone" type="tel" placeholder="Phone" aria-label="Phone" autoComplete="tel" value={form.phone} onChange={update} />
            <select className={input} name="service" aria-label="Service needed" value={form.service} onChange={update}>
              <option value="">Service needed</option>
              {services.map((s) => (
                <option key={s.id} value={s.title}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className={input}
            name="message"
            aria-label="Tell us about your project"
            rows={5}
            placeholder="Tell us about your project *"
            required
            value={form.message}
            onChange={update}
          />
          <button
            disabled={status === 'sending'}
            className="w-full rounded-md bg-navy-800 py-3.5 font-semibold text-white transition hover:bg-gold-500 disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending...' : 'Send message'}
          </button>
          {status === 'success' && (
            <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              Thank you! We received your message and will contact you soon.
            </p>
          )}
          {status === 'error' && (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              Sorry, something went wrong: {error}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}

/* ------------------------------ PAGE ------------------------------ */
export default function Home() {
  const { data: services } = useApi(getServices, fallbackServices)
  const { data: projects } = useApi(getProjects, fallbackProjects)

  return (
    <>
      <Hero />
      <Values />
      <BrandFilm />
      <About />
      <Services services={services} />
      <Showcase />
      <FeaturedProjects projects={projects} />
      <Contact services={services} />
    </>
  )
}