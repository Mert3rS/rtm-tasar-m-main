'use client'

import { Check, ChevronDown, Download, Ellipsis, Eye, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { DashboardProject } from './dashboard-types'

const PAGE_SIZE = 8

export function ProjectsTable({ projects }: { projects: DashboardProject[] }) {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | DashboardProject['status']>('all')
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr-TR')
    return projects.filter(
      (project) =>
        (status === 'all' || project.status === status) &&
        (!term ||
          project.title.toLocaleLowerCase('tr-TR').includes(term) ||
          project.location.toLocaleLowerCase('tr-TR').includes(term)),
    )
  }, [projects, query, status])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const exportProjects = () => {
    const csv = [
      ['Proje', 'Konum', 'Durum', 'Güncellenme'],
      ...filtered.map((project) => [
        project.title,
        project.location,
        project.status === 'published' ? 'Yayında' : 'Taslak',
        project.updatedAt,
      ]),
    ]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'rtm-projeler.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="@container/projects w-full" id="projects-table">
      <div className="flex flex-col gap-4 p-4 sm:p-7 sm:py-6 @3xl/projects:flex-row @3xl/projects:items-center @3xl/projects:justify-between">
        <div>
          <h2 className="font-semibold text-[18px] leading-6">Son güncellenen projeler</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Portföydeki proje kayıtlarını hızlıca bulun ve düzenleyin
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 @3xl/projects:justify-end">
          <label className="flex h-9 min-w-52 flex-1 items-center gap-2 rounded-md border bg-background px-3 @3xl/projects:max-w-72">
            <Search aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="sr-only">Projelerde ara</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Projelerde ara"
              type="search"
              value={query}
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Proje durumuna göre filtrele"
                className="rtm-admin-select-trigger h-9 min-w-36 justify-between gap-3 px-3"
                variant="outline"
              >
                {status === 'all' ? 'Tüm durumlar' : status === 'published' ? 'Yayında' : 'Taslak'}
                <ChevronDown aria-hidden="true" className="rtm-admin-select-chevron" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rtm-admin-select-menu w-44">
              {([
                ['all', 'Tüm durumlar'],
                ['published', 'Yayında'],
                ['draft', 'Taslak'],
              ] as const).map(([value, label]) => (
                <DropdownMenuItem
                  className="rtm-admin-select-option"
                  key={value}
                  onSelect={() => {
                    setStatus(value)
                    setPage(1)
                  }}
                >
                  <span>{label}</span>
                  {status === value && <Check aria-hidden="true" className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={exportProjects} size="lg" variant="outline">
            <Download aria-hidden="true" />
            Dışa aktar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border-t">
        <Table className="min-w-190 table-fixed [&_td:first-child]:pl-4 sm:[&_td:first-child]:pl-7 [&_td:last-child]:pr-4 sm:[&_td:last-child]:pr-7 [&_th:first-child]:pl-4 sm:[&_th:first-child]:pl-7 [&_th:last-child]:pr-4 sm:[&_th:last-child]:pr-7">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[24%]" />
            <col className="w-[18%]" />
            <col className="w-[calc(20%-68px)]" />
            <col className="w-17" />
          </colgroup>
          <TableHeader>
            <TableRow className="h-11 hover:bg-transparent">
              <TableHead className="px-2 text-xs text-muted-foreground">Proje</TableHead>
              <TableHead className="px-2 text-xs text-muted-foreground">Konum</TableHead>
              <TableHead className="px-2 text-xs text-muted-foreground">Güncellenme</TableHead>
              <TableHead className="px-2 text-xs text-muted-foreground">Durum</TableHead>
              <TableHead><span className="sr-only">İşlemler</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((project) => (
              <TableRow className="h-14" key={project.id}>
                <TableCell className="px-2 py-0 font-medium text-sm">
                  <a className="hover:underline" href={project.href}>{project.title}</a>
                </TableCell>
                <TableCell className="px-2 py-0 text-sm text-muted-foreground">
                  {project.location}
                </TableCell>
                <TableCell className="px-2 py-0 text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(project.updatedAt))}
                </TableCell>
                <TableCell className="px-2 py-0">
                  <StatusDot status={project.status} />
                </TableCell>
                <TableCell className="px-0 py-0 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-label={`${project.title} işlemleri`} size="icon-sm" variant="ghost">
                        <Ellipsis aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-[10px] p-1.5">
                      <DropdownMenuItem asChild className="min-h-9 gap-2.5 px-2.5">
                        <a href={project.href}>
                          <Eye aria-hidden="true" />
                          Projeyi düzenle
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow className="h-28 hover:bg-transparent">
                <TableCell className="text-center text-sm text-muted-foreground" colSpan={5}>
                  Bu filtrelerle eşleşen proje bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p aria-live="polite" className="text-[13px] text-muted-foreground">
          {filtered.length
            ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} / ${filtered.length} proje`
            : '0 proje'}
        </p>
        <nav aria-label="Proje sayfaları" className="flex items-center gap-1">
          <Button disabled={safePage === 1} onClick={() => setPage(Math.max(1, safePage - 1))} size="sm" variant="outline">
            Önceki
          </Button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
            <Button
              aria-current={safePage === number ? 'page' : undefined}
              key={number}
              onClick={() => setPage(number)}
              size="icon-sm"
              variant={safePage === number ? 'secondary' : 'ghost'}
            >
              {number}
            </Button>
          ))}
          <Button disabled={safePage === pageCount} onClick={() => setPage(Math.min(pageCount, safePage + 1))} size="sm" variant="outline">
            Sonraki
          </Button>
        </nav>
      </div>
    </section>
  )
}

function StatusDot({ status }: { status: DashboardProject['status'] }) {
  const published = status === 'published'
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', published ? 'bg-green-500' : 'bg-amber-500')}
      />
      {published ? 'Yayında' : 'Taslak'}
    </span>
  )
}
