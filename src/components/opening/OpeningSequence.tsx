'use client';

import { useEffect, useRef, useState } from 'react';
import { ClosingScene, HeroScene, OpeningNav, ReelScene, StatementScene, TracksScene, VerbScene } from './Scenes';

type Props = {
  onAsk: () => void;
  onTour: () => void;
  onRecruiter: () => void;
  /** Fires with true once the visitor has scrolled past the opening. */
  onPastOpening?: (past: boolean) => void;
};

/**
 * The opening page, modelled on Apple's "Introducing Apple Creator Studio" film:
 * mixed-media wordmark → statement → verb run →
 * Logic-style career tracks → focus reel → wordmark again → into the console.
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
    const io = new IntersectionObserver(([entry]) => {
      pastRef.current?.(entry.isIntersecting || entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* outside the z-10 wrapper so the fixed nav stays above the sections that follow */}
      <OpeningNav visible={heroDone || scrolled} onAsk={onAsk} onTour={onTour} onRecruiter={onRecruiter} />
      <div className="studio relative z-10 bg-black">
      <HeroScene onAsk={onAsk} onRecruiter={onRecruiter} onSettled={() => setHeroDone(true)} />
      <StatementScene />
      <VerbScene />
      <TracksScene />
      <ReelScene />
      <ClosingScene onAsk={onAsk} />
      <div ref={endRef} aria-hidden="true" />
      </div>
    </>
  );
}
