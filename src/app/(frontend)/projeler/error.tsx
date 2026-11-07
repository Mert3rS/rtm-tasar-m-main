'use client'

export default function PortfolioError({ reset }: { reset: () => void }) {
  return (
    <main className="site-shell archive-empty" id="main-content">
      <p className="eyebrow">Kısa bir ara</p>
      <h1>Projeler şu anda yüklenemedi.</h1>
      <p>Lütfen bir süre sonra yeniden deneyin.</p>
      <button className="button-primary" onClick={reset} type="button">
        Yeniden dene ↗
      </button>
    </main>
  )
}
