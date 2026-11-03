'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion';
import MediaWordmark from './MediaWordmark';
import { FILM_SUMMARY, OpeningNav, ReelStage, StatementStage, TracksStage, VerbStage } from './Scenes';
import { resumeData } from '../../data/resumeData';

type Props = {
  onAsk: () => void;
  onTour: () => void;
  onRecruiter: () => void;
  /** Fires with true once the visitor has scrolled past the opening. */
  onPastOpening?: (past: boolean) => void;
};

const EASE = [0.2, 0.8, 0.2, 1] as const;

/* Film timeline, in seconds. Modelled on Apple's "Introducing Apple Creator
   Studio": the name builds itself, the scenes play, and the name returns. */
const T = {
  introFade: 2.9,
  statement: [3.3, 6.4] as [number, number],
  verbs: [6.4, 15.9] as [number, number],
  tracks: [15.9, 18.7] as [number, number],
  reel: [18.7, 21.7] as [number, number],
  end: 21.7
};
const TOTAL = T.end + 0.3;

type Segment = 'intro' | 'film' | 'end';
const segmentAt = (v: number): Segment => (v < T.statement[0] ? 'intro' : v < T.end ? 'film' : 'end');

function FilmHero({ onAsk, onRecruiter, onDone }: { onAsk: () => void; onRecruiter: () => void; onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const t = useMotionValue(0);
  const [segment, setSegment] = useState<Segment>('intro');
  const segRef = useRef<Segment>('intro');
  const [wordKey, setWordKey] = useState(0);
  const [settled, setSettled] = useState(false);
  const [run, setRun] = useState(0);
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);

  useMotionValueEvent(t, 'change', (v) => {
    const seg = segmentAt(v);
    if (seg === segRef.current) return;
    const prev = segRef.current;
    segRef.current = seg;
    setSegment(seg);
    // the name rebuilds itself when it comes back at the end, and on replay
    if (seg === 'end' || (seg === 'intro' && prev === 'end')) {
      setSettled(false);
      setWordKey((k) => k + 1);
    }
  });

  useEffect(() => {
    controlsRef.current?.stop();
    if (reduceMotion) {
      t.set(TOTAL);
      return;
    }
    t.set(0);
    const controls = animate(t, TOTAL, { duration: TOTAL, ease: 'linear' });
    controlsRef.current = controls;
    return () => controls.stop();
  }, [run, reduceMotion, t]);

  const skip = () => {
    controlsRef.current?.stop();
    t.set(TOTAL);
  };

  const nameOpacity = useTransform(t, [T.introFade, T.statement[0], T.end, T.end + 0.25], [1, 0, 0, 1]);
  const pStatement = useTransform(t, T.statement, [0, 1]);
  const pVerbs = useTransform(t, T.verbs, [0, 1]);
  const pTracks = useTransform(t, T.tracks, [0, 1]);
  const pReel = useTransform(t, T.reel, [0, 1]);

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: settled ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 0.8, ease: EASE, delay: settled ? delay : 0 }
  });

  const links = [
    { label: 'Email', href: `mailto:${resumeData.contact.email}` },
    { label: 'LinkedIn', href: `https://${resumeData.contact.linkedin}` },
    { label: 'GitHub', href: `https://${resumeData.contact.github}` },
    { label: 'Scholar', href: `https://${resumeData.contact.scholar}` }
  ];

  const pill =
    'absolute bottom-6 right-5 z-20 rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] text-white/55 transition hover:border-white/40 hover:text-white';

  return (
    <section
      id="top"
      className="studio-scene flex h-[100svh] min-h-[560px] flex-col items-center justify-center overflow-hidden px-4 text-center"
    >
      <p className="sr-only">{FILM_SUMMARY}</p>

      <StatementStage p={pStatement} />
      <VerbStage p={pVerbs} />
      <TracksStage p={pTracks} />
      <ReelStage p={pReel} />

      <motion.div
        className={`relative z-10 flex flex-col items-center ${segment === 'end' ? '' : 'pointer-events-none'}`}
        style={{ opacity: nameOpacity }}
      >
        <MediaWordmark
          as="h1"
          text={resumeData.name}
          replayKey={wordKey}
          interactive={segment === 'end'}
          className="text-[clamp(44px,11.6vw,164px)]"
          onSettled={() => {
            if (segRef.current !== 'end') return;
            setSettled(true);
            onDone();
          }}
        />
        <motion.div {...reveal(0)} className="mt-6 md:mt-8">
          <p className="studio-display text-[clamp(21px,2.6vw,36px)] text-[#f5f5f7]">Research Engineer at Microsoft.</p>
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
        <motion.div {...reveal(0.3)} className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13px]">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
              className="text-[#86868b] transition hover:text-[#f5f5f7]"
            >
              {l.label}
            </a>
          ))}
        </motion.div>
      </motion.div>

      <motion.div {...reveal(0.6)} className="pointer-events-none absolute bottom-7 flex flex-col items-center gap-2" aria-hidden="true">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[#6e6e73]">Scroll</span>
        <span className="studio-scrollcue block h-9 w-px bg-gradient-to-b from-[#a1a1a6] to-transparent" />
      </motion.div>

      {segment !== 'end' ? (
        <button type="button" onClick={skip} className={pill}>
          Skip intro ›
        </button>
      ) : (
        settled && (
          <button type="button" onClick={() => setRun((r) => r + 1)} className={pill}>
            ↺ Replay
          </button>
        )
      )}
    </section>
  );
}

/**
 * The opening page: one screen that plays like Apple's "Introducing Apple
 * Creator Studio" film — name → "One engineer. / Endless experiments." →
 * verb run → Logic-style career tracks → focus reel → name again with links.
 */
export default function OpeningSequence({ onAsk, onTour, onRecruiter, onPastOpening }: Props) {
  const [heroDone, setHeroDone] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const pastRef = useRef(onPastOpening);
  useEffect(() => {
    pastRef.current = onPastOpening;
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    // "past" once the bottom of the opening is in the upper 60% of the screen
    const io = new IntersectionObserver(
      ([entry]) => {
        pastRef.current?.(entry.isIntersecting || entry.boundingClientRect.top < 0);
      },
      { rootMargin: '0px 0px -40% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* outside the z-10 wrapper so the fixed nav stays above the sections that follow */}
      <OpeningNav visible={heroDone || scrolled} onAsk={onAsk} onTour={onTour} onRecruiter={onRecruiter} />
      <div className="studio relative z-10 bg-black">
        <FilmHero onAsk={onAsk} onRecruiter={onRecruiter} onDone={() => setHeroDone(true)} />
        <div ref={endRef} aria-hidden="true" />
      </div>
    </>
  );
}
