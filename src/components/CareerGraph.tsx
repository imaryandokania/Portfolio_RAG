'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type GraphNode = {
  id: string;
  label: string;
  sub?: string;
  type: 'center' | 'experience' | 'project' | 'research';
  position: [number, number, number];
  targetSection?: string;
};

const COLORS: Record<GraphNode['type'], string> = {
  center: '#ffffff',
  experience: '#34d399',
  project: '#38bdf8',
  research: '#7dd3fc'
};

const NODE_SIZE: Record<GraphNode['type'], number> = {
  center: 0.34,
  experience: 0.22,
  project: 0.18,
  research: 0.16
};

function buildNodes(): GraphNode[] {
  const ring = (
    items: { label: string; sub?: string }[],
    radius: number,
    y: number,
    type: GraphNode['type'],
    targetSection: string,
    phase = 0
  ): GraphNode[] =>
    items.map((item, i) => {
      const angle = phase + (i / items.length) * Math.PI * 2;
      return {
        id: `${type}-${i}`,
        label: item.label,
        sub: item.sub,
        type,
        position: [
          Math.cos(angle) * radius,
          y + Math.sin(angle * 2.3) * 0.35,
          Math.sin(angle) * radius
        ] as [number, number, number],
        targetSection
      };
    });

  return [
    {
      id: 'center',
      label: 'ARYAN',
      type: 'center',
      position: [0, 0, 0]
    },
    ...ring(
      [
        { label: 'Microsoft', sub: 'Copilot Studio · 2026' },
        { label: 'UCSD CSE', sub: 'AI Researcher · 2026' },
        { label: 'Cisco', sub: 'SWE II Intern · 2025' },
        { label: 'Rose Yu Lab', sub: 'Researcher · 2024' },
        { label: 'Oracle', sub: 'SDE 1 · 2023' }
      ],
      3.1,
      0.5,
      'experience',
      'experience',
      0.4
    ),
    ...ring(
      [
        { label: 'DASH Streaming', sub: 'Go · AWS' },
        { label: 'gRPC LB', sub: 'Go · K8s' },
        { label: 'JIRA Search', sub: 'LLaMA 3.1' }
      ],
      2.4,
      -1.2,
      'project',
      'projects',
      1.6
    ),
    ...ring(
      [
        { label: 'ICLR WS 2025', sub: 'L2O Symmetries' },
        { label: 'i-PACT 2023', sub: 'Grammar Correction' },
        { label: 'SSIC 2023', sub: 'Secure Sharing' }
      ],
      2.7,
      1.6,
      'research',
      'research',
      2.9
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
  const baseY = node.position[1];

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // gentle float
    mesh.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.8 + node.position[0]) * 0.08;
    // smooth hover scale
    const target = hovered ? 1.5 : 1;
    mesh.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
  });

  const color = COLORS[node.type];

  return (
    <group>
      <mesh
        ref={meshRef}
        position={node.position}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
          document.body.style.cursor = node.targetSection ? 'pointer' : 'default';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[NODE_SIZE[node.type], 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.6 : 0.55}
          roughness={0.3}
        />
      </mesh>
      <Html
        position={[node.position[0], node.position[1] + NODE_SIZE[node.type] + 0.22, node.position[2]]}
        center
        distanceFactor={9}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] leading-tight transition-colors ${
            hovered
              ? 'border-white/40 bg-black/90 text-white'
              : 'border-white/10 bg-black/60 text-white/70'
          }`}
        >
          <span style={{ color }}>{node.label}</span>
          {hovered && node.sub && <span className="ml-1 text-white/50">{node.sub}</span>}
        </div>
      </Html>
    </group>
  );
}

function Graph() {
  const nodes = useMemo(buildNodes, []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const center = nodes[0];
  const edges = useMemo(() => {
    const list: { from: [number, number, number]; to: [number, number, number]; color: string }[] = [];
    nodes.slice(1).forEach((n) => {
      list.push({ from: center.position, to: n.position, color: COLORS[n.type] });
    });
    // chronological career path: Oracle → Rose Yu Lab → Cisco → UCSD CSE → Microsoft
    const path = ['experience-4', 'experience-3', 'experience-2', 'experience-1', 'experience-0'];
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = nodes.find((n) => n.id === path[i]);
      const b = nodes.find((n) => n.id === path[i + 1]);
      if (a && b) {
        list.push({ from: a.position, to: b.position, color: '#34d399' });
      }
    }
    return list;
  }, [nodes, center.position]);

  const handleSelect = (node: GraphNode) => {
    if (!node.targetSection) return;
    document.getElementById(node.targetSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={40} color="#38bdf8" />
      <pointLight position={[-5, -3, -5]} intensity={25} color="#34d399" />
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={[edge.from, edge.to]}
          color={edge.color}
          lineWidth={1}
          transparent
          opacity={0.22}
        />
      ))}
      {nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          hovered={hoveredId === node.id}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
      ))}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.7}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
      />
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
        <Canvas camera={{ position: [0, 1.2, 7.5], fov: 50 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Graph />
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
