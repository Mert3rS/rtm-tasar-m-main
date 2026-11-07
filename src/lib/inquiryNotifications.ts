import 'server-only'
import type { Payload } from 'payload'
import type { Inquiry } from '@/payload-types'
import { approvedNotificationRecipient, smtpConfiguration } from './smtp'
import { productionSiteUrl } from './seo'

type NotificationUpdate = {
  collection: 'inquiries'
  id: number
  overrideAccess: true
  depth: 0
  data: { notificationStatus: 'pending' | 'accepted' | 'failed' }
}
type NotificationServices = {
  update: (args: NotificationUpdate) => Promise<unknown>
  sendEmail: (args: Parameters<Payload['sendEmail']>[0]) => Promise<unknown>
  logger: { error: (event: { event: string; inquiryId: number }) => void }
}

export async function notifyInquiry(
  payload: NotificationServices,
  inquiry: Inquiry,
  recipient: string | null | undefined,
) {
  const to = approvedNotificationRecipient(recipient)
  if (!to || !smtpConfiguration()) return
  function statusUpdateFailed() {
    payload.logger.error({
      event: 'inquiry-notification-status-update-failed',
      inquiryId: inquiry.id,
    })
  }
  try {
    await payload.update({
      collection: 'inquiries',
      id: inquiry.id,
      overrideAccess: true,
      depth: 0,
      data: { notificationStatus: 'pending' },
    })
  } catch {
    statusUpdateFailed()
    return
  }
  let notificationStatus: 'accepted' | 'failed' = 'failed'
  try {
    const origin = productionSiteUrl()?.origin
    const reference = `/admin/collections/inquiries/${inquiry.id}`
    await payload.sendEmail({
      to,
      subject: `RTM — Yeni ${inquiry.inquiryType === 'quote' ? 'teklif' : 'iletişim'} başvurusu #${inquiry.id}`,
      text: [
        `Başvuru #${inquiry.id}`,
        `Tür: ${inquiry.inquiryType === 'quote' ? 'Teklif' : 'İletişim'}`,
        `Ad soyad: ${inquiry.fullName}`,
        `E-posta: ${inquiry.email}`,
        `Telefon: ${inquiry.phone || 'Belirtilmedi'}`,
        `Konu: ${inquiry.subject}`,
        `Şehir: ${inquiry.projectCity || 'Belirtilmedi'}`,
        '',
        inquiry.message,
        ...(inquiry.designShareUrl ? ['', 'Mobilya ön tasarımı:', inquiry.designShareUrl] : []),
        '',
        `Admin kaydı: ${origin ? origin + reference : reference}`,
      ].join('\n'),
      disableFileAccess: true,
      disableUrlAccess: true,
    })
    // Accepted by transport, not proof of delivery. Duplicate requests never resend notifications.
    notificationStatus = 'accepted'
  } catch {
    notificationStatus = 'failed'
  }
  try {
    await payload.update({
      collection: 'inquiries',
      id: inquiry.id,
      overrideAccess: true,
      depth: 0,
      data: { notificationStatus },
    })
  } catch {
    // Leave 'pending' if recording the outcome fails; acceptance may already have happened.
    statusUpdateFailed()
  }
}
