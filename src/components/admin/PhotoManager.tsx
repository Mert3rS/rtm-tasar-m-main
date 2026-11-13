'use client'

import { useState } from 'react'
import type { PhotoSection } from '@/lib/photoPlacements'
import { PhotoPlacementCards } from './PhotoPlacementCards'

const visualNotes: Record<string, string[]> = {
  home: [
    'Küre yüzeyi sabit harita dokusudur; proje fotoğrafları kürenin yanındaki karttan gelir. Şehir ve ülke ilişkileri konumu belirler.',
    'Hizmet tanıtım videoları ve dijital atölyenin kayan çizim şeridi sabit animasyonlardır. Normal bir fotoğraf yüklemek bu videoları veya animasyon karelerini değiştirmez.',
    'Kişiselleştirilmiş öneriler görünürse fotoğrafları önerilen proje, hizmet, model veya showroom’un kapağından gelir. Ayrı bir öneri fotoğrafı yüklenmez.',
  ],
  studio: [
    'Tasarım Oluştur ekranındaki mobilya, oda, malzeme ve ayna görüntüleri etkileşimli sahneden üretilir. Bu sayfa için kapak/arka plan fotoğrafı yükleme alanı yoktur. Başvuruya eklenen müşteri dosyaları site galerisi olarak yayınlanmaz.',
  ],
  about: [
    'Sayfanın Seçili projeler kartları ilgili projenin kapak görselini kullanır. Proje fotoğrafını değiştirmek için Projeler bölümündeki kaydı düzenleyin.',
  ],
}

export function PhotoManager({
  sections,
  onEdit,
  page,
}: {
  sections: PhotoSection[]
  page: string
  onEdit: (target: string, label: string, field?: string) => void
}) {
  const [sectionChoice, setSectionChoice] = useState('')
  const [documentChoice, setDocumentChoice] = useState('')
  const section = sections.find((item) => item.title === sectionChoice) || sections[0]
  if (!section)
    return visualNotes[page] ? (
      <aside className="rtm-photo-manager">
        <h2>Bu sayfanın görselleri</h2>
        {visualNotes[page].map((note) => (
          <p key={note}>{note}</p>
        ))}
      </aside>
    ) : null
  const doc = section.documents.find((item) => item.id === documentChoice) || section.documents[0]
  return (
    <section className="rtm-photo-manager" aria-label="Sayfanın fotoğraf alanları">
      <header>
        <p className="rtm-hero-photos-eyebrow">FOTOĞRAF YERLEŞİM REHBERİ</p>
        <h2>Fotoğrafı, göründüğü yere göre seçin.</h2>
        <p>
          Önce bölümü ve kaydı seçin. Fotoğrafa dokununca ilgili alan açılır. Yeni dosya
          yükleyebilir veya medya arşivinden seçebilirsiniz.
        </p>
      </header>
      <div className="rtm-photo-manager-selectors">
        {sections.length > 1 ? (
          <label>
            Bölüm
            <select
              aria-label="Bölüm"
              value={section.title}
              onChange={(event) => {
                setSectionChoice(event.target.value)
                setDocumentChoice('')
              }}
            >
              {sections.map((item) => (
                <option key={item.title} value={item.title}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {section.documents.length ? (
          <label>
            Düzenlenecek kayıt
            <select
              aria-label="Düzenlenecek kayıt"
              value={doc?.id}
              onChange={(event) => setDocumentChoice(event.target.value)}
            >
              {section.documents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          className="rtm-visual-button"
          type="button"
          onClick={() => onEdit(section.target, section.title)}
        >
          {['about-page', 'site-settings'].includes(section.target)
            ? 'Sayfa ayarlarını aç'
            : 'Tüm kayıtlar / yeni kayıt'}
        </button>
      </div>
      <p>{section.description}</p>
      {section.error ? (
        <p role="alert">
          Fotoğraflar okunamadı; bu durum içerik olmadığı anlamına gelmez. Sayfayı yenileyin veya
          ilgili kayıt listesini açın.
        </p>
      ) : doc ? (
        <>
          <p className="rtm-photo-manager-status">
            {doc.status}. Önizlemeler son kayıttandır; sitedeki yayınlanmış görünüm aşağıdaki gerçek
            önizlemede yer alır.
          </p>
          <PhotoPlacementCards
            placements={doc.placements}
            onSelect={(field, label) => onEdit(doc.target, `${doc.title} · ${label}`, field)}
          />
        </>
      ) : (
        <p className="rtm-photo-manager-status">
          Henüz kayıt yok. Önce onaylı içeriğinizle yeni bir kayıt oluşturun; fotoğrafı o kaydın
          ilgili alanında seçin.
        </p>
      )}
      <p className="rtm-hero-photo-tip">
        Medya arşivine yüklemek tek başına fotoğrafı siteye yerleştirmez. İlgili alanı seçip kaydı
        yayınlayın. Site ayarlarında Kaydet doğrudan uygulanır. Medya dosyasının kendisini
        düzenlemek aynı dosyayı kullanan diğer alanları da etkileyebilir; yalnızca bu alanı
        değiştirmek için başka bir medya kaydı seçin.
      </p>
      {visualNotes[page] ? (
        <details className="rtm-photo-visual-notes">
          <summary>Animasyonlar ve diğer görseller nereden geliyor?</summary>
          {visualNotes[page].map((note) => (
            <p key={note}>{note}</p>
          ))}
        </details>
      ) : null}
    </section>
  )
}
