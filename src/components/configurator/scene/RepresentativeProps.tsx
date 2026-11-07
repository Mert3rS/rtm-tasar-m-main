'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import {
  propRecipe,
  createPropGeometry,
  type Form,
  type Part,
} from '@/lib/configurator/props/geometry'
import { propSizes } from '@/lib/configurator/props/catalog'
import type { PropPlacement } from '@/lib/configurator/props/layout'
import { useSceneColors } from './SceneTheme'

function PropBatch({ form, parts, color }: { form: Form; parts: Part[]; color: string }) {
  const ref = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const geometry = useMemo(() => createPropGeometry(form), [form])
  const material = useMemo(() => new MeshStandardMaterial({ color, roughness: 0.88 }), [color])
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
    />
  )
}
/** Shared geometry/material per primitive and tone; no timers or idle frame requests. */
export default function RepresentativeProps({ placements }: { placements: PropPlacement[] }) {
  const colors = useSceneColors()
  const tones = [colors.counter, colors.drawer, colors.metal, colors['wood-dark'], colors.human]
  const batches = useMemo(() => {
    const groups = new Map<string, { form: Form; tone: number; parts: Part[] }>()
    const parent = new Object3D()
    const local = new Object3D()
    placements.forEach((item) => {
      parent.position.set(...item.position)
      parent.scale.set(...(item.rotation ? propSizes[item.kind] : item.size))
      parent.rotation.set(0, item.rotation ?? 0, 0)
      parent.updateMatrix()
      propRecipe(item.kind).forEach((p) => {
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
        <PropBatch key={key} form={b.form} parts={b.parts} color={tones[b.tone]} />
      ))}
    </group>
  )
}
