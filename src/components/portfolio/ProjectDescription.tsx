import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Project } from '@/payload-types'
import { safeConverters } from './richTextConverters'

export function ProjectDescription({ content }: { content: Project['description'] }) {
  if (!content?.root?.children?.length) return null
  return <RichText className="project-richtext" converters={safeConverters} data={content} />
}
