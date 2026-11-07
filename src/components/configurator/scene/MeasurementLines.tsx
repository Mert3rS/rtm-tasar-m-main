import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useSceneColors } from './SceneTheme'

export function MeasurementLines({
  width,
  height,
  depth,
  ink,
  returnLength,
  returnSide,
}: {
  width: number
  height: number
  depth: number
  ink?: string
  returnLength?: number
  returnSide?: 'left' | 'right'
}) {
  const colors = useSceneColors()
  const z = depth / 2 + 0.12
  const rx = (returnSide === 'left' ? -1 : 1) * (width / 2 + 0.15)
  const points = useMemo(
    () =>
      new Float32Array([
        -width / 2,
        -0.1,
        z,
        width / 2,
        -0.1,
        z,
        -width / 2,
        -0.15,
        z,
        -width / 2,
        -0.05,
        z,
        width / 2,
        -0.15,
        z,
        width / 2,
        -0.05,
        z,
        -width / 2 - 0.15,
        0,
        z,
        -width / 2 - 0.15,
        height,
        z,
        -width / 2 - 0.2,
        0,
        z,
        -width / 2 - 0.1,
        0,
        z,
        -width / 2 - 0.2,
        height,
        z,
        -width / 2 - 0.1,
        height,
        z,
        ...(returnLength ? [rx, -0.1, -depth / 2, rx, -0.1, returnLength - depth / 2] : []),
      ]),
    [width, height, z, rx, depth, returnLength],
  )
  return (
    <group>
      {returnLength ? (
        <Html
          center
          position={[rx, -0.1, (returnLength - depth) / 2]}
          style={{ pointerEvents: 'none' }}
        >
          <span className="dc-measure-label">Dönüş {Math.round(returnLength * 100)} cm</span>
        </Html>
      ) : null}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={ink ?? colors.selection} toneMapped={false} depthTest={false} />
      </lineSegments>
      <Html center position={[0, -0.1, z]} style={{ pointerEvents: 'none' }}>
        <span className="dc-measure-label">{Math.round(width * 10000) / 100} cm</span>
      </Html>
      <Html center position={[-width / 2 - 0.15, height / 2, z]} style={{ pointerEvents: 'none' }}>
        <span className="dc-measure-label">{Math.round(height * 10000) / 100} cm</span>
      </Html>
    </group>
  )
}
