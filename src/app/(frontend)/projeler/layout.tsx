import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/site/SiteFooter'

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
