'use client'

import { EditableRegion } from '@/components/site/EditableRegion'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PanoramaControls, TourHotspot, TourScene, TourStatus } from '@/types/showroom'
import { SiteDropdown } from '@/components/site/SiteDropdown'

const PanoramaViewer = dynamic(() => import('./PanoramaViewer'), {
  ssr: false,
  loading: () => (
    <div className="panorama-module-loading" role="status">
      360° deneyim hazırlanıyor…
    </div>
  ),
})

export function ShowroomExperience({ scenes }: { scenes: TourScene[] }) {
  const [activeId, setActiveId] = useState(scenes[0]?.id || '')
  const [status, setStatus] = useState<TourStatus>('loading')
  const [info, setInfo] = useState<TourHotspot | null>(null)
  const [retry, setRetry] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [canFullscreen, setCanFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')
  const controlsRef = useRef<PanoramaControls | null>(null)
  const infoCloseRef = useRef<HTMLButtonElement>(null)
  const infoTriggerRef = useRef<HTMLElement | null>(null)
  const active = scenes.find((scene) => scene.id === activeId) || scenes[0]

  const selectScene = useCallback((id: string) => {
    setActiveId(id)
    setInfo(null)
  }, [])
  const showInfo = useCallback((spot: TourHotspot) => {
    infoTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setInfo(spot)
  }, [])
  function closeInfo() {
    setInfo(null)
    infoTriggerRef.current?.focus({ preventScroll: true })
  }
  const receiveControls = useCallback((controls: PanoramaControls | null) => {
    controlsRef.current = controls
  }, [])

  useEffect(() => {
    function changed() {
      setFullscreen(document.fullscreenElement === document.documentElement)
    }
    const timer = window.setTimeout(
      () =>
        setCanFullscreen(
          Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen),
        ),
      0,
    )
    document.addEventListener('fullscreenchange', changed)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('fullscreenchange', changed)
    }
  }, [])

  useEffect(() => {
    if (info) infoCloseRef.current?.focus()
  }, [info])

  async function toggleFullscreen() {
    try {
      setFullscreenError('')
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setFullscreenError('Tam ekran bu tarayıcıda açılamadı. Normal görünümde devam edebilirsiniz.')
    }
  }

  if (!active)
    return (
      <div className="showroom-no-scenes">
        <span className="eyebrow">Yeni bir perspektif hazırlanıyor</span>
        <h2>Bu showroom’un 360° turu yakında.</h2>
        <p>Panoramik sahneler yayınlandığında mekânı buradan keşfedebilirsiniz.</p>
      </div>
    )

  return (
    <section aria-label="İnteraktif showroom" className="tour-experience">
      <EditableRegion as="div" className="tour-stage" data-rtm-edit={`showroom-scenes:${active.id}`} data-rtm-field="panoramaImage" data-rtm-label={`${active.title} · 360° panorama ve sahne açıklaması`}>
        <PanoramaViewer
          scenes={scenes}
          activeId={activeId}
          retry={retry}
          onSelect={selectScene}
          onInfo={showInfo}
          onStatus={setStatus}
          onControls={receiveControls}
        />
        <div className="tour-scene-badge">
          <span className="status-dot" />
          <span>{active.title}</span>
          <span className="micro-label">360°</span>
        </div>
        {status === 'loading' ? (
          <div aria-live="polite" className="tour-loading" role="status">
            <span className="loading-orbit" aria-hidden="true" />
            <p>Panorama yükleniyor…</p>
          </div>
        ) : null}
        {status === 'error' ? (
          <div className="tour-error" role="status">
            <p className="eyebrow">Biraz ara verelim</p>
            <h2>360° görünüm açılamadı.</h2>
            <p>
              Bağlantıyı kontrol edip yeniden deneyin. Bu cihaz WebGL veya görsel boyutunu
              desteklemiyor olabilir; sahneleri aşağıdaki listeden inceleyebilirsiniz.
            </p>
            <button
              className="button-primary"
              onClick={() => {
                setStatus('loading')
                setRetry((value) => value + 1)
              }}
              type="button"
            >
              Yeniden dene ↗
            </button>
          </div>
        ) : null}
        {info ? (
          <aside
            aria-label="Sahne bilgisi"
            className="tour-info-card"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation()
                closeInfo()
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <h3>{info.label}</h3>
              <button
                aria-label="Bilgiyi kapat"
                className="icon-button"
                onClick={closeInfo}
                ref={infoCloseRef}
                type="button"
              >
                ×
              </button>
            </div>
            <p>{info.informationText}</p>
          </aside>
        ) : null}
        <div aria-label="Panorama kontrolleri" className="tour-controls">
          <div className="tour-camera-buttons">
            <button
              aria-label="Sola dön"
              className="icon-button"
              disabled={status !== 'ready'}
              onClick={() => controlsRef.current?.rotate(-20)}
              type="button"
            >
              ←
            </button>
            <button
              aria-label="Sağa dön"
              className="icon-button"
              disabled={status !== 'ready'}
              onClick={() => controlsRef.current?.rotate(20)}
              type="button"
            >
              →
            </button>
            <span className="tour-control-divider" />
            <button
              aria-label="Yakınlaştır"
              className="icon-button"
              disabled={status !== 'ready'}
              onClick={() => controlsRef.current?.zoom(-10)}
              type="button"
            >
              +
            </button>
            <button
              aria-label="Uzaklaştır"
              className="icon-button"
              disabled={status !== 'ready'}
              onClick={() => controlsRef.current?.zoom(10)}
              type="button"
            >
              −
            </button>
          </div>
          <div className="tour-scene-select">
            <SiteDropdown
              id="tour-active-scene"
              label="Aktif sahne"
              onValueChange={selectScene}
              options={scenes.map((scene) => ({ label: scene.title, value: scene.id }))}
              value={activeId}
            />
          </div>
          <div className="tour-utility-buttons">
            <button
              aria-label="İlk sahneye dön"
              className="icon-button"
              disabled={status !== 'ready'}
              onClick={() => controlsRef.current?.home()}
              type="button"
            >
              ↺
            </button>
            {canFullscreen ? (
              <button
                aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
                className="icon-button"
                onClick={() => void toggleFullscreen()}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d={
                      fullscreen
                        ? 'M8 3v5H3m13-5v5h5M8 21v-5H3m13 5v-5h5'
                        : 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'
                    }
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </EditableRegion>
      {fullscreenError ? (
        <p className="tour-fullscreen-error" role="status">
          {fullscreenError}
        </p>
      ) : null}
      <div className="tour-navigation">
        <div className="tour-active-info" aria-live="polite">
          <p className="eyebrow">
            Sahne {scenes.findIndex((scene) => scene.id === activeId) + 1} / {scenes.length}
          </p>
          <h2>{active.title}</h2>
          {active.description ? <p>{active.description}</p> : null}
          <span className="micro-label muted">
            Sürükleyerek veya ok tuşlarıyla etrafınıza bakın.
          </span>
        </div>
        <ul aria-label="Showroom sahneleri" className="tour-scene-list">
          {scenes.map((scene, index) => (
            <li key={scene.id}>
              <button
                aria-pressed={activeId === scene.id}
                onClick={() => selectScene(scene.id)}
                type="button"
              >
                <span className="tour-thumbnail">
                  {scene.thumbnail ? (
                    <Image
                      alt=""
                      fill
                      className="object-cover"
                      sizes="110px"
                      src={scene.thumbnail.url}
                      data-rtm-edit={`showroom-scenes:${scene.id}`}
                      data-rtm-field="thumbnailImage"
                      data-rtm-label={`${scene.title} · Küçük önizleme`}
                    />
                  ) : (
                    <span aria-hidden="true">360°</span>
                  )}
                </span>
                <span>
                  <span className="micro-label">0{index + 1}</span>
                  <strong>{scene.title}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {active.hotspots.length ? (
        <div className="tour-html-hotspots">
          <p className="micro-label">Sahne noktaları</p>
          <ul>
            {active.hotspots.map((spot) => (
              <li key={spot.id}>
                <button
                  onClick={() =>
                    spot.type === 'scene' && spot.targetId
                      ? selectScene(spot.targetId)
                      : showInfo(spot)
                  }
                  type="button"
                >
                  {spot.type === 'scene' ? '↗' : 'ⓘ'} {spot.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
