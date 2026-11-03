'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * A wordmark whose letters flicker through different "media" — neon tube,
 * spray paint, vector pen, marching-ants selection, waveform, clay, script,
 * sticker… — and then snap into clean type, one by one. Modelled on the
 * opening logo of Apple's "Introducing Apple Creator Studio" film.
 */

type VariantId =
  | 'neon'
  | 'spray'
  | 'pen'
  | 'select'
  | 'chunk'
  | 'cursor'
  | 'crop'
  | 'sticker'
  | 'wave'
  | 'clay'
  | 'script'
  | 'pencil'
  | 'ring'
  | 'chrome'
  | 'solid'
  | 'mono'
  | 'token'
  | 'marker'
  | 'pixel'
  | 'dots'
  | 'outline';

type Letter = {
  mode: 'hidden' | 'media' | 'final';
  variant: VariantId;
  seed: number;
  pop: number;
};

const TICK_MS = 90;

const COMMON: VariantId[] = [
  'neon',
  'spray',
  'pen',
  'select',
  'chunk',
  'cursor',
  'crop',
  'sticker',
  'wave',
  'clay',
  'script',
  'chrome',
  'solid',
  'mono',
  'token',
  'marker',
  'pixel',
  'dots',
  'outline'
];

const SOLID_COLORS = ['#bf5af2', '#ff375f', '#ff6fd8', '#5ce1e6', '#ff9f0a', '#30d158', '#ffd60a', '#64d2ff'];
const TOKEN_COLORS = ['#a7f3d0', '#fde68a', '#c7d2fe', '#fbcfe8', '#bae6fd', '#fed7aa'];
const CHUNK_LABELS = ['chunk-2', 'doc-07', 'ctx-3', 'emb-12', 'chunk-9', 'src-4'];

function variantsFor(ch: string): VariantId[] {
  const list = [...COMMON];
  if ('oO0'.includes(ch)) list.push('ring', 'ring', 'ring');
  if ('ilI1j|!'.includes(ch)) list.push('pencil', 'pencil', 'pencil');
  return list;
}

function pickVariant(ch: string, avoid: (VariantId | undefined)[], rand: () => number): VariantId {
  const options = variantsFor(ch).filter((v) => !avoid.includes(v));
  return options[Math.floor(rand() * options.length)] ?? 'solid';
}

// 20-spike starburst, as a CSS clip-path polygon
const BURST = (() => {
  const pts: string[] = [];
  const spikes = 20;
  for (let k = 0; k < spikes * 2; k += 1) {
    const r = k % 2 === 0 ? 50 : 38;
    const a = (k * Math.PI) / spikes;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`);
  }
  return `polygon(${pts.join(', ')})`;
})();

function waveBars(seed: number) {
  // symmetric envelope that peaks in the middle, with seeded jitter
  const bars: { x: number; h: number }[] = [];
  const n = 15;
  let s = seed % 9973;
  for (let i = 0; i < n; i += 1) {
    s = (s * 9301 + 49297) % 233280;
    const jitter = s / 233280;
    const env = Math.sin(((i + 0.5) / n) * Math.PI);
    bars.push({ x: 8 + (i / (n - 1)) * 84, h: 0.08 + env * (0.35 + jitter * 0.4) });
  }
  return bars;
}

type DefsIds = { rainbow: string; clay: string; chrome: string; mint: string; dots: string; spray: string };

function Variant({ variant, ch, seed, ids }: { variant: VariantId; ch: string; seed: number; ids: DefsIds }) {
  const isUpper = ch !== ch.toLowerCase();
  const text = (props: Record<string, unknown>) => (
    <text x="50%" y="0.86em" textAnchor="middle" {...props}>
      {ch}
    </text>
  );

  switch (variant) {
    case 'neon':
      return (
        <svg className="mw-svg v-neon" aria-hidden="true" focusable="false">
          {text({
            fill: 'none',
            stroke: `url(#${ids.rainbow})`,
            strokeWidth: '0.075em',
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
            style: { fontWeight: 300 }
          })}
          {text({
            fill: 'none',
            stroke: 'rgba(255,255,255,0.75)',
            strokeWidth: '0.014em',
            strokeLinejoin: 'round',
            style: { fontWeight: 300 }
          })}
        </svg>
      );
    case 'spray':
      return (
        <svg className="mw-svg" aria-hidden="true" focusable="false">
          {text({ fill: '#f6d24a', filter: `url(#${ids.spray})` })}
        </svg>
      );
    case 'pen': {
      const left = `${34 + (seed % 32)}%`;
      return (
        <>
          <span className="mw-t" style={{ color: '#f5f5f7' }}>
            {ch}
          </span>
          <i className="v-pen-line" style={{ left }} />
          <i className="v-pen-node" style={{ left }} />
        </>
      );
    }
    case 'select':
      return (
        <svg className="mw-svg" aria-hidden="true" focusable="false">
          {text({
            fill: 'none',
            stroke: '#fff',
            strokeWidth: '0.032em',
            strokeDasharray: '0.05em 0.035em',
            className: 'v-ants'
          })}
          {text({ fill: '#ff2d55' })}
          <circle cx="16%" cy="0.22em" r="0.034em" fill="#ff453a" />
          <circle cx="30%" cy="0.36em" r="0.03em" fill="#30d158" stroke="#fff" strokeWidth="0.008em" />
        </svg>
      );
    case 'chunk':
      return (
        <span className="v-chunk">
          <span className="v-chunk-bar">{CHUNK_LABELS[seed % CHUNK_LABELS.length]}</span>
          <span className="v-chunk-body">
            <span className="v-chunk-ch">{ch}</span>
          </span>
        </span>
      );
    case 'cursor':
      return (
        <>
          <span className="mw-t" style={{ color: '#ffd9ec' }}>
            {ch}
          </span>
          <svg className="v-cursor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M4 2l15 11.5-6.6.9 3.9 7.4-2.9 1.4-3.8-7.5L4 20z"
              fill="#111"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </>
      );
    case 'crop':
      return (
        <>
          <span className="mw-t" style={{ color: '#32d74b' }}>
            {ch}
          </span>
          <span className={`v-crop ${isUpper ? 'is-upper' : ''}`}>
            <b />
            <b />
            <b />
            <b />
          </span>
        </>
      );
    case 'sticker':
      return (
        <>
          <span className="v-burst v-burst-edge" style={{ clipPath: BURST, transform: `translate(-50%, -50%) rotate(${seed % 40}deg)` }} />
          <span className="v-burst" style={{ clipPath: BURST, transform: `translate(-50%, -50%) rotate(${seed % 40}deg) scale(0.9)` }} />
          <svg className="mw-svg v-sticker" aria-hidden="true" focusable="false">
            {text({
              fill: `url(#${ids.mint})`,
              stroke: '#c63bff',
              strokeWidth: '0.035em',
              paintOrder: 'stroke',
              strokeLinejoin: 'round',
              style: { fontWeight: 800 }
            })}
          </svg>
        </>
      );
    case 'wave':
      return (
        <>
          <svg className="mw-svg" aria-hidden="true" focusable="false">
            {waveBars(seed).map((b, i) => (
              <rect
                key={i}
                x={`${b.x - 1.6}%`}
                width="3.2%"
                y={`${0.56 - b.h}em`}
                height={`${b.h * 2}em`}
                rx="0.012em"
                fill="#6cb8ff"
              />
            ))}
          </svg>
          <i className="v-mark" style={{ left: '4%' }} />
          <i className="v-mark" style={{ left: '96%' }} />
        </>
      );
    case 'clay': {
      const eyeTop = isUpper ? '0.27em' : '0.4em';
      return (
        <>
          <svg className="mw-svg v-clay" aria-hidden="true" focusable="false">
            {text({
              fill: `url(#${ids.clay})`,
              stroke: '#b36d00',
              strokeWidth: '0.012em',
              style: { fontWeight: 800 }
            })}
          </svg>
          <i className="v-eye" style={{ left: '42%', top: eyeTop }} />
          <i className="v-eye" style={{ left: '62%', top: eyeTop }} />
        </>
      );
    }
    case 'script':
      return <span className={`mw-t v-script ${isUpper ? 'is-upper' : ''}`}>{ch}</span>;
    case 'pencil':
      return <span className="v-pencil" />;
    case 'ring':
      return (
        <>
          <span className={`v-ring ${isUpper ? 'is-upper' : ''}`} />
          <span className={`v-ring-x ${isUpper ? 'is-upper' : ''}`} />
        </>
      );
    case 'chrome':
      return (
        <svg className="mw-svg" aria-hidden="true" focusable="false">
          {text({
            fill: `url(#${ids.chrome})`,
            stroke: 'rgba(255,255,255,0.45)',
            strokeWidth: '0.008em',
            style: { fontWeight: 800 }
          })}
        </svg>
      );
    case 'solid':
      return (
        <span className="mw-t" style={{ color: SOLID_COLORS[seed % SOLID_COLORS.length] }}>
          {ch}
        </span>
      );
    case 'mono':
      return <span className="mw-t v-mono">{ch}</span>;
    case 'token':
      return (
        <span className="v-token" style={{ background: TOKEN_COLORS[seed % TOKEN_COLORS.length] }}>
          {ch}
        </span>
      );
    case 'marker':
      return <span className="mw-t v-marker">{ch}</span>;
    case 'pixel':
      return <span className="mw-t v-pixel">{ch}</span>;
    case 'dots':
      return (
        <svg className="mw-svg" aria-hidden="true" focusable="false">
          {text({ fill: `url(#${ids.dots})`, style: { fontWeight: 800 } })}
        </svg>
      );
    case 'outline':
    default:
      return (
        <svg className="mw-svg" aria-hidden="true" focusable="false">
          {text({ fill: 'none', stroke: '#9a9aa1', strokeWidth: '0.016em' })}
        </svg>
      );
  }
}

type Props = {
  text: string;
  /** Start (or keep) the intro. Flipping false → true replays it. */
  play?: boolean;
  /** Change to replay the intro. */
  replayKey?: number;
  as?: 'div' | 'h1' | 'h2' | 'p';
  className?: string;
  style?: CSSProperties;
  /** Hovering a letter re-shuffles it; clicking replays the whole word. */
  interactive?: boolean;
  onSettled?: () => void;
};

export default function MediaWordmark({
  text,
  play = true,
  replayKey = 0,
  as = 'div',
  className = '',
  style,
  interactive = true,
  onSettled
}: Props) {
  const Tag = as as 'div';
  const chars = useMemo(() => Array.from(text), [text]);
  const reduceMotion = useReducedMotion();
  const rawId = useId();
  const prefix = useMemo(() => `mw${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);
  const ids: DefsIds = useMemo(
    () => ({
      rainbow: `${prefix}-rainbow`,
      clay: `${prefix}-clay`,
      chrome: `${prefix}-chrome`,
      mint: `${prefix}-mint`,
      dots: `${prefix}-dots`,
      spray: `${prefix}-spray`
    }),
    [prefix]
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [fontPx, setFontPx] = useState(100);
  const [letters, setLetters] = useState<Letter[]>(() =>
    chars.map(() => ({ mode: 'hidden', variant: 'solid', seed: 0, pop: 0 }))
  );
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [localReplay, setLocalReplay] = useState(0);
  const onSettledRef = useRef(onSettled);
  useEffect(() => {
    onSettledRef.current = onSettled;
  });
  const hoverTimers = useRef(new Map<number, number>());
  const canHover = useRef(false);

  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  // px-based SVG filter sizes follow the rendered font size
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setFontPx(parseFloat(getComputedStyle(el).fontSize) || 100);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the intro timeline
  useEffect(() => {
    if (!play) return;
    if (reduceMotion) {
      const id = requestAnimationFrame(() => {
        setLetters(chars.map(() => ({ mode: 'final', variant: 'solid', seed: 0, pop: 0 })));
        setPhase('done');
        onSettledRef.current?.();
      });
      return () => cancelAnimationFrame(id);
    }

    const rand = Math.random;
    const n = chars.length;
    const appear = chars.map(() => 120 + rand() * 520);
    const order = chars.map((_, i) => i).sort(() => rand() - 0.5);
    const settle: number[] = new Array(n).fill(0);
    order.forEach((idx, rank) => {
      settle[idx] = 1350 + rank * (900 / n) + rand() * 110;
    });
    const end = Math.max(...settle) + 60;

    let start = -1;
    let lastTick = -Infinity;
    let raf = 0;

    const step = (now: number) => {
      if (start < 0) {
        start = now;
        setPhase('playing');
        setLetters(chars.map(() => ({ mode: 'hidden', variant: 'solid', seed: 0, pop: 0 })));
      }
      const t = now - start;
      if (t >= end) {
        setLetters((prev) => prev.map((l) => (l.mode === 'final' ? l : { ...l, mode: 'final', pop: l.pop + 1 })));
        setPhase('done');
        onSettledRef.current?.();
        return;
      }
      if (t - lastTick >= TICK_MS) {
        lastTick = t;
        setLetters((prev) => {
          const chosen: (VariantId | undefined)[] = [];
          return prev.map((l, i) => {
            const ch = chars[i];
            if (ch === ' ') return l.mode === 'final' ? l : { ...l, mode: 'final' };
            if (t >= settle[i]) {
              return l.mode === 'final' ? l : { ...l, mode: 'final', pop: l.pop + 1 };
            }
            if (t < appear[i]) return l.mode === 'hidden' ? l : { ...l, mode: 'hidden' };
            if (l.mode === 'media' && rand() < 0.2) {
              chosen[i] = l.variant;
              return l;
            }
            const variant = pickVariant(ch, [l.variant, chosen[i - 1]], rand);
            chosen[i] = variant;
            return { mode: 'media', variant, seed: Math.floor(rand() * 1e6), pop: l.pop };
          });
        });
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [play, replayKey, localReplay, reduceMotion, chars]);

  useEffect(() => {
    const timers = hoverTimers.current;
    return () => {
      timers.forEach((id) => window.clearInterval(id));
      timers.clear();
    };
  }, []);

  const shuffleLetter = useCallback(
    (i: number) => {
      if (!interactive || !canHover.current || reduceMotion || phase !== 'done') return;
      if (chars[i] === ' ' || hoverTimers.current.has(i)) return;
      let count = 0;
      const id = window.setInterval(() => {
        count += 1;
        setLetters((prev) => {
          const next = [...prev];
          const l = next[i];
          next[i] =
            count >= 6
              ? { ...l, mode: 'final', pop: l.pop + 1 }
              : {
                  mode: 'media',
                  variant: pickVariant(chars[i], [l.variant], Math.random),
                  seed: Math.floor(Math.random() * 1e6),
                  pop: l.pop
                };
          return next;
        });
        if (count >= 6) {
          window.clearInterval(id);
          hoverTimers.current.delete(i);
        }
      }, TICK_MS);
      hoverTimers.current.set(i, id);
    },
    [chars, interactive, phase, reduceMotion]
  );

  const replay = useCallback(() => {
    if (!interactive || reduceMotion || phase !== 'done') return;
    setLocalReplay((k) => k + 1);
  }, [interactive, phase, reduceMotion]);

  const dot = Math.max(3, fontPx * 0.055);

  return (
    <Tag
      ref={rootRef}
      className={`mw-root ${className}`}
      style={style}
      data-state={phase}
      onClick={interactive ? replay : undefined}
      title={interactive && phase === 'done' ? 'Click to replay' : undefined}
    >
      <span className="sr-only">{text}</span>
      <span className="mw-line" aria-hidden="true">
        {chars.map((ch, i) => {
          if (ch === ' ') return <span key={i} className="mw-space" />;
          const l = letters[i];
          return (
            <span key={i} className="mw-slot" onPointerEnter={() => shuffleLetter(i)}>
              <span key={`g${l.pop}`} className={`mw-glyph ${l.mode === 'final' ? 'is-final' : ''} ${l.pop > 0 ? 'is-pop' : ''}`}>
                {ch}
              </span>
              {l.mode === 'media' && (
                <span className="mw-media">
                  <Variant variant={l.variant} ch={ch} seed={l.seed} ids={ids} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      <svg className="mw-defs" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={ids.rainbow} x1="0" y1="0.15" x2="1" y2="0.85">
            <stop offset="0" stopColor="#ff375f" />
            <stop offset="0.2" stopColor="#ff9f0a" />
            <stop offset="0.38" stopColor="#ffd60a" />
            <stop offset="0.55" stopColor="#30d158" />
            <stop offset="0.72" stopColor="#64d2ff" />
            <stop offset="0.86" stopColor="#5e5ce6" />
            <stop offset="1" stopColor="#bf5af2" />
          </linearGradient>
          <radialGradient id={ids.clay} cx="0.36" cy="0.28" r="0.85">
            <stop offset="0" stopColor="#fff9c9" />
            <stop offset="0.3" stopColor="#ffdc4f" />
            <stop offset="0.68" stopColor="#f1b300" />
            <stop offset="1" stopColor="#bf7400" />
          </radialGradient>
          <linearGradient id={ids.chrome} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dedee3" />
            <stop offset="0.36" stopColor="#8b8b93" />
            <stop offset="0.52" stopColor="#26262a" />
            <stop offset="0.78" stopColor="#57575e" />
            <stop offset="1" stopColor="#ababb3" />
          </linearGradient>
          <linearGradient id={ids.mint} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8dffe4" />
            <stop offset="1" stopColor="#14c2a3" />
          </linearGradient>
          <pattern id={ids.dots} width={dot} height={dot} patternUnits="userSpaceOnUse">
            <circle cx={dot / 2} cy={dot / 2} r={dot * 0.36} fill="#f5f5f7" />
          </pattern>
          <filter id={ids.spray} x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={fontPx * 0.075} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation={fontPx * 0.004} />
          </filter>
        </defs>
      </svg>
      <noscript>
        <style>{`.mw-glyph{opacity:1!important}`}</style>
      </noscript>
    </Tag>
  );
}
