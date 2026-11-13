export type ContentRecord = {
  id: string
  kind?: 'text' | 'image'
  title: string
  description?: string
  image?: { url: string; alt: string }
  editorHref: string
  status?: string
  location?: string
}

export type ContentSection = {
  title: string
  description: string
  editorHref: string
  editorLabel?: string
  liveHref?: string
  records: ContentRecord[]
  emptyMessage: string
}

export type ContentPage = {
  id: string
  title: string
  path: string
  description: string
  sections: ContentSection[]
}
