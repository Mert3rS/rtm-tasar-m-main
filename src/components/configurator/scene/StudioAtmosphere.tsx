import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, type HemisphereLight } from 'three'
import { useSceneColors } from './SceneTheme'
import { useReducedMotion } from '../useReducedMotion'

export function StudioAtmosphere() {
  const colors = useSceneColors()
  const reduced = useReducedMotion()
  const invalidate = useThree((state) => state.invalidate)
  const background = useMemo(() => new Color(), [])
  const light = useRef<HemisphereLight>(null)
  const targets = useMemo(
    () => ({
      background: new Color(colors.viewport),
      sky: new Color(colors.light),
      ground: new Color(colors['ground-light']),
    }),
    [colors],
  )
  useEffect(() => {
    invalidate()
  }, [targets, invalidate])
  useFrame((_, delta) => {
    const difference =
      Math.abs(background.r - targets.background.r) +
      Math.abs(background.g - targets.background.g) +
      Math.abs(background.b - targets.background.b)
    const speed = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 12)
    background.lerp(targets.background, speed)
    light.current?.color.lerp(targets.sky, speed)
    light.current?.groundColor.lerp(targets.ground, speed)
    if (difference > 0.001) invalidate()
    else {
      background.copy(targets.background)
      light.current?.color.copy(targets.sky)
      light.current?.groundColor.copy(targets.ground)
    }
  })
  return (
    <>
      <primitive object={background} attach="background" />
      <ambientLight intensity={0.6} />
      <hemisphereLight ref={light} intensity={1.15} />
    </>
  )
}

/** Observe only consecutive active frames; idle demand gaps are not low FPS. */
export function AdaptiveQuality({ onSlow }: { onSlow: () => void }) {
  const slow = useRef(0)
  const downgraded = useRef(false)
  useFrame((_, delta) => {
    if (downgraded.current || delta > 0.25) return
    slow.current = delta > 1 / 28 ? slow.current + 1 : Math.max(0, slow.current - 1)
    if (slow.current >= 24) {
      downgraded.current = true
      onSlow()
    }
  })
  return null
}
