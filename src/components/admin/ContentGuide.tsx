'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ChevronRight, ImageIcon, Search } from 'lucide-react'
import { useState } from 'react'
import type { ContentPage } from './content-types'

export function ContentGuide({
  pages,
  errors,
  photosHref,
}: {
  pages: ContentPage[]
  errors: string[]
  photosHref: string
}) {
  const [selected, setSelected] = useState('home')
  const [query, setQuery] = useState('')
  const page = pages.find((item) => item.id === selected) || pages[0]
  const term = query.trim().toLocaleLowerCase('tr-TR')
  const sections = page.sections.flatMap((section) => {
    if (
      !term ||
      `${section.title} ${section.description}`.toLocaleLowerCase('tr-TR').includes(term)
    )
      return [section]
    const records = section.records.filter((record) =>
      `${record.title} ${record.description || ''}`.toLocaleLowerCase('tr-TR').includes(term),
    )
    return records.length ? [{ ...section, records }] : []
  })

  return (
    <div className="rtm-content-hub">
      <header className="rtm-content-welcome">
        <div>
          <p className="rtm-content-eyebrow">RTM TASARIM / İÇERİK STÜDYOSU</p>
          <h1>Sitenizin her detayı, elinizin altında.</h1>
          <p>Sayfayı seçin, görselin yerini bulun, ilgili içeriği düzenleyin.</p>
        </div>
        <a className="rtm-content-action" href="/" target="_blank" rel="noopener noreferrer">
          Siteyi görüntüle <ArrowUpRight aria-hidden="true" size={18} />
        </a>
      </header>

      <ol className="rtm-content-steps" aria-label="İçerik düzenleme adımları">
        <li>
          <span>01</span> Sayfanızı seçin
        </li>
        <li>
          <span>02</span> Fotoğrafı veya metni bulun
        </li>
        <li>
          <span>03</span> Düzenleyin ve yayınlayın
        </li>
      </ol>

      {errors.length > 0 ? (
        <div className="rtm-content-warning" role="alert">
          Bazı içerikler okunamadı: {errors.join(', ')}. Bu alanlar boş olarak
          değerlendirilmemelidir. Sayfayı yenileyin; sorun sürerse yöneticinize bildirin.
        </div>
      ) : null}

      <nav className="rtm-content-page-nav" aria-label="Yönetilecek site sayfası">
        {pages.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={page.id === item.id}
            onClick={() => {
              setSelected(item.id)
              setQuery('')
            }}
          >
            {item.title}
            <span>{item.path}</span>
          </button>
        ))}
      </nav>

      <section aria-labelledby="content-guide-page-heading" className="rtm-content-page">
        <div className="rtm-content-page-heading">
          <div>
            <p className="rtm-content-eyebrow">
              SAYFA REHBERİ <ChevronRight aria-hidden="true" size={13} /> {page.path}
            </p>
            <h2 id="content-guide-page-heading">{page.title}</h2>
            <p>{page.description}</p>
          </div>
          <label className="rtm-content-search">
            <Search aria-hidden="true" size={18} />
            <span className="sr-only">Seçili sayfanın içeriğinde ara</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Başlık veya açıklama ara…"
            />
          </label>
        </div>

        {page.id === 'home' && !term ? (
          <section className="rtm-content-hero-map" aria-label="Sinematik açılış yönetimi">
            <div className="rtm-content-hero-copy">
              <h3>Mutfak animasyonu ve açılış metinleri</h3>
              <p>
                Açılış; ilk ekran, Mekân / Malzeme / Detay bölümleri ve kapanıştan oluşur.
                Animasyon kareleri ve bölüm yazıları uygulama dosyalarından gelir. Fotoğraf
                yüklemek animasyonu değiştirmez.
              </p>
              <p>
                Site ayarları → Ana sayfa açılışı sekmesinden yedek görseli seçin.
                Ana sayfa metinleri sekmesinden açılış ve kapanış yazılarını düzenleyin.
                Yedek görsel yalnızca animasyonun posteri de yüklenemezse kullanılır.
              </p>
              <Link href={photosHref} prefetch={false} className="rtm-content-action">
                Açılış ayarlarını yönet <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </section>
        ) : null}

        <div className="rtm-content-sections">
          {sections.map((section, index) => (
            <section
              className="rtm-content-section"
              key={section.title}
              aria-labelledby={`content-section-${page.id}-${index}`}
            >
              <header>
                <div>
                  <p className="rtm-content-eyebrow">
                    {String(index + 1).padStart(2, '0')} / İÇERİK ALANI
                  </p>
                  <h3 id={`content-section-${page.id}-${index}`}>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
                <div className="rtm-content-section-actions">
                  <Link className="rtm-content-action" href={section.editorHref} prefetch={false}>
                    {section.editorLabel || 'İçeriği düzenle'}{' '}
                    <ArrowUpRight aria-hidden="true" size={16} />
                  </Link>
                  {section.liveHref ? (
                    <a
                      href={section.liveHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rtm-content-live-link"
                    >
                      Sitede aç ↗
                    </a>
                  ) : null}
                </div>
              </header>
              {section.records.length ? (
                <div className="rtm-content-records">
                  {section.records.map((record) => (
                    <article className="rtm-content-record" key={record.id}>
                      {record.kind !== 'text' ? (
                        <Link
                          className={`rtm-content-record-image${record.image ? '' : ' rtm-content-record-image--empty'}`}
                          href={record.editorHref}
                          prefetch={false}
                          aria-label={`${record.title} içeriğini düzenle`}
                        >
                          {record.image ? (
                            <Image
                              src={record.image.url}
                              alt={record.image.alt}
                              fill
                              sizes="(max-width: 600px) 85vw, 280px"
                              unoptimized
                            />
                          ) : (
                            <ImageIcon aria-hidden="true" size={26} />
                          )}
                          {record.status ? (
                            <span className="rtm-content-status">{record.status}</span>
                          ) : null}
                        </Link>
                      ) : null}
                      <div className="rtm-content-record-copy">
                        {record.location ? <small>{record.location}</small> : null}
                        <h4>
                          <Link href={record.editorHref} prefetch={false}>
                            {record.title}
                          </Link>
                        </h4>
                        <p>
                          {record.description ||
                            'Açıklama eklenmemiş. Düzenleme ekranından ekleyebilirsiniz.'}
                        </p>
                        <Link
                          href={record.editorHref}
                          prefetch={false}
                          className="rtm-content-edit-link"
                        >
                          {record.kind === 'text'
                            ? 'Metinleri düzenle'
                            : 'Görseli ve metni düzenle'}{' '}
                          <ArrowUpRight aria-hidden="true" size={15} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rtm-content-empty">{section.emptyMessage}</p>
              )}
            </section>
          ))}
          {!sections.length ? (
            <p className="rtm-content-empty" role="status">
              “{query}” ile eşleşen içerik bulunamadı. Aramayı temizleyerek bütün alanları
              görebilirsiniz.
            </p>
          ) : null}
        </div>
      </section>
      <aside className="rtm-content-publishing">
        <strong>Kaydetmek ve yayınlamak</strong>
        <p>
          Proje, hizmet, model, showroom ve Hakkımızda kayıtlarında taslak değişikliklerini{' '}
          <strong>Yayınla</strong> ile siteye aktarın. Site ayarlarında <strong>Kaydet</strong>{' '}
          değişikliği doğrudan uygular. Medya arşivine fotoğraf yüklemek yeterli değildir; ilgili
          kaydın görsel alanında fotoğrafı seçmeniz gerekir.
        </p>
      </aside>
    </div>
  )
}
