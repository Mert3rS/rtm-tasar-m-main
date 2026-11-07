import Link from 'next/link'

export default function ProjectNotFound() {
  return (
    <main className="site-shell archive-empty project-not-found" id="main-content">
      <p className="eyebrow">404 / Proje bulunamadı</p>
      <h1>
        Bu sayfa henüz
        <br />
        <em>hikâyemizin bir parçası değil.</em>
      </h1>
      <p>Proje yayında olmayabilir veya bağlantı değişmiş olabilir.</p>
      <Link className="button-primary" href="/projeler">
        Projelerimizi keşfedin ↗
      </Link>
    </main>
  )
}
