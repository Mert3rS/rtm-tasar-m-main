'use client'
export default function ShowroomError({ reset }: { reset: () => void }) {
  return (
    <main className="site-shell archive-empty" id="main-content">
      <p className="eyebrow">Kısa bir ara</p>
      <h1>Showroom şu anda yüklenemedi.</h1>
      <p>Lütfen biraz sonra yeniden deneyin.</p>
      <button className="button-primary" onClick={reset} type="button">
        Yeniden dene ↗
      </button>
    </main>
  )
}
