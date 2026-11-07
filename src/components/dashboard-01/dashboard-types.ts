export type DashboardPeriod = 'day' | 'week' | 'month' | 'year'

export type DashboardRange = {
  from: string
  to: string
}

export type DashboardMetric = {
  change: string
  changeTone: 'positive' | 'negative' | 'neutral'
  href: string
  label: string
  value: string
}

export type DashboardEvent = {
  date: string
  kind: 'inquiry' | 'media' | 'project'
}

export type DashboardProject = {
  href: string
  id: number
  location: string
  status: 'draft' | 'published'
  title: string
  updatedAt: string
}

export type DashboardData = {
  events: DashboardEvent[]
  metrics: DashboardMetric[]
  projects: DashboardProject[]
  today: string
  userEmail: string
}
