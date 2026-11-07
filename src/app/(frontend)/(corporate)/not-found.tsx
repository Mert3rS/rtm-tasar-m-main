import Link from 'next/link'

export default function CorporateNotFound() {
  return (
    <main className="site-shell corporate-error" id="main-content">
      <p className="eyebrow">404 / İçerik bulunamadı</p>
      <h1>Bu içerik şu anda yayında değil.</h1>
      <p className="section-intro">Diğer tasarımları ve hizmetlerimizi keşfedebilirsiniz.</p>
      <div className="corporate-inline-links">
        <Link className="text-link" href="/modeller">
          Modelleri keşfedin ↗
        </Link>
        <Link className="text-link" href="/hizmetler">
          Hizmetleri keşfedin ↗
        </Link>
      </div>
    </main>
  )
}
