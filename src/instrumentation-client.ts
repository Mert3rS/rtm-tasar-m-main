import { restoreInitialTheme } from '@/lib/consent/storage'

// Payload owns a separate root layout. Mutating its <html> element before React hydrates
// creates an attribute mismatch in /admin, so public-site bootstrapping stays route-scoped.
if (!window.location.pathname.startsWith('/admin')) {
  document.documentElement.dataset.rtmJs = 'true'

  try {
    const policyVersion = document.documentElement.dataset.consentPolicyVersion
    if (policyVersion) restoreInitialTheme(policyVersion)
  } catch {
    // Storage or cookie access can be blocked; the server-rendered light theme remains valid.
  }
}
