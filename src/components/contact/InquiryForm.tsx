'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { contactMethods, validateInquiry, type FormResult } from '@/lib/contactValidation'
import type { Config } from '@/lib/configurator/config'
import { InquiryAttachments } from './InquiryAttachments'
import { productNames } from '@/lib/configurator/config'
import { prepareInquiryToken } from '@/lib/inquiryClient'
import { QuoteCategoryHint } from './QuoteCategoryHint'
import { SiteDropdown } from '@/components/site/SiteDropdown'
import { toast } from 'sonner'

type Props = {
  type: 'contact' | 'quote'
  designQuote?: boolean
  successActions?: ReactNode
  onDetailsChange?: (location: string, note: string) => void
  categories: { id: number; name: string }[]
  designConfig?: Config
  preview?: () => string | undefined
  endpoint?: string
  previewOnly?: boolean
}
type FieldProps = {
  name: string
  label: string
  required?: boolean
  maxLength?: number
  type?: string
  autoComplete?: string
  multiline?: boolean
  error?: string
  options?: { value: string; label: string }[]
  hint?: string
  placeholder?: string
}

function Field({ name, label, required, error, multiline, options, hint, ...rest }: FieldProps) {
  const props = {
    ...rest,
    id: `inquiry-${name}`,
    name,
    required,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `error-${name}` : hint ? `hint-${name}` : undefined,
  }
  return (
    <div className={`inquiry-field${multiline ? ' inquiry-field-wide' : ''}`}>
      <label htmlFor={props.id}>
        {label}
        {required ? (
          <span aria-hidden="true"> *</span>
        ) : (
          <span className="field-optional"> (isteğe bağlı)</span>
        )}
      </label>
      {options ? (
        <SiteDropdown
          ariaDescribedBy={props['aria-describedby']}
          ariaInvalid={Boolean(error)}
          defaultValue={options[0]?.value}
          id={props.id}
          label={label}
          name={name}
          options={options}
          required={required}
        />
      ) : multiline ? (
        <textarea {...props} rows={5} />
      ) : (
        <input {...props} />
      )}
      {hint ? (
        <p className="field-hint" id={`hint-${name}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`error-${name}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

function responseResult(value: unknown): FormResult {
  if (
    !value ||
    typeof value !== 'object' ||
    !('message' in value) ||
    typeof value.message !== 'string' ||
    !('success' in value) ||
    typeof value.success !== 'boolean'
  )
    throw new Error('Unexpected response')
  const errors: Record<string, string> = {}
  if ('errors' in value && value.errors && typeof value.errors === 'object')
    for (const [key, message] of Object.entries(value.errors))
      if (typeof message === 'string') errors[key] = message
  return { success: value.success, message: value.message, errors }
}

export function InquiryForm({
  type,
  categories,
  designConfig,
  designQuote = false,
  successActions,
  onDetailsChange,
  preview,
  endpoint = '/api/inquiry-submit',
  previewOnly = false,
}: Props) {
  const [attachmentHandles, setAttachmentHandles] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [note, setNote] = useState('')
  const [submissionKey, setSubmissionKey] = useState('')
  const [token, setToken] = useState('')
  const [tokenError, setTokenError] = useState(false)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<FormResult | null>(null)
  const busy = useRef(false)
  const key = useRef('')
  const successRef = useRef<HTMLHeadingElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (previewOnly) return
    const controller = new AbortController()
    async function prepare() {
      try {
        const preparedToken = await prepareInquiryToken()
        if (!controller.signal.aborted) {
          key.current = crypto.randomUUID()
          setSubmissionKey(key.current)
          setToken(preparedToken)
        }
      } catch {
        if (!controller.signal.aborted) setTokenError(true)
      }
    }
    void prepare()
    return () => controller.abort()
  }, [previewOnly])

  useEffect(() => {
    if (result?.success) {
      successRef.current?.focus()
      toast.success('Mesajınız alındı', { description: result.message })
    } else if (result) {
      errorRef.current?.focus()
      toast.error('Gönderim tamamlanamadı', { description: result.message })
    }
  }, [result])

  useEffect(() => {
    if (tokenError) {
      toast.error('Form hazırlanamadı', {
        description: 'Sayfayı yenileyip tekrar deneyin veya iletişim kanallarımızı kullanın.',
      })
    }
  }, [tokenError])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (previewOnly) return
    if (busy.current || uploading || !token) return
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    if (designConfig && fields.designConsent !== 'on') {
      setResult({ success: false, message: 'Lütfen aydınlatma metnini okuduğunuzu belirtin.' })
      return
    }
    delete fields.designConsent
    const input = {
      ...fields,
      inquiryType: type,
      ...(designQuote
        ? {
            designQuote: true,
            requestMeasurement: fields.requestMeasurement === 'on',
            requestSamples: fields.requestSamples === 'on',
            attachmentHandles,
          }
        : {}),
      token,
      idempotencyKey: key.current,
      ...(designConfig ? { designConfig, designPreview: preview?.(), designConsent: true } : {}),
    }
    const validated = validateInquiry(input)
    if (validated.errors) {
      setResult({
        success: false,
        message: 'İşaretli alanları kontrol edin.',
        errors: validated.errors,
      })
      return
    }
    let submission = JSON.stringify(input)
    if (new TextEncoder().encode(submission).byteLength > 24 * 1024 && designConfig) {
      submission = JSON.stringify({ ...input, designPreview: undefined })
    }
    if (new TextEncoder().encode(submission).byteLength > 24 * 1024) {
      setResult({
        success: false,
        message: 'Başvuru boyutu aşılıyor. Tasarım etiketlerini veya mesajınızı kısaltın.',
      })
      return
    }
    busy.current = true
    setPending(true)
    setResult(null)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: submission,
      })
      const body: unknown = await response.json()
      setResult(responseResult(body))
    } catch {
      setResult({
        success: false,
        message: 'Bağlantı kurulamadı. Bilgileriniz formda korunuyor; lütfen yeniden deneyin.',
      })
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  if (result?.success)
    return (
      <div className="inquiry-success" role="status" aria-live="polite">
        {designQuote ? (
          <span className="dq-success-check" aria-hidden="true">
            ✓
          </span>
        ) : null}
        <span className="eyebrow">Teşekkür ederiz</span>
        <h2 ref={successRef} tabIndex={-1}>
          {designQuote ? 'Talebiniz alındı' : 'İlk adımı birlikte attık.'}
        </h2>
        {designQuote && designConfig ? (
          <p>
            {productNames[designConfig.m]} · {designConfig.d.w} × {designConfig.d.h} ×{' '}
            {designConfig.d.d} cm
          </p>
        ) : null}
        <p>{result.message}</p>
        {successActions}
      </div>
    )
  const errors = result?.errors || {}
  return (
    <form
      className="inquiry-form"
      data-preview={previewOnly || undefined}
      onSubmit={(event) => void submit(event)}
      noValidate
      onChange={(event) => {
        if (!designQuote) return
        const fields = new FormData(event.currentTarget)
        const message = String(fields.get('message') || '')
        setNote(message)
        onDetailsChange?.(String(fields.get('projectCity') || ''), message)
      }}
      aria-busy={pending}
    >
      <p className="form-required-note">* işaretli alanlar zorunludur.</p>
      {result ? (
        <div className="inquiry-feedback" role="status" tabIndex={-1} ref={errorRef}>
          <p>{result.message}</p>
          {Object.entries(errors).length ? (
            <ul>
              {Object.entries(errors).map(([name, message]) => (
                <li key={name}>
                  {name === 'form' ? message : <a href={`#inquiry-${name}`}>{message}</a>}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {tokenError ? (
        <p role="status" className="inquiry-feedback">
          Form hazırlanamadı. Sayfayı yenileyip tekrar deneyin.
        </p>
      ) : null}
      <div className="inquiry-honeypot" aria-hidden="true">
        <label htmlFor="inquiry-website">Web sitesi</label>
        <input autoComplete="off" id="inquiry-website" name="website" tabIndex={-1} type="text" />
      </div>
      <fieldset disabled={pending}>
        <legend>
          <span className="micro-label accent">01</span> Sizi tanıyalım
        </legend>
        <div className="inquiry-fields">
          <Field
            name="fullName"
            label="Ad soyad"
            required
            maxLength={120}
            autoComplete="name"
            error={errors.fullName}
          />
          <Field
            name="phone"
            label="Telefon"
            required={type === 'quote'}
            type="tel"
            maxLength={35}
            autoComplete="tel"
            error={errors.phone}
          />
          <Field
            name="email"
            label="E-posta"
            required={!designQuote}
            type="email"
            maxLength={254}
            autoComplete="email"
            error={errors.email}
          />
          {type === 'contact' ? (
            <Field name="subject" label="Konu" required maxLength={160} error={errors.subject} />
          ) : null}
        </div>
      </fieldset>
      <fieldset disabled={pending}>
        <legend>
          <span className="micro-label accent">02</span>{' '}
          {type === 'quote' ? 'Mekânınızı anlatalım' : 'Birlikte konuşalım'}
        </legend>
        <div className="inquiry-fields">
          {type === 'quote' && !designQuote ? (
            <>
              <Field
                name="projectCategory"
                label="Proje kategorisi"
                required
                error={errors.projectCategory}
                options={
                  categories.length
                    ? [
                        { value: '', label: 'Kategori seçin' },
                        ...categories.map((category) => ({
                          value: String(category.id),
                          label: category.name,
                        })),
                      ]
                    : [{ value: 'general', label: 'Genel proje başvurusu' }]
                }
              />
              {categories.length ? (
                <QuoteCategoryHint categories={categories} selectId="inquiry-projectCategory" />
              ) : null}
              <Field
                name="projectCity"
                label="Projenin bulunduğu şehir"
                required
                maxLength={120}
                error={errors.projectCity}
              />
              <Field
                name="estimatedArea"
                label="Yaklaşık alan (m²)"
                maxLength={16}
                error={errors.estimatedArea}
              />
              <Field
                name="estimatedBudgetRange"
                label="Düşündüğünüz bütçe aralığı"
                maxLength={160}
                error={errors.estimatedBudgetRange}
                hint="Yaklaşık bir aralık paylaşabilirsiniz; bu bilgi fiyat teklifi değildir."
              />
              <Field
                name="preferredContactMethod"
                label="İletişim tercihiniz"
                error={errors.preferredContactMethod}
                options={[{ value: '', label: 'Tercihim yok' }, ...contactMethods]}
              />
            </>
          ) : null}
          {designQuote ? (
            <>
              <Field
                name="projectCity"
                label="Projenin konumu · İl / ilçe"
                required
                maxLength={120}
                error={errors.projectCity}
              />
              <Field
                name="preferredContactMethod"
                label="İletişim tercihi"
                error={errors.preferredContactMethod}
                options={[{ value: '', label: 'Tercihim yok' }, ...contactMethods]}
              />
            </>
          ) : null}
          <Field
            name="message"
            label={
              designQuote
                ? 'Eklemek istedikleriniz'
                : type === 'quote'
                  ? 'Projeniz hakkında'
                  : 'Mesajınız'
            }
            multiline
            required={!designQuote}
            maxLength={designQuote ? 2000 : 5000}
            placeholder={
              designQuote
                ? 'Pencere, kolon, tesisat noktaları, cihaz ölçüleri veya özel istekleriniz.'
                : undefined
            }
            error={errors.message}
            hint={
              designQuote
                ? `Pencere, kolon, tesisat noktaları, cihaz ölçüleri veya özel istekleriniz. ${note.length}/2000`
                : 'İlk değerlendirme için ihtiyaçlarınızı paylaşın; hassas kişisel bilgi göndermeyin.'
            }
          />
        </div>
      </fieldset>
      {designQuote ? (
        <>
          <InquiryAttachments
            token={token}
            submissionKey={submissionKey}
            onChange={setAttachmentHandles}
            onBusy={setUploading}
          />
          <label className="dq-check">
            <input type="checkbox" name="requestMeasurement" />
            Yerinde ölçü alınmasını istiyorum
          </label>
          <label className="dq-check">
            <input type="checkbox" name="requestSamples" />
            Renk ve malzeme numunelerini görmek istiyorum
          </label>
        </>
      ) : null}
      {designConfig ? (
        <label className="dc-toggle">
          <input disabled={previewOnly} name="designConsent" type="checkbox" required />
          Aydınlatma metnini okudum.
        </label>
      ) : null}
      <button
        type="submit"
        className="button-primary inquiry-submit"
        disabled={previewOnly || pending || uploading || !token}
      >
        {previewOnly
          ? 'Gönderim henüz açık değil'
          : pending
          ? 'Gönderiliyor…'
          : designQuote
            ? 'Çizimimi gönder'
            : type === 'quote'
              ? 'Teklif Talebini Gönder'
              : 'Mesajı Gönder'}
        <span aria-hidden="true">↗</span>
      </button>
      <noscript>
        <p>Formu göndermek için JavaScript’i etkinleştirin veya iletişim kanallarımızı kullanın.</p>
      </noscript>
    </form>
  )
}
