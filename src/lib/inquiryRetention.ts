import 'server-only'
import type { Payload } from 'payload'

export const INQUIRY_RETENTION_DAYS = 30
const BATCH_SIZE = 100
const MAX_BATCHES = 10

export function inquiryRetentionCutoff(now = new Date()) {
  return new Date(now.getTime() - INQUIRY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

async function deleteExpiredCollection(
  payload: Payload,
  collection: 'inquiries' | 'inquiry-attachments',
  dateField: 'submittedAt' | 'linkedAt',
  cutoff: Date,
) {
  let deleted = 0
  let hasMore = false

  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const result = await payload.find({
      collection,
      overrideAccess: true,
      depth: 0,
      limit: BATCH_SIZE,
      pagination: false,
      where: { [dateField]: { less_than: cutoff.toISOString() } },
    })
    if (!result.docs.length) {
      hasMore = false
      break
    }
    for (const doc of result.docs) {
      await payload.delete({ collection, id: doc.id, overrideAccess: true, depth: 0 })
      deleted += 1
    }
    hasMore = result.docs.length === BATCH_SIZE
    if (!hasMore) break
  }

  return { deleted, hasMore }
}

/**
 * Deletes expired private inquiry records and their linked private files. It logs no document
 * content or identifiers. The maintenance route is protected by CRON_SECRET and is intended to
 * run daily; repeated execution is safe.
 */
export async function pruneExpiredInquiries(payload: Payload, now = new Date()) {
  const cutoff = inquiryRetentionCutoff(now)
  const inquiries = await deleteExpiredCollection(payload, 'inquiries', 'submittedAt', cutoff)
  const attachments = await deleteExpiredCollection(
    payload,
    'inquiry-attachments',
    'linkedAt',
    cutoff,
  )

  return {
    cutoff: cutoff.toISOString(),
    deletedInquiries: inquiries.deleted,
    deletedAttachments: attachments.deleted,
    hasMore: inquiries.hasMore || attachments.hasMore,
  }
}
