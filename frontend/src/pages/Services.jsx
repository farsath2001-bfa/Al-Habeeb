import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import SectionPhoto from '../components/SectionPhoto'
import { fallbackServices } from '../data/site'
import { getServices } from '../lib/api'
import { useApi } from '../lib/useApi'

const promises = [
  { title: 'Experienced Team', icon: 'hardhat' },
  { title: 'On-Time Delivery', icon: 'clipboard' },
  { title: 'Client Satisfaction', icon: 'handshake' },
  { title: 'Sustainable Future', icon: 'leaf' },
]

export default function Services() {
  // Shows the built-in list straight away and swaps in live data when the backend answers.
  const { data: services } = useApi(getServices, fallbackServices)

  return (
    <>
      {/* Intro (photo background) + banner image */}
      <section className="relative overflow-hidden bg-navy-900 pt-16 pb-12">
        <SectionPhoto src="/images/hero-bg-tower-dusk.jpg" grid />
        <div className="relative mx-auto max-w-7xl px-5">
          <p className="text-sm font-semibold tracking-[0.25em] text-glow uppercase">What we do</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold text-white uppercase md:text-6xl">
            Our services
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            From concept to completion, we deliver quality, safety and excellence in every project.
          </p>

          <img
            src="/images/services-banner.jpg"
            alt="Al Habeeb services: residential and commercial construction, civil engineering, renovation, project planning and design, quality, safety and compliance"
            className="mt-10 w-full rounded-2xl shadow-2xl"
          />
        </div>
      </section>

      {/* Service cards */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition hover:border-gold-500 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-navy-800 text-gold-400">
                  <Icon name={s.icon} className="h-7 w-7" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-navy-900 uppercase">{s.title}</h2>
                <p className="mt-2 flex-1 text-sm text-slate-600">{s.description}</p>
                <Link
                  to="/#contact"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-500"
                >
                  Request a quote <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promises strip */}
      <section className="relative overflow-hidden bg-navy-800">
        <SectionPhoto src="/images/site-progress.jpg" overlay="soft" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
          {promises.map((p) => (
            <div key={p.title} className="flex items-center gap-3 text-white">
              <Icon name={p.icon} className="h-8 w-8 shrink-0 text-gold-400" aria-hidden="true" />
              <span className="font-display text-lg font-bold tracking-wide uppercase">{p.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="relative overflow-hidden bg-navy-900 py-16 text-center">
        <SectionPhoto src="/images/hero-bg-glass-tower.jpg" grid />
        <div className="relative mx-auto max-w-3xl px-5">
          <h2 className="font-display text-4xl font-extrabold text-white uppercase md:text-5xl">
            Have a project in mind?
          </h2>
          <p className="mt-3 text-slate-300">Tell us about it and our team will get back to you shortly.</p>
          <Link
            to="/#contact"
            className="mt-7 inline-block rounded-md bg-gold-500 px-8 py-3.5 font-semibold text-navy-950 transition hover:bg-gold-400"
          >
            Start your project
          </Link>
        </div>
      </section>
    </>
  )
}
