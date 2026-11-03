'use client';

import Image from 'next/image';
import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { easeInOutCubic, lerp, mulberry32, useMediaQuery } from './util';

/* The ad's second shot: a tight cluster of app screens that bursts into a
   full-bleed mosaic. Here every screen is a piece of Aryan's work. */

type Kind =
  | 'review'
  | 'chartA'
  | 'chartB'
  | 'orb'
  | 'terminal'
  | 'agent'
  | 'heatmap'
  | 'lb'
  | 'paper'
  | 'rag'
  | 'codenib'
  | 'eval'
  | 'stream'
  | 'loss';

type Spec = { kind: Kind; rect: [number, number, number, number] }; // left, top (vh), width (vw), height (vh)

const DESKTOP: Spec[] = [
  { kind: 'review', rect: [-5, -8, 26, 32] },
  { kind: 'chartA', rect: [-5, 26, 26, 30] },
  { kind: 'orb', rect: [-5, 58, 26, 46] },
  { kind: 'terminal', rect: [22.2, -6, 28, 26] },
  { kind: 'agent', rect: [22.2, 22, 28, 38] },
  { kind: 'heatmap', rect: [22.2, 62, 28, 22] },
  { kind: 'lb', rect: [22.2, 86, 28, 24] },
  { kind: 'paper', rect: [51.4, -12, 22, 40] },
  { kind: 'rag', rect: [51.4, 30, 22, 24] },
  { kind: 'codenib', rect: [51.4, 56, 22, 28] },
  { kind: 'loss', rect: [51.4, 86, 22, 24] },
  { kind: 'chartB', rect: [74.6, -4, 29.4, 32] },
  { kind: 'eval', rect: [74.6, 30, 29.4, 34] },
  { kind: 'stream', rect: [74.6, 66, 29.4, 40] }
];

const MOBILE: Spec[] = [
  { kind: 'review', rect: [-6, -6, 53, 22] },
  { kind: 'chartA', rect: [-6, 18, 53, 17] },
  { kind: 'agent', rect: [-6, 37, 53, 27] },
  { kind: 'heatmap', rect: [-6, 66, 53, 16] },
  { kind: 'orb', rect: [-6, 84, 53, 24] },
  { kind: 'terminal', rect: [49, -10, 55, 20] },
  { kind: 'paper', rect: [49, 12, 55, 28] },
  { kind: 'rag', rect: [49, 42, 55, 18] },
  { kind: 'eval', rect: [49, 62, 55, 22] },
  { kind: 'codenib', rect: [49, 86, 55, 22] }
];

const mono = { fontFamily: 'var(--font-mono)' } as const;

function Dots() {
  return (
    <span className="absolute left-[4cqw] top-[4cqh] flex gap-[1.6cqw]">
      <i className="block h-[2.6cqw] w-[2.6cqw] rounded-full bg-[#ff5f57]" />
      <i className="block h-[2.6cqw] w-[2.6cqw] rounded-full bg-[#febc2e]" />
      <i className="block h-[2.6cqw] w-[2.6cqw] rounded-full bg-[#28c840]" />
    </span>
  );
}

function TileBody({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'chartA':
    case 'chartB':
      return (
        <div className="absolute inset-0 bg-white">
          <Image
            src={kind === 'chartA' ? '/reward-vs-task/post_1_naive.png' : '/reward-vs-task/post_2_full.png'}
            alt=""
            fill
            sizes="(max-width: 768px) 55vw, 30vw"
            className="object-contain p-[3cqw]"
          />
        </div>
      );
    case 'review':
      return (
        <div className="absolute inset-0 bg-[#0d1117] text-[3.4cqw] leading-[1.7]" style={mono}>
          <Dots />
          <p className="absolute right-[4cqw] top-[2.6cqh] text-[3cqw] text-white/40">review · pr #482</p>
          <div className="absolute inset-x-0 top-[14cqh] space-y-[0.4cqh] px-[4cqw]">
            <p className="text-white/45">41&nbsp; for attempt in range(retries):</p>
            <p className="rounded bg-[#f85149]/20 text-[#ffa198]">42 − &nbsp;resp = client.send(req)</p>
            <p className="rounded bg-[#2ea043]/20 text-[#7ee787]">42 + &nbsp;resp = client.send(req, timeout=t)</p>
            <p className="rounded bg-[#2ea043]/20 text-[#7ee787]">43 + &nbsp;if resp is None: continue</p>
            <p className="text-white/45">44&nbsp; &nbsp;return resp.json()</p>
          </div>
          <div className="absolute bottom-[6cqh] left-[4cqw] right-[4cqw] rounded-[2cqw] border border-[#a371f7]/40 bg-[#a371f7]/10 p-[3cqw] text-[3.2cqw] leading-snug text-[#d2b8ff]">
            <span className="text-white/60">LLM review ·</span> retry path can return None — guard before .json()
          </div>
        </div>
      );
    case 'orb':
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
          <div
            className="h-[52cqw] w-[52cqw] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #ffffff 0%, #9ad7ff 12%, #3b82f6 38%, #7c3aed 64%, rgba(124,58,237,0) 72%)',
              boxShadow: '0 0 12cqw rgba(56,189,248,0.45)',
              animation: 'studio-orb 6s ease-in-out infinite'
            }}
          />
          <p className="mt-[7cqh] text-[4cqw] text-white/55">voice agent · listening…</p>
        </div>
      );
    case 'terminal':
      return (
        <div className="absolute inset-0 bg-[#0a0a0a] px-[5cqw] pt-[17cqh] text-[3.6cqw] leading-[1.75]" style={mono}>
          <Dots />
          <p className="text-emerald-300"><span className="text-emerald-500">$</span> whoami</p>
          <p className="text-white/80">aryan_dokania</p>
          <p className="text-emerald-300"><span className="text-emerald-500">$</span> cat focus.txt</p>
          <p className="text-white/80">agents · retrieval · evals</p>
          <p className="text-emerald-300"><span className="text-emerald-500">$</span> ./ask_me_anything.sh</p>
          <p className="text-[#38bdf8]">RAG agent ready ▊</p>
        </div>
      );
    case 'agent': {
      const nodes = [
        { t: 'Trigger', d: 'user message', c: '#8e8e93' },
        { t: 'Retrieve', d: 'knowledge sources', c: '#64d2ff' },
        { t: 'Tool call', d: 'search_docs()', c: '#bf5af2' },
        { t: 'Respond', d: 'grounded answer', c: '#30d158' }
      ];
      return (
        <div
          className="absolute inset-0 bg-[#121018]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '4cqw 4cqw' }}
        >
          <p className="absolute left-[5cqw] top-[4cqh] text-[3.2cqw] text-white/45" style={mono}>agent.flow</p>
          <div className="absolute inset-x-[14cqw] top-[13cqh] bottom-[5cqh] flex flex-col justify-between">
            {nodes.map((n, i) => (
              <div key={n.t} className="relative">
                <div className="rounded-[2.2cqw] border border-white/10 bg-[#1d1a26] px-[4cqw] py-[1.6cqh] shadow-lg">
                  <p className="text-[3.8cqw] font-semibold" style={{ color: n.c }}>{n.t}</p>
                  <p className="text-[3.1cqw] text-white/55">{n.d}</p>
                </div>
                {i < nodes.length - 1 && <span className="absolute left-1/2 top-full h-[3cqh] w-px bg-white/25" />}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'heatmap': {
      const r = mulberry32(42);
      const shades = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
      return (
        <div className="absolute inset-0 bg-[#0d1117] p-[4cqw]">
          <p className="mb-[2cqh] text-[3cqw] text-white/45" style={mono}>contributions</p>
          <div className="grid grid-flow-col grid-rows-7 gap-[0.8cqw]">
            {Array.from({ length: 7 * 26 }, (_, i) => (
              <i key={i} className="block aspect-square rounded-[0.5cqw]" style={{ background: shades[Math.floor(Math.pow(r(), 1.6) * 5)] }} />
            ))}
          </div>
        </div>
      );
    }
    case 'lb':
      return (
        <div className="absolute inset-0 bg-[#0b0f14] p-[5cqw]">
          <p className="text-[3cqw] text-white/45" style={mono}>grpc-lb · kubernetes</p>
          <p className="mt-[2cqh] text-[11cqw] font-semibold leading-none text-[#30d158]">p99 −35%</p>
          <div className="mt-[4cqh] space-y-[1.6cqh]">
            {[0.82, 0.57, 0.31].map((s, i) => (
              <div key={i} className="flex items-center gap-[2cqw] text-[3cqw] text-white/55" style={mono}>
                <span className="w-[12cqw]">pod-{i + 1}</span>
                <span className="h-[2.4cqh] rounded-full bg-[#64d2ff]" style={{ width: `${s * 60}cqw` }} />
                <span>{s.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'paper':
      return (
        <div className="absolute inset-0 bg-[#fbfbfd] px-[7cqw] pt-[6cqh] text-[#1d1d1f]">
          <p className="text-[3.2cqw] font-semibold uppercase tracking-[0.12em] text-[#bf5af2]">ICLR 2025 · Workshop</p>
          <p className="mt-[2cqh] font-serif text-[6.6cqw] leading-[1.15]">Improving Learning to Optimize Using Parameter Symmetries</p>
          <p className="mt-[2cqh] text-[3.4cqw] text-[#6e6e73]">G. Zamir, A. Dokania, B. Zhao, R. Yu</p>
          <div className="mt-[3cqh] space-y-[1.4cqh]">
            {[100, 94, 98, 88, 96, 70].map((w, i) => (
              <i key={i} className="block h-[1.3cqh] rounded-full bg-[#d2d2d7]" style={{ width: `${w}%` }} />
            ))}
          </div>
          <svg viewBox="0 0 100 40" className="mt-[3cqh] w-full" aria-hidden="true">
            <path d="M2 4 C 20 30, 40 34, 98 36" stroke="#86868b" strokeWidth="1.2" fill="none" />
            <path d="M2 4 C 12 26, 26 34, 98 37.5" stroke="#bf5af2" strokeWidth="1.6" fill="none" />
          </svg>
        </div>
      );
    case 'rag': {
      const steps = ['query', 'embed', 'FAISS', 'rerank', 'LLM'];
      return (
        <div className="absolute inset-0 bg-[#0b0d12] p-[5cqw]" style={mono}>
          <p className="text-[3.2cqw] text-white/45">rag.pipeline</p>
          <div className="mt-[5cqh] flex flex-wrap items-center gap-[1.6cqw] text-[3.8cqw]">
            {steps.map((s, i) => (
              <span key={s} className="flex items-center gap-[1.6cqw]">
                <span className="rounded-[1.6cqw] border border-[#64d2ff]/40 bg-[#64d2ff]/10 px-[2.2cqw] py-[0.6cqh] text-[#9fe1ff]">{s}</span>
                {i < steps.length - 1 && <span className="text-white/30">→</span>}
              </span>
            ))}
          </div>
          <div className="mt-[5cqh] space-y-[1.4cqh] text-[3.2cqw] text-white/55">
            {[0.92, 0.88, 0.81].map((s) => (
              <div key={s} className="flex items-center gap-[2cqw]">
                <span className="h-[1.6cqh] rounded-full bg-[#30d158]" style={{ width: `${s * 55}cqw` }} />
                <span>{s.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'codenib':
      return (
        <div className="absolute inset-0 bg-[#f5f5f7] p-[6cqw] text-[#1d1d1f]">
          <p className="text-[3.4cqw] font-semibold text-[#6e6e73]">CodeNib · arXiv 2026</p>
          <p className="mt-[3cqh] text-[13cqw] font-semibold leading-none tracking-tight">8.7–25.4×</p>
          <p className="mt-[1.4cqh] text-[4cqw] text-[#424245]">faster graph &amp; vector updates</p>
          <p className="mt-[4cqh] text-[9cqw] font-semibold leading-none tracking-tight text-[#0071e3]">50–87%</p>
          <p className="mt-[1.4cqh] text-[4cqw] text-[#424245]">fewer agent trajectory tokens</p>
        </div>
      );
    case 'eval':
      return (
        <div className="absolute inset-0 bg-[#0c0c0e] p-[5cqw]" style={mono}>
          <p className="text-[3cqw] text-white/45">reward_vs_task · 36 runs</p>
          {[
            { name: 'reward from task text', success: 94, done: 6, ok: false },
            { name: 'reward checks full spec', success: 54, done: 54, ok: true }
          ].map((row) => (
            <div key={row.name} className="mt-[4cqh] rounded-[2cqw] border border-white/10 bg-white/[0.03] p-[3cqw]">
              <div className="flex items-center justify-between text-[3.3cqw] text-white/75">
                <span>{row.name}</span>
                <span
                  className="rounded-full px-[2cqw] text-[2.8cqw]"
                  style={{ background: row.ok ? 'rgba(48,209,88,.18)' : 'rgba(255,69,58,.18)', color: row.ok ? '#30d158' : '#ff6961' }}
                >
                  {row.ok ? 'no gap' : 'gap'}
                </span>
              </div>
              <div className="mt-[1.6cqh] space-y-[1cqh] text-[2.8cqw] text-white/50">
                <div className="flex items-center gap-[2cqw]">
                  <span className="w-[22cqw]">marked</span>
                  <span className="h-[1.6cqh] rounded-full bg-[#3b82f6]" style={{ width: `${row.success * 0.42}cqw` }} />
                  <span>{row.success}%</span>
                </div>
                <div className="flex items-center gap-[2cqw]">
                  <span className="w-[22cqw]">done</span>
                  <span className="h-[1.6cqh] rounded-full bg-[#f97316]" style={{ width: `${row.done * 0.42}cqw` }} />
                  <span>{row.done}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    case 'stream':
      return (
        <div className="absolute inset-0 bg-[#101012] p-[5cqw]" style={mono}>
          <p className="text-[3cqw] text-white/45">mpeg-dash · adaptive bitrate</p>
          <div className="mt-[4cqh] grid grid-cols-6 gap-[1.2cqw]">
            {Array.from({ length: 18 }, (_, i) => (
              <span
                key={i}
                className="aspect-video rounded-[1cqw]"
                style={{ background: `linear-gradient(135deg, hsl(${200 + i * 9} 70% ${30 + (i % 3) * 10}%), hsl(${260 + i * 7} 60% 22%))` }}
              />
            ))}
          </div>
          <div className="mt-[4cqh] space-y-[1.2cqh] text-[2.8cqw] text-white/55">
            {[
              ['1080p', 92, '#bf5af2'],
              ['720p', 70, '#64d2ff'],
              ['360p', 44, '#30d158']
            ].map(([label, w, c]) => (
              <div key={label as string} className="flex items-center gap-[2cqw]">
                <span className="w-[10cqw]">{label}</span>
                <span className="h-[1.4cqh] rounded-full" style={{ width: `${(w as number) * 0.6}cqw`, background: c as string }} />
              </div>
            ))}
          </div>
        </div>
      );
    case 'loss':
    default:
      return (
        <div className="absolute inset-0 bg-[#0b0b0d] p-[5cqw]">
          <p className="text-[3cqw] text-white/45" style={mono}>meta-optimizer · loss</p>
          <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="mt-[3cqh] h-[62cqh] w-full" aria-hidden="true">
            <path d="M0 4 C 25 20, 50 30, 100 38" stroke="#636366" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M0 4 C 15 26, 40 38, 100 42" stroke="#64d2ff" strokeWidth="1.4" fill="none" vectorEffect="non-scaling-stroke" />
            <path d="M0 4 C 8 34, 30 44, 100 46" stroke="#bf5af2" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-[1cqh] flex gap-[4cqw] text-[2.8cqw] text-white/55" style={mono}>
            <span className="text-[#8e8e93]">GD</span>
            <span className="text-[#64d2ff]">LSTM</span>
            <span className="text-[#bf5af2]">ours</span>
          </div>
        </div>
      );
  }
}

function Tile({ spec, e, children }: { spec: Spec; e: MotionValue<number>; children: ReactNode }) {
  const [l, t, w, h] = spec.rect;
  const dx = l + w / 2 - 50;
  const dy = t + h / 2 - 50;
  const x = useTransform(e, (v) => `${(lerp(0.3, 1, v) - 1) * dx}vw`);
  const y = useTransform(e, (v) => `${(lerp(0.3, 1, v) - 1) * dy}vh`);
  const scale = useTransform(e, (v) => lerp(0.3, 1, v));
  return (
    <motion.div
      className="studio-tile"
      style={{ left: `${l}vw`, top: `${t}vh`, width: `${w}vw`, height: `${h}vh`, x, y, scale }}
    >
      {children}
    </motion.div>
  );
}

export default function CollageScene() {
  const ref = useRef<HTMLElement | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const e = useTransform(p, [0.08, 0.6], [0, 1], { ease: easeInOutCubic });
  const drift = useTransform(p, [0.6, 1], [1, 1.08]);
  const opacity = useTransform(p, [0, 0.84, 1], [1, 1, 0]);
  const tiles = isMobile ? MOBILE : DESKTOP;

  return (
    <section ref={ref} className="studio-scene h-[190vh]" aria-label="A collage of Aryan's work">
      <div className="studio-sticky">
        <motion.div className="absolute inset-0" style={{ scale: drift, opacity }}>
          {tiles.map((spec) => (
            <Tile key={spec.kind} spec={spec} e={e}>
              <TileBody kind={spec.kind} />
            </Tile>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
