const statusStyles = {
  'Design Concept': 'bg-white text-cyan-800',
  'Under Construction': 'bg-gold-400 text-navy-950',
  Completed: 'bg-emerald-500 text-white',
}

export default function ProjectCard({ project }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy-900">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          // No photo yet? Show a blueprint-style placeholder.
          <div className="blueprint flex h-full items-center justify-center font-display text-2xl tracking-widest text-glow/60 uppercase">
            Photo coming soon
          </div>
        )}
        <span
          className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold ${
            statusStyles[project.status] || 'bg-white text-navy-800'
          }`}
        >
          {project.status}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold tracking-widest text-gold-500 uppercase">
          {project.category} · {project.location}
        </p>
        <h3 className="mt-1 font-display text-2xl font-bold text-navy-900">{project.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{project.summary}</p>
      </div>
    </article>
  )
}
