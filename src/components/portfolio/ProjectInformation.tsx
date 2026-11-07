import type { ProjectDetailData } from '@/types/portfolio'
import { TextAnimate } from '@/components/site/TextAnimate'
import { ProjectDescription } from './ProjectDescription'

export function ProjectInformation({ project }: { project: ProjectDetailData }) {
  const facts = [
    ['Konum', [project.cityName, project.countryName].filter(Boolean).join(', ')],
    ['Proje türü', project.projectType],
    ['Tamamlanma', project.completionYear?.toString()],
    [
      'Proje alanı',
      project.projectArea !== undefined
        ? `${new Intl.NumberFormat('tr-TR').format(project.projectArea)} m²`
        : undefined,
    ],
    ['Müşteri', project.clientName],
    ['Konum detayı', project.locationDescription],
  ].filter(([, value]) => Boolean(value))
  return (
    <section aria-labelledby="project-about-heading" className="site-shell project-information">
      <div className="project-narrative">
        <p className="eyebrow">Proje hakkında</p>
        <h2 id="project-about-heading">
          <TextAnimate animation="slideUp" as="span" by="word" duration={0.54}>
            Mekânın
          </TextAnimate>{' '}
          <em>
            <TextAnimate
              animation="blurInUp"
              as="span"
              by="character"
              delay={0.1}
              duration={0.44}
              stagger={0.026}
            >
              hikâyesi
            </TextAnimate>
          </em>
        </h2>
        <TextAnimate animation="fadeIn" as="p" by="text" className="project-lead" delay={0.14}>
          {project.description}
        </TextAnimate>
        <ProjectDescription content={project.descriptionContent} />
      </div>
      {facts.length ? (
        <dl className="project-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="micro-label">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
