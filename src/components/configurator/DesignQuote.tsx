'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { InquiryForm } from '@/components/contact/InquiryForm'
import { TechnicalDrawing } from './TechnicalDrawing'
import { MaterialSwatch } from './MaterialSwatch'
import {
  configSchema,
  decode,
  encode,
  palette,
  productNames,
  type Config,
} from '@/lib/configurator/config'
import { safeStorage } from '@/lib/consent/storage'
import { designDetails, designMessage } from '@/lib/configurator/summary'
import { preferredDesignUrl } from '@/lib/configurator/shareClient'
import { kitchenDescription } from '@/lib/configurator/kitchen'
import { tvDetails } from '@/lib/configurator/tv'
import { bathroomDetails } from '@/lib/configurator/bathroom'
import { entrywayDetails } from '@/lib/configurator/entryway'
import { wardrobeDetails } from '@/lib/configurator/wardrobe'
import type { PublicSiteSettings } from '@/lib/siteSettings'

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.7a8.5 8.5 0 1 1 16.3-3.8Z" />
      <path d="M8 7.5c-.8 1.2.1 3.6 2 5.5s4.3 2.8 5.5 2l1-1.5-2.5-1.2-1 1c-1.4-.6-2.2-1.4-2.8-2.8l1-1L10 7Z" />
    </svg>
  )
}

export function DesignQuote({
  settings,
  origin,
}: {
  settings: PublicSiteSettings
  origin?: string
}) {
  const [design, setDesign] = useState<Config | null>(null)
  const [ready, setReady] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [personal, setPersonal] = useState(false)
  const [details, setDetails] = useState({ location: '', note: '' })
  const [expanded, setExpanded] = useState(false)
  const drawing = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const enlarge = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    function restore() {
      setDetails({ location: '', note: '' })
      setPersonal(false)
      try {
        const saved = window.location.hash
          ? decode(window.location.hash)
          : configSchema.parse(JSON.parse(safeStorage.get('rtm-design-v2') || 'null'))
        setDesign(saved)
        setShareUrl(`${origin || window.location.origin}/tasarim-olustur#c=${encode(saved)}`)
      } catch {
        setDesign(null)
      }
      setReady(true)
    }
    restore()
    window.addEventListener('hashchange', restore)
    return () => window.removeEventListener('hashchange', restore)
  }, [origin])
  // Share creation contains no form values. Failure preserves the full v2 link.
  useEffect(() => {
    if (!design) return
    let active = true
    void preferredDesignUrl(design, origin).then((url) => {
      if (active) setShareUrl(url)
    })
    return () => {
      active = false
    }
  }, [design, origin])
  async function download(type: 'png' | 'pdf') {
    const svg = drawing.current?.querySelector('svg')
    if (!design || !svg || busy) return
    setBusy(true)
    try {
      const exp = await import('@/lib/configurator/export')
      if (type === 'pdf') await exp.exportPdf(design, svg, shareUrl)
      else await exp.exportPng(null, svg)
      setStatus(`${type.toUpperCase()} dosyanız hazırlandı.`)
    } catch {
      setStatus('Dosya hazırlanamadı. Tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus('Bağlantı kopyalandı.')
    } catch {
      setStatus('Panoya erişilemiyor. Tasarımı düzenle bağlantısını kopyalayabilirsiniz.')
    }
  }
  if (!ready)
    return (
      <main id="main-content" className="dq-page dq-empty" aria-busy="true">
        <p>Tasarımınız hazırlanıyor…</p>
      </main>
    )
  if (!design)
    return (
      <main id="main-content" className="dq-page dq-empty">
        <p className="eyebrow">RTM / SON ADIM</p>
        <h1>Henüz bir tasarım bulunamadı</h1>
        <p>Atölyede tasarım oluşturun veya geçerli tasarım bağlantınızı açın.</p>
        <Link className="button-primary" href="/tasarim-olustur">
          Tasarım oluştur ↗
        </Link>
      </main>
    )
  const editUrl = `/tasarim-olustur#c=${encode(design)}`
  const message = designMessage(design, shareUrl, personal ? details : undefined)
  const whatsapp = settings.whatsappHref
    ? `${settings.whatsappHref.split('?')[0]}?text=${encodeURIComponent(message)}`
    : undefined
  const actions = (withWhatsApp: boolean) => (
    <div className="dq-actions">
      <button type="button" disabled={busy} onClick={() => void download('png')}>
        ↓ Çizimi indir (PNG)
      </button>
      <button type="button" disabled={busy} onClick={() => void download('pdf')}>
        ↓ PDF indir
      </button>
      <button type="button" onClick={() => void copy()}>
        ↗ Bağlantıyı kopyala
      </button>
      {whatsapp && withWhatsApp ? (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon /> WhatsApp’tan gönder
        </a>
      ) : null}
    </div>
  )
  const allowed =
    settings.quoteFormEnabled && Boolean(settings.privacyNoticeContent || settings.privacyNoticeUrl)
  return (
    <main id="main-content" className="dq-page">
      <div className="dq-form-column">
        <header className="dq-intro">
          <p className="eyebrow">RTM / SON ADIM</p>
          <p className="dq-progress" aria-label="İlerleme">
            Tasarım ✓ <span>· Bilgiler · Gönderim</span>
          </p>
          <h1>
            Ön tasarımınızı <span>gönderin.</span>
          </h1>
          <p>Seçimlerinizi ve çiziminizi paylaşın; ihtiyaçlarınızı birlikte değerlendirelim.</p>
          <aside>
            Çiziminiz teklif talebinizle birlikte bize ulaşır. Üretim öncesinde ölçüler, tasarım ve
            teklif koşulları ayrıca netleştirilir.
          </aside>
        </header>
        {allowed ? (
          <>
            <details className="privacy-notice">
              <summary>KVKK aydınlatma metni</summary>
              {settings.privacyNoticeContent ? <p>{settings.privacyNoticeContent}</p> : null}
              {settings.privacyNoticeUrl ? (
                <a href={settings.privacyNoticeUrl} target="_blank" rel="noopener noreferrer">
                  Aydınlatma metnini okuyun ↗
                </a>
              ) : null}
            </details>
            <InquiryForm
              key={encode(design)}
              type="quote"
              categories={[]}
              designConfig={design}
              designQuote
              endpoint="/api/teklif"
              onDetailsChange={(location, note) => setDetails({ location, note })}
              successActions={
                <>
                  {actions(true)}
                  <Link href="/">Ana sayfaya dön ↗</Link>
                </>
              }
            />
          </>
        ) : (
          <div className="dq-unavailable">
            <h2>Teklif formu şu anda kapalı.</h2>
            <p>
              Tasarımınızı indirebilir, bağlantınızı kopyalayabilir
              {whatsapp ? ' veya WhatsApp üzerinden paylaşabilirsiniz' : 'siniz'}.
            </p>
          </div>
        )}
        <p className="dq-disclaimer">
          Çizim ön tasarımdır; kesin ölçüler yerinde alınır. Ekrandaki renk ve dokular temsilîdir.{' '}
          {settings.privacyNoticeUrl ? (
            <a href={settings.privacyNoticeUrl} target="_blank" rel="noopener noreferrer">
              KVKK aydınlatma metni ↗
            </a>
          ) : null}
        </p>
      </div>
      <aside
        className={`dq-design-column${expanded ? ' dq-details-open' : ''}`}
        aria-label="Tasarımınız"
      >
        <div className="dq-card-top">
          <p className="eyebrow">SİZE AİT BİR TASARIM</p>
          <Link href={editUrl}>← Tasarımı düzenle</Link>
        </div>
        <h2>{productNames[design.m]}</h2>
        <p className="dq-dimensions">
          {design.d.w} × {design.d.h} × {design.d.d} <small>cm</small>
        </p>
        <p className="dq-dimension-label">Genişlik × yükseklik × derinlik</p>
        {design.k ? <p className="dq-kitchen-plan">{kitchenDescription(design)}</p> : null}
        {design.tvUnit ? (
          <p className="dq-kitchen-plan dq-tv-plan">{tvDetails(design)[0]?.[1]}</p>
        ) : null}
        {design.bathroom ? (
          <p className="dq-kitchen-plan dq-bathroom-plan">{bathroomDetails(design)[0]?.[1]}</p>
        ) : null}
        {design.entryway ? (
          <p className="dq-kitchen-plan dq-entryway-plan">{entrywayDetails(design)[0]?.[1]}</p>
        ) : null}
        {design.wardrobe ? (
          <p className="dq-kitchen-plan dq-wardrobe-plan">{wardrobeDetails(design)[0]?.[1]}</p>
        ) : null}
        {whatsapp ? (
          <section className="dq-whatsapp-share" aria-label="WhatsApp ile tasarım paylaşımı">
            <a
              className="dq-whatsapp-button"
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span>WhatsApp’tan gönder</span>
              <span aria-hidden="true">↗</span>
            </a>
            <p>
              Çizim bağlantınız ve tasarım özellikleriniz mesajda hazır gelir. WhatsApp’ta Gönder’e
              basarak iletebilirsiniz.
            </p>
            <details className="dq-message">
              <summary>Mesaj önizlemesi</summary>
              <label className="inquiry-check">
                <input
                  type="checkbox"
                  checked={personal}
                  onChange={(event) => setPersonal(event.target.checked)}
                />
                <span>Bilgilerimi de ekle (konum ve not)</span>
              </label>
              <pre>{message}</pre>
            </details>
          </section>
        ) : null}
        <div role="tablist" aria-label="Tasarım görünümü">
          <button
            role="tab"
            id="quote-drawing-tab"
            aria-controls="quote-drawing-panel"
            aria-selected="true"
          >
            Teknik çizim
          </button>
        </div>
        <div
          role="tabpanel"
          id="quote-drawing-panel"
          aria-labelledby="quote-drawing-tab"
          ref={drawing}
        >
          <div className="dq-drawing">
            <TechnicalDrawing config={design} />
            <button
              type="button"
              ref={enlarge}
              className="dq-enlarge"
              onClick={() => dialog.current?.showModal()}
            >
              Teknik çizimi büyüt
            </button>
          </div>
        </div>
        <button
          className="dq-expand"
          type="button"
          aria-expanded={expanded}
          aria-controls="quote-design-details"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Detayları gizle −' : 'Detayları göster +'}
        </button>
        <div id="quote-design-details" className="dq-design-details">
          <div className="dq-materials">
            <div>
              <MaterialSwatch color={design.o.renk} glossy={design.o.yuzey === 'Parlak'} />
              <span>
                Kapak · {palette[design.o.renk].name}
                <small>
                  {design.o.malz} / {design.o.yuzey}
                </small>
              </span>
            </div>
            <div>
              <MaterialSwatch
                color={
                  design.o.govde === 'kapak'
                    ? design.o.renk
                    : design.o.govde === 'ahsap'
                      ? 'mese'
                      : design.o.govde
                }
              />
              <span>
                Gövde
                <small>
                  {design.o.govde === 'kapak'
                    ? 'Kapakla aynı'
                    : design.o.govde === 'ahsap'
                      ? 'Ahşap'
                      : palette[design.o.govde]?.name}
                </small>
              </span>
            </div>
          </div>
          <dl>
            {designDetails(design).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {label === 'Bölmeler' ? (
                    <details>
                      <summary>{design.r.main.w.length} bölme · Tümünü göster</summary>
                      {value}
                    </details>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        {actions(false)}
        <p className="dq-disclaimer">
          Bağlantıyı kopyala ile tasarımınızı saklayabilir, daha sonra bu bağlantıdan çiziminize
          dönebilirsiniz.
        </p>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </aside>
      <dialog
        className="dq-dialog"
        ref={dialog}
        onClose={() => enlarge.current?.focus()}
        aria-label="Büyütülmüş teknik çizim"
      >
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>
          Kapat ×
        </button>
        <TechnicalDrawing config={design} />
      </dialog>
    </main>
  )
}
