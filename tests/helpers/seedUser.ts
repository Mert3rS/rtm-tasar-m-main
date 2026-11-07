import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: `demo-admin-${crypto.randomUUID()}@example.invalid`,
  password: crypto.randomUUID(),
}
let createdUserId: number | undefined

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  if (
    process.env.RTM_CMS_E2E !== '1' ||
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(process.env.DATABASE_URI || 'postgresql://localhost').hostname,
    )
  )
    throw new Error('Admin fixtures require RTM_CMS_E2E=1 and a local development database')
  const payload = await getPayload({ config })
  const user = await payload.create({
    collection: 'users',
    data: testUser,
  })
  createdUserId = user.id
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  if (!createdUserId) return
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    id: createdUserId,
  })
  createdUserId = undefined
}
