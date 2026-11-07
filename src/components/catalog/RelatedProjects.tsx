import type { ProjectCardData } from '@/types/portfolio'
import { ProjectCard } from '@/components/portfolio/ProjectCard'

export function RelatedProjects({ projects }: { projects: ProjectCardData[] }) {
  if (!projects.length) return null
  return (
    <section className="site-shell corporate-related" aria-labelledby="corporate-projects-heading">
      <p className="eyebrow">Tamamlanmış işlerimizden</p>
      <h2 id="corporate-projects-heading">İlgili Projeler</h2>
      <div className="related-project-grid">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  )
}
