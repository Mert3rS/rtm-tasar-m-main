import 'server-only'
import { createHmac } from 'node:crypto'
import type { Payload } from 'payload'
import { configSchema, type Config } from './configurator/config'

export function designShareKey(value: unknown, secret: string) {
  if (!secret) throw new Error('Missing configuration')
  // Zod reconstructs objects in schema order, so insertion order in the request is irrelevant.
  const canonical = JSON.stringify(configSchema.parse(value))
  return createHmac('sha256', secret)
    .update(`design-share:v1:${canonical}`)
    .digest('base64url')
    .slice(0, 12)
}

/** Trusted server-only store of schema-validated design data. No personal form fields accepted. */
export async function saveDesignShare(payload: Payload, design: Config) {
  const shareKey = designShareKey(design, process.env.PAYLOAD_SECRET || '')
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    depth: 0,
    select: { designShareRetentionDays: true },
  })
  const days = settings.designShareRetentionDays || 180
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString()
  const existing = await payload.find({
    collection: 'design-shares',
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: { shareKey: { equals: shareKey } },
  })
  if (existing.docs[0]) {
    if (existing.docs[0].expiresAt < new Date().toISOString())
      await payload.update({
        collection: 'design-shares',
        id: existing.docs[0].id,
        overrideAccess: true,
        data: { expiresAt },
      })
    return `/t/${shareKey}`
  }
  try {
    await payload.create({
      collection: 'design-shares',
      overrideAccess: true,
      data: { shareKey, design, expiresAt },
    })
  } catch {
    const raced = await payload.find({
      collection: 'design-shares',
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: { shareKey: { equals: shareKey } },
    })
    if (!raced.docs.length) throw new Error('Share unavailable')
  }
  return `/t/${shareKey}`
}

export async function resolveDesignShare(payload: Pick<Payload, 'find'>, key: string) {
  if (!/^[\w-]{12}$/.test(key)) return null
  const result = await payload.find({
    collection: 'design-shares',
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: {
      and: [
        { shareKey: { equals: key } },
        { expiresAt: { greater_than: new Date().toISOString() } },
      ],
    },
  })
  const parsed = configSchema.safeParse(result.docs[0]?.design)
  return parsed.success ? parsed.data : null
}
