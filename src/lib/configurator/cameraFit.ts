import { Box3, InstancedMesh, Vector3, type Object3D } from 'three'

/** Measure only the product subtree, never the room, lighting or environment. */
export function productBounds(product: Object3D) {
  product.updateWorldMatrix(true, true)
  product.traverse((object) => {
    // Instanced board matrices change with dimensions; cached bounds must follow them.
    if (object instanceof InstancedMesh) object.computeBoundingBox()
  })
  return new Box3().setFromObject(product)
}

export function nearestCameraDistance(bounds: Box3, direction: Vector3) {
  const half = bounds.getSize(new Vector3()).multiplyScalar(0.5)
  const unit = direction.clone().normalize()
  return (
    Math.abs(unit.x) * half.x +
    Math.abs(unit.y) * half.y +
    Math.abs(unit.z) * half.z +
    Math.max(0.03, half.length() * 0.12)
  )
}

/** Fit all eight corners in camera space, including depth and an oblique viewing angle. */
export function cameraFit(
  bounds: Box3,
  direction: Vector3,
  width: number,
  height: number,
  fov = 36,
  padding = 1.18,
) {
  const center = bounds.getCenter(new Vector3())
  const unit = direction.lengthSq() > 0 ? direction.clone().normalize() : new Vector3(0, 0, 1)
  const right = new Vector3().crossVectors(new Vector3(0, 1, 0), unit).normalize()
  const up = new Vector3().crossVectors(unit, right).normalize()
  const aspect = Math.max(1, width) / Math.max(1, height)
  const vertical = Math.tan((fov * Math.PI) / 360)
  const horizontal = vertical * aspect
  let distance = 0,
    projectedWidth = 0,
    projectedHeight = 0
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new Vector3(x, y, z).sub(center)
        const px = Math.abs(corner.dot(right)),
          py = Math.abs(corner.dot(up)),
          depth = corner.dot(unit)
        distance = Math.max(
          distance,
          depth + (px * padding) / horizontal,
          depth + (py * padding) / vertical,
        )
        projectedWidth = Math.max(projectedWidth, px * 2)
        projectedHeight = Math.max(projectedHeight, py * 2)
      }
  distance = Math.max(distance, nearestCameraDistance(bounds, unit))
  return {
    center,
    distance,
    position: center.clone().addScaledVector(unit, distance),
    minDistance: nearestCameraDistance(bounds, unit),
    maxDistance: distance * 4,
    zoom: Math.min(
      Math.max(1, width) / Math.max(0.01, projectedWidth * padding),
      Math.max(1, height) / Math.max(0.01, projectedHeight * padding),
    ),
  }
}
