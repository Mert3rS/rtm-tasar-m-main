import 'server-only'
import { cache } from 'react'
import { getPublicPayload, projectImage } from './projectData'
import { phoneHref, safeHttpsUrl, validEmail, whatsappUrl } from './contactValidation'
import { policyVersionPattern, UNCONFIGURED_POLICY } from './consent/cookie'
import { resolveHomepageCopy } from './homepageContent'
import { HERO_POSITIONS, type HeroPositionKey, type HeroImage } from './homepageHero'
import { resolveSiteCopy } from './siteCopy'

// Global REST access is admin-only. This intentional trusted read selects approved public fields only.
export const getPublicSiteSettings = cache(async () => {
  const payload = await getPublicPayload()
  const doc = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    depth: 1,
    select: {
      homepage: true,
      siteCopy: true,
      heroImages: true,
      companyName: true,
      companyDescription: true,
      logo: true,
      contactEmail: true,
      phone: true,
      whatsappNumber: true,
      address: true,
      city: true,
      country: true,
      googleMapsUrl: true,
      instagramUrl: true,
      facebookUrl: true,
      linkedinUrl: true,
      youtubeUrl: true,
      defaultSeoTitle: true,
      defaultSeoDescription: true,
      quoteFormEnabled: true,
      contactFormEnabled: true,
      privacyNoticeContent: true,
      privacyNoticeUrl: true,
      cookiePolicyContent: true,
      cookiePolicyUrl: true,
      cookiePolicyVersion: true,
      cookiePolicyUpdatedAt: true,
      consentBannerTitle: true,
      consentBannerDescription: true,
    },
  })
  const cookiePolicyUrl = safeHttpsUrl(doc.cookiePolicyUrl)
  const heroImages: Partial<Record<HeroPositionKey, HeroImage | undefined>> = {}
  for (const { key } of HERO_POSITIONS) heroImages[key] = projectImage(doc.heroImages?.[key])
  const cookiePolicyContent = doc.cookiePolicyContent?.root?.children?.length
    ? doc.cookiePolicyContent
    : undefined
  const policyVersion =
    doc.cookiePolicyVersion &&
    policyVersionPattern.test(doc.cookiePolicyVersion) &&
    doc.cookiePolicyVersion !== UNCONFIGURED_POLICY
      ? doc.cookiePolicyVersion
      : undefined
  const cookiePolicyReady = Boolean((cookiePolicyContent || cookiePolicyUrl) && policyVersion)
  return {
    homepage: resolveHomepageCopy(doc.homepage),
    siteCopy: resolveSiteCopy(doc.siteCopy),
    heroImages,
    companyName: doc.companyName || 'RTM Tasarım',
    companyDescription: doc.companyDescription || undefined,
    logo: projectImage(doc.logo),
    contactEmail: doc.contactEmail && validEmail(doc.contactEmail) ? doc.contactEmail : undefined,
    phone: doc.phone && phoneHref(doc.phone) ? doc.phone : undefined,
    whatsappHref: whatsappUrl(doc.whatsappNumber),
    address: doc.address || undefined,
    city: doc.city || undefined,
    country: doc.country || undefined,
    mapsHref: safeHttpsUrl(doc.googleMapsUrl),
    socials: [
      { label: 'Instagram', href: safeHttpsUrl(doc.instagramUrl) },
      { label: 'Facebook', href: safeHttpsUrl(doc.facebookUrl) },
      { label: 'LinkedIn', href: safeHttpsUrl(doc.linkedinUrl) },
      { label: 'YouTube', href: safeHttpsUrl(doc.youtubeUrl) },
    ].filter((social): social is { label: string; href: string } => Boolean(social.href)),
    defaultSeoTitle: doc.defaultSeoTitle || undefined,
    defaultSeoDescription: doc.defaultSeoDescription || undefined,
    quoteFormEnabled: doc.quoteFormEnabled !== false,
    contactFormEnabled: doc.contactFormEnabled !== false,
    privacyNoticeContent: doc.privacyNoticeContent?.trim() || undefined,
    privacyNoticeUrl: safeHttpsUrl(doc.privacyNoticeUrl),
    cookiePolicy: {
      ready: cookiePolicyReady,
      // Without an approved policy only necessary storage runs (src/lib/consent/cookie.ts).
      version: cookiePolicyReady && policyVersion ? policyVersion : UNCONFIGURED_POLICY,
      content: cookiePolicyContent,
      url: cookiePolicyUrl,
      updatedAt: doc.cookiePolicyUpdatedAt || undefined,
      bannerTitle: doc.consentBannerTitle?.trim() || undefined,
      bannerDescription: doc.consentBannerDescription?.trim() || undefined,
    },
  }
})

export type PublicSiteSettings = Awaited<ReturnType<typeof getPublicSiteSettings>>
