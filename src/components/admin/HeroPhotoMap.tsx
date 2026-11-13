'use client'

import Image from 'next/image'
import { ImagePlus, Pencil } from 'lucide-react'
import { useState } from 'react'
import type { HeroPhoto, HeroPositionKey } from '@/lib/homepageHero'
import { ASSEMBLY_FILM, FRAME_COUNT, HERO_CHAPTERS, HERO_FILM, heroFramePath, type HeroVariant } from '@/lib/heroSequence'

export function HeroPhotoMap({ photos, onSelect, variant }: {
  photos: HeroPhoto[]
  onSelect: (position: HeroPositionKey) => void
  variant: HeroVariant
}) {
  const [step, setStep] = useState(0)
  const film = variant === 'assembly' ? ASSEMBLY_FILM : HERO_FILM
  const stages = [
    { title: 'İlk açılış', note: 'Üst başlık, ana başlık ve proje bağlantısı', progress: 0 },
    ...HERO_CHAPTERS.map((chapter) => ({
      title: chapter.title, note: chapter.note, progress: (chapter.start + chapter.end) / 2,
    })),
    { title: 'Kapanış', note: 'İletişim çağrısı', progress: 1 },
  ]
  const stage = stages[step]
  const fallback = photos.find(({ position }) => position === 'center')

  return (
    <section className="rtm-hero-photos" aria-label="Sinematik açılış yönetimi">
      <header>
        <p className="rtm-hero-photos-eyebrow">ANA SAYFA / SİNEMATİK AÇILIŞ</p>
        <h2>Mekân. Malzeme. Detay.</h2>
        <p>
          Kaydırmayla ilerleyen mutfak animasyonu, üç bölüm ve kapanış çağrısından oluşur.
          Aşamaları seçerek kullanılan kareleri inceleyin; gerçek hareketi site
          önizlemesinde masaüstü ve telefon boyutlarında kontrol edin.
        </p>
      </header>
      <div className="rtm-hero-photo-phases" role="group" aria-label="Açılış aşamaları">
        {stages.map((item, index) => (
          <button type="button" key={item.title} aria-pressed={step === index} onClick={() => setStep(index)}>
            {item.title}
          </button>
        ))}
      </div>
      <figure className="rtm-hero-sequence-preview">
        <Image src={heroFramePath(Math.round(stage.progress * (FRAME_COUNT - 1)), false, variant)}
          alt={film.alt} fill sizes="(max-width: 700px) 90vw, 1000px" unoptimized />
        <figcaption aria-live="polite"><strong>{stage.title}</strong><span>{stage.note}</span></figcaption>
      </figure>
      <ol className="rtm-hero-photo-instructions">
        <li><strong>Açılış metinleri</strong> Üst başlık, ana başlık ve proje bağlantısının metni
          Ana sayfa metinleri sekmesindedir. Ana başlığın ilk cümlesi büyük başlık, devamı açıklama olarak görünür.</li>
        <li><strong>Animasyon ve bölüm yazıları</strong> Kareler, Mekân / Malzeme / Detay yazıları
          ve video bağlantısı uygulama dosyalarından gelir. Medya arşivine fotoğraf yüklemek animasyonu değiştirmez.</li>
        <li><strong>Kapanış çağrısı</strong> Animasyonun sonundaki başlık, hemen altındaki
          iletişim çağrısıyla aynı CMS alanlarını kullanır. Kaydettikten sonra her iki konumu kontrol edin.</li>
      </ol>
      <h3>Yedek açılış görseli</h3>
      <p>Animasyonun poster görseli de yüklenemezse kullanılacak fotoğrafı seçin. Bu seçim animasyon karelerini değiştirmez.</p>
      <button type="button" className="rtm-hero-fallback" onClick={() => onSelect('center')}>
        {fallback?.image ? <Image src={fallback.image.url} alt={fallback.image.alt} width={160} height={90} unoptimized /> : <ImagePlus aria-hidden="true" size={24} />}
        <span>{fallback?.source === 'selected' ? 'Seçilen yedek fotoğrafı değiştir' : fallback?.image ? 'Otomatik proje kapağı · farklı fotoğraf seç' : 'Yedek fotoğraf seç / yükle'}</span>
        <Pencil aria-hidden="true" size={16} />
      </button>
      <p className="rtm-hero-photo-tip">Yatay ve net bir görsel seçin; anlamlı alternatif metin girin.
        Seçim boşsa yayınlanmış proje kapağı yedek olabilir. Önceki kolajın diğer sekiz seçimi saklanır;
        mevcut açılışta kullanılmaz. Hareket azaltma tercihinde animasyonun son karesi gösterilir.</p>
    </section>
  )
}
