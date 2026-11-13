import { useMemo } from 'react'

export function SelectionOutline({
  width,
  height,
  position,
  color,
  ignorePointer = false,
}: {
  width: number
  height: number
  position: [number, number, number]
  color: string
  ignorePointer?: boolean
}) {
  const points = useMemo(
    () =>
      new Float32Array([
        -width / 2,
        -height / 2,
        0,
        width / 2,
        -height / 2,
        0,
        width / 2,
        height / 2,
        0,
        -width / 2,
        height / 2,
        0,
      ]),
    [width, height],
  )
  return (
    <lineLoop position={position} raycast={ignorePointer ? () => undefined : undefined}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} depthTest={false} toneMapped={false} transparent opacity={0.85} />
    </lineLoop>
  )
}
