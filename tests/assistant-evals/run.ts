/**
 * Assistant evaluation: `pnpm eval:assistant`. Runs the deterministic engine against DEMO
 * knowledge (no CMS, no network) and reports intent accuracy. Exits non-zero below 90%.
 */
import { DeterministicEngine } from '@/lib/assistant/engine'
import { evalCases } from './cases'
import { demoKnowledge } from './fixture'

const engine = new DeterministicEngine()
let passed = 0
const failures: string[] = []
const byLang = { tr: { total: 0, ok: 0 }, en: { total: 0, ok: 0 } }

for (const testCase of evalCases) {
  const reply = engine.respond(
    { message: testCase.q, page: testCase.page, context: testCase.context },
    demoKnowledge,
  )
  const accepted = Array.isArray(testCase.expect) ? testCase.expect : [testCase.expect]
  let ok = accepted.includes(reply.intent)
  if (ok && testCase.entity)
    for (const [key, value] of Object.entries(testCase.entity))
      if (reply.context.entities?.[key as keyof typeof reply.context.entities] !== value) ok = false
  if (ok && testCase.lang === 'en' && reply.intent !== 'unsupported_language' && reply.lang !== 'en')
    ok = false
  const lang = testCase.lang === 'en' ? 'en' : 'tr'
  byLang[lang].total += 1
  if (ok) {
    passed += 1
    byLang[lang].ok += 1
  } else
    failures.push(
      `✗ "${testCase.q}" → ${reply.intent} (${reply.confidence}, ${reply.lang}) ${JSON.stringify(reply.context.entities)}; beklenen ${accepted.join(' | ')}${testCase.entity ? ` ${JSON.stringify(testCase.entity)}` : ''}`,
    )
}

const rate = passed / evalCases.length
console.log(failures.join('\n'))
console.log(
  `\nAsistan değerlendirmesi: ${passed}/${evalCases.length} doğru (%${(rate * 100).toFixed(1)}) · TR ${byLang.tr.ok}/${byLang.tr.total} · EN ${byLang.en.ok}/${byLang.en.total}`,
)
if (rate < 0.9) {
  console.error('Hedef ≥%90 sağlanamadı.')
  process.exit(1)
}
