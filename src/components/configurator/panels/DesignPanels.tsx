'use client'
import { useRef, useState } from 'react'
import {
  baseHeight,
  defaultConfig,
  optionName,
  frontNames,
  fronts,
  interiorNames,
  interiors,
  limits,
  newCell,
  palette,
  productNames,
  products,
  ralColors,
  redistribute,
  resize,
  round,
  setHeight,
  setWidth,
  type Config,
  type Options,
} from '@/lib/configurator/config'
import { MaterialSwatch } from '../MaterialSwatch'
import { StudioIcon, DetailIcon } from '../StudioIcon'
import { NumberField, SelectField, Toggle, FieldGroup } from './Fields'
import { StudioSuggestion } from '../StudioSuggestion'
import { KitchenPanel } from './KitchenPanel'
import { KitchenSectionsPanel, KitchenInteriorPanel } from './KitchenModulePanels'
import { KitchenStylePresets, KitchenGlassPanel } from './KitchenStylePanel'
import type { KitchenSelection } from '@/lib/configurator/kitchenSchema'
import { WardrobeStartPanel, WardrobeSectionsPanel, WardrobeInteriorPanel, WardrobeStylePanel, WardrobeDetailsPanel } from './WardrobePanels'
import { assertWardrobeFits } from '@/lib/configurator/wardrobe'
import { BathroomStartPanel, BathroomSectionsPanel, BathroomInteriorPanel, BathroomStylePanel, BathroomDetailsPanel } from './BathroomPanels'
import { TvStartPanel, TvSectionsPanel, TvInteriorPanel, TvStylePanel, TvDetailsPanel } from './TvPanels'
import { assertTvFits } from '@/lib/configurator/tv'
import type { TvSelection } from '@/lib/configurator/tvSchema'
import { assertBathroomFits } from '@/lib/configurator/bathroom'
import type { BathroomSelection } from '@/lib/configurator/bathroomSchema'
import { assertEntrywayFits } from '@/lib/configurator/entryway'
import { EntrywayStartPanel, EntrywaySectionsPanel, EntrywayInteriorPanel, EntrywayStylePanel, EntrywayDetailsPanel } from './EntrywayPanels'
import { SiteDropdown } from '@/components/site/SiteDropdown'

export type PanelProps = {
  config: Config
  edit: (fn: (c: Config) => void) => void
  selected: number
  cell: number
  onSelect: (s: number, i: number) => void
  onProduct: (m: Config['m']) => void
  tvSelection?: TvSelection
  onTvSelect?: (selection: TvSelection) => void
  bathroomSelection?: BathroomSelection
  onBathroomSelect?: (selection: BathroomSelection) => void
  kitchenSelection?: KitchenSelection
  onKitchenSelect?: (selection: KitchenSelection) => void
}
export function ProductPanel(props: PanelProps) {
  const { config: c, edit, onProduct } = props
  const dialog = useRef<HTMLDialogElement>(null),
    [next, setNext] = useState<Config['m']>('ozel')
  return (
    <>
      <StudioSuggestion
        current={c.m}
        onChoose={(m) => {
          setNext(m)
          dialog.current?.showModal()
        }}
      />
      <FieldGroup title="Ürün tipini seçin">
        <div className="dc-products">
          {products.map((m, i) => (
            <button
              className={c.m === m ? 'selected' : ''}
              aria-pressed={c.m === m}
              key={m}
              onClick={() => {
                if (m === c.m) return
                setNext(m)
                dialog.current?.showModal()
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <rect x="6" y={i === 4 ? 16 : 4} width="20" height={i === 4 ? 10 : 24} />
                <path d={i % 2 === 0 ? 'M6 14h20M16 4v24M6 22h20' : 'M16 4v24M13 13v5m6-5v5'} />
              </svg>
              <span>{productNames[m]}</span>
              {c.m === m ? <small>✓</small> : null}
            </button>
          ))}
        </div>
      </FieldGroup>
      {c.m === 'mutfak' ? <KitchenPanel config={c} edit={edit} /> : null}
      {c.m === 'gardirop' ? <WardrobeStartPanel {...props} /> : null}
      {c.m === 'portmanto' ? <EntrywayStartPanel {...props} /> : null}
      {c.m === 'banyo' ? <BathroomStartPanel {...props} /> : null}
      {c.m === 'tv' ? <TvStartPanel {...props} /> : null}
      <FieldGroup title="Mekânınıza göre ölçülendirin">
        <p className="dc-hint">Dış ölçüler · santimetre</p>
        {(['w', 'h', 'd'] as const).map((key, i) => (
          <NumberField
            key={key}
            label={(c.tvUnit ? ['Genişlik', 'Alt ünite yüksekliği', 'Derinlik'] : c.bathroom ? ['Genişlik', 'Alt dolap yüksekliği', 'Derinlik'] : c.k ? ['Ana duvar genişliği', 'Alt dolap yüksekliği', 'Derinlik'] : ['Genişlik', 'Yükseklik', 'Derinlik'])[i]}
            value={c.d[key]}
            min={c.tvUnit && key === 'h' ? 35 : c.tvUnit && key === 'd' ? Math.max(25, c.tvUnit.upperDepth) : c.tvUnit && key === 'w' ? Math.max(c.r.main.w.length * 30, Math.ceil(c.o.tv * 2.214 + 8) + (c.tvUnit.upper.w.length - 1) * 30) : c.bathroom && key === 'h' ? 40 : c.bathroom && key === 'd' ? 40 : c.bathroom && key === 'w' ? Math.max(60, c.r.main.w.length * 30 + c.bathroom.lower.filter((kind) => kind === 'sink').length * 25, c.bathroom.upper.w.length * 30) : c.entryway && key === 'w' ? Math.max(limits[c.m][key][0], c.r.main.w.length * 40) : c.entryway && key === 'd' && c.entryway.layouts.includes('hanging') ? 60 : c.wardrobe && key === 'w' ? Math.max(limits[c.m][key][0], c.r.main.w.length * 45) : c.wardrobe && key === 'd' && c.o.acilim === 'surgulu' ? 60 : c.k && c.k.layout !== 'straight' && key === 'w' ? c.d.d + 120 : limits[c.m][key][0]}
            max={c.tvUnit && key === 'h' ? 90 : c.tvUnit && key === 'd' ? 65 : c.bathroom && key === 'h' ? 95 : c.bathroom && key === 'd' ? 65 : c.k && key === 'h' ? 110 : limits[c.m][key][1]}
            slider
            recommended={[
              Math.max(limits[c.m][key][0], defaultConfig(c.m).d[key] * 0.9),
              Math.min(limits[c.m][key][1], defaultConfig(c.m).d[key] * 1.1),
            ]}
            onChange={(v) => edit((draft) => { resize(draft, key, v); if (draft.wardrobe) assertWardrobeFits(draft); if (draft.entryway) assertEntrywayFits(draft); if (draft.bathroom) assertBathroomFits(draft); if (draft.tvUnit) assertTvFits(draft) })}
          />
        ))}
      </FieldGroup>
      <dialog
        ref={dialog}
        className="dc-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close()
        }}
      >
        <h2>Yeni bir ürünle başlayalım mı?</h2>
        <p>
          Ölçüler ve iç düzen, {productNames[next].toLocaleLowerCase('tr-TR')} için başlangıç
          ayarlarına dönecek. Bu işlemi geri alabilirsiniz.
        </p>
        <div>
          <button onClick={() => dialog.current?.close()}>Vazgeç</button>
          <button
            className="dc-primary"
            onClick={() => {
              onProduct(next)
              dialog.current?.close()
            }}
          >
            Ürünü değiştir →
          </button>
        </div>
      </dialog>
    </>
  )
}
export function SectionsPanel(props: PanelProps) {
  const { config: c, edit, selected, onSelect } = props
  if (c.wardrobe) return <WardrobeSectionsPanel {...props} />
  if (c.entryway) return <EntrywaySectionsPanel {...props} />
  if (c.bathroom) return <BathroomSectionsPanel {...props} />
  if (c.tvUnit) return <TvSectionsPanel {...props} />
  if (c.k) return <KitchenSectionsPanel {...props} />
  const r = c.r.main
  return (
    <>
      <FieldGroup title="Dikey bölmeler">
        <div className="dc-field">
          <span>Bölme sayısı</span>
          <SiteDropdown
            label="Bölme sayısı"
            onValueChange={(nextValue) =>
              edit((draft) => {
                const n = Number(nextValue),
                  r = draft.r.main
                if (r.lk.some(Boolean))
                  throw new Error('Bölme sayısını değiştirmek için genişlik kilitlerini açın.')
                if (draft.d.w < n * 30)
                  throw new Error('Her bölme en az 30 cm olmalı. Önce toplam genişliği artırın.')
                r.w = redistribute(Array(n).fill(1), Array(n).fill(false), draft.d.w, 30)
                r.lk = Array(n).fill(false)
                r.t = Array(n).fill('kolon')
                r.ay = Array(n).fill(false)
                r.g = Array.from(
                  { length: n },
                  (_, i) => r.g[i] || newCell(draft.d.h - baseHeight(draft)),
                )
                onSelect(0, 0)
              })
            }
            options={Array.from({ length: 8 }, (_, index) => ({
              label: `${index + 1} bölme`,
              value: String(index + 1),
            }))}
            value={String(r.w.length)}
            variant="studio"
          />
        </div>
        <button
          className="dc-secondary"
          onClick={() =>
            edit((d) => {
              d.r.main.w = redistribute(
                d.r.main.w.map((v, i) => (d.r.main.lk[i] ? v : 1)),
                d.r.main.lk,
                d.d.w,
                30,
              )
            })
          }
        >
          ↔ Eşit dağıt
        </button>
        <p className="dc-hint">
          Kilitli genişlikler korunur. Sahnedeki kum rengi dikmeyi sürükleyerek sınırı 5 mm
          aralıklarla taşıyabilirsiniz.
        </p>
      </FieldGroup>
      {r.w.map((width, s) => (
        <section key={s} className={`dc-cell-card ${selected === s ? 'active' : ''}`}>
          <div className="dc-card-heading">
            <button onClick={() => onSelect(s, 0)}>{String(s + 1).padStart(2, '0')} · Bölme</button>
            <button
              title="Genişlik kilidi"
              aria-label={`${s + 1}. bölme genişlik kilidi`}
              aria-pressed={r.lk[s]}
              onClick={() =>
                edit((d) => {
                  d.r.main.lk[s] = !d.r.main.lk[s]
                })
              }
            >
              <StudioIcon name={r.lk[s] ? 'lock' : 'unlock'} />
              {r.lk[s] ? 'Kilitli' : 'Kilitle'}
            </button>
          </div>
          <NumberField
            label={`${s + 1}. bölme genişliği`}
            value={round(width)}
            min={30}
            max={c.d.w}
            disabled={r.lk[s]}
            onChange={(v) => edit((d) => setWidth(d, s, v))}
          />
          <SelectField
            label="Bölme tipi"
            value={r.t[s]}
            values={[
              { value: 'kolon', label: 'Tam boy kolon' },
              { value: 'ust', label: 'Üst modül' },
              { value: 'alt', label: 'Alt modül' },
            ]}
            onChange={(v) =>
              edit((d) => {
                d.r.main.t[s] = v
              })
            }
          />
          {s < r.w.length - 1 ? (
            <Toggle
              label="Çift ayırıcı dikme"
              checked={r.ay[s]}
              onChange={() =>
                edit((d) => {
                  d.r.main.ay[s] = !d.r.main.ay[s]
                })
              }
            />
          ) : null}
        </section>
      ))}
    </>
  )
}
export function CellPicker({
  config: c,
  selected,
  cell,
  onSelect,
}: Pick<PanelProps, 'config' | 'selected' | 'cell' | 'onSelect'>) {
  return (
    <div className="dc-cell-picker">
      <SelectField
        label="Bölme"
        value={String(selected)}
        values={c.r.main.w.map((_, i) => ({ value: String(i), label: `${i + 1}. bölme` }))}
        onChange={(v) => onSelect(Number(v), 0)}
      />
      <SelectField
        label="Göz (alttan üste)"
        value={String(cell)}
        values={c.r.main.g[selected].h.map((_, i) => ({
          value: String(i),
          label: `${i + 1}. göz`,
        }))}
        onChange={(v) => onSelect(selected, Number(v))}
      />
    </div>
  )
}
export function InteriorPanel(props: PanelProps) {
  if (props.config.wardrobe) return <WardrobeInteriorPanel {...props} />
  if (props.config.entryway) return <EntrywayInteriorPanel {...props} />
  if (props.config.bathroom) return <BathroomInteriorPanel {...props} />
  if (props.config.tvUnit) return <TvInteriorPanel {...props} />
  if (props.config.k) return <KitchenInteriorPanel {...props} />
  const { config: c, selected: s, cell: i, edit, onSelect } = props,
    g = c.r.main.g[s]
  function split() {
    edit((d) => {
      const g = d.r.main.g[s]
      if (g.h.length >= 12) throw new Error('Bir bölmede en fazla 12 göz olabilir.')
      if (g.lk[i]) throw new Error('Önce gözün kilidini açın.')
      if (g.h[i] < 10) throw new Error('Bölmek için göz en az 10 cm olmalı.')
      const h = round(g.h[i] / 2)
      g.h.splice(i, 1, h, round(g.h[i] - h))
      g.lk.splice(i, 1, 0, 0)
      g.f.splice(i, 1, g.f[i], g.f[i])
      g.ic.splice(i, 1, g.ic[i], g.ic[i])
      g.rf.splice(i, 1, g.rf[i], g.rf[i])
      g.ka.splice(i, 1, g.ka[i], '')
    })
  }
  return (
    <>
      <FieldGroup title="İç düzeninizi kurun">
        <CellPicker {...props} />
        <p className="dc-hint">Sahnede bir göze dokunarak da seçim yapabilirsiniz.</p>
      </FieldGroup>
      <section className="dc-cell-card active">
        <div className="dc-card-heading">
          <h3>
            {s + 1}. bölme · {i + 1}. göz
          </h3>
          <button
            aria-label="Göz yükseklik kilidi"
            aria-pressed={Boolean(g.lk[i])}
            onClick={() =>
              edit((d) => {
                d.r.main.g[s].lk[i] = g.lk[i] ? 0 : 1
              })
            }
          >
            <StudioIcon name={g.lk[i] ? 'lock' : 'unlock'} />
            {g.lk[i] ? 'Kilitli' : 'Kilitle'}
          </button>
        </div>
        <NumberField
          label="Göz yüksekliği"
          value={g.h[i]}
          min={5}
          max={c.d.h - baseHeight(c)}
          disabled={Boolean(g.lk[i])}
          onChange={(v) => edit((d) => setHeight(d, s, i, v))}
        />
        <SelectField
          label="İç düzen"
          value={g.ic[i]}
          values={interiors.map((v) => ({ value: v, label: interiorNames[v] }))}
          onChange={(v) =>
            edit((d) => {
              d.r.main.g[s].ic[i] = v
            })
          }
        />
        {g.ic[i] === 'raf' || g.ic[i] === 'ayakkabi' ? (
          <SelectField
            label="Raf sayısı"
            value={String(g.rf[i])}
            values={[
              { value: '-1', label: 'Otomatik (~35 cm)' },
              ...Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) })),
            ]}
            onChange={(v) =>
              edit((d) => {
                d.r.main.g[s].rf[i] = Number(v)
              })
            }
          />
        ) : null}
        <label className="dc-field">
          Göz etiketi (paylaşılır; kişisel bilgi girmeyin)
          <input
            maxLength={80}
            value={g.ka[i]}
            onChange={(e) =>
              edit((d) => {
                d.r.main.g[s].ka[i] = e.target.value
              })
            }
            placeholder="Örn. günlük kullanım"
          />
        </label>
        <button
          className="dc-secondary"
          onClick={() =>
            edit((d) => {
              const group = d.r.main.g[s]
              group.h = redistribute(
                group.h.map((height, index) => (group.lk[index] ? height : 1)),
                group.lk.map(Boolean),
                d.d.h - baseHeight(d),
                5,
              )
            })
          }
        >
          Gözleri eşit dağıt
        </button>
        <div className="dc-inline">
          <button className="dc-secondary" onClick={split}>
            + Gözü ikiye böl
          </button>
          <button
            disabled={g.h.length === 1}
            onClick={() =>
              edit((d) => {
                const g = d.r.main.g[s]
                const next = i === 0 ? 1 : i - 1
                if (g.lk[i] || g.lk[next])
                  throw new Error('Birleştirmek için her iki gözün kilidini açın.')
                g.h[next] = round(g.h[next] + g.h[i])
                g.h.splice(i, 1)
                g.lk.splice(i, 1)
                g.f.splice(i, 1)
                g.ic.splice(i, 1)
                g.rf.splice(i, 1)
                g.ka.splice(i, 1)
                onSelect(s, Math.max(0, i - 1))
              })
            }
          >
            Gözü sil
          </button>
        </div>
      </section>
    </>
  )
}
function Colors({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <div className="dc-swatches">
      {Object.entries(palette).map(([key, color]) => (
        <button
          key={key}
          title={color.name}
          aria-label={color.name}
          aria-pressed={value === key}
          className={value === key ? 'selected' : ''}
          onClick={() => onChange(key)}
        >
          <MaterialSwatch color={key} />
          {color.name}
        </button>
      ))}
    </div>
  )
}
export function FinishPanel(props: PanelProps) {
  const { config: c, edit, selected: s, cell: i } = props,
    o = c.o
  function option<K extends keyof Options>(key: K, value: Options[K]) {
    edit((d) => {
      d.o[key] = value
    })
  }
  const [ralDraft, setRalDraft] = useState<{ base: string; value: string } | null>(null),
    [error, setError] = useState('')
  const ral = ralDraft?.base === o.ral ? ralDraft.value : o.ral
  return (
    <>
      {c.k ? <KitchenStylePresets config={c} edit={edit} onApply={() => { setRalDraft(null); setError('') }} /> : null}
      {c.wardrobe ? <WardrobeStylePanel {...props} onApply={() => { setRalDraft(null); setError('') }} /> : null}
      {c.entryway ? <EntrywayStylePanel {...props} onApply={() => { setRalDraft(null); setError('') }} /> : null}
      {c.bathroom ? <BathroomStylePanel {...props} onApply={() => { setRalDraft(null); setError('') }} /> : null}
      {c.tvUnit ? <TvStylePanel {...props} onApply={() => { setRalDraft(null); setError('') }} /> : null}
      {!c.k && !c.wardrobe && !c.entryway && !c.bathroom && !c.tvUnit ? <FieldGroup title="Kapak düzeni">
        <CellPicker {...props} />
        <SelectField
          label="Seçili gözün ön yüzü"
          value={c.r.main.g[s].f[i]}
          values={fronts.map((v) => ({ value: v, label: frontNames[v] }))}
          onChange={(v) =>
            edit((d) => {
              d.r.main.g[s].f[i] = v
            })
          }
        />
        <SelectField
          label="Kapak açılımı"
          value={o.acilim}
          values={[
            { value: 'mentese', label: 'Menteşeli' },
            { value: 'surgulu', label: 'Sürgülü' },
            { value: 'katlanir', label: 'Katlanır' },
          ]}
          onChange={(v) => option('acilim', v)}
        />
      </FieldGroup> : null}
      <FieldGroup title="Malzeme ve yüzey">
        <SelectField
          label="Malzeme"
          value={o.malz}
          values={['Akrilik', 'Lake', 'Laminat', 'Ahşap kaplama', 'MDF boyalı', 'MDF-lam', 'Glossmax', 'High gloss']}
          onChange={(v) => option('malz', v)}
        />
        <SelectField
          label="Yüzey"
          value={o.yuzey}
          values={['Mat', 'Parlak', 'Süper mat', 'Dokulu']}
          onChange={(v) => option('yuzey', v)}
        />
        <div className="dc-finishes">
          {(
            [
              { value: 'duz', label: 'Düz' },
              { value: 'cerceveli', label: 'Çerçeveli' },
              { value: 'cizgili', label: 'Çizgili' },
              { value: 'fluted', label: 'Fluted' },
            ] as const
          ).map((v) => (
            <button
              key={v.value}
              className={o.km === v.value ? 'selected' : ''}
              aria-pressed={o.km === v.value}
              onClick={() => option('km', v.value)}
            >
              <span className={`dc-finish-${v.value}`} />
              {v.label}
            </button>
          ))}
        </div>
      </FieldGroup>
      <FieldGroup title="Renk paleti">
        <Colors
          value={o.renk}
          onChange={(v) =>
            edit((d) => {
              d.o.renk = v
              d.o.ral = ''
            })
          }
        />
        <Toggle label="İki renkli tasarım" checked={o.iki} onChange={() => option('iki', !o.iki)} />
        {o.iki ? (
          <>
            <p className="dc-hint">{c.tvUnit ? 'Üst bölüm, vitrin ve çıta panellerinin rengi' : c.bathroom ? 'Üst dolapların gövde ve standart kapak rengi' : c.entryway ? 'Oturma, açık raf ve arkalık detaylarının rengi' : c.k ? 'Üst dolapların kapak rengi' : c.wardrobe ? c.o.acilim === 'surgulu' ? 'Çift numaralı sürgü panellerinin rengi' : c.wardrobe.loft ? 'Üst depolama kapaklarının rengi' : 'Çift numaralı bölmelerin rengi' : 'Çift numaralı bölmelerin kapak rengi'}</p>
            <Colors value={o.renk2} onChange={(v) => option('renk2', v)} />
          </>
        ) : null}
        <label className="dc-field">
          RAL veya HEX kodu
          <input
            placeholder="RAL 7016 veya #45494b"
            maxLength={12}
            value={ral}
            onChange={(e) => setRalDraft({ base: o.ral, value: e.target.value })}
            onBlur={() => {
              const cleaned = ral.trim().toUpperCase()
              if (
                !cleaned ||
                /^#[A-F0-9]{6}$/.test(cleaned) ||
                ralColors[cleaned.replace(/RAL\s*/, '')]
              ) {
                setError('')
                option('ral', cleaned)
              } else setError('Desteklenen bir RAL (ör. 7016, 9010) veya HEX kodu girin.')
            }}
          />
        </label>
        {error ? <p className="dc-error">{error}</p> : null}
        <SelectField
          label="Gövde rengi"
          value={o.govde}
          values={[
            { value: 'kapak', label: 'Kapak ile aynı' },
            { value: 'beyaz', label: 'Beyaz' },
            { value: 'antrasit', label: 'Antrasit' },
            { value: 'ahsap', label: 'Ahşap' },
          ]}
          onChange={(v) => option('govde', v)}
        />
      </FieldGroup>
      {c.k ? <KitchenGlassPanel {...props} /> : null}
      {!c.k && !c.wardrobe && !c.entryway && !c.bathroom && !c.tvUnit && c.r.main.g.some((g) => g.f.includes('cam')) ? (
        <FieldGroup title="Cam detayları">
          <SelectField
            label="Cam çerçevesi"
            value={o.camc}
            values={[
              { value: 'siyah', label: 'Siyah' },
              { value: 'alu', label: 'Alüminyum' },
              { value: 'altin', label: 'Altın' },
            ]}
            onChange={(v) => option('camc', v)}
          />
          <SelectField
            label="Cam tipi"
            value={o.camt}
            values={[
              { value: 'seffaf', label: 'Şeffaf' },
              { value: 'fume', label: 'Füme' },
              { value: 'buzlu', label: 'Buzlu' },
              { value: 'reflekte', label: 'Reflekte' },
            ]}
            onChange={(v) => option('camt', v)}
          />
        </FieldGroup>
      ) : null}
    </>
  )
}
export function DetailsPanel(props: PanelProps) {
  const { config: c, edit } = props
  if (c.wardrobe) return <WardrobeDetailsPanel {...props} />
  if (c.entryway) return <EntrywayDetailsPanel {...props} />
  if (c.bathroom) return <BathroomDetailsPanel {...props} />
  if (c.tvUnit) return <TvDetailsPanel {...props} />
  const o = c.o
  function option<K extends keyof Options>(key: K, value: Options[K]) {
    edit((d) => {
      d.o[key] = value
    })
  }
  return (
    <>
      <FieldGroup title="Dokunuşu tamamlayın">
        <div className="dc-detail-options" role="group" aria-label="Kulp modeli">
          {(['gola', 'cubuk', 'gomme', 'bas-ac', 'kenar-profil', 'dugme', 'yok'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={o.kulp === value}
              onClick={() => option('kulp', value)}
            >
              <DetailIcon value={value} />
              <span>{value === 'yok' ? 'Kulpsuz' : optionName(value)}</span>
            </button>
          ))}
        </div>
        <SelectField
          label="Kulp rengi"
          value={o.krenk}
          values={[
            { value: 'beyaz', label: 'Beyaz' },
            { value: 'siyah', label: 'Siyah' },
            { value: 'inox', label: 'İnoks' },
            { value: 'altin', label: 'Altın' },
            { value: 'bronz', label: 'Bronz' },
          ]}
          onChange={(v) => option('krenk', v)}
        />
        <SelectField
          label="Baza ve ayak"
          value={o.baza}
          values={[
            { value: 'b0', label: 'Bazasız' },
            { value: 'b8', label: '8 cm baza' },
            { value: 'b10', label: '10 cm baza' },
            { value: 'b12', label: '12 cm baza' },
            { value: 'ayak', label: '12 cm ayak' },
            { value: 'asma', label: 'Duvara asma' },
          ]}
          onChange={(v) =>
            edit((d) => {
              d.o.baza = v
              resize(d, 'h', d.d.h)
            })
          }
        />
        {c.m === 'mutfak' || c.m === 'banyo' ? (
          <SelectField
            label="Tezgâh"
            value={o.tezgah}
            values={[
              { value: 'karar', label: 'Sonra karar vereceğim' },
              { value: 'kuvars', label: 'Kuvars' },
              { value: 'masif', label: 'Masif' },
              { value: 'compact', label: 'Compact' },
              { value: 'laminat', label: 'Laminat' },
              { value: 'porselen', label: 'Porselen' },
              { value: 'granit', label: 'Granit / doğal taş' },
              { value: 'yok', label: 'Tezgâhsız' },
            ]}
            onChange={(v) => option('tezgah', v)}
          />
        ) : null}
        <Toggle
          label="Yan / üst kapatma paneli"
          checked={o.panel}
          onChange={() => option('panel', !o.panel)}
        />
        <Toggle label="Üst asma modül" checked={o.ust} onChange={() => option('ust', !o.ust)} />
        {c.m === 'tv' ? (
          <label className="dc-field">
            Ekran boyutu · inç
            <input
              aria-label="Ekran boyutu"
              type="number"
              min={32}
              max={98}
              value={o.tv}
              onChange={(e) => option('tv', Number(e.target.value))}
            />
          </label>
        ) : null}
      </FieldGroup>
      <FieldGroup title="Sıcak ışık, ince detay">
        <p className="dc-hint">2700 K sıcak beyaz LED</p>
        {(
          [
            { value: 'ic', label: 'İç aydınlatma' },
            { value: 'alt', label: 'Alt aydınlatma' },
            { value: 'ust', label: 'Üst aydınlatma' },
            { value: 'raf', label: 'Raf altı' },
            { value: 'gola', label: 'Gola profil LED' },
          ] as const
        ).map((v) => (
          <Toggle
            key={v.value}
            label={c.k && v.value === 'alt' ? 'Üst dolap altı LED' : v.label}
            checked={o.led.includes(v.value)}
            onChange={() =>
              option(
                'led',
                o.led.includes(v.value) ? o.led.filter((x) => x !== v.value) : [...o.led, v.value],
              )
            }
          />
        ))}
      </FieldGroup>
    </>
  )
}
