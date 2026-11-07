'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, InstancedMesh, MeshStandardMaterial, Object3D, RepeatWrapping, type MeshStandardMaterialParameters } from 'three'
import { palette } from '@/lib/configurator/config'
import {
  propRecipe,
  createPropGeometry,
  type Form,
  type Part,
} from '@/lib/configurator/props/geometry'
import { propSizes } from '@/lib/configurator/props/catalog'
import type { PropPlacement } from '@/lib/configurator/props/layout'
import { useSceneColors } from './SceneTheme'

function fabricWeave() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#dededb'
    ctx.fillRect(0, 0, 64, 64)
    for (let i = 0; i < 64; i += 2) {
      ctx.fillStyle = i % 4 ? '#f2f2ef' : '#bdbdba'
      ctx.fillRect(i, 0, 1, 64)
      ctx.fillRect(0, i, 64, 1)
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}
function PropBatch({ form, parts, appearance }: { form: Form; parts: Part[]; appearance: MeshStandardMaterialParameters }) {
  const ref = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const geometry = useMemo(() => createPropGeometry(form), [form])
  const material = useMemo(() => new MeshStandardMaterial({
    ...appearance,
    ...(form === 'softBox' || form === 'garment' ? { roughness: 0.96, metalness: 0 } : {}),
  }), [appearance, form])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  useLayoutEffect(() => {
    const dummy = new Object3D()
    parts.forEach((p, i) => {
      dummy.position.set(...p.p)
      dummy.scale.set(...p.s)
      dummy.rotation.set(...(p.rotation ?? [0, 0, 0]))
      dummy.updateMatrix()
      ref.current?.setMatrixAt(i, p.matrix ?? dummy.matrix)
    })
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
    invalidate()
  }, [parts, invalidate])
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, parts.length]}
      frustumCulled={false}
      castShadow
      receiveShadow
    />
  )
}
/** Shared geometry/material per primitive and tone; no timers or idle frame requests. */
export default function RepresentativeProps({ placements }: { placements: PropPlacement[] }) {
  const colors = useSceneColors()
  const weave = useMemo(() => fabricWeave(), [])
  useEffect(() => () => weave.dispose(), [weave])
  const tones: MeshStandardMaterialParameters[] = useMemo(() => {
    const cloth = { roughness: 0.98, bumpMap: weave, bumpScale: 0.0007 }
    return [
      { color: palette.fildisi.hex, roughness: 0.28, metalness: 0.03 },
      { color: palette.kasmir.hex, ...cloth },
      { color: palette.antrasit.hex, roughness: 0.36, metalness: 0.35 },
      { color: palette.mese.hex, roughness: 0.65 },
      { color: palette.orman.hex, roughness: 0.82 },
      { color: palette.adacayi.hex, ...cloth },
      { color: palette.bej.hex, ...cloth },
      { color: palette['gece-mavisi'].hex, ...cloth },
      { color: palette['gul-kurusu'].hex, roughness: 0.55 },
      { color: colors.light, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.42, depthWrite: false },
      { color: colors.gold, roughness: 0.3, metalness: 0.75 },
    ]
  }, [colors.light, colors.gold, weave])
  const batches = useMemo(() => {
    const groups = new Map<string, { form: Form; tone: number; parts: Part[] }>()
    const parent = new Object3D()
    const local = new Object3D()
    placements.forEach((item, index) => {
      parent.position.set(...item.position)
      parent.scale.set(...(item.rotation ? propSizes[item.kind] : item.size))
      parent.rotation.set(0, item.rotation ?? 0, 0)
      parent.updateMatrix()
      const variation = index + [...item.cell].reduce((sum, character) => sum + character.charCodeAt(0), 0)
      propRecipe(item.kind, variation).forEach((p) => {
        const key = `${p.form}-${p.tone}`
        let group = groups.get(key)
        if (!group) {
          group = { form: p.form, tone: p.tone, parts: [] }
          groups.set(key, group)
        }
        local.position.set(...p.p)
        local.scale.set(...p.s)
        local.rotation.set(...(p.rotation ?? [0, 0, 0]))
        local.updateMatrix()
        group.parts.push({ ...p, matrix: parent.matrix.clone().multiply(local.matrix) })
      })
    })
    return [...groups.entries()]
  }, [placements])
  return (
    <group name="representative-props">
      {batches.map(([key, b]) => (
        <PropBatch key={key} form={b.form} parts={b.parts} appearance={tones[b.tone]} />
      ))}
    </group>
  )
}
