'use client';

import { useState, type ReactNode } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { resumeData } from '../../data/resumeData';

/* Scenes of the auto-playing opening film. Each "stage" fills the hero and is
   driven by `p`, its own 0 → 1 progress on the film's timeline. */

const EASE = [0.2, 0.8, 0.2, 1] as const;
const DISPLAY = 'studio-display text-[#f5f5f7]';

/** Full-screen layer for one scene; hidden outside its slot on the timeline. */
function Layer({ p, children, className = '' }: { p: MotionValue<number>; children: ReactNode; className?: string }) {
  const opacity = useTransform(p, [0, 0.04, 0.94, 1], [0, 1, 1, 0]);
  const visibility = useTransform(p, (v) => (v <= 0 || v >= 1 ? 'hidden' : 'visible'));
  return (
    <motion.div className={`pointer-events-none absolute inset-0 ${className}`} style={{ opacity, visibility }} aria-hidden="true">
      {children}
    </motion.div>
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

export function StatementStage({ p }: { p: MotionValue<number> }) {
  return (
    <Layer p={p} className={`flex items-center justify-center px-4 ${DISPLAY} text-[clamp(44px,8.6vw,132px)]`}>
      <p className="absolute inset-x-4 flex flex-wrap justify-center gap-x-[0.24em] text-center">
        <Word p={p} inAt={0.06} outAt={0.44}>One</Word>
        <Word p={p} inAt={0.2} outAt={0.44}>engineer.</Word>
      </p>
      <p className="absolute inset-x-4 flex flex-wrap justify-center gap-x-[0.24em] text-center">
        <Word p={p} inAt={0.52} outAt={0.93}>Endless</Word>
        <Word p={p} inAt={0.66} outAt={0.93}>experiments.</Word>
      </p>
    </Layer>
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
        />
      </motion.p>
      <motion.p className="absolute inset-0 text-[#d7ff3a]" style={{ clipPath: crisp, textShadow: '0 0 0.18em rgba(198,255,40,0.55)' }}>
        Fine-tune it.
      </motion.p>
      <motion.span className="absolute -top-[0.3em] h-[1.65em] w-px bg-white/80" style={{ left }} />
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

function Beat({ p, from, to, children }: { p: MotionValue<number>; from: number; to: number; children: (lp: MotionValue<number>) => ReactNode }) {
  const lp = useTransform(p, [from, to], [0, 1]);
  const opacity = useTransform(lp, [0, 0.1, 0.88, 1], [0, 1, 1, 0]);
  const scale = useTransform(lp, [0, 0.1, 0.88, 1], [0.97, 1, 1, 1.02]);
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center px-4 text-center" style={{ opacity, scale }}>
      {children(lp)}
    </motion.div>
  );
}

// relative screen time per beat: the "Build an agent." beat needs the longest
const VERB_WEIGHTS = [2.2, 1.2, 1.0, 1.3, 1.3, 1.4, 1.1];
const VERB_RANGES: [number, number][] = (() => {
  const total = VERB_WEIGHTS.reduce((a, b) => a + b, 0);
  const out: [number, number][] = [];
  let acc = 0;
  for (const w of VERB_WEIGHTS) {
    out.push([acc / total, (acc + w) / total]);
    acc += w;
  }
  return out;
})();

export function VerbStage({ p }: { p: MotionValue<number> }) {
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
    <Layer p={p}>
      {beats.map((render, i) => (
        <Beat key={i} p={p} from={VERB_RANGES[i][0]} to={VERB_RANGES[i][1]}>
          {render}
        </Beat>
      ))}
    </Layer>
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
        <svg viewBox="0 0 24 24" className="h-[0.62em] w-[0.62em]">
          {item.icon}
        </svg>
      </span>
      <span style={{ color: item.color }}>{item.name}</span>
    </motion.div>
  );
}

export function ReelStage({ p }: { p: MotionValue<number> }) {
  const center = useTransform(p, [0.04, 0.96], [-0.4, REEL.length - 0.6]);
  return (
    <Layer p={p} className={`flex items-center justify-center ${DISPLAY} text-[clamp(38px,7vw,100px)]`}>
      <div className="relative h-[1.2em] w-full -translate-y-[0.6em]">
        {REEL.map((item, i) => (
          <ReelRow key={item.name} item={item} index={i} center={center} />
        ))}
      </div>
    </Layer>
  );
}

/** Plain-text version of the film for screen readers. */
export const FILM_SUMMARY = `One engineer. Endless experiments. Build an agent. Ground it. Loop it. Evaluate it. Fine-tune it. Write it up. Ship it. Focus areas: ${REEL.map(
  (r) => r.name
).join(', ')}.`;

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
      className="studio fixed inset-x-0 top-0 z-[45] h-11 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl backdrop-saturate-150"
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
