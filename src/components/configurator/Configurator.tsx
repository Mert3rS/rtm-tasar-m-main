'use client'

import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { safeStorage } from '@/lib/consent/storage'
import { preferredDesignUrl } from '@/lib/configurator/shareClient'
import { kitchenDescription, normalizeKitchenSelection } from '@/lib/configurator/kitchen'
import { KitchenSelectionDock } from './KitchenSelectionDock'
import { TvSelectionDock } from './TvSelectionDock'
import { tvDetails, tvGeometry, normalizeTvSelection } from '@/lib/configurator/tv'
import { tvKindNames, type TvSelection } from '@/lib/configurator/tvSchema'
import { BathroomSelectionDock } from './BathroomSelectionDock'
import { bathroomDetails, bathroomGeometry, normalizeBathroomSelection } from '@/lib/configurator/bathroom'
import { bathroomKindNames, type BathroomSelection } from '@/lib/configurator/bathroomSchema'
import { EntrywaySelectionDock } from './EntrywaySelectionDock'
import { entrywayDetails } from '@/lib/configurator/entryway'
import { entrywayLayoutNames } from '@/lib/configurator/entrywaySchema'
import { WardrobeSelectionDock } from './WardrobeSelectionDock'
import { wardrobeDetails } from '@/lib/configurator/wardrobe'
import { wardrobeLayoutNames } from '@/lib/configurator/wardrobeSchema'
import type { KitchenSelection } from '@/lib/configurator/kitchenSchema'
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  baseHeight,
  encode,
  frontNames,
  interiorNames,
  optionName,
  palette,
  productNames,
  products,
  round,
  type Config,
} from '@/lib/configurator/config'
import { SceneControls } from './SceneControls'
import { useScenePreferences } from './useScenePreferences'
import { useDesign } from './store/useDesign'
import {
  DetailsPanel,
  FinishPanel,
  InteriorPanel,
  ProductPanel,
  SectionsPanel,
  type PanelProps,
} from './panels/DesignPanels'
import { TechnicalDrawing } from './TechnicalDrawing'
import { StudioIcon } from './StudioIcon'
import { StudioTool as Tool } from './StudioTool'
import { DesignSummary } from './DesignSummary'
import { StudioGuide } from './StudioGuide'
import { MaterialSwatch } from './MaterialSwatch'
import { MobileSheetHandle, type SheetSnap } from './MobileSheet'
import { useMobileStudio } from './useMobileStudio'
import { recordInterest } from '@/lib/personalization/interest'

const Scene = dynamic(() => import('./scene/CabinetScene'), {
  ssr: false,
  loading: () => (
    <div className="dc-loading">
      <span />
      <p>Atölyeniz hazırlanıyor…</p>
    </div>
  ),
})
const steps = [
  'Ürün ve ölçü',
  'Bölmeler',
  'İç düzen',
  'Kapak ve renk',
  'Kulp ve detaylar',
  'Gönder',
]
const introductions = [
  ['Ön tasarımınızı', 'oluşturun.'],
  ['Her şeye', 'yer açın.'],
  ['İçini sizin için', 'düzenleyin.'],
  ['Karakterini', 'belirleyin.'],
  ['İnce detaylarla', 'tamamlayın.'],
  ['Fikrinizi birlikte', 'gerçekleştirelim.'],
]
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
function Summary({ config: c, onStep }: { config: Config; onStep: (s: number) => void }) {
  const rows = [
    ['Ürün ve ölçü', `${productNames[c.m]} · ${c.d.w} × ${c.d.h} × ${c.d.d} cm`],
    ['Bölmeler', `${c.r.main.w.length} bölme · ${c.r.main.w.map(round).join(' / ')} cm`],
    [
      'İç düzen',
      c.tvUnit ? c.tvUnit.lower.map((kind) => tvKindNames[kind]).join(' / ') : c.bathroom ? c.bathroom.lower.map((kind) => bathroomKindNames[kind]).join(' / ') : c.entryway ? c.entryway.layouts.map((layout) => entrywayLayoutNames[layout]).join(' / ') : c.wardrobe ? c.wardrobe.layouts.map((layout) => wardrobeLayoutNames[layout]).join(' / ') : `${c.r.main.g.reduce((s, g) => s + g.h.length, 0)} göz · ${c.r.main.g
        .flatMap((g) => g.f)
        .map((f) => frontNames[f])
        .filter((f, i, a) => a.indexOf(f) === i)
        .join(', ')}`,
    ],
    [
      'Malzeme ve renk',
      `${c.o.malz} · ${c.o.yuzey} · ${palette[c.o.renk].name}${c.o.iki ? ` / ${palette[c.o.renk2].name}` : ''}${c.o.ral ? ` · ${c.o.ral}` : ''}`,
    ],
    [
      'Kulp ve detaylar',
      `${optionName(c.o.kulp)} / ${optionName(c.o.krenk)} · ${baseHeight(c)} cm baza · LED: ${c.o.led.map(optionName).join(', ') || 'Yok'}`,
    ],
  ]
  return (
    <div className="dc-summary">
      {c.k ? <p className="dc-hint">{kitchenDescription(c)}</p> : null}
      {c.wardrobe ? <p className="dc-hint">{wardrobeDetails(c)[0]?.[1]}</p> : null}
      {c.entryway ? <p className="dc-hint">{entrywayDetails(c)[0]?.[1]}</p> : null}
      {c.bathroom ? <p className="dc-hint">{bathroomDetails(c)[0]?.[1]}</p> : null}
      {c.tvUnit ? <p className="dc-hint">{tvDetails(c)[0]?.[1]}</p> : null}
      {rows.map(([label, value], s) => (
        <div key={label}>
          <div>
            <small>{label}</small>
            <p>{value}</p>
          </div>
          <button onClick={() => onStep(s)}>Düzenle</button>
        </div>
      ))}
    </div>
  )
}
export function Configurator({ origin }: { origin?: string }) {
  const router = useRouter()
  const [focus, setFocus] = useState(false)
  const [hint, setHint] = useState(true)
  const [chips, setChips] = useState(true)
  const [sceneReady, setSceneReady] = useState(false)
  const markSceneReady = useCallback(() => setSceneReady(true), [])
  const design = useDesign(),
    c = design.config
  const mobile = useMobileStudio()
  const scenePreferences = useScenePreferences()
  const [roomControls, setRoomControls] = useState(false)
  const roomButton = useRef<HTMLButtonElement>(null)
  const { undo, redo, message, setMessage, edit } = design
  const [step, setStep] = useState(0),
    [selected, setSelected] = useState(0),
    [cell, setCell] = useState(0)
  const [panel, setPanel] = useState(false),
    [view, setView] = useState<'3d' | 'front' | 'drawing'>('3d')
  const [open, setOpen] = useState(false),
    [human, setHuman] = useState(false),
    [dimensions, setDimensions] = useState(false)
  const [interior, setInterior] = useState(false)
  const [kitchenSelection, setKitchenSelection] = useState<KitchenSelection>({ row: 'lower', index: 0 })
  const [bathroomSelection, setBathroomSelection] = useState<BathroomSelection>({ row: 'lower', index: 0 })
  const activeBathroomSelection = normalizeBathroomSelection(c, bathroomSelection)
  const [tvSelection, setTvSelection] = useState<TvSelection>({ row: 'lower', index: 0 })
  const activeTvSelection = normalizeTvSelection(c, tvSelection)
  const [selectionFocus, setSelectionFocus] = useState(false)
  const activeKitchenSelection = c.k ? normalizeKitchenSelection(c, kitchenSelection) : kitchenSelection
  const [zoom, setZoom] = useState(1),
    [reset, setReset] = useState(0),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0)
  const [exporting, setExporting] = useState(false),
    [help, setHelp] = useState(false)
  const [hoverLabel, setHoverLabel] = useState('')
  const [snap, setSnap] = useState<SheetSnap>('closed')
  useEffect(() => {
    const active = document.querySelector<HTMLElement>('.dc-steps button[aria-current="step"]')
    if (active?.getClientRects().length) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }, [step])
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (matchMedia('(max-width: 820px), (min-width: 1600px)').matches) setPanel(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  useEffect(() => {
    // Slot for site-level fixed UI (assistant launcher hides while the mobile sheet is half/full open).
    const root = document.documentElement
    if (mobile && snap !== 'closed') root.dataset.studioSheet = snap
    else delete root.dataset.studioSheet
    return () => {
      delete root.dataset.studioSheet
    }
  }, [mobile, snap])
  useEffect(() => {
    // Publish the studio's fixed bottom chrome height so site-level fixed UI sits above it.
    const nav = document.querySelector<HTMLElement>('.dc-bottom-nav')
    const root = document.documentElement
    if (!nav) return
    const update = () => {
      const top = nav.getBoundingClientRect().top
      root.style.setProperty(
        '--rtm-fixed-base',
        `${Math.max(0, Math.ceil(window.innerHeight - top))}px`,
      )
    }
    update()
    const observer = 'ResizeObserver' in window ? new ResizeObserver(update) : null
    observer?.observe(nav)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
      root.style.removeProperty('--rtm-fixed-base')
    }
  }, [])
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [guide, setGuide] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const optionsButton = useRef<HTMLButtonElement>(null)
  const summaryButton = useRef<HTMLButtonElement>(null)
  const summaryClose = useRef<HTMLButtonElement>(null)
  const workspace = useRef<HTMLDivElement>(null),
    drawing = useRef<HTMLDivElement>(null),
    scrollPanel = useRef<HTMLDivElement>(null)
  const select = useCallback((s: number, i: number) => {
    setSelected(s)
    setCell(i)
    setKitchenSelection({ row: 'lower', index: s })
    setBathroomSelection({ row: 'lower', index: s })
    setTvSelection({ row: 'lower', index: s })
    setAnnouncement(`${s + 1}. bölme, ${i + 1}. göz seçildi.`)
  }, [])
  const applyProduct = (m: Config['m']) => {
    // Personalisation signal (consent-gated): only the product type, never dimensions/content.
    recordInterest({
      k: 'studio',
      s: m,
      l: productNames[m],
      sig: [{ t: 'product', s: m, l: productNames[m] }],
    })
    design.reset(m)
    setSelectionFocus(false)
    select(0, 0)
    setReset((r) => r + 1)
  }
  // ?urun=… (e.g. from the assistant) opens the studio with that product applied. It is an explicit
  // choice and undoable with “Geri al”; the one-shot hint is then removed from the URL so a reload
  // or a shared #c= link keeps the visitor's own design.
  const requestedProduct = useSearchParams().get('urun')
  const applyRequested = useRef(applyProduct)
  useEffect(() => {
    applyRequested.current = applyProduct
  })
  useEffect(() => {
    if (!design.ready || !requestedProduct) return
    const product = products.find((item) => item === requestedProduct)
    if (product && product !== design.config.m) applyRequested.current(product)
    const url = new URL(window.location.href)
    url.searchParams.delete('urun')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    // Run once per requested product, after the saved/shared design has been restored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.ready, requestedProduct])
  useEffect(() => {
    const media = matchMedia('(min-width: 1600px)')
    const frame = requestAnimationFrame(() => {
      setSummaryOpen(
        safeStorage.get('rtm-studio-summary-v1', 'session') === 'open' ||
          (safeStorage.get('rtm-studio-summary-v1', 'session') === null && media.matches),
      )
    })
    const resize = () =>
      setSummaryOpen(
        safeStorage.get('rtm-studio-summary-v1', 'session') === 'open' ||
          (safeStorage.get('rtm-studio-summary-v1', 'session') === null && media.matches),
      )
    media.addEventListener('change', resize)
    return () => {
      cancelAnimationFrame(frame)
      media.removeEventListener('change', resize)
    }
  }, [])
  useEffect(() => {
    if (!summaryOpen || !mobile) return
    const frame = requestAnimationFrame(() => summaryClose.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [summaryOpen, mobile])
  const sceneError = useCallback(() => setFailed(true), [])
  const s = Math.min(selected, c.r.main.w.length - 1),
    i = Math.min(cell, c.r.main.g[s].h.length - 1)
  const go = useCallback((n: number) => {
    setStep(Math.max(0, Math.min(5, n)))
    setRoomControls(false)
    setPanel(true)
    setSnap((value) => (value === 'closed' ? 'half' : value))
    if (matchMedia('(max-width: 1250px)').matches) setSummaryOpen(false)
    scrollPanel.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  const selectFromScene = useCallback(
    (section: number, index: number) => {
      select(section, index)
      go(2)
      if (matchMedia('(max-width: 1250px)').matches) setSummaryOpen(false)
    },
    [select, go],
  )
  const editBoundary = useCallback(
    (index: number, delta: number) =>
      edit((d) => {
        if (d.r.main.lk[index] || d.r.main.lk[index + 1])
          throw new Error('Sınırı taşımak için iki bölmenin kilidini açın.')
        const a = d.r.main.w[index] + delta,
          b = d.r.main.w[index + 1] - delta
        if (a < 30 || b < 30) throw new Error('Bölmeler en az 30 cm olmalı.')
        d.r.main.w[index] = round(a)
        d.r.main.w[index + 1] = round(b)
      }),
    [edit],
  )
  const fullscreen = useCallback(() => {
    const node = document.documentElement
    if (!document.fullscreenEnabled) {
      setMessage('Tam ekran bu tarayıcıda kullanılamıyor.')
      return
    }
    const action = document.fullscreenElement
      ? document.exitFullscreen()
      : node.requestFullscreen?.()
    void action?.catch(() => setMessage('Tam ekran bu tarayıcıda kullanılamıyor.'))
  }, [setMessage])
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) {
        const extras = document.getElementById('studio-scene-extras')
        if (extras && typeof extras.hidePopover === 'function' && extras.matches(':popover-open')) { extras.hidePopover(); return }
        workspace.current
          ?.querySelectorAll<HTMLDetailsElement>('.dc-production-info[open]')
          .forEach((node) => {
            node.open = false
          })
        setFocus(false)
        setHelp(false)
        setSummaryOpen(false)
        if (summaryOpen) {
          safeStorage.set('rtm-studio-summary-v1', 'closed', 'necessary', 'session')
          summaryButton.current?.focus()
          return
        }
        if (matchMedia('(max-width: 820px)').matches) {
          setSnap('closed')
          optionsButton.current?.focus()
        }
        return
      }
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest('input,textarea,select,[contenteditable],dialog') ||
          document.querySelector('dialog[open]'))
      )
        return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(step + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(step - 1)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setPanel((value) => !value)
      } else if (e.key.toLowerCase() === 'f') setFocus((value) => !value)
      else if (e.key === '?') setHelp((v) => !v)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [step, go, undo, redo, fullscreen, summaryOpen])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 6500)
    return () => clearTimeout(timer)
  }, [message, setMessage])
  async function copy() {
    try {
      await navigator.clipboard.writeText(await preferredDesignUrl(c, origin))
      design.setMessage('Bağlantı kopyalandı. Bu bağlantı tasarımınızın bir kopyasını açar.')
    } catch {
      design.setMessage(
        'Panoya erişilemiyor. Tasarım bağlantısı adres çubuğunda; oradan kopyalayabilirsiniz.',
      )
    }
  }
  async function download(type: 'pdf' | 'png') {
    if (exporting) return
    const svg = drawing.current?.querySelector('svg')
    if (!svg) return
    setExporting(true)
    try {
      const exp = await import('@/lib/configurator/export')
      if (type === 'pdf') await exp.exportPdf(c, svg, await preferredDesignUrl(c, origin))
      else
        await exp.exportPng(
          view === 'drawing' || failed ? null : workspace.current?.querySelector('canvas') || null,
          svg,
        )
      design.setMessage(`${type.toUpperCase()} dosyanız hazırlandı.`)
    } catch {
      design.setMessage('Dosya hazırlanamadı. Lütfen tekrar deneyin.')
    } finally {
      setExporting(false)
    }
  }
  function quote() {
    if (!design.ready) return
    design.flushSave()
    router.push(`/tasarim-olustur/teklif#c=${encode(c)}`)
  }
  useEffect(() => {
    document.documentElement.toggleAttribute('data-studio-focus', focus)
    return () => document.documentElement.removeAttribute('data-studio-focus')
  }, [focus])
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setHint(safeStorage.get('rtm-studio-hint-v1', 'session') !== 'seen'),
    )
    return () => cancelAnimationFrame(frame)
  }, [])
  function dismissHint() {
    setHint(false)
    safeStorage.set('rtm-studio-hint-v1', 'seen', 'necessary', 'session')
  }
  const props: PanelProps = {
    config: c,
    edit: design.edit,
    selected: s,
    cell: i,
    onSelect: select,
    onProduct: applyProduct,
    kitchenSelection: activeKitchenSelection,
    onKitchenSelect: setKitchenSelection,
    bathroomSelection: activeBathroomSelection,
    onBathroomSelect: setBathroomSelection,
    tvSelection: activeTvSelection,
    onTvSelect: setTvSelection,
  }
  const closeGuide = useCallback(() => {
    setGuide(false)
    optionsButton.current?.focus()
  }, [])
  return (
    <main className="design-studio dc-expanded" data-step={step + 1} data-focus={focus}>
      {!panel || step !== 0 || focus || (mobile && snap === 'closed') ? <h1 className="dc-sr-only">Tasarım oluştur</h1> : null}
      {focus ? (
        <button className="dc-focus-exit" onClick={() => setFocus(false)}>
          Odak modundan çık · Esc
        </button>
      ) : null}
      <a
        href="#design-options"
        className="dc-skip"
        onClick={(event) => {
          event.preventDefault()
          setPanel(true)
          setSnap('half')
          requestAnimationFrame(() => scrollPanel.current?.focus())
        }}
      >
        Tasarım seçeneklerine geç
      </a>
      <div className="dc-stepbar" role="toolbar" aria-label="Tasarım araçları">
        <button
          ref={optionsButton}
          className="dc-tool dc-options-toggle"
          aria-label="Seçenekler paneli"
          aria-expanded={panel && snap !== 'closed'}
          aria-controls="design-options"
          onClick={() => {
            if (matchMedia('(max-width: 820px)').matches) {
              setPanel(true)
              setSnap(snap === 'closed' ? 'half' : 'closed')
            } else setPanel(!panel)
          }}
        >
          <StudioIcon name="panel" />
        </button>
        <nav aria-label="Tasarım adımları" className="dc-steps">
          {steps.map((label, n) => (
            <button
              key={label}
              aria-label={`${n + 1}. adım: ${label}`}
              aria-current={step === n ? 'step' : undefined}
              onClick={() => go(n)}
            >
              <span>{n < step ? <StudioIcon name="check" /> : String(n + 1).padStart(2, '0')}</span>
              <span className="dc-step-name">{label}</span>
            </button>
          ))}
        </nav>
        <div className="dc-actions">
          <Tool label="Geri al" onClick={design.undo} disabled={!design.canUndo}>
            <StudioIcon name="undo" />
          </Tool>
          <Tool label="İleri al" onClick={design.redo} disabled={!design.canRedo}>
            <StudioIcon name="redo" />
          </Tool>
          <details className="dc-export">
            <summary>{exporting ? 'Hazırlanıyor…' : '↓ Çizimi indir'}</summary>
            <div>
              <button disabled={exporting} onClick={() => void download('pdf')}>
                Teknik çizim · PDF
              </button>
              <button disabled={exporting} onClick={() => void download('png')}>
                Önizleme · PNG
              </button>
            </div>
          </details>
          <button className="dc-copy" onClick={() => void copy()}>
            <StudioIcon name="link" />
            <span>Bağlantıyı kopyala</span>
          </button>
          <button
            ref={summaryButton}
            className="dc-tool dc-summary-toggle"
            aria-label="Özet: Tasarım özeti"
            aria-expanded={summaryOpen}
            aria-controls="design-summary"
            onClick={() => {
              setSummaryOpen(!summaryOpen)
              safeStorage.set(
                'rtm-studio-summary-v1',
                summaryOpen ? 'closed' : 'open',
                'necessary',
                'session',
              )
            }}
          >
            <StudioIcon name="layers" />
            <span>Özet</span>
          </button>
          <details className="dc-more dc-export">
            <summary aria-label="Diğer tasarım araçları">⋯</summary>
            <div>
              <button onClick={undo} disabled={!design.canUndo}>
                Geri al
              </button>
              <button onClick={redo} disabled={!design.canRedo}>
                İleri al
              </button>
              <button onClick={() => void download('png')}>Çizimi indir · PNG</button>
              <button onClick={() => void download('pdf')}>Çizimi indir · PDF</button>
              <button onClick={() => void copy()}>Bağlantıyı kopyala</button>
              <button onClick={() => go(3)}>Malzemeler</button>
            </div>
          </details>
          <button className="dc-primary dc-quote-action" onClick={quote} disabled={!design.ready}>
            Teklif isteyin ↗
          </button>
        </div>
      </div>
      <div
        className={`dc-workspace ${panel ? '' : 'dc-panel-hidden'} ${summaryOpen ? 'dc-summary-open' : ''}`}
        data-snap={snap}
        ref={workspace}
      >
        <aside className="dc-panel" id="design-options" aria-label="Tasarım seçenekleri">
          <nav className="dc-panel-rail" aria-label="Seçenek panelini aç">
            {steps.map((label, index) => (
              <button
                key={label}
                title={label}
                aria-label={`${label} seçeneklerini aç`}
                aria-current={step === index ? 'step' : undefined}
                onClick={() => go(index)}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </nav>
          <MobileSheetHandle snap={snap} onSnap={setSnap} />
          <div
            className="dc-panel-scroll"
            id="design-options-content"
            tabIndex={-1}
            ref={scrollPanel}
            inert={mobile && snap === 'closed'}
          >
            {roomControls ? (
              <>
                <SceneControls {...scenePreferences} />
                <button
                  type="button"
                  className="dc-room-reset"
                  onClick={() => {
                    setRoomControls(false)
                    roomButton.current?.focus()
                  }}
                >
                  Tasarım seçeneklerine dön
                </button>
              </>
            ) : null}
            <div className="dc-panel-intro" hidden={step !== 0}>
              <p className="dc-eyebrow">
                <span />
                SİZİN MEKÂNINIZ, SİZİN TASARIMINIZ
              </p>
              <h1>
                {introductions[step][0]} <em>{introductions[step][1]}</em>
              </h1>
              <p>
                {step === 0
                  ? 'Ölçüleri belirleyin, bölmeleri düzenleyin, size ait bir tasarım oluşturun. Her detay, tam düşündüğünüz gibi.'
                  : 'Seçimlerinizi canlı önizlemede inceleyin. Tasarımınız her adımda sizinle birlikte şekillenir.'}
              </p>
            </div>
            {design.resumed ? (
              <div className="dc-resumed">
                Kaldığınız tasarımdan devam ediyorsunuz.{' '}
                <button
                  onClick={() => {
                    design.reset()
                    select(0, 0)
                    go(0)
                  }}
                >
                  Baştan başla ↗
                </button>
              </div>
            ) : null}
            <div className="dc-panel-content" key={step}>
              {step === 0 ? (
                <ProductPanel {...props} />
              ) : step === 1 ? (
                <SectionsPanel {...props} />
              ) : step === 2 ? (
                <InteriorPanel {...props} />
              ) : step === 3 ? (
                <FinishPanel {...props} />
              ) : step === 4 ? (
                <DetailsPanel {...props} />
              ) : (
                <>
                  <div className="dc-summary-preview">
                    <TechnicalDrawing config={c} />
                  </div>
                  <Summary config={c} onStep={go} />
                  <p className="dc-hint">
                    Bu bir ön tasarımdır. Üretim öncesinde ölçü, donanım ve uygulanabilirlik
                    birlikte doğrulanır.
                  </p>
                  <button className="dc-primary" onClick={quote}>
                    Teklif isteyin ↗
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>
        <section
          className="dc-stage"
          aria-label="Canlı tasarım önizlemesi"
          inert={!focus && mobile && snap === 'full'}
        >
          <div className="dc-stage-toolbar">
            <div className="dc-view-tabs" role="group" aria-label="Görünüm">
              {(
                [
                  { v: '3d', label: 'Üç boyutlu' },
                  { v: 'front', label: 'Önden' },
                  { v: 'drawing', label: 'Teknik çizim' },
                ] as const
              ).map(({ v, label }) => (
                <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                  {label}
                </button>
              ))}
            </div>
            <button
              className="dc-human"
              aria-label="İnsan ölçeği"
              disabled={!sceneReady && view !== 'drawing'}
              aria-pressed={human}
              onClick={() => setHuman(!human)}
            >
              <StudioIcon name="human" />
              <span>İnsan ölçeği</span>
            </button>
            <button type="button" className="dc-tool dc-scene-menu-trigger" aria-label="Diğer sahne araçları" title="Diğer sahne araçları" popoverTarget="studio-scene-extras">⋯</button>
            <button
              ref={roomButton}
              className="dc-human"
              aria-expanded={roomControls}
              aria-controls="design-options-content"
              onClick={() => {
                setRoomControls(!roomControls)
                setPanel(true)
                setSnap('half')
                requestAnimationFrame(() => {
                  scrollPanel.current?.scrollTo({ top: 0 })
                  scrollPanel.current?.focus()
                })
              }}
            >
              Mekân
            </button>
            <button
              className="dc-human"
              aria-pressed={scenePreferences.preferences.props}
              onClick={() =>
                scenePreferences.update({ props: !scenePreferences.preferences.props })
              }
            >
              Eşyaları göster
            </button>
            <div className="dc-view-tools">
              <Tool label={open ? 'Tüm kapakları kapat' : 'Tüm kapakları aç'} showLabel pressed={open} onClick={() => setOpen(!open)}>
                <StudioIcon name="door" />
              </Tool>
              <Tool
                label="İç düzeni göster"
                pressed={interior}
                onClick={() => setInterior(!interior)}
              >
                <StudioIcon name="layers" />
              </Tool>
              <Tool label="Uzaklaş" onClick={() => setZoom((v) => Math.max(0.45, v - 0.15))}>
                <StudioIcon name="minus" />
              </Tool>
              <Tool label="Yaklaş" onClick={() => setZoom((v) => Math.min(2.5, v + 0.15))}>
                <StudioIcon name="plus" />
              </Tool>
              <Tool
                label="Sığdır"
                onClick={() => {
                  setSelectionFocus(false)
                  setZoom(1)
                  setReset((v) => v + 1)
                }}
              >
                <StudioIcon name="fit" />
              </Tool>
              <Tool
                label="Kamerayı sıfırla"
                secondary
                onClick={() => {
                  setSelectionFocus(false)
                  setZoom(1)
                  setReset((v) => v + 1)
                }}
              >
                <StudioIcon name="reset" />
              </Tool>
              <Tool
                label="Ölçüleri göster"
                pressed={dimensions}
                onClick={() => setDimensions(!dimensions)}
              >
                <StudioIcon name="measure" />
              </Tool>
              <Tool
                label="Bilgi kartlarını göster / gizle"
                secondary
                pressed={chips}
                onClick={() => setChips(!chips)}
              >
                <StudioIcon name="layers" />
              </Tool>
              <Tool label="Odak modu" pressed={focus} onClick={() => setFocus(!focus)}>
                <StudioIcon name="fit" />
              </Tool>
              <Tool label="Tam ekran" onClick={fullscreen}>
                <StudioIcon name="fullscreen" />
              </Tool>
            </div>
          </div>
          <div id="studio-scene-extras" className="dc-scene-popover" popover="auto" role="group" aria-label="Ek sahne araçları">
            <button type="button" disabled={!sceneReady} popoverTarget="studio-scene-extras" popoverTargetAction="hide" onClick={() => { setZoom(1); setReset((value) => value + 1) }}>Kamerayı sıfırla</button>
            <button type="button" popoverTarget="studio-scene-extras" popoverTargetAction="hide" aria-pressed={chips} onClick={() => setChips(!chips)}>Bilgi kartlarını göster / gizle</button>
          </div>
          <p className="dc-props-note">Eşyalar ölçek fikri vermek için temsilîdir.</p>
          <div
            className="dc-viewport"
            onPointerDown={dismissHint}
            onWheel={dismissHint}
            data-chips={chips}
          >
            <div
              className="dc-scene"
              style={{ visibility: view === 'drawing' ? 'hidden' : 'visible' }}
            >
              <SceneBoundary
                key={retry}
                fallback={
                  <div className="dc-webgl-fallback">
                    <p>3B önizleme bu cihazda başlatılamadı.</p>
                    <button onClick={() => setView('drawing')}>Teknik çizime geç →</button>
                    <button
                      onClick={() => {
                        setFailed(false)
                        setRetry((r) => r + 1)
                      }}
                    >
                      Tekrar dene
                    </button>
                  </div>
                }
              >
                {!failed ? (
                  <Scene
                    config={c}
                    preferences={scenePreferences.preferences}
                    selected={s}
                    cell={i}
                    onSelect={selectFromScene}
                    kitchenSelection={activeKitchenSelection}
                    kitchenFocus={selectionFocus}
                    wardrobeFocus={selectionFocus}
                    entrywayFocus={selectionFocus}
                    bathroomFocus={selectionFocus}
                    tvFocus={selectionFocus}
                    tvSelection={activeTvSelection}
                    onTvSelect={(selection) => { setTvSelection(selection); go(2) }}
                    bathroomSelection={activeBathroomSelection}
                    onBathroomSelect={(selection) => { setBathroomSelection(selection); go(2) }}
                    onKitchenSelect={(selection) => { setKitchenSelection(selection); go(2) }}
                    open={open || interior}
                    human={human}
                    front={view === 'front'}
                    zoom={zoom}
                    reset={reset}
                    dimensions={dimensions}
                    onBoundary={editBoundary}
                    onError={sceneError}
                    onHover={setHoverLabel}
                    onReady={markSceneReady}
                  />
                ) : (
                  <div className="dc-webgl-fallback">
                    <p>3B bağlantısı kesildi. Teknik çizim kullanılabilir.</p>
                    <button onClick={() => setView('drawing')}>Teknik çizime geç</button>
                    <button
                      onClick={() => {
                        setFailed(false)
                        setRetry((r) => r + 1)
                      }}
                    >
                      Tekrar dene
                    </button>
                  </div>
                )}
              </SceneBoundary>
            </div>
            <div
              ref={drawing}
              className={`dc-technical ${view === 'drawing' ? 'visible' : ''}`}
              aria-hidden={view !== 'drawing'}
            >
              <TechnicalDrawing
                human={human}
                config={c}
                selected={s}
                cell={i}
                kitchenSelection={activeKitchenSelection}
                tvSelection={activeTvSelection}
                onTvSelect={view === 'drawing' ? (selection) => { setTvSelection(selection); go(2) } : undefined}
                bathroomSelection={activeBathroomSelection}
                onBathroomSelect={view === 'drawing' ? (selection) => { setBathroomSelection(selection); go(2) } : undefined}
                onKitchenSelect={view === 'drawing' ? (selection) => { setKitchenSelection(selection); go(2) } : undefined}
                onSelect={
                  view === 'drawing'
                    ? (s, i) => {
                        select(s, i)
                        go(2)
                      }
                    : undefined
                }
              />
            </div>
            {view !== 'drawing' ? (
              <>
                <div className="dc-scene-label">
                  <span className="dc-eyebrow">CANLI ÖNİZLEME</span>
                  <p>
                    {productNames[c.m]}
                    <span> / {palette[c.o.renk].name}</span>
                  </p>
                </div>
                <div className="dc-scene-note" hidden={!hint && !hoverLabel}>
                  {hoverLabel || 'Döndürmek için sürükleyin · Yakınlaşmak için kaydırın'}
                </div>
                {dimensions ? (
                  <div className="dc-dimensions">
                    {c.d.w} G × {c.d.h} Y × {c.d.d} D <span>cm</span>
                    <small>
                      {s + 1}. bölme / {i + 1}. göz · {round(c.r.main.w[s])} ×{' '}
                      {round(c.r.main.g[s].h[i])} cm · {frontNames[c.r.main.g[s].f[i]]}
                    </small>
                  </div>
                ) : null}
              </>
            ) : null}
            <div className="dc-material-tag">
              <MaterialSwatch color={c.o.renk} glossy={c.o.yuzey === 'Parlak'} />
              <span>
                {c.o.malz}
                <small>
                  {c.o.yuzey} / {palette[c.o.renk].name}
                </small>
              </span>
            </div>
            {c.k && view !== 'drawing' ? <KitchenSelectionDock config={c} selection={activeKitchenSelection} onSelect={setKitchenSelection} focused={selectionFocus} onFocus={() => setSelectionFocus((value) => !value)} /> : null}
            {c.tvUnit && view !== 'drawing' ? <TvSelectionDock config={c} selection={activeTvSelection} onSelect={setTvSelection} focused={selectionFocus} onFocus={() => setSelectionFocus((value) => !value)} /> : null}
            {c.bathroom && view !== 'drawing' ? <BathroomSelectionDock config={c} selection={activeBathroomSelection} onSelect={setBathroomSelection} focused={selectionFocus} onFocus={() => setSelectionFocus((value) => !value)} /> : null}
            {c.entryway && view !== 'drawing' ? <EntrywaySelectionDock config={c} selected={s} onSelect={select} focused={selectionFocus} onFocus={() => setSelectionFocus((value) => !value)} /> : null}
            {c.wardrobe && view !== 'drawing' ? <WardrobeSelectionDock config={c} selected={s} onSelect={select} focused={selectionFocus} onFocus={() => setSelectionFocus((value) => !value)} /> : null}
          </div>
          <footer className="dc-stage-footer">
            <span>
              <i />
              {design.ready ? 'Tasarım tarayıcınızda saklanır' : 'Tasarım yükleniyor…'}
            </span>
            <span>
              {c.d.w} × {c.d.h} × {c.d.d} cm
            </span>
            <button onClick={() => setGuide(true)}>Rehber</button>
            <button onClick={() => setHelp(!help)} aria-expanded={help}>
              ? <span>Kısayollar</span>
            </button>
            <details className="dc-production-info">
              <summary
                aria-label="Bu araç üretim/CNC çizimi değildir."
                title="Bu araç üretim/CNC çizimi değildir."
              >
                ⓘ
              </summary>
              <p>Bu araç üretim/CNC çizimi değildir.</p>
            </details>
          </footer>
        </section>
        <aside
          id="design-summary"
          className="dc-summary-sidebar"
          aria-label="Tasarım özeti"
          hidden={!summaryOpen}
        >
          <div className="dc-summary-heading">
            <span>Tasarım özeti</span>
            <button
              ref={summaryClose}
              aria-label="Özeti kapat"
              onClick={() => {
                setSummaryOpen(false)
                safeStorage.set('rtm-studio-summary-v1', 'closed', 'necessary', 'session')
                summaryButton.current?.focus()
              }}
            >
              <StudioIcon name="close" />
            </button>
          </div>
          <DesignSummary config={c} selected={s} cell={i} onStep={go} onSelect={selectFromScene} tvSelection={activeTvSelection} onTvSelect={(selection) => { setTvSelection(selection); go(2) }} bathroomSelection={activeBathroomSelection} onBathroomSelect={(selection) => { setBathroomSelection(selection); go(2) }} kitchenSelection={activeKitchenSelection} onKitchenSelect={(selection) => { setKitchenSelection(selection); go(2) }} />
        </aside>
      </div>
      <footer className="dc-bottom-nav">
        <button disabled={step === 0} onClick={() => go(step - 1)}>
          <StudioIcon name="back" />
          <span>Önceki adım</span>
        </button>
        <div>
          <strong>Adım {step + 1}/6</strong>
          <span> · {steps[step]}</span>
        </div>
        {step < 5 ? (
          <button className="dc-primary" onClick={() => go(step + 1)}>
            Sonraki adım
            <StudioIcon name="arrow" />
          </button>
        ) : (
          <button className="dc-primary" onClick={quote}>
            Teklif isteyin
            <StudioIcon name="arrow" />
          </button>
        )}
      </footer>
      <StudioGuide requested={guide} onClose={closeGuide} />
      <p className="dc-sr-only" role="status" aria-live="polite">
        {c.bathroom ? `${activeBathroomSelection.row === 'upper' ? 'Üst' : 'Alt'} dolap ${activeBathroomSelection.index + 1}. bölme seçildi.` : announcement} Ölçüler: {c.d.w} × {c.d.h} × {c.d.d} cm. {c.bathroom ? '' : `${frontNames[c.r.main.g[s].f[i]]}, `}
        {c.tvUnit ? tvKindNames[tvGeometry(c)[activeTvSelection.row][activeTvSelection.index].kind] : c.bathroom ? bathroomKindNames[bathroomGeometry(c)[activeBathroomSelection.row][activeBathroomSelection.index].kind] : c.entryway ? entrywayLayoutNames[c.entryway.layouts[s]] : c.wardrobe ? wardrobeLayoutNames[c.wardrobe.layouts[s]] : interiorNames[c.r.main.g[s].ic[i]]}. {c.o.malz}, {c.o.yuzey}, {palette[c.o.renk].name}.
      </p>
      {help ? (
        <div className="dc-help" role="region" aria-label="Klavye kısayolları">
          <button onClick={() => setHelp(false)} aria-label="Kısayolları kapat">
            ×
          </button>
          <p>Ctrl / ⌘ + Z · Geri al</p>
          <p>Ctrl / ⌘ + Y · İleri al</p>
          <p>← / → · Adımlar</p>
          <p>F · Odak modu</p>
          <p>Ctrl / ⌘ + B · Seçenekler paneli</p>
          <p>? · Kısayollar</p>
        </div>
      ) : null}
      <div
        className={`dc-toast ${design.message ? 'visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {design.message}
        {design.message.toLocaleLowerCase('tr-TR').includes('kilit') ? (
          <button onClick={() => go(design.message.includes('bölme') ? 1 : 2)}>
            Kilitleri incele
            <StudioIcon name="arrow" />
          </button>
        ) : null}
      </div>
    </main>
  )
}
