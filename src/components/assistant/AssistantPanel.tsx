'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import type { AssistantPublicSettings } from '@/lib/assistantSettings'
import type { AssistantReply, ConversationContext, FlowRequest, ReplyAction, ReplyChip } from '@/lib/assistant/types'
import { safeInternalHref } from '@/lib/assistant/links'
import { productFromFlow, productInfo, studioHref } from '@/lib/assistant/studio'
import { safeStorage } from '@/lib/consent/storage'
import { recordInterest } from '@/lib/personalization/interest'
import { safeConverters } from '@/components/portfolio/richTextConverters'
import { openConsentPreferences, useConsent } from '@/components/consent/ConsentProvider'
import { useInterestProfile } from '@/components/personalization/useInterestProfile'
import { AssistantIcon } from './AssistantIcon'

type PublicReply = Omit<AssistantReply, 'unanswered'>
type Message =
  | { id: string; role: 'user'; text: string; at?: number }
  | { id: string; role: 'assistant'; reply: PublicReply; at?: number }
type Pending = { message?: string; flow?: FlowRequest }
type PanelError = { text: string; kind: 'error' | 'limit'; retry?: Pending }

const SESSION_KEY = 'rtm-assistant-v1'
const MAX_MESSAGES = 30
const MAX_CHARS = 500
const WELCOME_TYPING_MS = 350
const SWIPE_CLOSE_PX = 90
export const DEFAULT_WELCOME =
  'Merhaba, ben RTM Tasarım Yardımcısı. Projeler, hizmetler, tasarım modelleri veya kendi mobilyanızı tasarlama konusunda size yardımcı olabilirim. Ne öğrenmek istersiniz?'
const DEFAULT_CHIPS: ReplyChip[] = [
  { label: 'Hizmetleriniz neler?', message: 'Hizmetleriniz neler?', topic: 'services' },
  { label: 'Projelerinizi göster', message: 'Projelerinizi görmek istiyorum', topic: 'projects' },
  // "Dolap" alone resolves to wardrobe in the engine; this message offers the product choice chips.
  { label: 'Kendi dolabımı tasarlamak istiyorum', message: 'Kendim tasarlamak istiyorum', topic: 'studio' },
  { label: 'Teklif nasıl alırım?', message: 'Teklif nasıl alırım?', topic: 'quote' },
  { label: 'Size nasıl ulaşırım?', message: 'Size nasıl ulaşırım?', topic: 'contact' },
]
const cardKind = { project: 'Proje', service: 'Hizmet', model: 'Model', showroom: 'Showroom', faq: 'SSS', page: 'Sayfa' }
const uid = () => Math.random().toString(36).slice(2, 10)
const timeFormat = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function readSession(): { messages: Message[]; context: ConversationContext } {
  try {
    const raw = safeStorage.get(SESSION_KEY, 'session')
    if (!raw) return { messages: [], context: {} }
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'messages' in parsed && Array.isArray(parsed.messages))
      return {
        messages: (parsed.messages as Message[]).slice(-MAX_MESSAGES),
        context: 'context' in parsed && parsed.context && typeof parsed.context === 'object' ? (parsed.context as ConversationContext) : {},
      }
  } catch {
    /* Corrupt session data is ignored. */
  }
  return { messages: [], context: {} }
}

/** One extra suggestion for the page the visitor is on (only known public route shapes). */
function contextualChip(pathname: string | null): ReplyChip | null {
  if (!pathname) return null
  if (/^\/projeler\/[a-z0-9-]+$/.test(pathname))
    return { label: 'Bu projeye benzer işler', message: 'Bu projeye benzer projeler', topic: 'projects' }
  if (/^\/modeller\/[a-z0-9-]+$/.test(pathname))
    return { label: 'Bu modeli nasıl sipariş ederim?', message: 'Bu modeli nasıl sipariş ederim?', topic: 'models' }
  if (/^\/hizmetler\/[a-z0-9-]+$/.test(pathname))
    return { label: 'Bu hizmet hakkında bilgi', message: 'Bu hizmet hakkında bilgi', topic: 'services' }
  if (pathname === '/tasarim-olustur')
    return { label: 'Atölye nasıl kullanılır?', message: 'Tasarım atölyesi nasıl kullanılır?', topic: 'studio' }
  return null
}

function safeExternal(href: string | undefined) {
  if (!href) return undefined
  try {
    const url = new URL(href)
    return ['https:', 'mailto:', 'tel:'].includes(url.protocol) && !url.username ? url.href : undefined
  } catch {
    return undefined
  }
}

const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="assistant-glyph">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)
const glyphs = {
  arrow: 'M5 12h13M13 7l5 5-5 5',
  external: 'M8 16 16 8M10 8h6v6',
  chat: 'M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z',
  studio: 'M5 4.5h14v15H5zM12 4.5v15M9.5 11v2M14.5 11v2',
  shield: 'M12 4 18.5 6.5v4.8c0 3.9-2.7 6.9-6.5 8.4-3.8-1.5-6.5-4.5-6.5-8.4V6.5z',
  quote: 'M6 4.5h9l3 3v12H6zM9 10h6M9 13.5h6M9 17h3.5',
}

function ActionButton({ action, onNavigate }: { action: ReplyAction; onNavigate: () => void }) {
  if (action.kind === 'consent')
    return (
      <button type="button" className="assistant-action" onClick={() => openConsentPreferences()}>
        <Glyph d={glyphs.shield} />
        {action.label}
      </button>
    )
  if (action.kind === 'internal') {
    const href = safeInternalHref(action.href)
    if (!href) return null
    const quote = href.startsWith('/teklif-al')
    const studio = href.startsWith('/tasarim-olustur')
    return (
      <Link className={`assistant-action${quote ? ' assistant-action-signal' : ''}`} href={href} onClick={onNavigate}>
        <Glyph d={quote ? glyphs.quote : studio ? glyphs.studio : glyphs.arrow} />
        {action.label}
      </Link>
    )
  }
  const href = safeExternal(action.href)
  if (!href) return null
  const whatsapp = /(^https:\/\/(wa\.me|api\.whatsapp\.com|(www\.)?whatsapp\.com)\/)/.test(href)
  return (
    <a className="assistant-action" href={href} target={href.startsWith('https:') ? '_blank' : undefined} rel="noopener noreferrer">
      <Glyph d={whatsapp ? glyphs.chat : glyphs.external} />
      {action.label}
      {href.startsWith('https:') ? <span className="assistant-sr"> (yeni sekmede açılır)</span> : null}
    </a>
  )
}

function StateCard({ kind, children, action }: { kind: PanelError['kind']; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`assistant-state assistant-state-${kind}`} role="status">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="assistant-state-icon">
        {kind === 'limit' ? (
          <path d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM12 8v4.5l3 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        ) : (
          <path d="M12 4 20.5 19h-17zM12 10v4.5M12 16.5v1" fill="none" stroke="currentColor" strokeWidth="1.6" />
        )}
      </svg>
      <div>
        <p>{children}</p>
        {action}
      </div>
    </div>
  )
}

function Stamp({ at }: { at?: number }) {
  if (!at) return null
  const date = new Date(at)
  return (
    <time className="assistant-time" dateTime={date.toISOString()}>
      {timeFormat.format(date)}
    </time>
  )
}

export function AssistantPanel({
  open,
  onClose,
  settings,
}: {
  open: boolean
  onClose: () => void
  settings: AssistantPublicSettings
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasConsent, policy } = useConsent()
  const analytics = hasConsent('analytics')
  const profile = useInterestProfile()
  // Client-only component (ssr: false), so reading session storage here cannot cause a mismatch.
  const [initial] = useState(readSession)
  const [messages, setMessages] = useState<Message[]>(initial.messages)
  const [context, setContext] = useState<ConversationContext>(initial.context)
  // A tab that already chatted continues where it left off: no welcome typing replay.
  const [welcomeReady, setWelcomeReady] = useState(() => initial.messages.length > 0 || prefersReduced())
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<PanelError | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [voted, setVoted] = useState<Record<string, 'up' | 'down'>>({})
  const [modal, setModal] = useState(false)
  const token = useRef<string>('')
  const panel = useRef<HTMLDivElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const firstScroll = useRef(true)
  const swipe = useRef<{ y: number; dy: number } | null>(null)
  const titleId = useId()

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const update = () => setModal(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (welcomeReady) return
    const timer = window.setTimeout(() => setWelcomeReady(true), WELCOME_TYPING_MS)
    return () => window.clearTimeout(timer)
  }, [welcomeReady])

  useEffect(() => {
    // Session-only history (necessary storage, cleared when the tab closes). Never localStorage/URL.
    safeStorage.set(SESSION_KEY, JSON.stringify({ messages: messages.slice(-MAX_MESSAGES), context }), 'necessary', 'session')
  }, [messages, context])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.dataset.assistantOpen = 'true'
    // Phones: focus the heading so the on-screen keyboard never pops; desktop: first suggestion.
    const frame = window.requestAnimationFrame(() => {
      const target = modal
        ? panel.current?.querySelector<HTMLElement>('[data-assistant-heading]')
        : panel.current?.querySelector<HTMLButtonElement>('.assistant-chip:not(:disabled)')
      ;(target || panel.current?.querySelector<HTMLElement>('[data-assistant-heading]'))?.focus({ preventScroll: true })
    })
    return () => {
      window.cancelAnimationFrame(frame)
      delete root.dataset.assistantOpen
    }
  }, [open, modal, welcomeReady])

  // Chips are disabled while a reply is pending, which drops focus to <body>; Escape must still
  // close the panel then (but not while focus is elsewhere on the page).
  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const active = document.activeElement
      if (active === document.body || active === null) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // After a reply lands, keep keyboard users inside the conversation.
  useEffect(() => {
    if (!open || pending) return
    const active = document.activeElement
    if (active !== document.body && active !== null) return
    const turns = panel.current?.querySelectorAll<HTMLElement>('.assistant-turn')
    const last = turns?.[turns.length - 1]
    last?.querySelector<HTMLButtonElement>('.assistant-chip:not(:disabled)')?.focus({ preventScroll: true })
  }, [open, pending])

  useEffect(() => {
    const node = log.current
    if (!node || !open) return
    const smooth = !firstScroll.current && !prefersReduced()
    firstScroll.current = false
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [messages, pending, error, open, welcomeReady])

  const fetchToken = useCallback(async () => {
    const response = await fetch('/api/inquiry-token', { cache: 'no-store' })
    const body: unknown = await response.json()
    if (!response.ok || !body || typeof body !== 'object' || !('token' in body) || typeof body.token !== 'string')
      throw new Error('token')
    token.current = body.token
  }, [])

  const send = useCallback(
    async (request: Pending, displayText?: string, retry = false) => {
      if (pending) return
      const text = request.message?.trim()
      if (!text && !request.flow) return
      setError(null)
      if (!retry && (displayText || text))
        setMessages((current) =>
          [...current, { id: uid(), role: 'user' as const, text: (displayText || text || '').slice(0, MAX_CHARS), at: Date.now() }].slice(-MAX_MESSAGES),
        )
      setPending(true)
      const started = performance.now()
      const reduced = prefersReduced()
      try {
        let attempt = 0
        let body: unknown
        let status = 0
        while (attempt < 2) {
          if (!token.current) await fetchToken()
          const response = await fetch('/api/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.current, message: text || undefined, flow: request.flow, context, path: pathname }),
          })
          status = response.status
          body = await response.json().catch(() => null)
          if (status === 401) {
            token.current = ''
            attempt += 1
            continue
          }
          break
        }
        if (!reduced) {
          const elapsed = performance.now() - started
          if (elapsed < 300) await new Promise((resolve) => setTimeout(resolve, 300 - elapsed))
        }
        if (status !== 200 || !body || typeof body !== 'object' || !('reply' in body)) {
          const message =
            body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
              ? body.message
              : 'Asistan şu anda cevap veremiyor.'
          setError({ text: message, kind: status === 429 ? 'limit' : 'error', retry: request })
          return
        }
        const reply = body.reply as PublicReply
        setContext(reply.context)
        setMessages((current) => [...current, { id: uid(), role: 'assistant' as const, reply, at: Date.now() }].slice(-MAX_MESSAGES))
        const spoken = reply.blocks.map((block) => (block.type === 'text' ? block.text : '')).join(' ').trim()
        setAnnouncement(spoken || 'Yeni cevap geldi.')
      } catch {
        setError({ text: 'Bağlantı kurulamadı.', kind: 'error', retry: request })
      } finally {
        setPending(false)
      }
    },
    [context, fetchToken, pathname, pending],
  )

  const chooseChip = (chip: ReplyChip) => {
    // Only the topic key of the chip is remembered (with Personalisation consent), never text.
    if (chip.topic && /^[a-z0-9:_-]{1,60}$/.test(chip.topic))
      recordInterest({ k: 'topic', s: chip.topic.replace(/_/g, '-'), l: chip.label.slice(0, 80) })
    // Choosing a product (or a space that maps to one) opens the studio with it applied.
    const product = productFromFlow(chip.flow)
    if (product) {
      recordInterest({ k: 'studio', s: product, l: productInfo[product].label, sig: [{ t: 'product', s: product, l: productInfo[product].label }] })
      onClose()
      router.push(studioHref(product))
      return
    }
    if (chip.flow) void send({ flow: chip.flow }, chip.label)
    else void send({ message: chip.message || chip.label }, chip.label)
  }

  const clear = () => {
    setMessages([])
    setContext({})
    setError(null)
    safeStorage.remove(SESSION_KEY, 'session')
    setAnnouncement('Sohbet temizlendi.')
    // A cleared chat starts a fresh welcome.
    if (!prefersReduced()) setWelcomeReady(false)
    window.requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[data-assistant-heading]')?.focus())
  }

  const vote = (answerKey: string, id: string, value: 'up' | 'down') => {
    if (!analytics || voted[id]) return
    setVoted((current) => ({ ...current, [id]: value }))
    void fetch('/api/assistant/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.current, answerKey, vote: value }),
    }).catch(() => undefined)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !modal || !panel.current) return
    const focusable = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter((node) => node.offsetParent !== null)
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement as HTMLElement))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  // Phone sheet: drag the header down to close (transform only).
  const onGripDown = (event: PointerEvent<HTMLElement>) => {
    if (!modal || event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return
    swipe.current = { y: event.clientY, dy: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onGripMove = (event: PointerEvent<HTMLElement>) => {
    if (!swipe.current || !panel.current) return
    swipe.current.dy = Math.max(0, event.clientY - swipe.current.y)
    panel.current.style.transform = `translateY(${swipe.current.dy}px)`
  }
  const onGripUp = () => {
    const state = swipe.current
    swipe.current = null
    if (!state || !panel.current) return
    panel.current.style.transform = ''
    if (state.dy > SWIPE_CLOSE_PX) onClose()
  }

  const interestChips: ReplyChip[] = useMemo(() => {
    if (!profile || profile.total < 0.9) return []
    const chips: ReplyChip[] = []
    const product = profile.signals.product[0]
    const modelCategory = profile.signals.modelCategory[0]
    const city = profile.signals.city[0]
    if (product) chips.push({ label: `${product.label} tasarlamak ister misiniz?`, message: `${product.label} tasarlamak istiyorum`, topic: 'studio' })
    else if (modelCategory) chips.push({ label: `${modelCategory.label} modelleri`, message: `${modelCategory.label} modelleri`, topic: 'models' })
    if (city) chips.push({ label: `${city.label} projelerimiz`, message: `${city.label} projeleri`, topic: 'projects' })
    return chips.slice(0, 2)
  }, [profile])

  const quickChips: ReplyChip[] = settings.quickQuestions.length
    ? settings.quickQuestions.map(({ label, message }) => ({ label, message }))
    : DEFAULT_CHIPS
  const pageChip = contextualChip(pathname)
  const welcomeChips = [...(pageChip ? [pageChip] : []), ...interestChips, ...quickChips].slice(0, 6)

  const renderChips = (chips: ReplyChip[], key: string) =>
    chips.length ? (
      <div className="assistant-chips" role="group" aria-label="Önerilen sorular">
        {chips.map((chip, index) => (
          <button key={`${key}-${index}`} type="button" className="assistant-chip" disabled={pending} onClick={() => chooseChip(chip)}>
            {chip.label}
          </button>
        ))}
      </div>
    ) : null

  const avatar = (show: boolean) => (
    <span className="assistant-avatar" data-visible={show ? 'true' : 'false'} aria-hidden="true">
      {show ? <AssistantIcon dot={false} /> : null}
    </span>
  )
  const closeOnPhone = () => {
    if (modal) onClose()
  }

  return (
    <div
      ref={panel}
      id="rtm-assistant-panel"
      className="assistant-panel"
      role="dialog"
      aria-modal={modal ? 'true' : 'false'}
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-status`}
      hidden={!open}
      onKeyDown={onKeyDown}
    >
      <header
        className="assistant-header"
        onPointerDown={onGripDown}
        onPointerMove={onGripMove}
        onPointerUp={onGripUp}
        onPointerCancel={onGripUp}
      >
        <span className="assistant-grip" aria-hidden="true" />
        <div className="assistant-header-main">
          <span className="assistant-avatar assistant-avatar-lg" aria-hidden="true">
            <AssistantIcon dot={false} />
          </span>
          <div className="assistant-header-text">
            <h2 id={titleId} tabIndex={-1} data-assistant-heading>
              {settings.name}
            </h2>
            <p id={`${titleId}-status`} className="assistant-status">
              <span className="assistant-online-dot" aria-hidden="true" />
              Çevrimiçi · Otomatik asistan
            </p>
          </div>
          <div className="assistant-header-actions">
            <button
              type="button"
              className="assistant-icon-button"
              onClick={clear}
              disabled={!messages.length && !error}
              aria-label="Sohbeti temizle"
              data-tooltip="Sohbeti temizle"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7M10.5 10.5v6M13.5 10.5v6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button type="button" className="assistant-icon-button" onClick={onClose} aria-label="Sohbeti kapat" data-tooltip="Kapat">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </div>
        </div>
        <p className="assistant-kicker">RTM / YARDIMCI</p>
      </header>
      <div className="assistant-log" ref={log}>
        {welcomeReady ? (
          <div className="assistant-row assistant-row-bot">
            {avatar(true)}
            <div className="assistant-stack">
              <div className="assistant-message assistant-message-bot">
                <span className="assistant-sr">{settings.name}: </span>
                <p>{settings.welcome || DEFAULT_WELCOME}</p>
              </div>
              {renderChips(welcomeChips, 'welcome')}
            </div>
          </div>
        ) : (
          <div className="assistant-row assistant-row-bot">
            {avatar(true)}
            <div className="assistant-typing" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {welcomeReady
          ? messages.map((message, index) => {
              if (message.role === 'user')
                return (
                  <div key={message.id} className="assistant-row assistant-row-user">
                    <div className="assistant-stack">
                      <div className="assistant-message assistant-message-user">
                        <span className="assistant-sr">Siz: </span>
                        <p>{message.text}</p>
                      </div>
                      <Stamp at={message.at} />
                    </div>
                  </div>
                )
              const grouped = index > 0 && messages[index - 1].role === 'assistant'
              const isLast = message.id === messages.at(-1)?.id
              return (
                <div key={message.id} className="assistant-row assistant-row-bot assistant-turn">
                  {avatar(!grouped)}
                  <div className="assistant-stack">
                    <div className="assistant-message assistant-message-bot">
                      <span className="assistant-sr">{settings.name}: </span>
                      {message.reply.blocks.map((block, blockIndex) =>
                        block.type === 'text' ? (
                          <p key={blockIndex}>{block.text}</p>
                        ) : (
                          <RichText key={blockIndex} className="assistant-rich" converters={safeConverters} data={block.content} />
                        ),
                      )}
                    </div>
                    {message.reply.cards.length ? (
                      <ul className="assistant-cards" aria-label="Sonuçlar">
                        {message.reply.cards.map((card) => {
                          const href = safeInternalHref(card.href)
                          if (!href) return null
                          return (
                            <li key={card.href}>
                              <Link href={href} className="assistant-card" onClick={closeOnPhone}>
                                {card.image ? (
                                  <Image src={card.image.url} alt={card.image.alt} width={240} height={160} sizes="220px" className="assistant-card-image" />
                                ) : (
                                  <span className="assistant-card-image assistant-card-placeholder" aria-hidden="true" />
                                )}
                                <span className="assistant-card-kind">{cardKind[card.kind]}</span>
                                <strong>{card.title}</strong>
                                {card.meta ? <span className="assistant-card-meta">{card.meta}</span> : null}
                                {card.description ? <span className="assistant-card-text">{card.description}</span> : null}
                                <span className="assistant-card-more" aria-hidden="true">
                                  İncele →
                                </span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                    {message.reply.actions.length ? (
                      <div className="assistant-actions">
                        {message.reply.actions.map((action, actionIndex) => (
                          <ActionButton key={actionIndex} action={action} onNavigate={closeOnPhone} />
                        ))}
                      </div>
                    ) : null}
                    {/* Chip-only chat: a reply without suggestions falls back to the main menu (last reply only). */}
                    {renderChips(message.reply.chips.length || !isLast ? message.reply.chips : quickChips, message.id)}
                    {analytics && message.reply.confidence !== 'low' ? (
                      <div className="assistant-feedback" role="group" aria-label="Bu cevap yardımcı oldu mu?">
                        <span>Yardımcı oldu mu?</span>
                        <button type="button" aria-pressed={voted[message.id] === 'up'} disabled={Boolean(voted[message.id])} onClick={() => vote(message.reply.answerKey, message.id, 'up')} aria-label="Evet, yardımcı oldu">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h3v8.5H5zM8 11l3.5-6.5c1.4 0 2.2 1 1.9 2.4L12.8 10h5.4c1 0 1.7.9 1.5 1.9l-1.3 6c-.2.9-1 1.6-1.9 1.6H8" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
                        </button>
                        <button type="button" aria-pressed={voted[message.id] === 'down'} disabled={Boolean(voted[message.id])} onClick={() => vote(message.reply.answerKey, message.id, 'down')} aria-label="Hayır, yardımcı olmadı">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-3V4.5h3zM16 13l-3.5 6.5c-1.4 0-2.2-1-1.9-2.4l.6-3.1H5.8c-1 0-1.7-.9-1.5-1.9l1.3-6c.2-.9 1-1.6 1.9-1.6H16" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
                        </button>
                      </div>
                    ) : null}
                    <Stamp at={message.at} />
                  </div>
                </div>
              )
            })
          : null}
        {pending ? (
          <div className="assistant-row assistant-row-bot">
            {avatar(messages.at(-1)?.role !== 'assistant')}
            <div className="assistant-typing" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
        {error ? (
          <StateCard
            kind={error.kind}
            action={
              error.retry && error.kind === 'error' ? (
                <button type="button" className="assistant-action" onClick={() => error.retry && void send(error.retry, undefined, true)}>
                  Tekrar dene
                </button>
              ) : null
            }
          >
            {error.kind === 'limit' ? `${error.text} Biraz sonra tekrar deneyebilirsiniz.` : error.text}
          </StateCard>
        ) : null}
      </div>
      <p className="assistant-sr" role="status" aria-live="polite">
        {announcement}
      </p>
      <p className="assistant-note">
        Otomatik asistan; cevaplar sitedeki içerikten hazırlanır. Kişisel bilgilerinizi paylaşmayın.{' '}
        {policy.privacyHref ? (
          policy.privacyExternal ? (
            <a href={policy.privacyHref} target="_blank" rel="noopener noreferrer">
              Aydınlatma metni
            </a>
          ) : (
            <Link href={policy.privacyHref}>Aydınlatma metni</Link>
          )
        ) : null}{' '}
        <Link href="/cerez-politikasi">Çerez politikası</Link>
      </p>
    </div>
  )
}
