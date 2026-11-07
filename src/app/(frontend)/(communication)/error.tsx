'use client'

export default function CommunicationError({ reset }: { reset: () => void }) {
  return (
    <main className="site-shell communication-page" id="main-content">
      <p className="eyebrow">Bağlantı kesintisi</p>
      <h1>Sayfa şu anda açılamadı.</h1>
      <p className="section-intro">Bir süre sonra yeniden deneyebilirsiniz.</p>
      <button type="button" className="button-primary mt-6" onClick={reset}>
        Yeniden dene ↗
      </button>
    </main>
  )
}
