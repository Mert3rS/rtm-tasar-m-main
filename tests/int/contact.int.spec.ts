import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  phoneHref,
  safeHttpsUrl,
  validEmail,
  validateInquiry,
  whatsappUrl,
} from '@/lib/contactValidation'
import { formToken, validFormToken, sameOrigin, boundedJson } from '@/lib/inquirySecurity'
import { approvedNotificationRecipient, smtpConfiguration } from '@/lib/smtp'

afterEach(() => vi.unstubAllEnvs())
const contact = {
  inquiryType: 'contact',
  fullName: '  DEMO Test  ',
  email: 'DEMO@EXAMPLE.COM',
  subject: 'Proje hakkında',
  message: 'Yerel otomasyon test mesajı.',
}

describe('Contact input boundaries', () => {
  it('normalizes input and keeps only typed service inquiry fields', () => {
    const result = validateInquiry(contact)
    expect(result.data?.fullName).toBe('DEMO Test')
    expect(result.data?.email).toBe('demo@example.com')
  })
  it.each([
    { fullName: '' },
    { email: 'invalid' },
    { email: 'a@b.com\r\nBcc:x@y.com' },
    { subject: 'a'.repeat(161) },
    { message: 'a'.repeat(5001) },
    { phone: 'xxx' },
    { inquiryType: 'admin' },
    { status: 'completed' },
    { priority: 'high' },
    { internalNotes: 'forged' },
    { notificationStatus: 'accepted' },
    { fullName: ['test'] },
  ])('rejects invalid or protected fields: %j', (change) => {
    expect(validateInquiry({ ...contact, ...change }).errors).toBeDefined()
  })
  it('requires quote fields and accepts only bounded numeric area and known methods', () => {
    const quote = {
      ...contact,
      inquiryType: 'quote',
      phone: '+90 555 000 00 00',
      projectCategory: 'general',
      projectCity: 'DEMO şehir',
      estimatedArea: '125,5',
      preferredContactMethod: 'phone',
    }
    expect(validateInquiry(quote).data?.estimatedArea).toBe(125.5)
    for (const change of [
      { phone: '' },
      { projectCategory: '' },
      { projectCity: '' },
      { estimatedArea: 'Infinity' },
      { estimatedArea: '-1' },
      { preferredContactMethod: 'carrier-pigeon' },
    ])
      expect(validateInquiry({ ...quote, ...change }).errors).toBeDefined()
  })
  it('validates the streamlined project contact form and enforces its 500 character limit', () => {
    const projectContact = {
      ...contact,
      projectContact: true,
      phone: '+90 555 000 00 00',
      message: 'a'.repeat(500),
    }
    const result = validateInquiry(projectContact)
    expect(result.data?.subject).toBe('Proje başvurusu')
    expect(result.data?.message).toHaveLength(500)
    for (const change of [
      { phone: '' },
      { message: 'a'.repeat(501) },
      { projectContact: 'yes' },
    ])
      expect(validateInquiry({ ...projectContact, ...change }).errors).toBeDefined()
  })
  it('rejects credential-bearing and executable URLs and malformed phone links', () => {
    for (const value of [
      'javascript:alert(1)',
      'http://example.com',
      'https://a:b@example.com',
      'https://example.com/\nx',
    ])
      expect(safeHttpsUrl(value)).toBeUndefined()
    expect(safeHttpsUrl('https://example.com/privacy')).toBe('https://example.com/privacy')
    expect(whatsappUrl('0090 555 000 00 00')).toContain('https://wa.me/905550000000?')
    expect(whatsappUrl('0555 000 00 00')).toBeUndefined()
    expect(phoneHref('123;alert(1)')).toBeUndefined()
    expect(validEmail('a@example.com,b@example.com')).toBe(false)
  })
})

describe('Submission security and SMTP configuration', () => {
  it('binds expiring signatures to a visitor without exposing the server secret', () => {
    vi.stubEnv('PAYLOAD_SECRET', 'DEMO-only-test-signing-secret')
    const now = 1793270000000
    const token = formToken('visitor-one', now)
    expect(validFormToken(token, 'visitor-one', now + 1000)).toBe(true)
    expect(validFormToken(token, 'visitor-two', now + 1000)).toBe(false)
    expect(validFormToken(token, 'visitor-one', now + 3600001)).toBe(false)
    expect(validFormToken(token, 'visitor-one', now - 1)).toBe(false)
    expect(validFormToken(`${token.slice(0, -1)}x`, 'visitor-one', now)).toBe(false)
  })
  it('requires exact origins and a real configured HTTPS production origin', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SITE_URL', 'https://rtm.example')
    expect(
      sameOrigin(
        new Request('https://rtm.example/api/inquiry-submit', {
          headers: { Origin: 'https://rtm.example' },
        }),
      ),
    ).toBe(true)
    expect(
      sameOrigin(
        new Request('https://rtm.example/api/inquiry-submit', {
          headers: { Origin: 'https://evil.example' },
        }),
      ),
    ).toBe(false)
    expect(sameOrigin(new Request('https://rtm.example/api/inquiry-submit'))).toBe(false)
    vi.stubEnv('SITE_URL', 'http://localhost:3000')
    expect(
      sameOrigin(
        new Request('http://localhost:3000', { headers: { Origin: 'http://localhost:3000' } }),
      ),
    ).toBe(false)
  })
  it('caps bodies even without Content-Length', async () => {
    await expect(
      boundedJson(
        new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'x'.repeat(25000) }),
        }),
      ),
    ).rejects.toThrow()
    await expect(
      boundedJson(
        new Request('http://localhost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"ok":true}',
        }),
      ),
    ).resolves.toEqual({ ok: true })
  })
  it('requires complete SMTP config and independently approved recipients', () => {
    vi.stubEnv('SMTP_HOST', '')
    expect(smtpConfiguration()).toBeUndefined()
    vi.stubEnv('SMTP_HOST', 'smtp.example.com')
    vi.stubEnv('SMTP_FROM_EMAIL', 'forms@example.com')
    vi.stubEnv('SMTP_PORT', '587')
    vi.stubEnv('SMTP_USER', '')
    vi.stubEnv('SMTP_PASSWORD', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(smtpConfiguration()?.transportOptions.requireTLS).toBe(true)
    vi.stubEnv('INQUIRY_NOTIFICATION_RECIPIENT_ALLOWLIST', 'approved@example.com')
    expect(approvedNotificationRecipient('APPROVED@example.com')).toBe('approved@example.com')
    expect(approvedNotificationRecipient('visitor@example.com')).toBeUndefined()
    vi.stubEnv('SMTP_USER', 'account')
    expect(smtpConfiguration()).toBeUndefined()
  })
})
