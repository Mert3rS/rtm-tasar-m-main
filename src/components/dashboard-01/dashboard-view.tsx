'use client'

import { addDays, format, parseISO } from 'date-fns'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { DashboardCharts } from './dashboard-charts'
import { DashboardHeader } from './dashboard-header'
import type { DashboardData, DashboardPeriod, DashboardRange } from './dashboard-types'
import { ProjectsTable } from './customers-table'

export function DashboardView({
  accountHref,
  data,
  siteHref,
}: {
  accountHref: string
  data: DashboardData
  siteHref: string
}) {
  const [period, setPeriod] = useState<DashboardPeriod>('week')
  const [range, setRange] = useState<DashboardRange>(() => ({
    from: format(addDays(parseISO(data.today), -6), 'yyyy-MM-dd'),
    to: data.today,
  }))

  return (
    <main
      className="rtm-blocks-dashboard min-w-0 bg-background font-sans text-foreground antialiased [--chart-1:var(--rtm-admin-accent)] [--chart-2:#d4d4d8] dark:[--chart-2:#3f3f46]"
      id="overview"
    >
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:p-3"
        href="#dashboard-metrics"
      >
        Dashboard verilerine geç
      </a>
      <DashboardHeader
        accountHref={accountHref}
        onPeriodChange={setPeriod}
        onRangeChange={setRange}
        period={period}
        range={range}
        siteHref={siteHref}
        today={data.today}
        userEmail={data.userEmail}
      />

      <div className="@container/metrics border-b" id="dashboard-metrics">
        <dl className="grid grid-cols-2 @3xl/metrics:grid-cols-4">
          {data.metrics.map((metric) => (
            <a
              className="group flex min-w-0 flex-col justify-center gap-2 border-b px-4 py-6 transition-colors hover:bg-muted/35 even:border-l [&:nth-last-child(-n+2)]:border-b-0 @3xl/metrics:border-b-0 @3xl/metrics:not-first:border-l @3xl/metrics:px-7"
              href={metric.href}
              key={metric.label}
            >
              <dt className="truncate text-sm text-muted-foreground sm:text-[0.9375rem]">
                {metric.label}
              </dt>
              <dd className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-semibold text-[1.75rem] tabular-nums tracking-tight">
                  {metric.value}
                </span>
                <span
                  className={cn(
                    'font-medium text-[0.8125rem] tabular-nums',
                    metric.changeTone === 'positive' && 'text-green-600 dark:text-green-400',
                    metric.changeTone === 'negative' && 'text-red-600 dark:text-red-400',
                    metric.changeTone === 'neutral' && 'text-muted-foreground',
                  )}
                >
                  {metric.change}
                </span>
              </dd>
            </a>
          ))}
        </dl>
      </div>

      <DashboardCharts events={data.events} period={period} range={range} />
      <ProjectsTable projects={data.projects} />
    </main>
  )
}
