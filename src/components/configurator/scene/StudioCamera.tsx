'use client'

import { useEffect, useRef, type ComponentRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Box3, OrthographicCamera, PerspectiveCamera, Vector3, type Group } from 'three'
import type { Config } from '@/lib/configurator/config'
import { cameraFit, nearestCameraDistance, productBounds } from '@/lib/configurator/cameraFit'
import { useReducedMotion } from '../useReducedMotion'

type Focus = { x: number; y: number; z: number; width: number; height: number }
type Goal = { position: Vector3; target: Vector3; zoom: number }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function StudioCamera({
  product,
  config,
  front,
  zoom,
  reset,
  fit,
  side,
  focus,
  human,
  dimensions,
  fallback,
}: {
  product: RefObject<Group | null>
  config: Config
  front: boolean
  /** Relative zoom command counter; mouse-wheel distance remains authoritative. */
  zoom: number
  reset: number
  fit: number
  side: number
  focus?: Focus
  human: boolean
  dimensions: boolean
  fallback: { w: number; h: number; d: number; x: number; z: number }
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, get, invalidate, size } = useThree()
  const reduced = useReducedMotion()
  const goal = useRef<Goal | null>(null)
  const boundsRef = useRef<Box3 | null>(null)
  const previous = useRef({ zoom, reset, fit, front, model: config.m, width: 0, height: 0 })

  useFrame((state, delta) => {
    const camera = state.camera
    const next = goal.current,
      orbit = controls.current
    if (!next || !orbit) return
    const speed = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 16)
    camera.position.lerp(next.position, speed)
    orbit.target.lerp(next.target, speed)
    if (camera instanceof OrthographicCamera) {
      camera.zoom += (next.zoom - camera.zoom) * speed
      camera.updateProjectionMatrix()
    }
    const settled =
      camera.position.distanceTo(next.position) < 0.001 &&
      orbit.target.distanceTo(next.target) < 0.001 &&
      (!(camera instanceof OrthographicCamera) || Math.abs(camera.zoom - next.zoom) < 0.001)
    if (settled) {
      camera.position.copy(next.position)
      orbit.target.copy(next.target)
      if (camera instanceof OrthographicCamera) {
        camera.zoom = next.zoom
        camera.updateProjectionMatrix()
      }
      goal.current = null
    }
    camera.lookAt(orbit.target)
    orbit.update()
    invalidate()
  })

  useEffect(() => {
    const orbit = controls.current,
      active = get().camera
    // Drei replaces its controls after the default camera changes. Wait for that pair.
    if (!orbit || orbit.object !== active || size.width <= 0 || size.height <= 0) return
    const bounds = product.current ? productBounds(product.current) : new Box3()
    if (bounds.isEmpty())
      bounds.setFromCenterAndSize(
        new Vector3(fallback.x, fallback.h / 2, fallback.z),
        new Vector3(fallback.w, fallback.h, fallback.d),
      )
    if (focus)
      bounds.setFromCenterAndSize(
        new Vector3(focus.x, focus.y, focus.z),
        new Vector3(focus.width, focus.height, config.d.d / 100),
      )
    else if (human)
      bounds.union(
        new Box3(
          new Vector3(-config.d.w / 200 - 0.7, 0, -0.1),
          new Vector3(-config.d.w / 200 - 0.25, 1.8, 0.1),
        ),
      )
    if (dimensions) bounds.expandByScalar(0.12)
    const old = previous.current
    const initial = boundsRef.current === null
    const changed =
      !boundsRef.current ||
      !boundsRef.current.min.equals(bounds.min) ||
      !boundsRef.current.max.equals(bounds.max)
    const resized = old.width !== size.width || old.height !== size.height
    const resetView = old.reset !== reset || old.model !== config.m || old.front !== front
    const fitView = old.fit !== fit
    const zoomDelta = zoom - old.zoom
    previous.current = {
      zoom,
      reset,
      fit,
      front,
      model: config.m,
      width: size.width,
      height: size.height,
    }
    boundsRef.current = bounds
    if (!initial && !changed && !resized && !resetView && !fitView && !zoomDelta) return

    const base = goal.current
    const target = base?.target.clone() ?? orbit.target.clone()
    const eye = base?.position.clone() ?? active.position.clone()
    const direction =
      initial || resetView
        ? new Vector3(front ? 0 : 0.52 * side, front ? 0 : 0.15, 1).normalize()
        : eye.clone().sub(target).normalize()
    const framing = cameraFit(
      bounds,
      direction,
      size.width,
      size.height,
      active instanceof PerspectiveCamera ? active.fov : 36,
    )
    orbit.minDistance = framing.minDistance
    orbit.maxDistance = framing.maxDistance
    orbit.minZoom = framing.zoom * 0.3
    orbit.maxZoom = framing.zoom * 3
    let next: Goal = { position: framing.position, target: framing.center, zoom: framing.zoom }
    if (zoomDelta && !initial && !resetView && !fitView && !resized && !changed) {
      const factor = Math.pow(1.2, zoomDelta)
      const distance = clamp(eye.distanceTo(target) / factor, orbit.minDistance, orbit.maxDistance)
      next = {
        target,
        position: target.clone().addScaledVector(direction, distance),
        zoom: clamp((base?.zoom ?? active.zoom) * factor, orbit.minZoom, orbit.maxZoom),
      }
    }
    const diagonal = bounds.getSize(new Vector3()).length()
    active.near = Math.max(0.005, diagonal / 1000)
    active.far = Math.max(100, framing.maxDistance + diagonal * 4)
    active.updateProjectionMatrix()
    if (reduced || initial || old.front !== front) {
      goal.current = null
      active.position.copy(next.position)
      orbit.target.copy(next.target)
      if (active instanceof OrthographicCamera) {
        active.zoom = next.zoom
        active.updateProjectionMatrix()
      }
      active.lookAt(orbit.target)
      orbit.update()
    } else goal.current = next
    invalidate()
  }, [
    camera,
    config,
    front,
    zoom,
    reset,
    fit,
    side,
    focus,
    human,
    dimensions,
    fallback,
    get,
    invalidate,
    product,
    reduced,
    size.width,
    size.height,
  ])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping={!reduced}
      dampingFactor={0.12}
      enableRotate={!front}
      enablePan={false}
      minDistance={0.05}
      maxDistance={100}
      minZoom={0.1}
      maxZoom={10000}
      minAzimuthAngle={-Math.PI * 0.44}
      maxAzimuthAngle={Math.PI * 0.44}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI / 2 + 0.04}
      onStart={() => {
        goal.current = null
      }}
      onChange={() => {
        const orbit = controls.current,
          bounds = boundsRef.current
        if (!orbit || !bounds) return
        orbit.minDistance = nearestCameraDistance(
          bounds,
          get().camera.position.clone().sub(orbit.target),
        )
      }}
    />
  )
}
