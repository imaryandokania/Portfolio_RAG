'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TourStep = {
  sectionId: string | null; // null = scroll to top
  text: string;
};

const STEPS: TourStep[] = [
  {
    sectionId: null,
    text: "Hi — I'm Aryan's AI agent. Let me give you the 60-second tour. This whole site is a RAG pipeline over his resume, so you can ask me anything when we're done."
  },
  {
    sectionId: 'career-graph',
    text: 'This is his career as a living graph — drag to orbit it. Green nodes are roles, blue are projects, light blue are papers. Click any node to jump to it.'
  },
  {
    sectionId: 'experience',
    text: 'Right now he is a Research Engineer at Microsoft on the Copilot Studio team. The path here: Oracle → grad research at UC San Diego → Cisco (ML) → UCSD CSE → Microsoft.'
  },
  {
    sectionId: 'projects',
    text: 'Projects lean distributed-systems + ML: an MPEG-DASH streaming platform with RAFT leader election, an ML-scored gRPC load balancer, and LLaMA-powered JIRA search.'
  },
  {
    sectionId: 'research',
    text: 'Four publications — including CodeNib (2026), a data system serving repository context to coding agents, and an ICLR 2025 workshop paper on learning-to-optimize co-authored with Prof. Rose Yu.'
  },
  {
    sectionId: 'skills',
    text: 'The stack: C++, Go, Python, PyTorch, RAG, and a lot of AWS/Kubernetes. Full list here.'
  },
  {
    sectionId: null,
    text: "That's the highlights. Now ask me anything in the query console — or try typing `sudo hire aryan`. 😉"
  }
];

const TYPE_SPEED_MS = 18;

export default function GuidedTour({ onExit }: { onExit: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  const step = STEPS[stepIndex];
  const typingDone = charIndex >= step.text.length;

  // scroll on step change
  useEffect(() => {
    if (step.sectionId) {
      document.getElementById(step.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [stepIndex, step.sectionId]);

  // typewriter
  useEffect(() => {
    if (typingDone) return;
    timerRef.current = window.setTimeout(() => setCharIndex((c) => c + 1), TYPE_SPEED_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [charIndex, typingDone]);

  const goNext = useCallback(() => {
    if (!typingDone) {
      setCharIndex(step.text.length); // fast-forward typing first
      return;
    }
    if (stepIndex >= STEPS.length - 1) {
      onExit();
      return;
    }
    setStepIndex((i) => i + 1);
    setCharIndex(0);
  }, [typingDone, step.text.length, stepIndex, onExit]);

  // keyboard: Enter/Space advance, Esc exits
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, onExit]);

  return (
    <AnimatePresence>
      <motion.div
        key="tour-card"
        className="fixed bottom-16 left-1/2 z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
      >
        <div className="overflow-hidden rounded-2xl border border-emerald-400/30 bg-black/95 shadow-[0_0_45px_rgba(52,211,153,0.25)] backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <p className="ml-2 font-mono text-[11px] text-white/50">
              <span className="text-emerald-400">tour.sh</span>
              <span className="text-white/40"> — step {stepIndex + 1}/{STEPS.length}</span>
            </p>
            <button
              type="button"
              onClick={onExit}
              className="ml-auto font-mono text-[11px] text-white/40 transition hover:text-white"
            >
              [esc] exit
            </button>
          </div>
          <div className="px-5 py-4">
            <p className="min-h-[72px] font-mono text-sm leading-relaxed text-white/85">
              <span className="mr-2 select-none text-emerald-500">&gt;</span>
              {step.text.slice(0, charIndex)}
              {!typingDone && <span className="terminal-cursor" aria-hidden="true" />}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-6 rounded-full ${i <= stepIndex ? 'bg-emerald-400' : 'bg-white/15'}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-1.5 font-mono text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                {typingDone ? (stepIndex >= STEPS.length - 1 ? 'finish ⏎' : 'next ⏎') : 'skip ⏎'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
