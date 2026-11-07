'use client'

import { useEffect, useRef, useState } from 'react'
import { StudioIcon } from './StudioIcon'
import { safeStorage } from '@/lib/consent/storage'

const pages = [
  {
    body: 'Ürününüzü seçin ve dış ölçüleri belirleyin. Kilitlediğiniz bölme ve göz ölçüleri sonraki düzenlemelerde korunur.',
    icon: 'measure' as const,
    label: 'Temel ölçüler',
    title: 'Ölçülerle başlayın.',
  },
  {
    body: 'Sahnede veya tasarım özetinde bir göz seçin; iç düzenini ve kapaklarını panelden değiştirin.',
    icon: 'door' as const,
    label: 'İç düzen',
    title: 'Dokunun, düzenleyin.',
  },
  {
    body: 'Bağlantıyı kopyalayın veya PDF/PNG indirin. Kişisel başvuru bilgileriniz tasarım kaydına eklenmez.',
    icon: 'download' as const,
    label: 'Paylaş ve indir',
    title: 'Fikrinizi yanınıza alın.',
  },
]
const storageKey = 'rtm-studio-guide-v1'
/** In-memory for this page session (client navigation), never persisted. */
let sessionSeen = false

export function StudioGuide({ requested, onClose }: { requested: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [page, setPage] = useState(0)
  useEffect(() => {
    // Without Functional consent the guide is remembered for this visit only.
    if (safeStorage.get(storageKey) !== 'seen' && !sessionSeen) dialog.current?.showModal()
  }, [])
  useEffect(() => {
    if (requested && !dialog.current?.open) dialog.current?.showModal()
  }, [requested])
  function finish() {
    sessionSeen = true
    safeStorage.set(storageKey, 'seen', 'functional')
    dialog.current?.close()
  }
  const activePage = pages[page]
  return (
    <dialog
      ref={dialog}
      className="dc-dialog dc-guide"
      aria-labelledby="studio-guide-title"
      onCancel={finish}
      onClose={() => {
        setPage(0)
        onClose()
      }}
    >
      <header className="dc-guide-header">
        <div>
          <p className="dc-eyebrow">RTM TASARIM ATÖLYESİ</p>
          <p className="dc-guide-step">Kısa rehber · {page + 1}/3</p>
        </div>
        <button type="button" className="dc-guide-close" onClick={finish} aria-label="Rehberi kapat">
          <StudioIcon name="close" />
        </button>
      </header>
      <nav className="dc-guide-progress" aria-label="Rehber adımları">
        {pages.map((item, index) => (
          <button
            type="button"
            aria-current={index === page ? 'step' : undefined}
            aria-label={`${index + 1}. adım: ${item.label}`}
            key={item.label}
            onClick={() => setPage(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </nav>
      <div className="dc-guide-art" aria-hidden="true">
        <span className="dc-guide-art-label">{activePage.label}</span>
        <StudioIcon name={activePage.icon} />
        <span className="dc-guide-art-index">0{page + 1}</span>
      </div>
      <h2 id="studio-guide-title">{activePage.title}</h2>
      <p>{activePage.body}</p>
      <div className="dc-guide-actions">
        <div className="dc-guide-secondary-actions">
          {page > 0 ? (
            <button type="button" onClick={() => setPage(page - 1)}>
              Geri
            </button>
          ) : null}
          <button type="button" onClick={finish}>Rehberi atla</button>
        </div>
        <button type="button" className="dc-primary" onClick={() => (page === 2 ? finish() : setPage(page + 1))}>
          {page === 2 ? 'Tasarlamaya başla' : 'Devam et'}
          <StudioIcon name="arrow" />
        </button>
      </div>
    </dialog>
  )
}
