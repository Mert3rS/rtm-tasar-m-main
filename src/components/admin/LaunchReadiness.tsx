export type LaunchReadinessItem = {
  action: string
  description: string
  href: string
  status: 'ready' | 'warning' | 'blocked'
  title: string
}

const statusLabel = {
  ready: 'Hazır',
  warning: 'Kontrol edin',
  blocked: 'Eksik',
} as const

export function LaunchReadiness({ items }: { items: LaunchReadinessItem[] }) {
  const ready = items.filter(({ status }) => status === 'ready').length
  const blocked = items.filter(({ status }) => status === 'blocked').length
  return (
    <section className="rtm-launch-readiness" aria-labelledby="rtm-launch-readiness-heading">
      <header>
        <div>
          <p className="rtm-visual-eyebrow">YAYINA HAZIRLIK</p>
          <h2 id="rtm-launch-readiness-heading">Teslim öncesi kontrol merkezi</h2>
          <p>
            İçerik, 360° turlar, iletişim, hukuki metinler ve production ayarlarını tek yerden
            izleyin. Karttaki bağlantı sizi doğrudan ilgili yönetim ekranına götürür.
          </p>
        </div>
        <div className="rtm-launch-readiness-score" aria-label={`${ready} / ${items.length} hazır`}>
          <strong>{ready}</strong>
          <span>/ {items.length} hazır</span>
          {blocked ? <small>{blocked} zorunlu eksik</small> : <small>Zorunlu eksik yok</small>}
        </div>
      </header>
      <div className="rtm-launch-readiness-grid">
        {items.map((item) => (
          <article className={`rtm-launch-card rtm-launch-card--${item.status}`} key={item.title}>
            <div>
              <span className="rtm-launch-status">{statusLabel[item.status]}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <a href={item.href}>{item.action} ↗</a>
          </article>
        ))}
      </div>
    </section>
  )
}
