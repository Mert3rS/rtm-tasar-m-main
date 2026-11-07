import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { validEmail } from './contactValidation'

export function smtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim()
  const port = Number(process.env.SMTP_PORT || 587)
  const from = process.env.SMTP_FROM_EMAIL?.trim()
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  if (
    !host ||
    !from ||
    !validEmail(from) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    Boolean(user) !== Boolean(pass)
  )
    return undefined
  return {
    defaultFromAddress: from,
    defaultFromName: 'RTM Tasarım',
    skipVerify: true,
    transportOptions: {
      host,
      port,
      secure: port === 465,
      requireTLS: process.env.NODE_ENV === 'production' && port !== 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
      disableFileAccess: true,
      disableUrlAccess: true,
    },
  }
}

export function configuredEmailAdapter() {
  const options = smtpConfiguration()
  return options ? nodemailerAdapter(options) : undefined
}

export function approvedNotificationRecipient(value: string | null | undefined) {
  const email = value?.trim().toLowerCase()
  const approved = (process.env.INQUIRY_NOTIFICATION_RECIPIENT_ALLOWLIST || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(validEmail)
  return email && validEmail(email) && approved.includes(email) ? email : undefined
}
