import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/** Scheduled maintenance: removes ONLY expired unlinked uploads and expired non-personal shares.
 * Linked inquiry attachments and inquiries are never subject to automatic retention here.
 * Use a maintenance window; a concurrent submission can safely fail if its expired file is removed.
 */
const payload = await getPayload({ config })
const cutoff = new Date().toISOString()
let page = 1
let removedAttachments = 0
while (true) {
  const result = await payload.find({
    collection: 'inquiry-attachments',
    overrideAccess: true,
    depth: 0,
    limit: 100,
    page,
    sort: 'id',
    where: { and: [{ expiresAt: { less_than: cutoff } }, { linkedAt: { exists: false } }] },
  })
  let kept = 0
  for (const attachment of result.docs) {
    const referenced = await payload.count({
      collection: 'inquiries',
      overrideAccess: true,
      where: { attachments: { contains: attachment.id } },
    })
    if (referenced.totalDocs) {
      kept++
      continue
    }
    await payload.delete({
      collection: 'inquiry-attachments',
      id: attachment.id,
      overrideAccess: true,
    })
    removedAttachments++
  }
  if (!result.hasNextPage) break
  // Deleted rows shift pagination; rescan from page one only when progress was made.
  page = kept === result.docs.length ? page + 1 : 1
}
const shares = await payload.delete({
  collection: 'design-shares',
  overrideAccess: true,
  where: { expiresAt: { less_than: cutoff } },
})
payload.logger.info({
  event: 'expired-design-data-pruned',
  attachments: removedAttachments,
  shares: shares.docs.length,
})
await payload.destroy()
// Payload's editor imports can retain worker handles after the DB pool is closed.
// This is a standalone maintenance CLI; every delete and shutdown has completed.
process.exit(0)
