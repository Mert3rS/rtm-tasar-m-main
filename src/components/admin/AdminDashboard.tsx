import type { ServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { DashboardView } from '@/components/dashboard-01/dashboard-view'
import type {
  DashboardData,
  DashboardEvent,
  DashboardMetric,
  DashboardProject,
} from '@/components/dashboard-01/dashboard-types'
import type { City } from '@/payload-types'
import { AdminContentOverview } from './AdminContentOverview'

type ProjectDoc = {
  _status?: 'draft' | 'published' | null
  city: number | City
  createdAt: string
  id: number
  title: string
  updatedAt: string
}

type MediaDoc = { createdAt: string; id: number }
type InquiryDoc = { id: number; submittedAt: string }

type CountResult = { totalDocs: number }

const safeTotal = async (request: Promise<CountResult>): Promise<number | null> => {
  try {
    return (await request).totalDocs
  } catch {
    return null
  }
}

const safeDocs = async <T,>(request: Promise<{ docs: T[] }>): Promise<T[]> => {
  try {
    return (await request).docs
  } catch {
    return []
  }
}

const displayCount = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('tr-TR')

export async function AdminDashboard({ payload, user }: ServerProps) {
  if (!user) return null

  // This authenticated admin view reads through Payload's trusted Local API.
  // Only the minimal serializable fields needed by the dashboard cross into the client.
  const [
    totalProjects,
    publishedProjects,
    mediaItems,
    totalShowrooms,
    publishedShowrooms,
    newInquiries,
    reviewingInquiries,
    projects,
    media,
    inquiries,
  ] = await Promise.all([
    safeTotal(payload.count({ collection: 'projects', overrideAccess: true })),
    safeTotal(
      payload.count({
        collection: 'projects',
        overrideAccess: true,
        where: { _status: { equals: 'published' } },
      }),
    ),
    safeTotal(payload.count({ collection: 'media', overrideAccess: true })),
    safeTotal(payload.count({ collection: 'showrooms', overrideAccess: true })),
    safeTotal(
      payload.count({
        collection: 'showrooms',
        overrideAccess: true,
        where: { _status: { equals: 'published' } },
      }),
    ),
    safeTotal(
      payload.count({
        collection: 'inquiries',
        overrideAccess: true,
        where: { status: { equals: 'new' } },
      }),
    ),
    safeTotal(
      payload.count({
        collection: 'inquiries',
        overrideAccess: true,
        where: { status: { equals: 'reviewing' } },
      }),
    ),
    safeDocs<ProjectDoc>(
      payload.find({
        collection: 'projects',
        depth: 2,
        draft: true,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        select: {
          _status: true,
          city: true,
          createdAt: true,
          title: true,
          updatedAt: true,
        },
        sort: '-updatedAt',
      }),
    ),
    safeDocs<MediaDoc>(
      payload.find({
        collection: 'media',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        select: { createdAt: true },
        sort: '-createdAt',
      }),
    ),
    safeDocs<InquiryDoc>(
      payload.find({
        collection: 'inquiries',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        select: { submittedAt: true },
        sort: '-submittedAt',
      }),
    ),
  ])

  const adminRoute = payload.config.routes.admin
  const href = (path: `/${string}`) => formatAdminURL({ adminRoute, path })
  const today = new Date().toISOString().slice(0, 10)
  const weekStart = new Date(`${today}T00:00:00.000Z`)
  weekStart.setUTCDate(weekStart.getUTCDate() - 6)
  const weekStartISO = weekStart.toISOString()
  const mediaThisWeek = media.filter((item) => item.createdAt >= weekStartISO).length

  const metrics: DashboardMetric[] = [
    {
      change: `${displayCount(publishedProjects)} yayında`,
      changeTone: 'positive',
      href: href('/collections/projects'),
      label: 'Toplam projeler',
      value: displayCount(totalProjects),
    },
    {
      change: `${displayCount(reviewingInquiries)} inceleniyor`,
      changeTone: (newInquiries ?? 0) > 0 ? 'positive' : 'neutral',
      href: href('/collections/inquiries'),
      label: 'Yeni başvurular',
      value: displayCount(newInquiries),
    },
    {
      change: `+${mediaThisWeek} bu hafta`,
      changeTone: mediaThisWeek > 0 ? 'positive' : 'neutral',
      href: href('/collections/media'),
      label: 'Medya arşivi',
      value: displayCount(mediaItems),
    },
    {
      change: `${displayCount(totalShowrooms)} toplam`,
      changeTone: (publishedShowrooms ?? 0) > 0 ? 'positive' : 'neutral',
      href: href('/collections/showrooms'),
      label: 'Aktif showroom',
      value: displayCount(publishedShowrooms),
    },
  ]

  const events: DashboardEvent[] = [
    ...projects.map((project) => ({ date: project.updatedAt, kind: 'project' as const })),
    ...media.map((item) => ({ date: item.createdAt, kind: 'media' as const })),
    ...inquiries.map((inquiry) => ({ date: inquiry.submittedAt, kind: 'inquiry' as const })),
  ]

  const recentProjects: DashboardProject[] = projects.slice(0, 24).map((project) => ({
    href: href(`/collections/projects/${project.id}`),
    id: project.id,
    location: projectLocation(project.city),
    status: project._status === 'published' ? 'published' : 'draft',
    title: project.title,
    updatedAt: project.updatedAt,
  }))

  const data: DashboardData = {
    events,
    metrics,
    projects: recentProjects,
    today,
    userEmail: typeof user.email === 'string' ? user.email : 'Yönetici',
  }

  return (
    <DashboardView
      accountHref={href(payload.config.admin.routes.account as `/${string}`)}
      data={data}
      content={<AdminContentOverview payload={payload} user={user} />}
      siteHref="/"
    />
  )
}

function projectLocation(city: number | City) {
  if (typeof city === 'number') return 'Konum belirtilmedi'
  const country = typeof city.country === 'number' ? null : city.country
  return country ? `${city.name}, ${country.name}` : city.name
}
