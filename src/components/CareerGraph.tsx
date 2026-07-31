'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type NodeType = 'center' | 'experience' | 'project' | 'research';

type GraphNode = {
  id: string;
  label: string;
  sub?: string;
  type: NodeType;
  position: [number, number, number];
  targetSection?: string;
};

const COLORS: Record<NodeType, string> = {
  center: '#ffffff',
  experience: '#34d399',
  project: '#38bdf8',
  research: '#7dd3fc'
};

const NODE_SIZE: Record<NodeType, number> = {
  center: 0.3,
  experience: 0.16,
  project: 0.14,
  research: 0.13
};

// Point on a circle of radius r, tilted by t around the X axis
function orbitPoint(r: number, t: number, angle: number): [number, number, number] {
  return [r * Math.cos(angle), -r * Math.sin(angle) * Math.sin(t), r * Math.sin(angle) * Math.cos(t)];
}

function orbitRing(r: number, t: number, segments = 96): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    pts.push(orbitPoint(r, t, (i / segments) * Math.PI * 2));
  }
  return pts;
}

const RINGS: { type: NodeType; radius: number; tilt: number }[] = [
  { type: 'experience', radius: 3.1, tilt: 0.18 },
  { type: 'project', radius: 2.2, tilt: -0.5 },
  { type: 'research', radius: 2.65, tilt: 0.95 }
];

function buildNodes(): GraphNode[] {
  const onRing = (
    items: { label: string; sub?: string }[],
    ring: { type: NodeType; radius: number; tilt: number },
    targetSection: string,
    phase = 0
  ): GraphNode[] =>
    items.map((item, i) => ({
      id: `${ring.type}-${i}`,
      label: item.label,
      sub: item.sub,
      type: ring.type,
      position: orbitPoint(ring.radius, ring.tilt, phase + (i / items.length) * Math.PI * 2),
      targetSection
    }));

  return [
    { id: 'center', label: 'ARYAN', sub: 'research engineer', type: 'center', position: [0, 0, 0] },
    ...onRing(
      [
        { label: 'Microsoft', sub: 'Copilot Studio · 2026' },
        { label: 'UCSD CSE', sub: 'AI Researcher · 2026' },
        { label: 'Cisco', sub: 'SWE II Intern · 2025' },
        { label: 'Rose Yu Lab', sub: 'Researcher · 2024' },
        { label: 'Oracle', sub: 'SDE 1 · 2023' }
      ],
      RINGS[0],
      'experience',
      0.3
    ),
    ...onRing(
      [
        { label: 'DASH Streaming', sub: 'Go · AWS' },
        { label: 'gRPC LB', sub: 'Go · K8s' },
        { label: 'JIRA Search', sub: 'LLaMA 3.1' }
      ],
      RINGS[1],
      'projects',
      1.2
    ),
    ...onRing(
      [
        { label: 'ICLR WS 2025', sub: 'L2O Symmetries' },
        { label: 'i-PACT 2023', sub: 'Grammar Correction' },
        { label: 'SSIC 2023', sub: 'Secure Sharing' }
      ],
      RINGS[2],
      'research',
      2.4
    )
  ];
}

function Node({
  node,
  hovered,
  onHover,
  onSelect
}: {
  node: GraphNode;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (node: GraphNode) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetScale = useRef(new THREE.Vector3(1, 1, 1));

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const s = hovered ? 1.7 : 1;
    targetScale.current.set(s, s, s);
    mesh.scale.lerp(targetScale.current, 0.15);
  });

  const color = COLORS[node.type];
  const isCenter = node.type === 'center';

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
          if (node.targetSection) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[NODE_SIZE[node.type], 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={hovered || isCenter ? 1 : 0.85} />
      </mesh>
      {/* soft halo */}
      <mesh>
        <sphereGeometry args={[NODE_SIZE[node.type] * 1.9, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.25 : 0.08} depthWrite={false} />
      </mesh>
      <Html center position={[0, -(NODE_SIZE[node.type] + 0.32), 0]} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
        <div
          className="whitespace-nowrap text-center font-mono leading-tight"
          style={{ textShadow: '0 0 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.9)' }}
        >
          <p style={{ color, fontSize: isCenter ? 12 : 10, fontWeight: 600, letterSpacing: '0.05em' }}>
            {node.label}
          </p>
          {(hovered || isCenter) && node.sub && (
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{node.sub}</p>
          )}
        </div>
      </Html>
    </group>
  );
}

function Scene() {
  const nodes = useMemo(buildNodes, []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // slow idle spin of the whole system (OrbitControls autoRotate spins the camera instead;
  // we spin the group so labels stay readable while rings sweep through space)
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  const careerPath = useMemo(() => {
    const order = ['experience-4', 'experience-3', 'experience-2', 'experience-1', 'experience-0'];
    return order
      .map((id) => nodes.find((n) => n.id === id)?.position)
      .filter((p): p is [number, number, number] => Boolean(p));
  }, [nodes]);

  const handleSelect = (node: GraphNode) => {
    if (!node.targetSection) return;
    document.getElementById(node.targetSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <group ref={groupRef}>
        {/* orbit rings */}
        {RINGS.map((ring) => (
          <Line
            key={ring.type}
            points={orbitRing(ring.radius, ring.tilt)}
            color={COLORS[ring.type]}
            lineWidth={1}
            transparent
            opacity={0.18}
          />
        ))}
        {/* chronological career path */}
        {careerPath.length > 1 && (
          <Line points={careerPath} color="#34d399" lineWidth={1.5} transparent opacity={0.3} dashed dashSize={0.15} gapSize={0.1} />
        )}
        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            hovered={hoveredId === node.id}
            onHover={setHoveredId}
            onSelect={handleSelect}
          />
        ))}
      </group>
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  );
}

export default function CareerGraph() {
  return (
    <div id="career-graph" className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_45px_rgba(16,185,129,0.05)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <p className="ml-3 font-mono text-xs text-white/50">
          <span className="text-emerald-400">aryan@portfolio</span>
          <span className="text-white/40">:~$ </span>
          <span className="text-white/80">python3 visualize.py --graph=career</span>
        </p>
        <p className="ml-auto hidden font-mono text-[10px] uppercase tracking-widest text-white/30 sm:block">
          drag to orbit · click a node
        </p>
      </div>
      <div className="h-[380px] md:h-[440px]">
        <Canvas camera={{ position: [0, 1.6, 7], fov: 45 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-5 flex gap-4 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-emerald-300">● experience</span>
        <span className="text-[#38bdf8]">● projects</span>
        <span className="text-[#7dd3fc]">● research</span>
      </div>
    </div>
  );
}
