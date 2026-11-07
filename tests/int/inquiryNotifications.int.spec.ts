import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { notifyInquiry } from '@/lib/inquiryNotifications'
import type { Inquiry } from '@/payload-types'

const inquiry: Inquiry = {
  id: 42,
  fullName: 'DEMO test',
  email: 'demo@example.invalid',
  inquiryType: 'contact',
  subject: 'DEMO konu',
  message: '<script>DEMO yalnızca düz metin</script>',
  status: 'new',
  submittedAt: '2026-10-29T12:00:00Z',
  createdAt: '2026-10-29T12:00:00Z',
  updatedAt: '2026-10-29T12:00:00Z',
}
beforeEach(() => {
  vi.stubEnv('SMTP_HOST', 'smtp.example.invalid')
  vi.stubEnv('SMTP_PORT', '587')
  vi.stubEnv('SMTP_FROM_EMAIL', 'forms@example.invalid')
  vi.stubEnv('SMTP_USER', '')
  vi.stubEnv('SMTP_PASSWORD', '')
  vi.stubEnv('INQUIRY_NOTIFICATION_RECIPIENT_ALLOWLIST', 'admin@example.invalid')
})
afterEach(() => vi.unstubAllEnvs())

function services() {
  return {
    update: vi.fn(async () => undefined),
    sendEmail: vi.fn(async () => undefined),
    logger: { error: vi.fn() },
  }
}

it('does not send or mark acceptance without SMTP or an approved recipient', async () => {
  const payload = services()
  await notifyInquiry(payload, inquiry, 'visitor@example.invalid')
  vi.stubEnv('SMTP_HOST', '')
  await notifyInquiry(payload, inquiry, 'admin@example.invalid')
  expect(payload.sendEmail).not.toHaveBeenCalled()
  expect(payload.update).not.toHaveBeenCalled()
})

it('records transport acceptance without claiming delivery and uses plain text', async () => {
  const payload = services()
  await notifyInquiry(payload, inquiry, 'admin@example.invalid')
  expect(payload.sendEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'admin@example.invalid',
      text: expect.stringContaining('/admin/collections/inquiries/42'),
      disableFileAccess: true,
      disableUrlAccess: true,
    }),
  )
  expect(payload.sendEmail).not.toHaveBeenCalledWith(
    expect.objectContaining({ html: expect.anything() }),
  )
  expect(payload.update).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ data: { notificationStatus: 'accepted' } }),
  )
})

it('contains SMTP errors after storage and records failure', async () => {
  const payload = services()
  payload.sendEmail.mockRejectedValue(new Error('DEMO SMTP unavailable'))
  await expect(notifyInquiry(payload, inquiry, 'admin@example.invalid')).resolves.toBeUndefined()
  expect(payload.update).toHaveBeenLastCalledWith(
    expect.objectContaining({ data: { notificationStatus: 'failed' } }),
  )
})

it('leaves the pending record when acceptance cannot be persisted and never resends', async () => {
  const payload = services()
  payload.update
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('DEMO storage unavailable'))
  await expect(notifyInquiry(payload, inquiry, 'admin@example.invalid')).resolves.toBeUndefined()
  expect(payload.update).toHaveBeenCalledTimes(2)
  expect(payload.sendEmail).toHaveBeenCalledTimes(1)
  expect(payload.logger.error).toHaveBeenCalledWith({
    event: 'inquiry-notification-status-update-failed',
    inquiryId: 42,
  })
})
