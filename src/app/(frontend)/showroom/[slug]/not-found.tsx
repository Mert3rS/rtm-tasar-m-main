import Link from 'next/link'
export default function ShowroomNotFound() {
  return (
    <main className="site-shell archive-empty project-not-found" id="main-content">
      <p className="eyebrow">404 / Showroom bulunamadı</p>
      <h1>
        Bu showroom
        <br />
        <em>şu anda yayında değil.</em>
      </h1>
      <p>Diğer yayınlanmış showroom’ları keşfedebilirsiniz.</p>
      <Link className="button-primary" href="/showroom">
        Showroom koleksiyonuna dön ↗
      </Link>
    </main>
  )
}
