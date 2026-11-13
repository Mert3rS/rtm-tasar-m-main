import { describe, expect, it } from 'vitest'
import {
  Box3,
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Vector3,
} from 'three'
import { cameraFit, productBounds } from '@/lib/configurator/cameraFit'

describe('Object-aware studio framing', () => {
  for (const [width, height] of [
    [1440, 800],
    [390, 650],
    [800, 300],
  ]) {
    for (const size of [
      [2.4, 2.25, 0.4],
      [0.6, 2.8, 0.7],
      [6, 2.4, 3.5],
    ]) {
      for (const direction of [
        new Vector3(0, 0, 1),
        new Vector3(0.52, 0.15, 1),
        new Vector3(-1, 0.4, 0.4),
      ]) {
        it(`fits ${size.join('x')} at ${width}x${height}, angle ${direction.x}`, () => {
          // Offset centers cover suspended units, tall side cabinets and L-shaped kitchens.
          const bounds = new Box3().setFromCenterAndSize(
            new Vector3(-0.7, 1.4, 0.8),
            new Vector3(...size),
          )
          const fit = cameraFit(bounds, direction, width, height)
          const perspective = new PerspectiveCamera(36, width / height, 0.001, 1000)
          const orthographic = new OrthographicCamera(
            -width / 2,
            width / 2,
            height / 2,
            -height / 2,
            0.001,
            1000,
          )
          orthographic.zoom = fit.zoom
          for (const camera of [perspective, orthographic]) {
            camera.position.copy(fit.position)
            camera.lookAt(fit.center)
            camera.updateMatrixWorld()
            camera.updateProjectionMatrix()
            for (const x of [bounds.min.x, bounds.max.x])
              for (const y of [bounds.min.y, bounds.max.y])
                for (const z of [bounds.min.z, bounds.max.z]) {
                  const point = new Vector3(x, y, z).project(camera)
                  expect(Math.abs(point.x)).toBeLessThanOrEqual(1 / 1.18 + 0.00001)
                  expect(Math.abs(point.y)).toBeLessThanOrEqual(1 / 1.18 + 0.00001)
                  expect(point.z).toBeGreaterThan(-1)
                  expect(point.z).toBeLessThan(1)
                }
          }
          expect(fit.minDistance).toBeLessThan(fit.distance)
          expect(fit.maxDistance).toBeGreaterThan(fit.distance)
        })
      }
    }
  }

  it('refreshes instanced board bounds after dimensions change, excluding the room', () => {
    const product = new Group(),
      scene = new Group()
    const geometry = new BoxGeometry(1, 1, 1),
      material = new MeshBasicMaterial()
    const boards = new InstancedMesh(geometry, material, 1)
    product.add(boards)
    scene.add(product, new InstancedMesh(new BoxGeometry(100, 100, 100), material, 1))
    boards.setMatrixAt(0, new Matrix4().makeScale(1, 2, 0.5))
    expect(productBounds(product).getSize(new Vector3()).toArray()).toEqual([1, 2, 0.5])
    boards.setMatrixAt(0, new Matrix4().makeScale(4, 3, 0.7))
    const size = productBounds(product).getSize(new Vector3())
    expect(size.x).toBeCloseTo(4)
    expect(size.y).toBeCloseTo(3)
    expect(size.z).toBeCloseTo(0.7)
    geometry.dispose()
    scene.children[1].traverse((object) => {
      if (object instanceof InstancedMesh) object.geometry.dispose()
    })
    material.dispose()
  })
})
