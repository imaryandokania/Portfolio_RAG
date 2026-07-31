'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

function MorphingSphere({ intensity }: { intensity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    const t = state.clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2) * 0.08 + intensity * 0.25;
    meshRef.current.scale.setScalar(THREE.MathUtils.clamp(pulse, 0.85, 1.25));
    meshRef.current.rotation.x += 0.01 + intensity * 0.01;
    meshRef.current.rotation.y += 0.02 + intensity * 0.015;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 3]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#0d9488"
        emissiveIntensity={1.8}
        metalness={0.4}
        roughness={0.25}
        wireframe
      />
    </mesh>
  );
}

export default function VoiceOrb({ intensity = 0 }: { intensity?: number }) {
  return (
    <div className="relative h-56 w-56 md:h-64 md:w-64">
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-[#38bdf8]/25 via-transparent to-[#38bdf8]/20 blur-2xl" />
      <div className="pointer-events-none absolute inset-2 -z-10 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm" />
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 40 }}
        style={{ borderRadius: '9999px' }}
        className="relative z-10"
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 0, 4]} intensity={2.2} color="#38bdf8" />
        <pointLight position={[2, 2, 2]} intensity={1.2} color="#38bdf8" />
        <Suspense fallback={null}>
          <MorphingSphere intensity={intensity} />
        </Suspense>
      </Canvas>
    </div>
  );
}
