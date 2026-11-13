'use client'

import {
  BotMessageSquare,
  Boxes,
  Building2,
  CircleHelp,
  ClipboardList,
  FileImage,
  FolderKanban,
  Globe2,
  Images,
  LayoutDashboard,
  MapPinned,
  MessageSquareText,
  PackageOpen,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { CollectionSlug, GlobalSlug } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { AdminThemeToggle } from '@/components/admin/AdminThemeToggle'
import { VISUAL_PAGES } from './visual-pages'
import { BrandLogo } from '@/components/brand/BrandLogo'
import type { User } from '@/payload-types'
import { Link, Logout, useAuth, useConfig, useEntityVisibility } from '@payloadcms/ui'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

type EntityNavItem = {
  icon: LucideIcon
  kind: 'collection' | 'global'
  slug: CollectionSlug | GlobalSlug
  title: string
}

const navSections: Array<{ items: EntityNavItem[]; label: string }> = [
  {
    label: 'İÇERİK VE PORTFÖY',
    items: [
      { title: 'Projeler', slug: 'projects', kind: 'collection', icon: FolderKanban },
      { title: 'Proje kategorileri', slug: 'project-categories', kind: 'collection', icon: Boxes },
      { title: 'Medya', slug: 'media', kind: 'collection', icon: Images },
      { title: 'Showroom’lar', slug: 'showrooms', kind: 'collection', icon: Globe2 },
      { title: 'Showroom sahneleri', slug: 'showroom-scenes', kind: 'collection', icon: MapPinned },
    ],
  },
  {
    label: 'KURUMSAL KATALOG',
    items: [
      { title: 'Hakkımızda', slug: 'about-page', kind: 'global', icon: Building2 },
      { title: 'Hizmetler', slug: 'services', kind: 'collection', icon: Sparkles },
      { title: 'Tasarım modelleri', slug: 'design-models', kind: 'collection', icon: PackageOpen },
      { title: 'Model kategorileri', slug: 'model-categories', kind: 'collection', icon: Boxes },
    ],
  },
  {
    label: 'İLETİŞİM',
    items: [
      { title: 'Başvurular', slug: 'inquiries', kind: 'collection', icon: ClipboardList },
      { title: 'Başvuru ekleri', slug: 'inquiry-attachments', kind: 'collection', icon: FileImage },
      {
        title: 'Tasarım bağlantıları',
        slug: 'design-shares',
        kind: 'collection',
        icon: MessageSquareText,
      },
    ],
  },
  {
    label: 'ASİSTAN',
    items: [
      {
        title: 'Asistan ayarları',
        slug: 'assistant-settings',
        kind: 'global',
        icon: BotMessageSquare,
      },
      {
        title: 'Onaylı cevaplar',
        slug: 'assistant-answers',
        kind: 'collection',
        icon: MessageSquareText,
      },
      { title: 'Sık sorulan sorular', slug: 'faqs', kind: 'collection', icon: CircleHelp },
      {
        title: 'Yanıtlanamayanlar',
        slug: 'assistant-unanswered',
        kind: 'collection',
        icon: CircleHelp,
      },
      {
        title: 'Geri bildirimler',
        slug: 'assistant-feedback',
        kind: 'collection',
        icon: MessageSquareText,
      },
    ],
  },
  {
    label: 'SİTE YÖNETİMİ',
    items: [
      { title: 'Site ayarları', slug: 'site-settings', kind: 'global', icon: Settings2 },
      { title: 'Ülkeler', slug: 'countries', kind: 'collection', icon: Globe2 },
      { title: 'Şehirler', slug: 'cities', kind: 'collection', icon: MapPinned },
      { title: 'Kullanıcılar', slug: 'users', kind: 'collection', icon: UsersRound },
      { title: 'İzin kayıtları', slug: 'consent-records', kind: 'collection', icon: ShieldCheck },
    ],
  },
]

const isCurrentPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

function SitePageMenu({
  dashboardHref,
  pathname,
  selectedPage,
}: {
  dashboardHref: string
  pathname: string
  selectedPage: string | null
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <SidebarMenu className="gap-0.5" aria-label="Site sayfaları">
      {VISUAL_PAGES.map((page) => (
        <SidebarMenuItem key={page.id}>
          <SidebarMenuButton
            asChild
            className="h-9 gap-2.5 rounded-lg px-2.5"
            tooltip={page.title}
            isActive={pathname === dashboardHref && (selectedPage || 'home') === page.id}
          >
            <Link
              href={`${dashboardHref}?page=${page.id}`}
              prefetch={false}
              onClick={() => {
                if (isMobile) setOpenMobile(false)
              }}
            >
              <Globe2 className="text-muted-foreground" />
              <span>{page.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

export function AdminNav() {
  const pathname = usePathname()
  const search = useSearchParams()
  const { user } = useAuth<User>()
  const { config } = useConfig()
  const { isEntityVisible } = useEntityVisibility()
  const adminRoute = config.routes.admin
  const dashboardHref = formatAdminURL({ adminRoute })
  const accountHref = formatAdminURL({ adminRoute, path: config.admin.routes.account })
  const email = user?.email ?? 'Yönetici'
  const initial = email.slice(0, 1).toLocaleUpperCase('tr-TR')

  return (
    <SidebarProvider className="rtm-sidebar-provider" defaultOpen>
      <Sidebar className="rtm-admin-sidebar" collapsible="icon">
        <SidebarHeader className="rtm-admin-sidebar-header">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="rtm-admin-sidebar-brand-row">
                <Link
                  className="rtm-admin-sidebar-brand no-underline"
                  href={dashboardHref}
                  prefetch={false}
                >
                  <span className="rtm-admin-sidebar-mark">
                    <BrandLogo decorative variant="icon" />
                  </span>
                  <BrandLogo ariaLabel="RTM Tasarım" className="rtm-admin-sidebar-title" />
                </Link>
                <SidebarTrigger
                  aria-label="Kenar çubuğunu aç veya daralt"
                  className="rtm-admin-sidebar-trigger"
                  title="Kenar çubuğunu aç veya daralt"
                />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-3 py-0">
            <SidebarGroupLabel className="px-2.5 text-[0.6875rem] tracking-wider">
              YÖNETİM
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem className="rtm-admin-dashboard-item">
                  <SidebarMenuButton
                    asChild
                    className="h-9 gap-2.5 rounded-lg px-2.5"
                    isActive={pathname === dashboardHref}
                    tooltip="Site içeriği"
                  >
                    <Link href={dashboardHref} prefetch={false}>
                      <LayoutDashboard />
                      <span>Site içeriği</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="px-3 py-2">
            <SidebarGroupLabel className="px-2.5 text-[0.6875rem] tracking-wider">
              SİTE SAYFALARI
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SitePageMenu
                dashboardHref={dashboardHref}
                pathname={pathname}
                selectedPage={search.get('page')}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) =>
              item.kind === 'collection'
                ? isEntityVisible({ collectionSlug: item.slug as CollectionSlug })
                : isEntityVisible({ globalSlug: item.slug as GlobalSlug }),
            )
            if (visibleItems.length === 0) return null

            return (
              <SidebarGroup className="px-3 py-2" key={section.label}>
                <SidebarGroupLabel className="px-2.5 text-[0.6875rem] tracking-wider">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {visibleItems.map((item) => {
                      const href = formatAdminURL({
                        adminRoute,
                        path:
                          item.kind === 'collection'
                            ? `/collections/${item.slug}`
                            : `/globals/${item.slug}`,
                      })
                      const Icon = item.icon
                      return (
                        <SidebarMenuItem key={`${item.kind}-${item.slug}`}>
                          <SidebarMenuButton
                            asChild
                            className="h-9 gap-2.5 rounded-lg px-2.5"
                            isActive={isCurrentPath(pathname, href)}
                            tooltip={item.title}
                          >
                            <Link href={href} prefetch={false}>
                              <Icon className="text-muted-foreground" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
        </SidebarContent>

        <SidebarFooter className="gap-3 px-3 pb-5">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-9 gap-2.5 rounded-lg px-2.5"
                tooltip="Hesabım"
              >
                <Link href={accountHref} prefetch={false}>
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted font-semibold text-[0.6875rem]">
                    {initial}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{email}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-9 gap-2.5 rounded-lg px-2.5"
                tooltip="Hesap ayarları"
              >
                <Link href={accountHref} prefetch={false}>
                  <UserRound className="text-muted-foreground" />
                  <span>Hesap ayarları</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="rtm-admin-logout">
            <Logout />
            <span>Çıkış yap</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarTrigger
        aria-label="Yönetim menüsünü aç"
        className="rtm-admin-mobile-trigger"
        title="Yönetim menüsünü aç"
      />
      <AdminThemeToggle />
    </SidebarProvider>
  )
}
