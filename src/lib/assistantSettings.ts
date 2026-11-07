import 'server-only'
import { cache } from 'react'
import { getPublicPayload } from './projectData'

/** Used when the CMS display name is empty (launcher, panel and engine replies). */
export const DEFAULT_ASSISTANT_NAME = 'RTM Tasarım Yardımcısı'

/**
 * `assistant-settings` is admin-only over REST/GraphQL. This trusted Local API read selects
 * explicit fields; the public DTO below omits the logging/retention switches.
 */
export const getAssistantConfig = cache(async () => {
  const payload = await getPublicPayload()
  const doc = await payload.findGlobal({
    slug: 'assistant-settings',
    overrideAccess: true,
    depth: 0,
    select: {
      enabled: true,
      displayName: true,
      tagline: true,
      welcomeMessage: true,
      quickQuestions: true,
      fallbackMessage: true,
      synonymGroups: true,
      logUnanswered: true,
      unansweredRetentionDays: true,
    },
  })
  return {
    enabled: doc.enabled === true,
    name: doc.displayName?.trim() || DEFAULT_ASSISTANT_NAME,
    tagline: doc.tagline?.trim() || undefined,
    welcome: doc.welcomeMessage?.trim() || undefined,
    quickQuestions: (doc.quickQuestions || []).slice(0, 6).map(({ label, question }) => ({
      label: label.slice(0, 48),
      message: (question?.trim() || label).slice(0, 200),
    })),
    fallback: doc.fallbackMessage?.trim() || undefined,
    synonymGroups: (doc.synonymGroups || [])
      .map(({ words }) =>
        words
          .split(',')
          .map((word) => word.trim())
          .filter((word) => word.length > 1 && word.length <= 60),
      )
      .filter((group) => group.length >= 2)
      .slice(0, 60),
    logUnanswered: doc.logUnanswered === true,
    unansweredRetentionDays: Math.min(730, Math.max(7, doc.unansweredRetentionDays || 90)),
  }
})

export type AssistantPublicSettings = {
  name: string
  tagline?: string
  welcome?: string
  quickQuestions: { label: string; message: string }[]
}

export async function getAssistantPublicSettings(): Promise<AssistantPublicSettings | null> {
  try {
    const config = await getAssistantConfig()
    if (!config.enabled) return null
    return {
      name: config.name,
      tagline: config.tagline,
      welcome: config.welcome,
      quickQuestions: config.quickQuestions,
    }
  } catch {
    // CMS unavailable or schema not migrated yet: the widget simply stays hidden.
    return null
  }
}
