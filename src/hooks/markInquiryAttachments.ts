import type { CollectionAfterChangeHook } from 'payload'
import type { Inquiry } from '../payload-types'

/** Native create/update owns the transaction. Propagate req so this metadata write and
 * the inquiry commit together; failure rolls back both. Idempotent (first link only).
 * The deliberate access override only marks already-authorized, fixed attachment IDs;
 * it exposes no private document and never accepts arbitrary client mutation fields.
 * Remember historical attachment even after an inquiry is deleted: retention of such
 * files stays a manual policy decision, unlike never-submitted temporary uploads.
 */
export const markInquiryAttachments: CollectionAfterChangeHook<Inquiry> = async ({ doc, req }) => {
  for (const attachment of doc.attachments || []) {
    const id = typeof attachment === 'number' ? attachment : attachment.id
    await req.payload.update({
      collection: 'inquiry-attachments',
      overrideAccess: true,
      req,
      depth: 0,
      where: { and: [{ id: { equals: id } }, { linkedAt: { exists: false } }] },
      data: { linkedAt: doc.submittedAt },
    })
  }
  return doc
}
