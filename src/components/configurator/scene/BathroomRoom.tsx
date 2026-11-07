'use client'

import { useEffect, useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { palette, type Config } from '@/lib/configurator/config'
import type { ScenePreferences } from '@/lib/configurator/scenePreferences'
import { bathroomGeometry } from '@/lib/configurator/bathroom'
import { Boards } from './CabinetParts'
import { useSceneColors } from './SceneTheme'

function patternedTile(cream: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = cream
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = '#424948'
    ctx.lineWidth = 5
    ctx.strokeRect(5, 5, 246, 246)
    ctx.save()
    ctx.translate(128, 128)
    ctx.rotate(Math.PI / 4)
    ctx.strokeRect(-81, -81, 162, 162)
    ctx.restore()
    for (let i = 0; i < 8; i++) {
      ctx.save()
      ctx.translate(128, 128)
      ctx.rotate(i * Math.PI / 4)
      ctx.fillStyle = '#a97546'
      ctx.beginPath()
      ctx.ellipse(0, -43, 17, 35, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#384340'
      ctx.lineWidth = 7
      ctx.stroke()
      ctx.restore()
    }
    ctx.fillStyle = '#384340'
    ctx.beginPath()
    ctx.arc(128, 128, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#c6bfaf'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, 256, 256)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(48, 48)
  texture.anisotropy = 4
  return texture
}

export function BathroomRoom({ config: c, preferences, lowQuality }: {
  config: Config; preferences: ScenePreferences; lowQuality: boolean
}) {
  const colors = useSceneColors()
  const texture = useMemo(() => patternedTile(colors['bath-tile']), [colors])
  useEffect(() => () => texture.dispose(), [texture])
  const wallZ = -c.d.d / 200 - 0.04,
    panelWidth = Math.max(3.6, bathroomGeometry(c).totalWidth / 100 + 1.5),
    center = bathroomGeometry(c).centerX / 100
  return (
    <group name="bathroom-interior">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={preferences.floor ?? palette.beyaz.hex}
          map={preferences.textured ? texture : null} roughness={0.8} />
      </mesh>
      <Boards plaster color={preferences.wall ?? colors['bath-wall']}
        items={[{ p: [center, 2.2, wallZ - 0.055], s: [12, 4.4, 0.08] }]} />
      <Boards wood color={colors['bath-panel']} roughness={0.9}
        items={Array.from({ length: 36 }, (_, i) => ({
          p: [center - panelWidth / 2 + panelWidth * (i + 0.5) / 36, 0.52, wallZ],
          s: [panelWidth / 36 - 0.004, 1.04, 0.035],
        }))} />
      <Boards color={colors['bath-panel']}
        items={[{ p: [center, 1.05, wallZ + 0.005], s: [panelWidth, 0.025, 0.05] }]} />
      <Boards color={colors.led}
        items={[{ p: [center, 2.55, wallZ + 0.005], s: [panelWidth, 0.012, 0.035] }]} />
      {!lowQuality ? <pointLight position={[center, 2.5, wallZ + 0.15]} color={colors.led} intensity={0.35} distance={3.5} /> : null}
      {preferences.props ? (
        <group position={[-c.d.w / 200 - 0.29, 0, wallZ + 0.12]} name="bathroom-pendant-and-towel">
          <mesh position={[0, 1.95, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 1.3, 8]} />
            <meshStandardMaterial color={palette.siyah.hex} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.045, 0.062, 0.095, 20, 1, true]} />
            <meshStandardMaterial color={colors.bronze} metalness={0.8} roughness={0.3} />
          </mesh>
          <Boards color={palette.fildisi.hex} roughness={1}
            items={[{ p: [0, 0.87, 0.015], s: [0.2, 0.44, 0.018] }]} />
          <Boards color={palette.siyah.hex} metalness={0.7}
            items={[{ p: [0, 1.08, 0.03], s: [0.24, 0.014, 0.05] }]} />
        </group>
      ) : null}
    </group>
  )
}
