import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/site/SiteFooter'

export default function ShowroomLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
