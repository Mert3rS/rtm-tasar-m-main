import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { tr } from 'payload/i18n/tr'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Cities } from './collections/Cities'
import { Countries } from './collections/Countries'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { ProjectCategories } from './collections/ProjectCategories'
import { Users } from './collections/Users'
import { Showrooms } from './collections/Showrooms'
import { ShowroomScenes } from './collections/ShowroomScenes'
import { uploadLimitBytes } from './lib/panoramaValidation'
import { Inquiries } from './collections/Inquiries'
import { FormRateLimits } from './collections/FormRateLimits'
import { SiteSettings } from './globals/SiteSettings'
import { configuredEmailAdapter } from './lib/smtp'
import { Services } from './collections/Services'
import { DesignModels } from './collections/DesignModels'
import { ModelCategories } from './collections/ModelCategories'
import { AboutPage } from './globals/AboutPage'
import { AssistantSettings } from './globals/AssistantSettings'
import { AssistantAnswers } from './collections/AssistantAnswers'
import { Faqs } from './collections/Faqs'
import { AssistantUnanswered } from './collections/AssistantUnanswered'
import { AssistantFeedback } from './collections/AssistantFeedback'
import { ConsentRecords } from './collections/ConsentRecords'
import { DesignShares } from './collections/DesignShares'
import { InquiryAttachments } from './collections/InquiryAttachments'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  i18n: {
    fallbackLanguage: 'tr',
    supportedLanguages: { tr },
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      Nav: '/components/admin/AdminNav#AdminNav',
      graphics: {
        Icon: '/components/admin/AdminBrand#AdminIcon',
        Logo: '/components/admin/AdminBrand#AdminLogo',
      },
      views: {
        dashboard: {
          Component: '/components/admin/AdminDashboard#AdminDashboard',
        },
      },
    },
    theme: 'all',
  },
  collections: [
    Users,
    Media,
    Countries,
    Cities,
    ProjectCategories,
    Projects,
    Showrooms,
    ShowroomScenes,
    Inquiries,
    FormRateLimits,
    Services,
    DesignModels,
    ModelCategories,
    AssistantAnswers,
    Faqs,
    AssistantUnanswered,
    AssistantFeedback,
    ConsentRecords,
    DesignShares,
    InquiryAttachments,
  ],
  globals: [SiteSettings, AboutPage, AssistantSettings],
  email: configuredEmailAdapter(),
  upload: {
    limits: { fileSize: uploadLimitBytes() },
    requestSizeLimit: uploadLimitBytes() + 1024 * 1024,
    abortOnLimit: true,
    responseOnLimit: 'Dosya yükleme boyutu sınırı aşıldı.',
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [],
})
