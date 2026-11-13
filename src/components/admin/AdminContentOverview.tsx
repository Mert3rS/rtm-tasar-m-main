import type { ServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { getHomepageData } from '@/lib/getGlobeData'
import { getHomepageServices, getFeaturedModels } from '@/lib/catalogData'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { projectImage, PROJECT_ORDER } from '@/lib/projectData'
import { HOMEPAGE_SECTIONS } from '@/lib/homepageContent'
import { activeHeroVariant } from '@/lib/heroVariant'
import { resolveHeroPhotos } from '@/lib/homepageHero'
import { photoDocument, type PhotoSection } from '@/lib/photoPlacements'
import type { Media } from '@/payload-types'
import { ContentGuide } from './ContentGuide'
import { VisualStudio } from './VisualStudio'
import type { ContentPage, ContentRecord, ContentSection } from './content-types'
import { LaunchReadiness, type LaunchReadinessItem } from './LaunchReadiness'
import { approvedNotificationRecipient, smtpConfiguration } from '@/lib/smtp'

type CardDoc = {
  id: number
  title: string
  shortDescription?: string | null
  coverImage?: number | Media | null
  _status?: 'draft' | 'published' | null
  active?: boolean | null
}

export async function AdminContentOverview({
  payload,
  user,
}: Pick<ServerProps, 'payload' | 'user'>) {
  if (!user) return null
  const href = (path: `/${string}`) =>
    formatAdminURL({ adminRoute: payload.config.routes.admin, path })
  const settingsHref = href('/globals/site-settings')
  const read = { user, overrideAccess: false, depth: 1, draft: true, limit: 8, sort: PROJECT_ORDER }
  const results = await Promise.allSettled([
    payload.find({
      ...read,
      collection: 'projects',
      select: {
        title: true,
        shortDescription: true,
        coverImage: true,
        gallery: true,
        seoImage: true,
        _status: true,
      },
    }),
    payload.find({
      ...read,
      collection: 'services',
      select: {
        title: true,
        shortDescription: true,
        coverImage: true,
        galleryImages: true,
        seoImage: true,
        _status: true,
        active: true,
      },
    }),
    payload.find({
      ...read,
      collection: 'design-models',
      select: {
        title: true,
        shortDescription: true,
        coverImage: true,
        galleryImages: true,
        seoImage: true,
        _status: true,
      },
    }),
    payload.find({
      ...read,
      collection: 'showrooms',
      select: {
        title: true,
        shortDescription: true,
        coverImage: true,
        seoImage: true,
        _status: true,
      },
    }),
    payload.findGlobal({
      slug: 'about-page',
      user,
      overrideAccess: false,
      depth: 1,
      draft: true,
      select: {
        heading: true,
        subtitle: true,
        heroImage: true,
        storyImage: true,
        teamImage: true,
        teamMembers: true,
        galleryImages: true,
        seoImage: true,
        _status: true,
      },
    }),
    getHomepageData(),
    getHomepageServices(),
    getFeaturedModels(),
    getPublicSiteSettings(),
    payload.find({
      ...read,
      collection: 'showroom-scenes',
      select: {
        title: true,
        panoramaImage: true,
        thumbnailImage: true,
        showroom: true,
        _status: true,
      },
    }),
  ])
  const [
    projects,
    services,
    models,
    showrooms,
    about,
    home,
    homeServices,
    homeModels,
    settings,
    scenes,
  ] = results
  const notificationSettings = await payload
    .findGlobal({
      slug: 'site-settings',
      user,
      overrideAccess: false,
      depth: 0,
      select: { notificationRecipientEmail: true },
    })
    .catch(() => null)
  const names = [
    'Projeler',
    'Hizmetler',
    'Modeller',
    'Showroom',
    'Hakkımızda',
    'Ana sayfa görselleri',
    'Ana sayfa hizmetleri',
    'Ana sayfa modelleri',
    'Site ayarları',
    'Showroom sahneleri',
  ]
  const errors = results.flatMap((result, index) =>
    result.status === 'rejected' ? [names[index]] : [],
  )
  const cards = (
    docs: CardDoc[],
    collection: 'projects' | 'services' | 'design-models' | 'showrooms',
  ): ContentRecord[] =>
    docs.map((doc) => {
      const image = projectImage(doc.coverImage)
      return {
        id: String(doc.id),
        title: doc.title,
        description: doc.shortDescription || undefined,
        image: image ? { url: image.thumbnailUrl || image.url, alt: image.alt } : undefined,
        editorHref: href(`/collections/${collection}/${doc.id}`),
        status:
          doc.active === false
            ? 'Pasif'
            : doc._status === 'published'
              ? 'Yayınlanmış kayıt'
              : 'Son kayıt: taslak',
      }
    })
  const liveCards = (
    docs: Array<{
      id: string | number
      title: string
      description?: string
      shortDescription?: string
      coverImage?: { url: string; alt: string }
      cover?: { url: string; alt: string; thumbnailUrl?: string }
    }>,
    collection: 'projects' | 'services' | 'design-models',
  ): ContentRecord[] =>
    docs.map((doc) => ({
      id: String(doc.id),
      title: doc.title,
      description: doc.shortDescription || doc.description,
      image:
        doc.coverImage ||
        (doc.cover
          ? { url: doc.cover.thumbnailUrl || doc.cover.url, alt: doc.cover.alt }
          : undefined),
      status: 'Sitede kullanılan kayıt',
      editorHref: href(`/collections/${collection}/${doc.id}`),
    }))
  const collectionSection = (
    title: string,
    collection: 'projects' | 'services' | 'design-models' | 'showrooms',
    description: string,
    records: ContentRecord[],
    liveHref: string,
  ): ContentSection => ({
    title,
    description,
    records,
    editorHref: href(`/collections/${collection}`),
    editorLabel: 'Tüm kayıtları yönet',
    liveHref,
    emptyMessage:
      'Henüz kayıt yok veya kayıtlar okunamadı. Tüm kayıtları yönet bağlantısından kontrol edebilir, onaylı içeriğinizi ekleyebilirsiniz.',
  })
  const heroPhotos = resolveHeroPhotos(
    home.status === 'fulfilled' ? home.value.heroImages : [],
    settings.status === 'fulfilled' ? settings.value.heroImages : {},
  )
  const copy = settings.status === 'fulfilled' ? settings.value.homepage : undefined
  const publicSettings = settings.status === 'fulfilled' ? settings.value : null
  const publishedCount = (result: typeof projects | typeof services | typeof models | typeof showrooms) =>
    result.status === 'fulfilled'
      ? result.value.docs.filter((doc) => doc._status === 'published').length
      : 0
  const publishedScenes =
    scenes.status === 'fulfilled'
      ? scenes.value.docs.filter(
          (scene) => scene._status === 'published' && Boolean(projectImage(scene.panoramaImage)),
        ).length
      : 0
  const productionOriginReady = (() => {
    try {
      const url = new URL(process.env.SITE_URL || '')
      return url.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)
    } catch {
      return false
    }
  })()
  const smtpReady = Boolean(smtpConfiguration())
  const recipientReady = Boolean(
    approvedNotificationRecipient(notificationSettings?.notificationRecipientEmail),
  )
  const readinessItems: LaunchReadinessItem[] = [
    {
      title: 'Projeler ve galeriler',
      description: `${publishedCount(projects)} yayınlanmış proje bulundu. Kapak, açıklama, galeri, konum ve SEO bilgileri Projeler ekranından yönetilir.`,
      status: publishedCount(projects) > 0 ? 'ready' : 'blocked',
      href: href('/collections/projects'),
      action: 'Projeleri yönet',
    },
    {
      title: 'Hizmetler ve modeller',
      description: `${publishedCount(services)} hizmet ve ${publishedCount(models)} model yayında. Ana sayfa kartları da bu yayınlanmış kayıtlardan beslenir.`,
      status: publishedCount(services) > 0 && publishedCount(models) > 0 ? 'ready' : 'blocked',
      href: href('/collections/services'),
      action: 'Kataloğu kontrol et',
    },
    {
      title: 'Showroom ve 360° sahneler',
      description: `${publishedCount(showrooms)} showroom ve geçerli panoraması bulunan ${publishedScenes} yayınlanmış sahne var. Hotspot ve başlangıç açıları Sahne ekranında yönetilir.`,
      status: publishedCount(showrooms) > 0 && publishedScenes > 0 ? 'ready' : 'blocked',
      href: href('/collections/showroom-scenes'),
      action: '360° sahneleri yönet',
    },
    {
      title: 'Ana sayfa açılışı ve yedek görsel',
      description: `Sinematik açılış uygulamanın kare dizisini kullanır. Açılış ve kapanış metinleri Site ayarlarından düzenlenir; yedek görsel isteğe bağlıdır.`,
      status: heroPhotos.some(({ position, image }) => position === 'center' && Boolean(image)) ? 'ready' : 'warning',
      href: settingsHref,
      action: 'Ana sayfayı düzenle',
    },
    {
      title: 'İletişim ve formlar',
      description:
        publicSettings?.contactEmail &&
        publicSettings.phone &&
        publicSettings.whatsappHref &&
        publicSettings.privacyNoticeContent &&
        publicSettings.contactFormEnabled &&
        publicSettings.quoteFormEnabled
          ? 'E-posta, telefon, WhatsApp, KVKK ve iki form da etkin.'
          : 'İletişim bilgileri, KVKK veya form anahtarlarından en az biri eksik.',
      status:
        publicSettings?.contactEmail &&
        publicSettings.phone &&
        publicSettings.whatsappHref &&
        publicSettings.privacyNoticeContent &&
        publicSettings.contactFormEnabled &&
        publicSettings.quoteFormEnabled
          ? 'ready'
          : 'blocked',
      href: settingsHref,
      action: 'Form ayarlarını aç',
    },
    {
      title: 'Bildirim e-postaları',
      description:
        smtpReady && recipientReady
          ? 'SMTP ve onaylı bildirim alıcısı yapılandırılmış.'
          : 'Başvurular veritabanına kaydolur; e-posta bildirimi için production SMTP sırları ve onaylı alıcı tamamlanmalıdır.',
      status: smtpReady && recipientReady ? 'ready' : 'blocked',
      href: settingsHref,
      action: 'Alıcı ayarını kontrol et',
    },
    {
      title: 'SEO ve production adresi',
      description:
        publicSettings?.defaultSeoTitle &&
        publicSettings.defaultSeoDescription &&
        productionOriginReady
          ? 'Varsayılan SEO bilgileri ve HTTPS SITE_URL hazır.'
          : 'Varsayılan SEO başlığı/açıklaması veya production ortamındaki HTTPS SITE_URL eksik.',
      status:
        publicSettings?.defaultSeoTitle &&
        publicSettings.defaultSeoDescription &&
        productionOriginReady
          ? 'ready'
          : 'blocked',
      href: settingsHref,
      action: 'SEO ayarlarını aç',
    },
    {
      title: 'Çerez politikası',
      description: publicSettings?.cookiePolicy.ready
        ? 'Onaylı politika ve sürüm yapılandırılmış.'
        : 'Onaylı politika ve sürüm girilene kadar yalnızca zorunlu depolama çalışır.',
      status: publicSettings?.cookiePolicy.ready ? 'ready' : 'warning',
      href: settingsHref,
      action: 'Çerez politikasını aç',
    },
    {
      title: 'Adres ve harita',
      description: publicSettings?.address
        ? 'Kurumsal adres ziyaretçiye gösterilmeye hazır.'
        : 'Gerçek şirket adresi henüz girilmediği için sitede adres gösterilmiyor.',
      status: publicSettings?.address ? 'ready' : 'warning',
      href: settingsHref,
      action: 'İletişim bilgilerini aç',
    },
  ]
  const photoSections: PhotoSection[] = [
    {
      page: 'projects',
      title: 'Proje kapakları ve detay albümleri',
      description:
        'Sıralamadaki ilk sekiz kaydın son sürümleri. Diğer projeler için Tüm kayıtlar düğmesini kullanın. Taslak fotoğraflar ziyaretçiye yayınlanana kadar gösterilmez.',
      target: 'projects',
      error: projects.status === 'rejected',
      documents:
        projects.status === 'fulfilled'
          ? projects.value.docs.map((doc) =>
              photoDocument('projects', doc, doc.title, `projects:${doc.id}`),
            )
          : [],
    },
    {
      page: 'services',
      title: 'Hizmet fotoğrafları',
      description:
        'İlk sekiz hizmetin kapak, albüm ve paylaşım alanları. Ziyaretçi yalnızca aktif ve yayınlanmış hizmetleri görür.',
      target: 'services',
      error: services.status === 'rejected',
      documents:
        services.status === 'fulfilled'
          ? services.value.docs.map((doc) =>
              photoDocument('services', doc, doc.title, `services:${doc.id}`),
            )
          : [],
    },
    {
      page: 'models',
      title: 'Model fotoğrafları',
      description:
        'İlk sekiz modelin kapak ve detay fotoğrafları. Katalog görselleri, tamamlanmış proje fotoğraflarından ayrı yönetilir.',
      target: 'design-models',
      error: models.status === 'rejected',
      documents:
        models.status === 'fulfilled'
          ? models.value.docs.map((doc) =>
              photoDocument('design-models', doc, doc.title, `design-models:${doc.id}`),
            )
          : [],
    },
    {
      page: 'showroom',
      title: 'Showroom kart kapakları',
      description:
        'İlk sekiz showroom’un normal kapak fotoğrafları. Tur içindeki görüntüler Sahne panoramaları bölümündedir.',
      target: 'showrooms',
      error: showrooms.status === 'rejected',
      documents:
        showrooms.status === 'fulfilled'
          ? showrooms.value.docs.map((doc) =>
              photoDocument('showrooms', doc, doc.title, `showrooms:${doc.id}`),
            )
          : [],
    },
    {
      page: 'showroom',
      title: 'Sahne panoramaları ve küçük önizlemeler',
      description:
        'İlk sekiz sahne. Doğru showroom’u ve sahneyi seçip önce gerçek panoramayı, sonra isteğe bağlı küçük resmi yerleştirin. Tüm sahneler için kayıt listesini açın.',
      target: 'showroom-scenes',
      error: scenes.status === 'rejected',
      documents:
        scenes.status === 'fulfilled'
          ? scenes.value.docs.map((doc) =>
              photoDocument(
                'showroom-scenes',
                doc,
                `${typeof doc.showroom === 'object' && doc.showroom ? doc.showroom.title + ' · ' : ''}${doc.title}`,
                `showroom-scenes:${doc.id}`,
              ),
            )
          : [],
    },
    {
      page: 'about',
      title: 'Hakkımızda · girişten şirket albümüne',
      description:
        'Sayfa akışı: giriş → hikâye → toplu ekip fotoğrafı → kişisel portreler → şirket albümü. Seçili proje kartları ilgili projenin kapağını kullanır.',
      target: 'about-page',
      error: about.status === 'rejected',
      documents:
        about.status === 'fulfilled'
          ? [photoDocument('about-page', about.value, 'Hakkımızda', 'about-page')]
          : [],
    },
    ...['contact', 'quote', 'cookies'].map((page): PhotoSection => ({
      page,
      title: 'Site geneli · logo ve fotoğraf kullanımı',
      description:
        'Bu sayfalarda ayrı kapak veya arka plan fotoğrafı alanı bulunmaz. İletişim bilgileri ve onaylı politika metinleri kendi sekmelerinden yönetilir.',
      target: 'site-settings',
      error: settings.status === 'rejected',
      documents:
        settings.status === 'fulfilled'
          ? [
              photoDocument(
                'site-settings',
                { logo: settings.value.logo },
                'Site ayarları',
                'site-settings',
              ),
            ]
          : [],
    })),
    {
      page: 'home',
      title: 'Küre kartları ve kaydırmalı Seçili işler',
      description:
        'Ana sayfada kullanılan yayınlanmış ilk dört seçili proje. Aynı projenin kapağı küre kartında, kaydırmalı fotoğrafta ve proje arşivinde paylaşılır.',
      target: 'projects',
      error: home.status === 'rejected',
      documents:
        home.status === 'fulfilled'
          ? home.value.projects.map((doc) => ({
              ...photoDocument(
                'projects',
                { coverImage: doc.coverImage },
                doc.title,
                `projects:${doc.id}`,
              ),
              status: 'Sitede kullanılan yayınlanmış proje',
              placements: photoDocument(
                'projects',
                { coverImage: doc.coverImage },
                doc.title,
                `projects:${doc.id}`,
              ).placements.filter(({ field }) => field === 'coverImage'),
            }))
          : [],
    },
    {
      page: 'home',
      title: 'Animasyonlu hizmet alanı',
      description:
        'Ana sayfada kullanılan en fazla dört aktif ve yayınlanmış hizmet. Sabit video bulunan hizmetlerde video kapağın üzerinde oynar; fotoğrafı seçmek videonun içeriğini değiştirmez.',
      target: 'services',
      error: homeServices.status === 'rejected',
      documents:
        homeServices.status === 'fulfilled'
          ? homeServices.value.map((doc) => ({
              ...photoDocument(
                'services',
                { coverImage: doc.cover },
                doc.title,
                `services:${doc.id}`,
              ),
              status: 'Sitede kullanılan yayınlanmış hizmet',
              placements: photoDocument(
                'services',
                { coverImage: doc.cover },
                doc.title,
                `services:${doc.id}`,
              ).placements.filter(({ field }) => field === 'coverImage'),
            }))
          : [],
    },
    {
      page: 'home',
      title: 'Tasarım koleksiyonu karuseli',
      description:
        'Ana sayfada kullanılan en fazla üç yayınlanmış, öne çıkarılmış model. Burada seçilen kapak model katalog kartını ve model detayını da değiştirir.',
      target: 'design-models',
      error: homeModels.status === 'rejected',
      documents:
        homeModels.status === 'fulfilled'
          ? homeModels.value.map((doc) => ({
              ...photoDocument(
                'design-models',
                { coverImage: doc.cover },
                doc.title,
                `design-models:${doc.id}`,
              ),
              status: 'Sitede kullanılan yayınlanmış model',
              placements: photoDocument(
                'design-models',
                { coverImage: doc.cover },
                doc.title,
                `design-models:${doc.id}`,
              ).placements.filter(({ field }) => field === 'coverImage'),
            }))
          : [],
    },
  ]
  const aboutDoc = about.status === 'fulfilled' ? about.value : null
  const aboutRecords: ContentRecord[] = aboutDoc
    ? [
        { field: 'Giriş görseli', image: aboutDoc.heroImage },
        { field: 'Şirket hikâyesi görseli', image: aboutDoc.storyImage },
        { field: 'Ekip görseli', image: aboutDoc.teamImage },
      ].map(({ field, image }, index) => {
        const photo = projectImage(image)
        return {
          id: `about-${index}`,
          title: field,
          image: photo ? { url: photo.thumbnailUrl || photo.url, alt: photo.alt } : undefined,
          description:
            index === 0
              ? aboutDoc.subtitle || 'Hakkımızda sayfasının en üstündeki tanıtım.'
              : `${field} alanını Hakkımızda düzenleme ekranında bulun.`,
          editorHref: href('/globals/about-page'),
          status: aboutDoc._status === 'published' ? 'Yayınlanmış kayıt' : 'Son kayıt: taslak',
        }
      })
    : []
  const pages: ContentPage[] = [
    {
      id: 'home',
      title: 'Ana Sayfa',
      path: '/',
      description:
        'Bölümler, ziyaretçinin gördüğü sırayla. Aşağıdaki fotoğraflar yayınlanan içeriklerden gelir.',
      sections: [
        {
          title: 'Başlıklar ve açıklamalar',
          description:
            'Açılış metni, iletişim çağrısı, küre, seçili işler, hizmetler, modeller ve atölye bölüm başlıkları Site ayarları → Ana sayfa metinleri sekmesindedir.',
          editorHref: settingsHref,
          editorLabel: 'Ana sayfa metinlerini düzenle',
          liveHref: '/',
          emptyMessage: 'Metinleri Site ayarları ekranında düzenleyin.',
          records: copy
            ? HOMEPAGE_SECTIONS.map((section, index) => ({
                id: `copy-${index}`,
                kind: 'text',
                title: section.label,
                description: section.fields.map(({ name }) => copy[name]).join(' · '),
                editorHref: settingsHref,
                location: 'Site ayarları → Ana sayfa metinleri',
              }))
            : [],
        },
        collectionSection(
          'Küre ve seçili işler',
          'projects',
          '“Öne çıkar” işaretli yayınlanmış ilk dört projenin kapağı ve kısa açıklaması kullanılır. Küre ayrıca geçerli şehir / ülke koordinatları ister. Projenin kapağını değiştirmek o projenin diğer fotoğraf alanlarını da etkiler.',
          home.status === 'fulfilled' ? liveCards(home.value.projects, 'projects') : [],
          '/#one-cikan',
        ),
        collectionSection(
          'Çalışma alanları / hizmet kartları',
          'services',
          'En fazla dört aktif ve yayınlanmış hizmet. Öncelikli kayıtlar önce gelir. Kart fotoğrafı “Kapak görseli”, kart metni “Kısa açıklama” alanıdır.',
          homeServices.status === 'fulfilled' ? liveCards(homeServices.value, 'services') : [],
          '/#hizmetler',
        ),
        collectionSection(
          'Tasarım koleksiyonu / model kartları',
          'design-models',
          '“Ana sayfada öne çıkar” işaretli yayınlanmış ilk üç model. Yayınlanmış seçili model yoksa bu bölüm sitede gizlenir.',
          homeModels.status === 'fulfilled' ? liveCards(homeModels.value, 'design-models') : [],
          '/modeller',
        ),
        {
          title: 'Atölye tanıtım animasyonu',
          description:
            'Sitenin altındaki çizim animasyonu sabit uygulama varlığıdır; medya yüklemesiyle değişmez. Yanındaki başlık, açıklama ve düğme metni Ana sayfa metinleri sekmesinden düzenlenir.',
          editorHref: settingsHref,
          records: [],
          emptyMessage: 'Tanıtım animasyonu proje fotoğraflarından bağımsızdır.',
          liveHref: '/tasarim-olustur',
        },
      ],
    },
    {
      id: 'projects',
      title: 'Projeler',
      path: '/projeler',
      description:
        'Arşiv, proje detayı, ana sayfanın seçili işleri ve küre aynı proje kayıtlarını kullanır. Aşağıda sıralamadaki ilk sekiz kaydın son kayıtları bulunur.',
      sections: [
        collectionSection(
          'Proje kapakları ve anlatımları',
          'projects',
          'Kapak: arşiv kartı ve detay açılışı. Kısa açıklama: liste / ana sayfa kartı. Proje anlatımı: detayın uzun metni. Galeri: detayın açılır fotoğraf albümü. Sosyal paylaşım görseli: sayfa içindeki kapak değildir.',
          projects.status === 'fulfilled' ? cards(projects.value.docs, 'projects') : [],
          '/projeler',
        ),
      ],
    },
    {
      id: 'services',
      title: 'Hizmetler',
      path: '/hizmetler',
      description: 'Hizmet arşivi ve hizmet detaylarının fotoğrafları, kısa ve uzun açıklamaları.',
      sections: [
        collectionSection(
          'Hizmet görselleri ve metinleri',
          'services',
          'Kapak: liste / ana sayfa kartı ve detay girişi. Galeri: detay albümü. Kısa açıklama: kart metni. Hizmet anlatımı: detayın ana metni. Ziyaretçi yalnızca aktif ve yayınlanmış kayıtları görür.',
          services.status === 'fulfilled' ? cards(services.value.docs, 'services') : [],
          '/hizmetler',
        ),
      ],
    },
    {
      id: 'models',
      title: 'Modeller',
      path: '/modeller',
      description: 'Tasarım kataloğu; tamamlanmış proje portföyünden ayrı yönetilir.',
      sections: [
        collectionSection(
          'Model kapakları ve galerileri',
          'design-models',
          'Kapak: katalog ve seçili model kartı. Kısa açıklama: kart metni. Model anlatımı / Model galerisi: detay sayfası. Ana sayfada öne çıkar: ana sayfa koleksiyonuna dahil eder. Referans sınıfını yalnızca doğrulanmış bilgiyle seçin.',
          models.status === 'fulfilled' ? cards(models.value.docs, 'design-models') : [],
          '/modeller',
        ),
      ],
    },
    {
      id: 'showroom',
      title: 'Showroom',
      path: '/showroom',
      description: 'Normal kapak fotoğrafı ile 360° tur panoraması farklı alanlardır.',
      sections: [
        collectionSection(
          'Showroom kapakları ve açıklamaları',
          'showrooms',
          'Kapak: showroom liste kartı. Kısa açıklama: liste / detay özeti. Showroom anlatımı: detayın uzun açıklaması. Tur içindeki görüntüler Showroom sahneleri ekranından değişir.',
          showrooms.status === 'fulfilled' ? cards(showrooms.value.docs, 'showrooms') : [],
          '/showroom',
        ),
        {
          title: '360° sahneler ve geçiş noktaları',
          description:
            '360° panorama alanı gerçek 2:1 JPEG/WebP ister. Küçük önizleme normal fotoğraftır. Sahne açıklaması sahne listesinde görünür. Hem showroom hem sahne yayınlanmış olmalıdır. Referanslı sahneyi silmeden önce gelen geçiş noktalarını kaldırın.',
          editorHref: href('/collections/showroom-scenes'),
          records: [],
          emptyMessage:
            'Sahne listesinde bağlı showroom’u seçip panorama, açıklama ve geçiş noktalarını düzenleyin.',
        },
      ],
    },
    {
      id: 'about',
      title: 'Hakkımızda',
      path: '/hakkimizda',
      description:
        'Footer bağlantısı kaldırılmıştır; sayfa ve içerikleri korunur. Aşağıdaki önizlemeler en son kaydı gösterir; taslaklar ayrıca yayınlanmalıdır.',
      sections: [
        {
          title: 'Şirket, hikâye ve ekip',
          description:
            'Giriş sekmesi: başlık, kısa tanıtım ve üst görsel. Hikâye ve uzmanlık: şirket anlatımı. Ekip: ekip görseli ve portreler. Yaklaşım ve görseller: süreç adımları, şirket galerisi, seçili projeler. SEO: arama sonucu ve sosyal paylaşım.',
          editorHref: href('/globals/about-page'),
          records: aboutRecords,
          emptyMessage: 'Hakkımızda içeriği henüz hazırlanmamış veya okunamadı.',
          liveHref: '/hakkimizda',
        },
      ],
    },
    {
      id: 'contact',
      title: 'İletişim ve footer',
      path: '/iletisim',
      description:
        'İletişim bilgileri tek yerden yönetilir; footer ve iletişim sayfalarına birlikte yansır.',
      sections: [
        {
          title: 'Footer, iletişim bilgileri ve Instagram',
          description:
            'Şirket ve iletişim sekmesi: header/footer logosu, logo altı açıklaması, telefon, e-posta, adres ve WhatsApp. Sosyal medya sekmesi: Instagram ve diğer profiller. Boş logo alanında yerleşik RTM logosu, boş sosyal bağlantılarda ise hiçbir düğme gösterilmez.',
          editorHref: settingsHref,
          records:
            settings.status === 'fulfilled'
              ? [
                  {
                    id: 'footer',
                    kind: 'text',
                    title: settings.value.companyName,
                    description: settings.value.companyDescription,
                    editorHref: settingsHref,
                    location: 'Footer → logonun altındaki açıklama',
                  },
                  ...settings.value.socials.map((social): ContentRecord => ({
                    id: social.label,
                    kind: 'text',
                    title: social.label,
                    description: social.href,
                    editorHref: settingsHref,
                    location: 'Footer + iletişim sayfası → sosyal medya',
                  })),
                ]
              : [],
          emptyMessage: 'İletişim bilgilerini Site ayarları ekranından girin.',
          liveHref: '/#iletisim',
        },
        {
          title: 'Formlar ve aydınlatma',
          description:
            'Site ve formlar sekmesi: form anahtarları ve sunucu bildirim ayarları. Aydınlatma metni sekmesi: onaylı metin / HTTPS bağlantısı. Onaylı aydınlatma olmadan formlar açılamaz. Başvuruların kişisel verileri yalnızca Başvurular ekranındadır.',
          editorHref: settingsHref,
          records: [],
          emptyMessage: 'Hukuki metinleri yalnızca onaylı kaynağınızdan girin.',
          liveHref: '/iletisim',
        },
      ],
    },
    {
      id: 'assistant',
      title: 'Asistan ve politikalar',
      path: 'Site geneli',
      description: 'Yardımcı cevapları ve çerez tercihleri ilgili yönetim ekranlarında tutulur.',
      sections: [
        {
          title: 'Site asistanı',
          description:
            'Asistan ayarları: açılış / karşılama. Onaylı cevaplar ve Sık sorulan sorular: cevap içerikleri. Fiyat, süre veya garanti bilgisi yalnızca doğrulanmış içerikten gelmelidir.',
          editorHref: href('/globals/assistant-settings'),
          records: [],
          emptyMessage:
            'Asistan ayarlarını açın; cevapları menüdeki Onaylı cevaplar ve Sık sorulan sorular kayıtlarından yönetin.',
        },
        {
          title: 'Çerez politikası',
          description:
            'Site ayarları → Çerez politikası sekmesi. Onaylı politika ve sürüm olmadan isteğe bağlı kategoriler kapalıdır. Sürümü değiştirmek ziyaretçinin tercihini yeniden sorar.',
          editorHref: settingsHref,
          records: [],
          emptyMessage:
            'Politika metnini, bağlantısını, sürümünü ve banner açıklamasını aynı sekmeden yönetin.',
          liveHref: '/cerez-politikasi',
        },
      ],
    },
  ]
  return (
    <VisualStudio
      heroPhotos={heroPhotos}
      heroVariant={activeHeroVariant()}
      photoSections={photoSections}
      readiness={<LaunchReadiness items={readinessItems} />}
      guide={
        <ContentGuide key="content-guide" pages={pages} errors={errors} photosHref={settingsHref} />
      }
    />
  )
}
