'use client'

import 'pannellum/build/pannellum.css'
import { useEffect, useRef } from 'react'
import type { PanoramaControls, TourHotspot, TourScene, TourStatus } from '@/types/showroom'

type Props = {
  scenes: TourScene[]
  activeId: string
  retry: number
  onSelect: (id: string) => void
  onInfo: (spot: TourHotspot) => void
  onStatus: (status: TourStatus) => void
  onControls: (controls: PanoramaControls | null) => void
}

export default function PanoramaViewer({
  scenes,
  activeId,
  retry,
  onSelect,
  onInfo,
  onStatus,
  onControls,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Pannellum.Viewer | null>(null)
  const activeRef = useRef(activeId)
  const reducedRef = useRef(false)
  const versionRef = useRef(0)

  useEffect(() => {
    activeRef.current = activeId
    const viewer = viewerRef.current
    if (!viewer || viewer.getScene() === activeId) return
    viewer.getConfig().sceneFadeDuration = reducedRef.current ? 0 : 350
    onStatus('loading')
    viewer.loadScene(activeId)
  }, [activeId, onStatus])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !scenes.length) return
    let disposed = false
    let instance: Pannellum.Viewer | undefined
    let observer: ResizeObserver | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    let canvas: HTMLCanvasElement | null = null
    const generation = ++versionRef.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedRef.current = motion.matches

    function updateMotion() {
      reducedRef.current = motion.matches
      if (instance) {
        instance.getConfig().sceneFadeDuration = motion.matches ? 0 : 350
        instance.getConfig().friction = motion.matches ? 1 : 0.25
      }
    }
    function fail() {
      if (!disposed && versionRef.current === generation) onStatus('error')
      if (timeout) clearTimeout(timeout)
    }
    function contextLost(event: Event) {
      event.preventDefault()
      fail()
    }
    function loading() {
      if (disposed) return
      onStatus('loading')
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(fail, 30_000)
    }
    function loaded() {
      if (disposed) return
      if (timeout) clearTimeout(timeout)
      const nextCanvas = container?.querySelector('canvas') || null
      if (nextCanvas !== canvas) {
        canvas?.removeEventListener('webglcontextlost', contextLost)
        canvas = nextCanvas
        canvas?.addEventListener('webglcontextlost', contextLost)
      }
      updateMotion()
      onStatus('ready')
    }
    function sceneChanged(id: string) {
      if (!disposed) {
        loading()
        onSelect(id)
        updateMotion()
      }
    }

    function hotspot(spot: TourHotspot): Pannellum.HotspotOptions {
      return {
        id: spot.id,
        type: 'info',
        yaw: spot.yaw,
        pitch: spot.pitch,
        cssClass: 'tour-hotspot-anchor',
        createTooltipFunc: (element) => {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'tour-hotspot'
          button.setAttribute('aria-label', spot.label)
          const mark = document.createElement('span')
          mark.setAttribute('aria-hidden', 'true')
          mark.textContent = spot.type === 'scene' ? '↗' : 'i'
          const label = document.createElement('span')
          label.className = 'tour-hotspot-label'
          label.textContent = spot.label
          button.append(mark, label)
          for (const event of ['pointerdown', 'mousedown', 'touchstart', 'keydown'])
            button.addEventListener(event, (e) => e.stopPropagation())
          button.addEventListener('click', (event) => {
            event.stopPropagation()
            if (spot.type === 'scene' && spot.targetId) onSelect(spot.targetId)
            else onInfo(spot)
          })
          element.append(button)
        },
      }
    }

    async function initialize() {
      try {
        await import('pannellum')
        if (disposed || !container) return
        const sceneConfig: Record<string, Pannellum.ConfigOptions> = {}
        for (const scene of scenes) {
          sceneConfig[scene.id] = {
            type: 'equirectangular',
            panorama: scene.panorama.url,
            yaw: scene.yaw,
            pitch: scene.pitch,
            hfov: scene.hfov,
            minHfov: 50,
            maxHfov: 110,
            minPitch: -85,
            maxPitch: 85,
            hotSpots: scene.hotspots.map(hotspot),
          }
        }
        loading()
        instance = window.pannellum.viewer(container, {
          default: {
            firstScene: activeRef.current,
            autoLoad: true,
            escapeHTML: true,
            showControls: false,
            showZoomCtrl: false,
            showFullscreenCtrl: false,
            keyboardZoom: true,
            mouseZoom: 'fullscreenonly',
            draggable: true,
            friction: reducedRef.current ? 1 : 0.25,
            sceneFadeDuration: reducedRef.current ? 0 : 350,
            strings: {
              loadingLabel: 'Panorama yükleniyor…',
              loadButtonLabel: 'Panoramayı aç',
              genericWebGLError: '360° görünüm bu cihazda açılamıyor.',
              fileAccessError: 'Panorama yüklenemedi.',
              unknownError: 'Panorama açılamadı.',
              noPanoramaError: 'Panorama bulunamadı.',
              textureSizeError: 'Bu cihaz görsel boyutunu desteklemiyor.',
            },
          },
          scenes: sceneConfig,
        })
        viewerRef.current = instance
        instance.on('load', loaded).on('scenechange', sceneChanged).on('error', fail)
        motion.addEventListener('change', updateMotion)
        observer = new ResizeObserver(() => instance?.resize())
        observer.observe(container)
        onControls({
          zoom: (delta) => {
            const current = viewerRef.current
            if (current)
              current.setHfov(
                Math.min(110, Math.max(50, current.getHfov() + delta)),
                reducedRef.current ? false : 250,
              )
          },
          rotate: (delta) => {
            const current = viewerRef.current
            if (current) current.setYaw(current.getYaw() + delta, reducedRef.current ? false : 300)
          },
          home: () => {
            const first = scenes[0]
            const current = viewerRef.current
            if (first && current) {
              if (current.getScene() !== first.id) onSelect(first.id)
              else
                current.lookAt(first.pitch, first.yaw, first.hfov, reducedRef.current ? false : 300)
            }
          },
        })
      } catch {
        fail()
      }
    }
    void initialize()
    return () => {
      disposed = true
      if (timeout) clearTimeout(timeout)
      motion.removeEventListener('change', updateMotion)
      canvas?.removeEventListener('webglcontextlost', contextLost)
      observer?.disconnect()
      onControls(null)
      instance?.off()
      instance?.destroy()
      if (viewerRef.current === instance) viewerRef.current = null
    }
  }, [scenes, retry, onSelect, onInfo, onStatus, onControls])

  return (
    <div
      aria-label="360 derece panoramik görünüm. Ok tuşlarıyla bakış açısını değiştirebilirsiniz."
      className="panorama-canvas"
      role="group"
      ref={containerRef}
    />
  )
}
