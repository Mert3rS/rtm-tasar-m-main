'use client'

import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
  subDays,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import type { DashboardEvent, DashboardPeriod, DashboardRange } from './dashboard-types'

const chartConfig = {
  current: { label: 'Seçili dönem', color: 'var(--chart-1)' },
  previous: { label: 'Önceki dönem', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function DashboardCharts({
  events,
  period,
  range,
}: {
  events: DashboardEvent[]
  period: DashboardPeriod
  range: DashboardRange
}) {
  const panels = [
    {
      id: 'content-activity',
      title: 'İçerik hareketi',
      description: 'Proje güncellemeleri ve medya yüklemeleri',
      kinds: ['project', 'media'] satisfies DashboardEvent['kind'][],
    },
    {
      id: 'inquiry-activity',
      title: 'Başvuru hareketi',
      description: 'İletişim ve teklif başvuruları',
      kinds: ['inquiry'] satisfies DashboardEvent['kind'][],
    },
  ]

  return (
    <div className="@container/charts border-b">
      <div className="grid @4xl/charts:grid-cols-2">
        {panels.map((panel) => {
          const data = buildChartData(events, range, panel.kinds)
          const total = data.reduce((sum, row) => sum + row.current, 0)
          const previous = data.reduce((sum, row) => sum + row.previous, 0)
          const change = previous ? ((total - previous) / previous) * 100 : null
          const tickStep = Math.max(1, Math.ceil(data.length / 7))
          const ticks = data
            .filter((_, index) => index % tickStep === 0)
            .map((row) => row.date)

          return (
            <section
              aria-labelledby={`${panel.id}-title`}
              className="@container/panel flex min-h-100 min-w-0 flex-col gap-7 border-t p-4 py-7 first:border-t-0 sm:px-7 @4xl/charts:border-t-0 @4xl/charts:not-first:border-l"
              id={panel.id}
              key={panel.id}
            >
              <div className="relative flex flex-col gap-2">
                <h2 className="text-[0.9375rem] text-muted-foreground" id={`${panel.id}-title`}>
                  {panel.title}
                </h2>
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <p className="font-semibold text-[1.75rem] tabular-nums tracking-tight">
                    {total.toLocaleString('tr-TR')}
                  </p>
                  <p
                    className={cn(
                      'font-medium text-[0.8125rem] tabular-nums',
                      change === null
                        ? 'text-muted-foreground'
                        : change < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400',
                    )}
                  >
                    {change === null
                      ? total > 0
                        ? 'Yeni hareket'
                        : 'Değişim yok'
                      : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                  </p>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    önceki {periodLabel(period)} ile karşılaştırma
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{panel.description}</p>
                <div className="flex items-center gap-4 text-[0.8125rem] @lg/panel:absolute @lg/panel:top-1 @lg/panel:right-0">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-0.75 w-2.5 rounded-full bg-chart-1" />
                    Bu dönem
                  </span>
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-0.75 w-2.5 rounded-full bg-chart-2" />
                    Önceki dönem
                  </span>
                </div>
              </div>

              <ChartContainer className="aspect-auto h-63 w-full" config={chartConfig}>
                <ComposedChart
                  accessibilityLayer
                  data={data}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    height={40}
                    minTickGap={24}
                    tickFormatter={(date: string) => format(parseISO(date), 'd MMM', { locale: tr })}
                    tickLine={false}
                    tickMargin={16}
                    ticks={ticks}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickCount={4}
                    tickLine={false}
                    tickMargin={8}
                    width={32}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-47.5 rounded-[10px] bg-popover px-3 py-2.5"
                        labelFormatter={(label) =>
                          typeof label === 'string'
                            ? format(parseISO(label), 'd MMMM yyyy', { locale: tr })
                            : label
                        }
                      />
                    }
                    cursor={{ stroke: 'var(--chart-1)', strokeDasharray: '3 3' }}
                  />
                  <Area
                    activeDot={false}
                    dataKey="current"
                    fill="var(--chart-1)"
                    fillOpacity={0.1}
                    isAnimationActive={false}
                    stroke="none"
                    tooltipType="none"
                    type="linear"
                  />
                  <Line
                    activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--background)', strokeWidth: 2 }}
                    dataKey="current"
                    dot={data.length === 1}
                    isAnimationActive={false}
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    type="linear"
                  />
                  <Line
                    activeDot={{ r: 4, fill: 'var(--chart-2)', stroke: 'var(--background)', strokeWidth: 2 }}
                    dataKey="previous"
                    dot={data.length === 1}
                    isAnimationActive={false}
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    type="linear"
                  />
                </ComposedChart>
              </ChartContainer>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function buildChartData(
  events: DashboardEvent[],
  range: DashboardRange,
  kinds: DashboardEvent['kind'][],
) {
  const from = parseISO(range.from)
  const to = parseISO(range.to)
  const days = Math.max(1, differenceInCalendarDays(to, from) + 1)
  const previousFrom = subDays(from, days)
  const previousTo = subDays(from, 1)
  const currentDays = eachDayOfInterval({ start: from, end: to })
  const previousDays = eachDayOfInterval({ start: previousFrom, end: previousTo })
  const matching = events.filter((event) => kinds.includes(event.kind))

  return currentDays.map((day, index) => ({
    date: format(day, 'yyyy-MM-dd'),
    current: countOnDay(matching, day),
    previous: countOnDay(matching, previousDays[index] ?? addDays(previousFrom, index)),
  }))
}

function countOnDay(events: DashboardEvent[], day: Date) {
  const key = format(day, 'yyyy-MM-dd')
  return events.reduce((sum, event) => sum + (event.date.slice(0, 10) === key ? 1 : 0), 0)
}

function periodLabel(period: DashboardPeriod) {
  return { day: 'gün', week: 'hafta', month: 'ay', year: 'yıl' }[period]
}
