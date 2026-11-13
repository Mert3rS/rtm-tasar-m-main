'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { ExternalLink, Monitor, Pencil, RefreshCw, Smartphone, Tablet, X } from 'lucide-react'
import { useConfig } from '@payloadcms/ui'
import { HOMEPAGE_SECTIONS } from '@/lib/homepageContent'
import { isPreviewPath, VISUAL_PAGES, visualEditorPath } from './visual-pages'
import { HeroPhotoMap } from './HeroPhotoMap'
import { type HeroPhoto } from '@/lib/homepageHero'
import { type PhotoSection } from '@/lib/photoPlacements'
import { PhotoManager } from './PhotoManager'
import { isNativeEditorField } from './nativeEditorFocus'

import type { HeroVariant } from '@/lib/heroSequence'

type VisualPage = (typeof VISUAL_PAGES)[number]
type Editor = { target: string; label: string; field?: string }

export function VisualStudio({
  guide,
  heroPhotos,
  heroVariant,
  photoSections,
  readiness,
}: {
  guide: ReactNode
  heroPhotos: HeroPhoto[]
  heroVariant: HeroVariant
  photoSections: PhotoSection[]
  readiness: ReactNode
}) {
  const search = useSearchParams()
  const page = VISUAL_PAGES.find(({ id }) => id === search.get('page')) || VISUAL_PAGES[0]
  return (
    <PageStudio
      key={page.id}
      page={page}
      guide={guide}
      heroPhotos={heroPhotos}
      heroVariant={heroVariant}
      photoSections={photoSections}
      readiness={readiness}
    />
  )
}

function PageStudio({
  page,
  guide,
  heroPhotos,
  heroVariant,
  photoSections,
  readiness,
}: {
  page: VisualPage
  guide: ReactNode
  heroPhotos: HeroPhoto[]
  heroVariant: HeroVariant
  photoSections: PhotoSection[]
  readiness: ReactNode
}) {
  const router = useRouter()
  const { config } = useConfig()
  const [route, setRoute] = useState<string>(page.path)
  const [revision, setRevision] = useState(0)
  const [deviceChoice, setDevice] = useState<number | null>(null)
  const [editing, setEditing] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [notice, setNotice] = useState('')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [nativeVisible, setNativeVisible] = useState(false)
  const [nativeProcessing, setNativeProcessing] = useState(false)
  const [available, setAvailable] = useState(1000)
  const device = deviceChoice ?? (available < 600 ? 390 : 1440)
  const preview = useRef<HTMLIFrameElement>(null)
  const editorFrame = useRef<HTMLIFrameElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const disposePreview = useRef<(() => void) | null>(null)
  const modified = useRef(false)
  const processing = useRef(false)
  const wasModified = useRef(false)
  const opener = useRef<HTMLElement | null>(null)
  const scrollPosition = useRef(0)
  const scale = Math.min(1, available / device)
  const frameHeight = device === 390 ? 844 : 900
  const refresh = () => {
    scrollPosition.current = preview.current?.contentWindow?.scrollY || 0
    setLoaded(false)
    setRevision((value) => value + 1)
  }

  useEffect(() => {
    const element = stage.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setAvailable(Math.max(1, entry.contentRect.width)),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(
    () => () => {
      disposePreview.current?.()
    },
    [],
  )

  useEffect(() => {
    if (!editor) return
    modified.current = false
    processing.current = false
    wasModified.current = false
    if (!opener.current)
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // Mount after the sheet is visible so Payload observes the actual form viewport.
    const mountFrame = requestAnimationFrame(() => setNativeVisible(true))
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== editorFrame.current?.contentWindow
      )
        return
      const data: unknown = event.data
      if (
        !data ||
        typeof data !== 'object' ||
        !('type' in data) ||
        data.type !== 'rtm-native-form' ||
        !('modified' in data) ||
        typeof data.modified !== 'boolean' ||
        !('processing' in data) ||
        typeof data.processing !== 'boolean'
      )
        return
      modified.current = data.modified
      processing.current = data.processing
      setNativeProcessing(data.processing)
      if (wasModified.current && !data.modified && !data.processing) {
        setNotice(
          'Kayıt güncellendi. Önizleme yayınlanmış içeriği gösterir; taslağı görmek için önce yayınlayın.',
        )
        scrollPosition.current = preview.current?.contentWindow?.scrollY || 0
        setRevision((value) => value + 1)
      }
      wasModified.current = data.modified || (wasModified.current && data.processing)
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (modified.current || processing.current) event.preventDefault()
    }
    window.addEventListener('message', receive)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      cancelAnimationFrame(mountFrame)
      window.removeEventListener('message', receive)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [editor])

  function closeEditor() {
    if (processing.current) {
      setNotice('Kaydetme işlemi tamamlanınca düzenleyiciyi kapatabilirsiniz.')
      return
    }
    if (
      modified.current &&
      !window.confirm(
        'Kaydedilmemiş değişiklikler var. Değişiklikleri bırakıp düzenleyiciyi kapatmak istiyor musunuz?',
      )
    )
      return
    setEditor(null)
    setNativeVisible(false)
    refresh()
    router.refresh()
  }

  function connectPreview() {
    disposePreview.current?.()
    const frame = preview.current
    const doc = frame?.contentDocument
    if (!doc) return
    setLoaded(true)
    frame.contentWindow?.scrollTo(0, scrollPosition.current)
    const style = doc.createElement('style')
    style.textContent = `html[data-rtm-edit-mode="true"] [data-rtm-edit]:hover {outline:2px dashed #3976a8!important;outline-offset:3px;cursor:crosshair!important} html[data-rtm-edit-mode="true"] [data-rtm-edit]:focus-visible {outline:3px solid #3976a8!important} `
    doc.head.appendChild(style)
    doc.documentElement.setAttribute('data-rtm-edit-mode', String(editing))
    // Hydrated regions subscribe to changes; late/streamed regions read the current mode
    // after their own hydration, without the parent mutating React-owned attributes.
    const notifyEditing = () => {
      const event = doc.createEvent('Event')
      event.initEvent('rtm-preview-editing', false, false)
      doc.dispatchEvent(event)
    }
    notifyEditing()
    const click = (event: MouseEvent) => {
      const view = doc.defaultView
      const element = view && event.target instanceof view.Element ? event.target : null
      if (!element) return
      const editable = element.closest<HTMLElement>('[data-rtm-edit]')
      if (editing && editable) {
        event.preventDefault()
        event.stopImmediatePropagation()
        const target = editable.dataset.rtmEdit
        if (target && visualEditorPath(target)) {
          opener.current = preview.current
          setEditor({
            target,
            label: editable.dataset.rtmLabel || 'Seçilen içerik',
            field: editable.dataset.rtmField,
          })
        }
        return
      }
      const link = element.closest('a')
      if (!link?.href) return
      event.preventDefault()
      event.stopImmediatePropagation()
      const next = new URL(link.href, window.location.origin)
      if (next.origin === window.location.origin && isPreviewPath(next.pathname)) {
        if (next.pathname + next.search === route && next.hash) {
          doc.getElementById(decodeURIComponent(next.hash.slice(1)))?.scrollIntoView()
        } else {
          scrollPosition.current = 0
          setLoaded(false)
          setRoute(next.pathname + next.search + next.hash)
        }
      } else setNotice('Bu bağlantıyı ziyaret etmek için “Sitede aç” düğmesini kullanın.')
    }
    const submit = (event: Event) => {
      event.preventDefault()
      event.stopImmediatePropagation()
      setNotice('Önizlemede form gönderimi kapalıdır. Formu denemek için sayfayı sitede açın.')
    }
    doc.addEventListener('click', click, true)
    doc.addEventListener('submit', submit, true)
    const keydown = (event: KeyboardEvent) => {
      const view = doc.defaultView
      if (
        !editing ||
        !view ||
        !(event.target instanceof view.HTMLElement) ||
        !event.target.matches('[data-rtm-edit][tabindex="0"]') ||
        event.target.matches('a,button,input,textarea,select')
      )
        return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.target.click()
      }
    }
    doc.addEventListener('keydown', keydown, true)
    disposePreview.current = () => {
      doc.removeEventListener('click', click, true)
      doc.removeEventListener('submit', submit, true)
      doc.removeEventListener('keydown', keydown, true)
      doc.documentElement.removeAttribute('data-rtm-edit-mode')
      notifyEditing()
      style.remove()
    }
  }

  // Rebind editing handlers without reloading the site or its 3D viewers.
  useEffect(() => {
    if (preview.current?.contentDocument?.readyState === 'complete') connectPreview()
    // The listeners capture these two values; all other state is read through refs/setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, route])

  const editorPath = editor ? visualEditorPath(editor.target) : null
  const previewURL = new URL(route, 'http://rtm-preview.invalid')
  previewURL.searchParams.set('rtmPreview', String(revision))
  return (
    <section
      className="rtm-visual-studio"
      aria-labelledby="content-page-heading"
      onClickCapture={(event) => {
        if (editor || !(event.target instanceof Element)) return
        const trigger = event.target.closest<HTMLElement>('button,a,[tabindex]')
        if (trigger) opener.current = trigger
      }}
    >
      {readiness}
      <header className="rtm-visual-heading">
        <div>
          <p className="rtm-visual-eyebrow">RTM TASARIM / GÖRSEL İÇERİK STÜDYOSU</p>
          <h1 id="content-page-heading">Sitenizin her detayı, elinizin altında.</h1>
          <p>Soldan sayfanızı seçin. Fotoğraf veya metne dokunarak düzenleyin.</p>
        </div>
        <a className="rtm-visual-button" href={route} target="_blank" rel="noopener noreferrer">
          Sitede aç <ExternalLink size={16} />
        </a>
      </header>
      <div className="rtm-visual-toolbar">
        <div>
          <strong>{page.title}</strong>
          <span className="rtm-visual-address">{route}</span>
        </div>
        <div className="rtm-visual-devices" role="group" aria-label="Önizleme ekran boyutu">
          {[
            { width: 1440, label: 'Masaüstü', Icon: Monitor },
            { width: 768, label: 'Tablet', Icon: Tablet },
            { width: 390, label: 'Telefon', Icon: Smartphone },
          ].map(({ width, label, Icon }) => (
            <button
              type="button"
              key={width}
              aria-pressed={device === width}
              onClick={() => setDevice(width)}
              title={`${label} · ${width}px`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="rtm-visual-tools">
          <button
            className="rtm-visual-button"
            type="button"
            aria-pressed={editing}
            onClick={() => setEditing(!editing)}
          >
            <Pencil size={15} />
            {editing ? 'Düzenleme açık' : 'Gezinme açık'}
          </button>
          <button
            className="rtm-visual-button"
            type="button"
            onClick={refresh}
            aria-label="Önizlemeyi yenile"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      <p className="rtm-visual-status" role="status">
        {notice ||
          'Canlı sayfa · Yayınlanmış içerik gösterilir. Metin ve görselleri düzenlemek için üzerine tıklayın.'}
      </p>
      {page.id === 'home' ? (
        <HeroPhotoMap
          variant={heroVariant}
          photos={heroPhotos}
          onSelect={(position) =>
            setEditor({
              target: 'site-settings',
              label: 'Yedek açılış görseli',
              field: `heroImages__${position}`,
            })
          }
        />
      ) : null}
      <PhotoManager
        key={route}
        page={
          VISUAL_PAGES.find(
            ({ path }) => path !== '/' && (route === path || route.startsWith(`${path}/`)),
          )?.id || page.id
        }
        sections={photoSections.filter(
          (section) =>
            section.page ===
            (VISUAL_PAGES.find(
              ({ path }) => path !== '/' && (route === path || route.startsWith(`${path}/`)),
            )?.id || page.id),
        )}
        onEdit={(target, label, field) => setEditor({ target, label, field })}
      />
      <div className="rtm-visual-workspace">
        <div className="rtm-visual-stage" ref={stage}>
          {!loaded ? (
            <p className="rtm-visual-loading" role="status">
              Sayfa yükleniyor…
            </p>
          ) : null}
          <div
            className="rtm-visual-frame"
            style={{ width: device * scale, height: frameHeight * scale }}
          >
            <iframe
              ref={preview}
              title={`${page.title} gerçek site önizlemesi`}
              src={`${previewURL.pathname}${previewURL.search}${previewURL.hash}`}
              onLoad={connectPreview}
              sandbox="allow-same-origin allow-scripts allow-forms allow-modals allow-downloads"
              style={{ width: device, height: frameHeight, transform: `scale(${scale})` }}
            />
          </div>
        </div>
        <aside
          className="rtm-visual-inspector"
          aria-label="Sayfanın düzenlenebilir alanları"
          style={{ maxHeight: frameHeight * scale }}
        >
          <p className="rtm-visual-eyebrow">{page.title}</p>
          <h2>İçeriği düzenle</h2>
          <p>{page.hint}</p>
          {page.editor ? (
            <button
              type="button"
              className="rtm-visual-edit-primary"
              onClick={() =>
                setEditor({
                  target: page.editor,
                  label: page.title,
                  field:
                    page.id === 'home'
                      ? 'homepage__heroHeading'
                      : page.id === 'contact'
                        ? 'contactEmail'
                        : page.id === 'cookies'
                          ? 'cookiePolicyVersion'
                          : undefined,
                })
              }
            >
              <Pencil size={16} />
              Sayfa içeriğini aç
            </button>
          ) : (
            <p className="rtm-visual-note">
              Bu sayfanın uygulama arayüzü CMS alanı içermez. İletişim ve footer bilgilerini
              aşağıdan düzenleyebilirsiniz.
            </p>
          )}
          {page.id === 'home' ? (
            <>
              <h3>Ana sayfa bölümleri</h3>
              {HOMEPAGE_SECTIONS.map((section) => (
                <button
                  type="button"
                  className="rtm-visual-field"
                  key={section.label}
                  onClick={() =>
                    setEditor({
                      target: 'site-settings',
                      label: section.label,
                      field: `homepage__${section.fields[0].name}`,
                    })
                  }
                >
                  {section.label}
                  <Pencil size={14} />
                </button>
              ))}
              <button
                type="button"
                className="rtm-visual-field"
                onClick={() =>
                  setEditor({
                    target: 'site-settings',
                    label: 'Yedek açılış görseli',
                    field: 'heroImages__center',
                  })
                }
              >
                Yedek açılış görseli
                <Pencil size={14} />
              </button>
              <p className="rtm-visual-note">
                Açılış animasyonu sabit kare dizisini kullanır. Buradaki fotoğraf yalnızca
                poster de yüklenemezse görünür; Kaydet ile yedek seçim uygulanır.
              </p>
            </>
          ) : null}
          <h3>Ortak alanlar</h3>
          <button
            type="button"
            className="rtm-visual-field"
            onClick={() =>
              setEditor({
                target: 'site-settings',
                label: 'Menü, footer ve sayfa başlıkları',
                field: 'siteCopy__navHome',
              })
            }
          >
            Menü ve sayfa metinleri
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="rtm-visual-field"
            onClick={() =>
              setEditor({
                target: 'site-settings',
                label: 'Footer ve iletişim',
                field: 'companyDescription',
              })
            }
          >
            Footer ve Instagram
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="rtm-visual-field"
            onClick={() => setEditor({ target: 'assistant-settings', label: 'Site asistanı' })}
          >
            Site asistanı
            <Pencil size={14} />
          </button>
          <p className="rtm-visual-note">
            Taslaklı içerikler “Yayınla” ile görünür. Site ayarlarında “Kaydet” değişikliği doğrudan
            siteye yansıtır. Menü, footer, arşiv başlıkları, iletişim çağrıları ve 404 metinleri Site
            ayarları içinden yönetilir.
          </p>
        </aside>
      </div>
      <details className="rtm-visual-guide">
        <summary>Fotoğraf yerleri ve içerik rehberi</summary>
        {guide}
      </details>
      <Dialog.Root
        open={Boolean(editor)}
        onOpenChange={(open) => {
          if (!open) closeEditor()
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="rtm-visual-overlay" />
          <Dialog.Content
            className="rtm-visual-editor"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              opener.current?.focus()
              opener.current = null
            }}
          >
            <header>
              <div>
                <p className="rtm-visual-eyebrow">İÇERİĞİ DÜZENLE</p>
                <Dialog.Title asChild>
                  <h2>{editor?.label}</h2>
                </Dialog.Title>
              </div>
              <button
                type="button"
                className="rtm-visual-button"
                onClick={closeEditor}
                disabled={nativeProcessing}
                aria-label="Düzenleyiciyi kapat"
              >
                <X size={20} />
              </button>
            </header>
            <Dialog.Description className="rtm-visual-editor-help">
              Aşağıdaki formdan kaydedin veya yayınlayın. Kapatınca önizleme yenilenir.
            </Dialog.Description>
            {editorPath && nativeVisible ? (
              <iframe
                key={`${editor?.target}:${editor?.field || ''}`}
                ref={editorFrame}
                data-rtm-native-editor="true"
                data-rtm-editor-field={
                  editor?.field && isNativeEditorField(editor.target.split(':')[0], editor.field)
                    ? editor.field
                    : undefined
                }
                title="İçerik düzenleme formu"
                src={`${config.routes.admin}${editorPath}`}
                onLoad={() => {
                  const doc = editorFrame.current?.contentDocument
                  if (!doc) return
                  const style = doc.createElement('style')
                  style.textContent =
                    '.rtm-sidebar-provider,.rtm-admin-sidebar,.rtm-admin-mobile-trigger,.rtm-admin-theme-toggle{display:none!important}.template-default{grid-template-columns:minmax(0,1fr)!important}.template-default__wrap{min-width:0!important;margin:0!important}.collection-edit,.global-edit{--gutter-h:24px}'
                  doc.head.appendChild(style)
                }}
              />
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
