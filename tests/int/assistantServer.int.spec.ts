import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FindArgs = { collection: string; overrideAccess?: boolean; draft?: boolean; where?: unknown }
const calls: FindArgs[] = []
const globals: { slug: string; select?: Record<string, boolean>; overrideAccess?: boolean }[] = []
const executed: string[] = []
let allow = true

const fakePayload = {
  find: vi.fn(async (args: FindArgs) => {
    calls.push(args)
    return { docs: [], totalDocs: 0, totalPages: 0, page: 1 }
  }),
  findGlobal: vi.fn(async (args: { slug: string; select?: Record<string, boolean>; overrideAccess?: boolean }) => {
    globals.push(args)
    // A private field that must never reach public DTOs even if the DB returns it.
    return { notificationRecipientEmail: 'private@example.com', enabled: true, companyName: 'DEMO', _status: 'draft' }
  }),
  db: {
    drizzle: {
      execute: vi.fn(async (query: { queryChunks?: unknown[] }) => {
        executed.push(JSON.stringify(query.queryChunks ?? query).slice(0, 200))
        return { rows: allow ? [{ id: 1 }] : [] }
      }),
    },
  },
}

vi.mock('@/lib/projectData', async (original) => ({
  ...(await original<typeof import('@/lib/projectData')>()),
  getPublicPayload: async () => fakePayload,
}))

beforeEach(() => {
  calls.length = 0
  globals.length = 0
  executed.length = 0
  allow = true
  vi.stubEnv('PAYLOAD_SECRET', 'test-secret-for-hmac-only')
})
afterEach(() => vi.unstubAllEnvs())

describe('Assistant knowledge reads only public, published content', () => {
  it('uses overrideAccess:false, draft:false and published/active filters for collections', async () => {
    const { getAssistantKnowledge } = await import('@/lib/assistant/knowledge')
    const knowledge = await getAssistantKnowledge()
    const content = calls.filter((call) =>
      ['projects', 'services', 'design-models', 'showrooms', 'faqs', 'assistant-answers'].includes(call.collection),
    )
    expect(content.map(({ collection }) => collection).sort()).toEqual(
      ['assistant-answers', 'design-models', 'faqs', 'projects', 'services', 'showrooms'].sort(),
    )
    for (const call of content) {
      expect(call.overrideAccess).toBe(false)
      expect(call.draft).toBe(false)
      expect(JSON.stringify(call.where)).toContain('"_status":{"equals":"published"}')
    }
    for (const collection of ['services', 'faqs', 'assistant-answers'])
      expect(JSON.stringify(content.find((call) => call.collection === collection)?.where)).toContain('"active":{"equals":true}')
    for (const call of calls.filter(({ collection }) => ['project-categories', 'model-categories', 'cities', 'countries'].includes(collection)))
      expect(call.overrideAccess).toBe(false)
    // Trusted global reads select explicit fields; private settings never reach the index.
    const siteSettings = globals.find(({ slug }) => slug === 'site-settings')
    expect(siteSettings?.select?.notificationRecipientEmail).toBeUndefined()
    expect(JSON.stringify(knowledge)).not.toContain('private@example.com')
    // Draft About snapshot is not exposed.
    expect(knowledge.about).toBeUndefined()
  }, 60_000)
})

describe('Recommendations read only published content', () => {
  it('queries with public access and published filters', async () => {
    const { getRecommendations } = await import('@/lib/personalization/recommendations')
    await getRecommendations({
      items: [
        { type: 'project', slug: 'demo-a' },
        { type: 'service', slug: 'demo-s' },
        { type: 'showroom', slug: 'demo-r' },
      ],
      projectCategories: ['mutfak'],
      modelCategories: ['gardirop'],
      cities: [],
      countries: [],
      limit: 4,
    })
    for (const call of calls) expect(call.overrideAccess).toBe(false)
    for (const call of calls.filter(({ collection }) => ['projects', 'design-models', 'services', 'showrooms'].includes(collection))) {
      expect(call.draft).toBe(false)
      expect(JSON.stringify(call.where)).toContain('"_status":{"equals":"published"}')
    }
    expect(JSON.stringify(calls.find(({ collection }) => collection === 'services')?.where)).toContain('"active":{"equals":true}')
  })
})

describe('Rate limits reuse form-rate-limits buckets', () => {
  it('evaluates every bucket and stops at the first refusal', async () => {
    const { allowBuckets } = await import('@/lib/inquirySecurity')
    const request = new Request('http://localhost/api/assistant')
    const buckets = [
      { identity: 'assistant:global', limit: 300, seconds: 60 },
      { identity: 'assistant:visitor:x', limit: 15, seconds: 60 },
      { identity: 'assistant:visitor-hour:x', limit: 120, seconds: 3600 },
    ]
    // Fake payload is structurally compatible with the calls allowBuckets makes.
    expect(await allowBuckets(fakePayload as never, request, buckets)).toBe(true)
    expect(executed.length).toBe(4) // prune + three atomic upserts
    allow = false
    executed.length = 0
    expect(await allowBuckets(fakePayload as never, request, buckets)).toBe(false)
    expect(executed.length).toBe(2) // prune + first refused bucket
  })
  it('requires a valid trusted proxy IP header when configured', async () => {
    vi.stubEnv('INQUIRY_CLIENT_IP_HEADER', 'x-real-ip')
    const { allowBuckets, trustedClientIp } = await import('@/lib/inquirySecurity')
    expect(trustedClientIp(new Request('http://localhost', { headers: { 'x-forwarded-for': '1.2.3.4' } }))).toEqual({ configured: true, ip: undefined })
    expect(await allowBuckets(fakePayload as never, new Request('http://localhost'), [], { prefix: 'assistant', limit: 30, seconds: 60 })).toBe(false)
    expect(
      await allowBuckets(fakePayload as never, new Request('http://localhost', { headers: { 'x-real-ip': '203.0.113.9' } }), [], {
        prefix: 'assistant',
        limit: 30,
        seconds: 60,
      }),
    ).toBe(true)
    // Raw IPs are only hashed into buckets.
    expect(executed.join(' ')).not.toContain('203.0.113.9')
  })
})
