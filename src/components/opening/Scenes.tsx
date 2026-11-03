'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue
} from 'framer-motion';
import MediaWordmark from './MediaWordmark';
import { mulberry32 } from './util';
import { resumeData } from '../../data/resumeData';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const DISPLAY = 'studio-display text-[#f5f5f7]';

function useSceneProgress() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return { ref, p: scrollYProgress };
}

/* ───────────────────────── Hero ───────────────────────── */

export function HeroScene({
  onAsk,
  onRecruiter,
  onSettled
}: {
  onAsk: () => void;
  onRecruiter: () => void;
  onSettled: () => void;
}) {
  const [done, setDone] = useState(false);
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: done ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 0.8, ease: EASE, delay }
  });

  return (
    <section id="top" className="studio-scene flex h-[100svh] min-h-[560px] flex-col items-center justify-center overflow-hidden px-4 text-center">
      <MediaWordmark
        as="h1"
        text={resumeData.name}
        className="text-[clamp(44px,11.6vw,164px)]"
        onSettled={() => {
          setDone(true);
          onSettled();
        }}
      />
      <motion.div {...reveal(0)} className="mt-6 md:mt-8">
        <p className={`${DISPLAY} text-[clamp(21px,2.6vw,36px)]`}>Research Engineer at Microsoft.</p>
        <p className="mt-2 text-[clamp(15px,1.5vw,21px)] text-[#86868b]">Building agentic AI for Copilot Studio.</p>
      </motion.div>
      <motion.div {...reveal(0.15)} className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
        <button
          type="button"
          onClick={onAsk}
          className="rounded-full bg-[#0071e3] px-6 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0077ed]"
        >
          Ask my agent
        </button>
        <button type="button" onClick={onRecruiter} className="text-[15px] text-[#2997ff] transition hover:underline">
          View résumé ›
        </button>
      </motion.div>
      <motion.div {...reveal(0.6)} className="pointer-events-none absolute bottom-7 flex flex-col items-center gap-2" aria-hidden="true">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[#6e6e73]">Scroll</span>
        <span className="studio-scrollcue block h-9 w-px bg-gradient-to-b from-[#a1a1a6] to-transparent" />
      </motion.div>
    </section>
  );
}

/* ───────────────────── "One engineer." / "Endless experiments." ───────────────────── */

function Word({ p, inAt, outAt, children }: { p: MotionValue<number>; inAt: number; outAt: number; children: ReactNode }) {
  const opacity = useTransform(p, [inAt, inAt + 0.07, outAt, outAt + 0.05], [0, 1, 1, 0]);
  const y = useTransform(p, [inAt, inAt + 0.08], ['0.22em', '0em']);
  const blur = useTransform(p, [inAt, inAt + 0.07], ['blur(10px)', 'blur(0px)']);
  return (
    <motion.span className="inline-block" style={{ opacity, y, filter: blur }}>
      {children}
    </motion.span>
  );
}

export function StatementScene() {
  const { ref, p } = useSceneProgress();
  return (
    <section ref={ref} className="studio-scene h-[170vh]" aria-label="One engineer. Endless experiments.">
      <div className={`studio-sticky flex items-center justify-center px-4 ${DISPLAY} text-[clamp(44px,8.6vw,132px)]`}>
        <p className="absolute inset-x-4 flex flex-wrap justify-center gap-x-[0.24em] text-center" aria-hidden="true">
          <Word p={p} inAt={0.06} outAt={0.44}>One</Word>
          <Word p={p} inAt={0.2} outAt={0.44}>engineer.</Word>
        </p>
        <p className="absolute inset-x-4 flex flex-wrap justify-center gap-x-[0.24em] text-center" aria-hidden="true">
          <Word p={p} inAt={0.52} outAt={0.93}>Endless</Word>
          <Word p={p} inAt={0.66} outAt={0.93}>experiments.</Word>
        </p>
        <p className="sr-only">One engineer. Endless experiments.</p>
      </div>
    </section>
  );
}

/* ───────────────────────── Verb run ───────────────────────── */

const VERB_TEXT = 'text-[clamp(42px,8.2vw,128px)]';

function useStep(v: MotionValue<number>) {
  const [n, setN] = useState(0);
  useMotionValueEvent(v, 'change', (x) => setN(Math.round(x)));
  return n;
}

function BeatBuild({ lp }: { lp: MotionValue<number> }) {
  const word = 'agent.';
  const typed = useStep(useTransform(lp, [0.1, 0.34], [0, word.length]));
  const glow = useTransform(lp, [0.48, 0.6], [1, 0]);
  const plain = useTransform(glow, (g) => 1 - g);
  const clipW = useTransform(lp, [0.4, 0.6], ['0em', '3.3em']);
  const clipO = useTransform(lp, [0.4, 0.46], [0, 1]);
  const [clipIn, setClipIn] = useState(false);
  useMotionValueEvent(lp, 'change', (v) => setClipIn(v > 0.5));
  const frames = [
    { t: 'ask', c: '#3a2a5c' },
    { t: 'retrieve', c: '#25456b' },
    { t: 'tool', c: '#4f2a63' },
    { t: 'answer', c: '#1f4d3a' }
  ];

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-[0.24em] gap-y-[0.1em] ${DISPLAY} ${VERB_TEXT}`}>
      <span className="relative inline-block">
        <motion.span style={{ opacity: plain }}>Build an</motion.span>
        <motion.span className="studio-glow-violet absolute inset-0" style={{ opacity: glow }}>
          Build an
        </motion.span>
      </span>
      <motion.span
        className="relative inline-flex h-[0.8em] shrink-0 overflow-hidden rounded-[0.09em] border-[0.03em] border-[#a35dff]"
        style={{ width: clipW, opacity: clipO, boxShadow: '0 0 0.35em rgba(163,93,255,0.55)' }}
        aria-hidden="true"
      >
        <span className="absolute inset-0 flex w-[3.3em] flex-col bg-[#120d1c]">
          <span className="flex h-[66%] gap-[0.03em] p-[0.03em]">
            {frames.map((f) => (
              <span
                key={f.t}
                className="flex flex-1 items-end rounded-[0.03em] p-[0.05em] text-[0.13em] font-medium tracking-normal text-white/85"
                style={{ background: `linear-gradient(160deg, ${f.c}, #0c0a12)`, fontFamily: 'var(--font-mono)' }}
              >
                {f.t}
              </span>
            ))}
          </span>
          <span className="flex flex-1 items-center gap-[0.012em] bg-[#1b2233] px-[0.04em]">
            {Array.from({ length: 64 }, (_, i) => (
              <i
                key={i}
                className="block w-[0.02em] flex-1 rounded-full bg-[#7b9cc9]"
                style={{ height: `${18 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.31)) * 70}%` }}
              />
            ))}
          </span>
        </span>
      </motion.span>
      <span className="relative inline-block">
        {Array.from(word).map((ch, i) => (
          <span
            key={i}
            style={{ opacity: i < typed ? 1 : 0, color: clipIn ? '#f5f5f7' : '#5b5b60', transition: 'color 0.3s' }}
          >
            {ch}
          </span>
        ))}
        {!clipIn && (
          <span className="absolute top-0 inline-block w-0" style={{ left: `${(typed / word.length) * 100}%` }}>
            <span className="studio-caret absolute left-0 top-[0.06em] text-[#a35dff]" />
          </span>
        )}
      </span>
    </div>
  );
}

function BeatGround({ lp }: { lp: MotionValue<number> }) {
  const spacing = useTransform(lp, [0.06, 0.55], ['0.45em', '-0.02em']);
  const blur = useTransform(lp, [0.06, 0.5], ['blur(14px)', 'blur(0px)']);
  const scale = useTransform(lp, [0.06, 0.55], [1.25, 1]);
  return (
    <motion.p
      className={`${DISPLAY} ${VERB_TEXT} font-extrabold`}
      style={{
        letterSpacing: spacing,
        filter: blur,
        scale,
        backgroundImage: 'radial-gradient(circle, #eef9ff 0 40%, #82d2ff 54%, transparent 62%)',
        backgroundSize: '0.066em 0.066em',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent'
      }}
    >
      Ground it.
    </motion.p>
  );
}

function BeatEvaluate({ lp }: { lp: MotionValue<number> }) {
  const r = useTransform(lp, [0.12, 0.66], [0, 100]);
  const clip = useTransform(r, (v) => `inset(-0.2em ${100 - v}% -0.2em 0)`);
  const left = useTransform(r, (v) => `${v}%`);
  const bob = useTransform(lp, (v) => `${Math.sin(v * 46) * 0.16}em`);
  const cursorO = useTransform(lp, [0.1, 0.14, 0.66, 0.72], [0, 1, 1, 0]);
  return (
    <div className={`relative ${DISPLAY} ${VERB_TEXT}`}>
      <p className="text-[#3a3a3c]">Evaluate it.</p>
      <motion.p
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          clipPath: clip,
          backgroundImage: 'repeating-linear-gradient(45deg, #d4ff3f 0 2px, #b6e324 2px 4px)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent'
        }}
      >
        Evaluate it.
      </motion.p>
      <motion.span
        className="pointer-events-none absolute top-[0.32em] h-[0.42em] w-[0.42em] -translate-x-1/2 rounded-full border-2 border-white/90"
        style={{ left, y: bob, opacity: cursorO }}
        aria-hidden="true"
      />
    </div>
  );
}

function BeatFineTune({ lp }: { lp: MotionValue<number> }) {
  const r = useTransform(lp, [0.14, 0.72], [0, 100]);
  const crisp = useTransform(r, (v) => `inset(-0.3em ${100 - v}% -0.3em -0.3em)`);
  const rough = useTransform(r, (v) => `inset(-0.3em -0.3em -0.3em ${v}%)`);
  const left = useTransform(r, (v) => `${v}%`);
  return (
    <div className={`relative ${DISPLAY} ${VERB_TEXT}`}>
      <motion.p style={{ clipPath: rough }} className="relative text-[#d1d1d6] [filter:blur(0.045em)]">
        Fine-tune it.
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.55) 1px, transparent 1px)',
            backgroundSize: '0.09em 0.09em'
          }}
          aria-hidden="true"
        />
      </motion.p>
      <motion.p
        className="absolute inset-0 text-[#d7ff3a]"
        style={{ clipPath: crisp, textShadow: '0 0 0.18em rgba(198,255,40,0.55)' }}
        aria-hidden="true"
      >
        Fine-tune it.
      </motion.p>
      <motion.span className="absolute -top-[0.3em] h-[1.65em] w-px bg-white/80" style={{ left }} aria-hidden="true" />
    </div>
  );
}

function BeatWrite({ lp }: { lp: MotionValue<number> }) {
  const text = 'Write it up.';
  const typed = useStep(useTransform(lp, [0.08, 0.62], [0, text.length]));
  return (
    <p className={`relative ${DISPLAY} ${VERB_TEXT}`}>
      {Array.from(text).map((ch, i) => {
        const age = typed - 1 - i;
        const hot = age >= 0 && age < 3;
        return (
          <span
            key={i}
            style={{
              opacity: i < typed ? 1 : 0,
              color: hot ? '#ffd60a' : '#f5f5f7',
              textShadow: hot ? `0 0 ${0.22 - age * 0.06}em rgba(255,214,10,0.75)` : 'none',
              transition: 'color 0.25s, text-shadow 0.25s'
            }}
          >
            {ch}
          </span>
        );
      })}
      <span className="absolute top-0 inline-block w-0" style={{ left: `${(typed / text.length) * 100}%` }}>
        <span className="studio-caret absolute left-0 top-[0.08em] text-[#f5f5f7]" />
      </span>
    </p>
  );
}

function Beat({ p, index, count, children }: { p: MotionValue<number>; index: number; count: number; children: (lp: MotionValue<number>) => ReactNode }) {
  const lp = useTransform(p, [index / count, (index + 1) / count], [0, 1]);
  const opacity = useTransform(lp, [0, 0.1, 0.88, 1], [0, 1, 1, 0]);
  const scale = useTransform(lp, [0, 0.1, 0.88, 1], [0.97, 1, 1, 1.02]);
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center px-4 text-center" style={{ opacity, scale }}>
      {children(lp)}
    </motion.div>
  );
}

export function VerbScene() {
  const { ref, p } = useSceneProgress();
  const beats: ((lp: MotionValue<number>) => ReactNode)[] = [
    (lp) => <BeatBuild lp={lp} />,
    (lp) => <BeatGround lp={lp} />,
    () => <p className={`${DISPLAY} ${VERB_TEXT}`}>Loop it.</p>,
    (lp) => <BeatEvaluate lp={lp} />,
    (lp) => <BeatFineTune lp={lp} />,
    (lp) => <BeatWrite lp={lp} />,
    () => <p className={`${DISPLAY} ${VERB_TEXT} !text-[#2997ff]`}>Ship it.</p>
  ];
  return (
    <section ref={ref} className="studio-scene h-[440vh]" aria-label="Build an agent. Ground it. Loop it. Evaluate it. Fine-tune it. Write it up. Ship it.">
      <div className="studio-sticky" aria-hidden="true">
        {beats.map((render, i) => (
          <Beat key={i} p={p} index={i} count={beats.length}>
            {render}
          </Beat>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Career as Logic-style track regions ───────────────────── */

type Track = { label: string; body: string; head: string; edge: string; ink: string; headInk: string; kind: 'steps' | 'notes' | 'wave' };

const TRACKS: Track[] = [
  { label: 'VIT_BTECH-CSE_2019-23', body: '#62c43c', head: '#62c43c', edge: '#93e674', ink: '#f4ffe9', headInk: '#effff0', kind: 'steps' },
  { label: 'ORACLE_SOFTWARE-DEVELOPER_2023-24', body: '#8d35d4', head: '#b07cf2', edge: '#c9a2ff', ink: '#ffffff', headInk: '#ffffff', kind: 'notes' },
  { label: 'UCSD_MS-CS-RESEARCH_2024-26', body: '#2b0a27', head: '#b01f8b', edge: '#d84bb3', ink: '#e7a8d2', headInk: '#ffffff', kind: 'wave' },
  { label: 'CISCO_ML-ENGINEER-INTERN_2025', body: '#cf7a3a', head: '#f2c3a0', edge: '#f5ad78', ink: '#f8dcc6', headInk: '#5a3215', kind: 'wave' },
  { label: 'MICROSOFT_RESEARCH-ENGINEER_2026', body: '#1d5fd8', head: '#7fb2ff', edge: '#a9cbff', ink: '#ffffff', headInk: '#0b2350', kind: 'notes' }
];

function RegionPattern({ kind, ink, seed }: { kind: Track['kind']; ink: string; seed: number }) {
  const shapes = useMemo(() => {
    const r = mulberry32(seed);
    if (kind === 'steps') {
      const cells: ReactNode[] = [];
      for (let c = 0; c < 24; c += 1) {
        for (let row = 0; row < 3; row += 1) {
          const hit = (row === 2 && c % 2 === 0) || (row === 1 && c % 4 === 2) || (row === 0 && r() > 0.82);
          cells.push(
            <rect key={`${c}-${row}`} x={c * 4.1 + 1} y={4 + row * 8.4} width={2.6} height={6.4} rx={0.5} fill={hit ? ink : 'rgba(255,255,255,0.13)'} />
          );
        }
      }
      return cells;
    }
    if (kind === 'notes') {
      const notes: ReactNode[] = [];
      let x = 1;
      while (x < 96) {
        const len = 3 + Math.floor(r() * 3) * 2;
        const y = 8 + Math.floor(r() * 4) * 5;
        notes.push(
          <g key={x}>
            <rect x={x} y={y - 1.6} width={0.6} height={3.2} fill={ink} />
            <rect x={x} y={y - 0.35} width={len} height={0.7} fill={ink} />
          </g>
        );
        x += len + 1.5 + r() * 2;
      }
      return notes;
    }
    const bars: ReactNode[] = [];
    for (let i = 0; i < 120; i += 1) {
      const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.11 + seed));
      for (const cy of [9, 21]) {
        const h = (1 + r() * 6) * env;
        bars.push(<rect key={`${i}-${cy}`} x={i * 0.83} y={cy - h / 2} width={0.42} height={h} fill={ink} opacity={0.9} />);
      }
    }
    return bars;
  }, [kind, ink, seed]);

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {shapes}
    </svg>
  );
}

function Region({ track, p, index, count }: { track: Track; p: MotionValue<number>; index: number; count: number }) {
  const start = 0.06 + index * (0.62 / count);
  const opacity = useTransform(p, [start, start + 0.06], [0, 1]);
  const y = useTransform(p, [start, start + 0.08], [-28, 0]);
  const isLast = index === count - 1;
  const glow = useTransform(
    p,
    isLast ? [start, start + 0.08] : [start, start + 0.06, start + 0.62 / count, start + 0.62 / count + 0.05],
    isLast ? [0, 1] : [0, 1, 1, 0]
  );
  const shadow = useTransform(glow, (g) => `0 0 ${28 * g}px ${track.edge}${Math.round(g * 160).toString(16).padStart(2, '0')}`);

  return (
    <motion.div
      className="relative overflow-hidden rounded-[10px] border-[1.5px]"
      style={{ opacity, y, borderColor: track.edge, background: track.body, boxShadow: shadow }}
    >
      <div className="px-2.5 py-[3px] text-[10px] font-medium tracking-[0.02em] md:text-[11px]" style={{ background: track.head, color: track.headInk }}>
        {track.label}
      </div>
      <div className="relative h-[46px] md:h-[64px]">
        <RegionPattern kind={track.kind} ink={track.ink} seed={index * 7 + 3} />
      </div>
    </motion.div>
  );
}

export function TracksScene() {
  const { ref, p } = useSceneProgress();
  const playhead = useTransform(p, [0.1, 0.95], ['0%', '100%']);
  const headO = useTransform(p, [0.08, 0.14, 0.92, 1], [0, 1, 1, 0]);
  return (
    <section ref={ref} className="studio-scene h-[230vh]" aria-label="Career: VIT, Oracle, UC San Diego, Cisco, Microsoft">
      <div className="studio-sticky flex items-center justify-center px-4">
        <div className="relative w-full max-w-[860px] space-y-2.5 md:space-y-3">
          {TRACKS.map((track, i) => (
            <Region key={track.label} track={track} p={p} index={i} count={TRACKS.length} />
          ))}
          <motion.span
            className="pointer-events-none absolute -bottom-3 -top-3 w-px bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ left: playhead, opacity: headO }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Focus-area reel ───────────────────── */

type ReelItem = { name: string; color: string; icon: ReactNode };

const ICON_STROKE = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const REEL: ReelItem[] = [
  {
    name: 'Agents',
    color: '#bf5af2',
    icon: (
      <g stroke="#bf5af2" {...ICON_STROKE}>
        <circle cx="7" cy="7" r="2.4" />
        <circle cx="17" cy="9" r="2.4" />
        <circle cx="10" cy="17" r="2.4" />
        <path d="M9.2 8l5.5 0.6M8 9.2l1.4 5.5M15.6 11l-3.8 4.4" />
      </g>
    )
  },
  {
    name: 'Retrieval',
    color: '#64d2ff',
    icon: (
      <g stroke="#64d2ff" {...ICON_STROKE}>
        <circle cx="10.5" cy="10.5" r="5" />
        <path d="M14.5 14.5L19 19M8 9h5M8 12h3.5" />
      </g>
    )
  },
  {
    name: 'Evaluations',
    color: '#30d158',
    icon: (
      <g stroke="#30d158" {...ICON_STROKE}>
        <path d="M5 19V13M10 19V9M15 19V11M20 19V6" />
        <path d="M4 6.5l2 2 3.5-4" />
      </g>
    )
  },
  {
    name: 'Fine-tuning',
    color: '#ff9f0a',
    icon: (
      <g stroke="#ff9f0a" {...ICON_STROKE}>
        <path d="M6 4v16M12 4v16M18 4v16" />
        <circle cx="6" cy="14" r="2" fill="#1c1c1e" />
        <circle cx="12" cy="8" r="2" fill="#1c1c1e" />
        <circle cx="18" cy="16" r="2" fill="#1c1c1e" />
      </g>
    )
  },
  {
    name: 'Research',
    color: '#ff375f',
    icon: (
      <g stroke="#ff375f" {...ICON_STROKE}>
        <path d="M7 3.5h7l4 4V20.5H7z" />
        <path d="M14 3.5v4h4M10 12h5M10 15.5h5" />
      </g>
    )
  },
  {
    name: 'Systems',
    color: '#5e9cff',
    icon: (
      <g stroke="#5e9cff" {...ICON_STROKE}>
        <rect x="5" y="4.5" width="14" height="6" rx="1.5" />
        <rect x="5" y="13.5" width="14" height="6" rx="1.5" />
        <path d="M8 7.5h.01M8 16.5h.01" />
      </g>
    )
  },
  {
    name: 'Voice',
    color: '#ffd60a',
    icon: (
      <g stroke="#ffd60a" {...ICON_STROKE}>
        <path d="M4 12v0M7 9v6M10 6v12M13 9v6M16 7v10M19 11v2" />
      </g>
    )
  }
];

function ReelRow({ item, index, center }: { item: ReelItem; index: number; center: MotionValue<number> }) {
  const d = useTransform(center, (c) => index - c);
  const y = useTransform(d, (v) => `${v * 1.3}em`);
  const scale = useTransform(d, (v) => 1 - Math.min(Math.abs(v), 2.2) * 0.17);
  const opacity = useTransform(d, (v) => Math.max(0, 1 - Math.abs(v) * 0.45));
  return (
    <motion.div className="absolute left-0 right-0 flex items-center justify-center gap-[0.28em]" style={{ y, scale, opacity }}>
      <span className="flex h-[1.02em] w-[1.02em] shrink-0 items-center justify-center rounded-[0.24em] border border-white/10 bg-gradient-to-b from-[#2c2c30] to-[#121214] shadow-[0_0.06em_0.2em_rgba(0,0,0,0.6)]">
        <svg viewBox="0 0 24 24" className="h-[0.62em] w-[0.62em]" aria-hidden="true">
          {item.icon}
        </svg>
      </span>
      <span style={{ color: item.color }}>{item.name}</span>
    </motion.div>
  );
}

export function ReelScene() {
  const { ref, p } = useSceneProgress();
  const center = useTransform(p, [0.05, 0.95], [-0.4, REEL.length - 0.6]);
  return (
    <section ref={ref} className="studio-scene h-[220vh]" aria-label={`Focus areas: ${REEL.map((r) => r.name).join(', ')}`}>
      <div className={`studio-sticky flex items-center justify-center ${DISPLAY} text-[clamp(38px,7vw,100px)]`} aria-hidden="true">
        <div className="relative h-[1.2em] w-full -translate-y-[0.6em]">
          {REEL.map((item, i) => (
            <ReelRow key={item.name} item={item} index={i} center={center} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Closing ───────────────────────── */

export function ClosingScene({ onAsk }: { onAsk: () => void }) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { amount: 0.55 });
  const [done, setDone] = useState(false);
  const links = [
    { label: 'Email', href: `mailto:${resumeData.contact.email}` },
    { label: 'LinkedIn', href: `https://${resumeData.contact.linkedin}` },
    { label: 'GitHub', href: `https://${resumeData.contact.github}` },
    { label: 'Scholar', href: `https://${resumeData.contact.scholar}` }
  ];
  return (
    <section ref={ref} className="studio-scene flex min-h-[100svh] flex-col items-center justify-center px-4 py-24 text-center">
      <MediaWordmark text={resumeData.name} play={inView} className="text-[clamp(40px,9vw,128px)]" onSettled={() => setDone(true)} />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mt-8 flex flex-col items-center"
      >
        <p className={`${DISPLAY} text-[clamp(22px,2.8vw,40px)]`}>Ask me anything.</p>
        <p className="mt-2 max-w-md text-[15px] text-[#86868b] md:text-[17px]">
          My agent has read every line of my résumé, papers and repos.
        </p>
        <button
          type="button"
          onClick={onAsk}
          className="mt-7 rounded-full bg-[#0071e3] px-6 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0077ed]"
        >
          Start asking
        </button>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px]">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
              className="text-[#2997ff] transition hover:underline"
            >
              {l.label} ›
            </a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── Nav ───────────────────────── */

export function OpeningNav({
  visible,
  onAsk,
  onTour,
  onRecruiter
}: {
  visible: boolean;
  onAsk: () => void;
  onTour: () => void;
  onRecruiter: () => void;
}) {
  const link = 'text-[12px] text-[#e8e8ed]/80 transition hover:text-white';
  return (
    <motion.nav
      initial={false}
      animate={{ y: visible ? 0 : -56, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="studio fixed inset-x-0 top-0 z-[60] h-11 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl backdrop-saturate-150"
      aria-label="Site"
    >
      <div className="mx-auto flex h-full max-w-[1024px] items-center justify-between px-4">
        <a href="#top" className="text-[14px] font-semibold tracking-tight text-[#f5f5f7]">
          Aryan Dokania
        </a>
        <div className="flex items-center gap-5 md:gap-7">
          <button type="button" onClick={onAsk} className={link}>
            Ask
          </button>
          <button type="button" onClick={onTour} className={`${link} hidden sm:inline`}>
            Tour
          </button>
          <a href="#experience" className={`${link} hidden sm:inline`}>
            Work
          </a>
          <a href="#research" className={`${link} hidden md:inline`}>
            Research
          </a>
          <a href={`https://${resumeData.contact.github}`} target="_blank" rel="noreferrer" className={`${link} hidden md:inline`}>
            GitHub
          </a>
          <button
            type="button"
            onClick={onRecruiter}
            className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-medium text-black transition hover:bg-white"
          >
            Résumé
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
