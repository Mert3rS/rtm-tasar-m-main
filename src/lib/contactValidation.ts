import { configSchema, type Config } from './configurator/config'

export function validEmail(value: string) {
  return value.length <= 254 && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value)
}

export function safeHttpsUrl(value: string | null | undefined) {
  if (!value || value.length > 2048 || /[\u0000-\u0020]/.test(value)) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined
  } catch {
    return undefined
  }
}

export function whatsappUrl(value: string | null | undefined) {
  if (!value || !/^\+?[\d\s().-]+$/.test(value)) return undefined
  const digits = value.replace(/\D/g, '').replace(/^00/, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) return undefined
  return `https://wa.me/${digits}?text=${encodeURIComponent('Merhaba, projem hakkında bilgi almak istiyorum.')}`
}

export function phoneHref(value: string | null | undefined) {
  if (!value || !/^[+\d\s().-]+$/.test(value)) return undefined
  const number = value.replace(/[\s().-]/g, '')
  return /^\+?\d{7,15}$/.test(number) ? `tel:${number}` : undefined
}

export const contactMethods = [
  { value: 'email', label: 'E-posta' },
  { value: 'phone', label: 'Telefon' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const

export type InquiryInput = {
  requestMeasurement?: boolean
  requestSamples?: boolean
  attachmentHandles?: string[]
  designConfig?: Config
  designPreview?: string
  inquiryType: 'contact' | 'quote'
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  projectCategory?: number
  projectCity?: string
  estimatedArea?: number
  estimatedBudgetRange?: string
  preferredContactMethod?: 'email' | 'phone' | 'whatsapp'
}

export type FormResult = { success: boolean; message: string; errors?: Record<string, string> }

export function validateInquiry(
  value: unknown,
): { data: InquiryInput; errors?: never } | { errors: Record<string, string>; data?: never } {
  if (typeof value !== 'object' || !value || Array.isArray(value))
    return { errors: { form: 'Geçerli bir form gönderin.' } }
  const input: Record<string, unknown> = Object.fromEntries(Object.entries(value))
  const allowed = new Set([
    'inquiryType',
    'projectContact',
    'fullName',
    'email',
    'phone',
    'subject',
    'message',
    'projectCategory',
    'projectCity',
    'estimatedArea',
    'estimatedBudgetRange',
    'preferredContactMethod',
    'token',
    'idempotencyKey',
    'website',
    'designConfig',
    'designPreview',
    'designConsent',
    'designQuote',
    'requestMeasurement',
    'requestSamples',
    'attachmentHandles',
  ])
  const errors: Record<string, string> = {}
  let designConfig: Config | undefined
  let designPreview: string | undefined
  if (input.designConfig !== undefined) {
    const result = configSchema.safeParse(input.designConfig)
    if (!result.success || input.inquiryType !== 'quote') errors.form = 'Tasarım verisi geçersiz.'
    else designConfig = result.data
    if (input.designConsent !== true) errors.form = 'Aydınlatma metnini okuduğunuzu belirtin.'
  }
  if (input.designPreview !== undefined) {
    if (
      !designConfig ||
      typeof input.designPreview !== 'string' ||
      input.designPreview.length > 8192 ||
      !/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]+={0,2}$/.test(input.designPreview)
    )
      errors.form = 'Tasarım önizlemesi geçersiz.'
    else designPreview = input.designPreview
  }
  const designQuote = input.designQuote === true && Boolean(designConfig)
  if (input.designQuote !== undefined && !designQuote) errors.form = 'Tasarım başvurusu geçersiz.'
  for (const field of ['requestMeasurement', 'requestSamples'])
    if (input[field] !== undefined && (!designQuote || typeof input[field] !== 'boolean'))
      errors[field] = 'Geçersiz seçim.'
  let attachmentHandles: string[] | undefined
  if (input.attachmentHandles !== undefined) {
    const handles = input.attachmentHandles
    if (
      !designQuote ||
      !Array.isArray(handles) ||
      handles.length > 3 ||
      handles.some(
        (item) =>
          typeof item !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(item),
      ) ||
      new Set(handles).size !== handles.length
    )
      errors.form = 'Dosya ekleri geçersiz.'
    else attachmentHandles = handles
  }
  if (Object.keys(input).some((key) => !allowed.has(key)))
    errors.form = 'Formda desteklenmeyen alan bulunuyor.'
  function text(key: string, max: number, min = 0, multiline = false) {
    const raw = input[key]
    if (raw !== undefined && typeof raw !== 'string') {
      errors[key] = 'Metin olarak girin.'
      return ''
    }
    const result = typeof raw === 'string' ? raw.normalize('NFC').trim() : ''
    if (result.length < min) errors[key] = 'Bu alanı doldurun.'
    else if (result.length > max) errors[key] = `En fazla ${max} karakter girin.`
    else if (
      (multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/).test(
        result,
      )
    )
      errors[key] = 'Geçersiz karakter içeriyor.'
    return result
  }
  const inquiryType = input.inquiryType === 'quote' ? 'quote' : 'contact'
  if (!['contact', 'quote'].includes(String(input.inquiryType))) errors.form = 'Form türü geçersiz.'
  const projectContact = input.projectContact === true && inquiryType === 'contact'
  if (input.projectContact !== undefined && !projectContact)
    errors.form = 'İletişim formu türü geçersiz.'
  const fullName = text('fullName', 120, 2)
  const email = text('email', 254, designQuote ? 0 : 3).toLowerCase()
  if ((!designQuote || email) && !validEmail(email))
    errors.email = 'Geçerli bir e-posta adresi girin.'
  const phone = text('phone', 35, inquiryType === 'quote' || projectContact ? 7 : 0)
  if (phone && !phoneHref(phone)) errors.phone = 'Geçerli bir telefon numarası girin.'
  const subject = projectContact
    ? 'Proje başvurusu'
    : inquiryType === 'contact'
      ? text('subject', 160, 3)
      : 'Proje teklif talebi'
  const message = text(
    'message',
    designQuote ? 2000 : projectContact ? 500 : 5000,
    designQuote ? 0 : 10,
    true,
  )
  let projectCategory: number | undefined
  let projectCity: string | undefined
  let estimatedArea: number | undefined
  let estimatedBudgetRange: string | undefined
  let preferredContactMethod: InquiryInput['preferredContactMethod']
  if (inquiryType === 'quote') {
    const category = input.projectCategory
    if (!designQuote && category !== 'general') {
      if (typeof category !== 'string' || !/^[1-9]\d{0,9}$/.test(category))
        errors.projectCategory = 'Bir proje kategorisi seçin.'
      else projectCategory = Number(category)
    }
    projectCity = text('projectCity', 120, 2)
    const area = text('estimatedArea', 16)
    if (area) {
      estimatedArea = Number(area.replace(',', '.'))
      if (!Number.isFinite(estimatedArea) || estimatedArea <= 0 || estimatedArea > 1_000_000)
        errors.estimatedArea = '0 ile 1.000.000 arasında geçerli bir alan girin.'
    }
    estimatedBudgetRange = text('estimatedBudgetRange', 160) || undefined
    const method = text('preferredContactMethod', 20)
    if (method === 'email' || method === 'phone' || method === 'whatsapp')
      preferredContactMethod = method
    else if (method) errors.preferredContactMethod = 'Geçerli bir iletişim yöntemi seçin.'
  }
  if (Object.keys(errors).length) return { errors }
  if (designQuote && preferredContactMethod === 'email' && !email)
    return { errors: { email: 'E-posta tercihi için adresinizi girin.' } }
  return {
    data: {
      inquiryType,
      fullName,
      email,
      phone,
      subject,
      message: message || 'Mobilya ön tasarım teklif talebi',
      projectCategory,
      projectCity,
      estimatedArea,
      estimatedBudgetRange,
      preferredContactMethod,
      ...(designConfig ? { designConfig } : {}),
      ...(designPreview ? { designPreview } : {}),
      ...(designQuote
        ? {
            requestMeasurement: input.requestMeasurement === true,
            requestSamples: input.requestSamples === true,
            attachmentHandles: attachmentHandles || [],
          }
        : {}),
    },
  }
}
