'use client'

export default function CorporateError({ reset }: { reset: () => void }) {
  return (
    <main className="site-shell corporate-error" id="main-content">
      <p className="eyebrow">Bağlantı kesintisi</p>
      <h1>İçerik şu anda açılamadı.</h1>
      <p className="section-intro">Bir süre sonra yeniden deneyebilirsiniz.</p>
      <button type="button" className="button-primary mt-6" onClick={reset}>
        Yeniden dene ↗
      </button>
    </main>
  )
}
