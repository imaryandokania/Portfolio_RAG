'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useMemo, useRef, Suspense } from 'react';

function Stars(props: any) {
  const ref = useRef<any>(null);
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
    if (!ref.current) return;
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#00fff5"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
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
