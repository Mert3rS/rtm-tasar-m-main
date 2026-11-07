'use client'

import { addDays, format, parseISO, startOfYear } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarDays, ChevronDown, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { DashboardPeriod, DashboardRange } from './dashboard-types'

const press =
  'ease-[cubic-bezier(0.23,1,0.32,1)] transition-[transform,background-color] duration-150 active:scale-[0.96] motion-reduce:active:scale-100'

export function DashboardHeader({
  accountHref,
  onPeriodChange,
  onRangeChange,
  period,
  range,
  siteHref,
  today,
  userEmail,
}: {
  accountHref: string
  onPeriodChange: (period: DashboardPeriod) => void
  onRangeChange: (range: DashboardRange) => void
  period: DashboardPeriod
  range: DashboardRange
  siteHref: string
  today: string
  userEmail: string
}) {
  const [draftRange, setDraftRange] = useState(range)
  const [rangeOpen, setRangeOpen] = useState(false)
  const presets = useMemo(() => getPresets(today), [today])
  const from = parseISO(range.from)
  const to = parseISO(range.to)
  const rangeLabel =
    range.from === range.to
      ? format(to, 'd MMM', { locale: tr })
      : `${format(from, 'd MMM', { locale: tr })} – ${format(to, 'd MMM', { locale: tr })}`
  const initial = userEmail.slice(0, 1).toLocaleUpperCase('tr-TR')

  const selectPeriod = (nextPeriod: DashboardPeriod) => {
    const preset = presets.find((item) => item.value === nextPeriod)
    if (!preset) return
    onPeriodChange(nextPeriod)
    onRangeChange(preset.range)
    setDraftRange(preset.range)
  }

  return (
    <header className="flex min-h-15 flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3 lg:px-7 lg:py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg tracking-tight">Genel Bakış</h1>
          <span className="hidden text-[0.8125rem] text-muted-foreground sm:inline">
            Canlı CMS verileri
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <ToggleGroup
          aria-label="Grafik dönemi"
          className="rounded-[9px] border bg-muted/50 p-0.75"
          onValueChange={(values) => {
            const next = values[0] as DashboardPeriod | undefined
            if (next) selectPeriod(next)
          }}
          size="sm"
          spacing={0.5}
          type="multiple"
          value={[period]}
        >
          {presets.map((item) => (
            <ToggleGroupItem
              className="h-7 min-w-0 rounded-md px-3 text-[0.8125rem]"
              key={item.value}
              value={item.value}
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Popover onOpenChange={setRangeOpen} open={rangeOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-label={`Tarih aralığı: ${rangeLabel}`}
              className={press}
              size="lg"
              variant="outline"
            >
              <CalendarDays aria-hidden="true" />
              {rangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 rounded-[10px] p-4">
            <div className="grid gap-4">
              <div>
                <h2 className="font-medium text-sm">Özel tarih aralığı</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Grafiklerde gösterilecek başlangıç ve bitiş tarihini seçin.
                </p>
              </div>
              <label className="grid gap-1.5 text-xs text-muted-foreground">
                Başlangıç
                <input
                  className="h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
                  max={draftRange.to}
                  onChange={(event) =>
                    setDraftRange((current) => ({ ...current, from: event.target.value }))
                  }
                  type="date"
                  value={draftRange.from}
                />
              </label>
              <label className="grid gap-1.5 text-xs text-muted-foreground">
                Bitiş
                <input
                  className="h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
                  min={draftRange.from}
                  max={today}
                  onChange={(event) =>
                    setDraftRange((current) => ({ ...current, to: event.target.value }))
                  }
                  type="date"
                  value={draftRange.to}
                />
              </label>
              <Button
                className={press}
                disabled={!draftRange.from || !draftRange.to || draftRange.from > draftRange.to}
                onClick={() => {
                  onRangeChange(draftRange)
                  setRangeOpen(false)
                }}
              >
                Uygula
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button asChild className={`${press} hidden sm:inline-flex`} size="lg" variant="outline">
          <a href={siteHref} rel="noreferrer" target="_blank">
            Siteyi görüntüle
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>

        <Button asChild className={`${press} gap-2 rounded-full pr-2.5 pl-1`} size="lg" variant="outline">
          <a aria-label="Hesap ayarları" href={accountHref}>
            <span className="flex size-7 items-center justify-center rounded-full bg-muted font-semibold text-[0.6875rem]">
              {initial}
            </span>
            <ChevronDown aria-hidden="true" />
          </a>
        </Button>
      </div>
    </header>
  )
}

function getPresets(today: string) {
  const end = parseISO(today)
  return [
    { label: 'Gün', value: 'day', range: { from: today, to: today } },
    {
      label: 'Hafta',
      value: 'week',
      range: { from: format(addDays(end, -6), 'yyyy-MM-dd'), to: today },
    },
    {
      label: 'Ay',
      value: 'month',
      range: { from: format(addDays(end, -29), 'yyyy-MM-dd'), to: today },
    },
    {
      label: 'Yıl',
      value: 'year',
      range: { from: format(startOfYear(end), 'yyyy-MM-dd'), to: today },
    },
  ] satisfies Array<{ label: string; range: DashboardRange; value: DashboardPeriod }>
}
