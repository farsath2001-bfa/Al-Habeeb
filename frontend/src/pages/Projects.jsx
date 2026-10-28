import { useState } from 'react'
import ProjectCard from '../components/ProjectCard'
import { fallbackProjects } from '../data/site'
import { getProjects } from '../lib/api'
import { useApi } from '../lib/useApi'

export default function Projects() {
  const { data: projects } = useApi(getProjects, fallbackProjects)
  const [filter, setFilter] = useState('All')

  const statuses = ['All', ...new Set(projects.map((p) => p.status))]
  const visible = filter === 'All' ? projects : projects.filter((p) => p.status === filter)

  return (
    <section className="min-h-[70vh] bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-5">
        <p className="text-sm font-semibold tracking-[0.25em] text-gold-500 uppercase">Portfolio</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold text-navy-900 uppercase">All projects</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === s
                  ? 'border-navy-800 bg-navy-800 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-navy-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
