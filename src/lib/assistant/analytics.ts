import 'server-only'
import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { maskPersonalData } from './privacy'
import { normalizeText } from './normalize'

/**
 * Anonymous improvement data. Callers must have verified: admin switch on AND Analytics consent.
 * No visitor id, IP or raw message is stored; text is masked and merged by normalised form.
 * Expired rows are removed on the next write (no background job).
 */
export async function recordUnanswered(payload: Payload, message: string, retentionDays: number) {
  const masked = maskPersonalData(message).slice(0, 500)
  const normalized = normalizeText(masked).slice(0, 500)
  if (normalized.length < 3) return
  await payload.db.drizzle.execute(sql`
    DELETE FROM assistant_unanswered
    WHERE last_seen_at < now() - make_interval(days => ${retentionDays})
  `)
  await payload.db.drizzle.execute(sql`
    INSERT INTO assistant_unanswered (question, normalized, count, last_seen_at, updated_at, created_at)
    VALUES (${masked}, ${normalized}, 1, now(), now(), now())
    ON CONFLICT (normalized) DO UPDATE
      SET count = assistant_unanswered.count + 1, last_seen_at = now(), updated_at = now()
  `)
}

export async function recordFeedback(payload: Payload, answerKey: string, vote: 'up' | 'down') {
  const up = vote === 'up' ? 1 : 0
  const down = vote === 'down' ? 1 : 0
  await payload.db.drizzle.execute(sql`
    INSERT INTO assistant_feedback (answer_key, helpful, not_helpful, updated_at, created_at)
    VALUES (${answerKey}, ${up}, ${down}, now(), now())
    ON CONFLICT (answer_key) DO UPDATE
      SET helpful = assistant_feedback.helpful + ${up},
          not_helpful = assistant_feedback.not_helpful + ${down},
          updated_at = now()
  `)
}
