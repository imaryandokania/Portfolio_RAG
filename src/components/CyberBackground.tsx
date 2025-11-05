'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useEffect, useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';

function Stars(props: any) {
  const trailRef = useRef<THREE.Points>(null);
  const trailPositions = useMemo(() => {
    const count = 60;
    return new Float32Array(count * 3);
  }, []);
  const ref = useRef<any>(null);
  useEffect(() => {
    if (trailRef.current) {
      trailRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailRef.current.geometry.attributes.position.needsUpdate = true;
      trailRef.current.geometry.computeBoundingSphere();
    }
  }, [trailPositions]);

  const positions = useMemo(() => {
    const count = 1500;
    const buffer = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      let x = 0;
      let y = 0;
      let z = 0;
      let lengthSquared = 0;

      // Rejection sampling to keep points inside a unit sphere
      while (!lengthSquared || lengthSquared > 1) {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        lengthSquared = x * x + y * y + z * z;
      }

      const length = Math.sqrt(lengthSquared);
      const scale = (1.5 * Math.cbrt(Math.random())) / length;
      const offset = i * 3;
      buffer[offset] = x * scale;
      buffer[offset + 1] = y * scale;
      buffer[offset + 2] = z * scale;
    }

    return buffer;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current || !trailRef.current) return;

    ref.current.rotation.x -= delta / 12;
    ref.current.rotation.y -= delta / 18;

    const { pointer } = state;
    const px = pointer.x * 2;
    const py = pointer.y * 2;

    const positions = trailPositions;
    const len = positions.length;

    for (let i = len - 3; i >= 3; i -= 3) {
      positions[i] = positions[i - 3] * 0.94;
      positions[i + 1] = positions[i - 2] * 0.94;
      positions[i + 2] = positions[i - 1] * 0.94;
    }

    positions[0] = px;
    positions[1] = py;
    positions[2] = 0;

    trailRef.current.geometry.attributes.position.needsUpdate = true;
    trailRef.current.geometry.computeBoundingSphere();
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <group>
        <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
          <PointMaterial
            transparent
            color="#00fff5"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
        </Points>
        <Points ref={trailRef} positions={trailPositions} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color="#ff2d55"
            size={0.01}
            sizeAttenuation={true}
            depthWrite={false}
            opacity={0.45}
          />
        </Points>
      </group>
    </group>
  );
}

export default function CyberBackground() {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 opacity-60">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Suspense fallback={null}>
          <Stars />
        </Suspense>
      </Canvas>
    </div>
  );
}
