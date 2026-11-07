import { PageIntro } from '@/components/site/PageIntro'
import { ProjectDescription } from '@/components/portfolio/ProjectDescription'
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton'
import { getPublicSiteSettings } from '@/lib/siteSettings'
import { portfolioMetadata } from '@/lib/seo'
import { categoryInfo, entriesFor, visibleOptionalCategories, type ConsentCategory } from '@/lib/consent/registry'

export async function generateMetadata() {
  const settings = await getPublicSiteSettings()
  return portfolioMetadata({
    title: `Çerez Politikası | ${settings.companyName}`,
    description: 'Sitede kullanılan çerezler ve tarayıcı kayıtları, amaçları ve tercih yönetimi.',
    path: '/cerez-politikasi',
  })
}

const kindLabel = { cookie: 'Çerez', localStorage: 'Yerel depolama', sessionStorage: 'Sekme depolaması' }

export default async function CookiePolicyPage() {
  const settings = await getPublicSiteSettings()
  const policy = settings.cookiePolicy
  const updated = policy.updatedAt
    ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeZone: 'Europe/Istanbul' }).format(new Date(policy.updatedAt))
    : undefined
  return (
    <main id="main-content" className="policy-page">
      <PageIntro
        number="10"
        eyebrow="GİZLİLİK"
        title={
          <>
            Çerez politikası<span className="accent">.</span>
          </>
        }
        description="Sitede hangi çerez ve tarayıcı kayıtlarının neden kullanıldığını burada görebilir, tercihlerinizi istediğiniz an değiştirebilirsiniz."
      />
      <div className="site-shell policy-body">
        <div className="policy-actions">
          <CookiePreferencesButton className="button-primary">Tercihleri değiştir</CookiePreferencesButton>
          {policy.ready ? <span className="policy-meta">SÜRÜM {policy.version}{updated ? ` · SON GÜNCELLEME ${updated}` : ''}</span> : null}
        </div>
        {policy.content ? (
          <ProjectDescription content={policy.content} />
        ) : policy.url ? (
          <p>
            <a className="text-link" href={policy.url} target="_blank" rel="noopener noreferrer">
              Onaylı çerez politikasını okuyun ↗
            </a>
          </p>
        ) : (
          <p className="policy-empty" role="note">
            Onaylı çerez politikası metni henüz yayınlanmadı. Bu süre boyunca sitede yalnızca aşağıdaki zorunlu kayıtlar kullanılır; isteğe bağlı çerezler ve kalıcı tercih kayıtları kapalıdır.
          </p>
        )}
        <section className="policy-table-section" aria-labelledby="policy-table-heading">
          <h2 id="policy-table-heading">Kullanılan kayıtlar</h2>
          <p className="section-intro">
            Bu tablo uygulamadaki kayıt listesinden otomatik oluşturulur. Hepsi birinci taraftır; üçüncü taraf takip, reklam veya analitik betiği kullanılmaz.
          </p>
          {(['necessary', ...visibleOptionalCategories] as ConsentCategory[]).map((category) => {
            const entries = entriesFor(category)
            return (
              <div key={category}>
                <h3>{categoryInfo[category].title}</h3>
                <p className="section-intro">{categoryInfo[category].description}</p>
                {entries.length ? (
                  <div className="consent-table-wrap">
                    <table className="consent-table">
                      <thead>
                        <tr>
                          <th scope="col">Ad</th>
                          <th scope="col">Amaç</th>
                          <th scope="col">Süre</th>
                          <th scope="col">Tür</th>
                          <th scope="col">Sağlayıcı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry) => (
                          <tr key={entry.name}>
                            <td>
                              <code>{entry.name}</code>
                            </td>
                            <td>
                              {entry.purpose}
                              {entry.legalReview ? <small>{entry.legalReview}</small> : null}
                            </td>
                            <td>{entry.duration}</td>
                            <td>{kindLabel[entry.kind]}</td>
                            <td>{entry.provider}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="consent-empty">Tarayıcıda kalıcı kayıt oluşturmaz.</p>
                )}
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}
