import { BrandLogo } from '@/components/brand/BrandLogo'

export function AdminIcon() {
  return (
    <span aria-label="RTM Tasarım" className="rtm-admin-graphic rtm-admin-graphic--icon">
      <BrandLogo className="rtm-admin-icon-logo" decorative variant="icon" />
    </span>
  )
}

export function AdminLogo() {
  return (
    <span aria-label="RTM Tasarım içerik yönetimi" className="rtm-admin-graphic rtm-admin-graphic--logo">
      <BrandLogo className="rtm-admin-full-logo" decorative />
      <small>İÇERİK YÖNETİMİ</small>
    </span>
  )
}
