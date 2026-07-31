'use client';

import { useEffect, useRef, useState } from 'react';

type BootLine = {
  prompt?: string;
  text: string;
  className?: string;
  instant?: boolean;
};

const BOOT_LINES: BootLine[] = [
  { prompt: '$', text: 'whoami', className: 'text-emerald-300' },
  { text: 'aryan_dokania — research engineer @ microsoft · copilot studio', className: 'text-white/80', instant: true },
  { prompt: '$', text: 'aryan --status', className: 'text-emerald-300' },
  { text: '● ONLINE · Seattle, WA · MS CS @ UC San Diego (GPA 3.96)', className: 'text-white/80', instant: true },
  { prompt: '$', text: './ask_me_anything.sh', className: 'text-emerald-300' },
  { text: 'RAG agent initialized. Query console ready ▊', className: 'text-[#38bdf8]', instant: true }
];

const TYPE_SPEED_MS = 34;
const LINE_PAUSE_MS = 260;

export default function TerminalBoot() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (lineIndex >= BOOT_LINES.length) {
      return;
    }

    const line = BOOT_LINES[lineIndex];

    if (line.instant || charIndex >= line.text.length) {
      timerRef.current = window.setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      }, LINE_PAUSE_MS);
    } else {
      timerRef.current = window.setTimeout(() => {
        setCharIndex((c) => c + 1);
      }, TYPE_SPEED_MS);
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [lineIndex, charIndex]);

  return (
    <div
      className="rounded-xl border border-emerald-400/20 bg-black/70 p-4 font-mono text-[13px] leading-relaxed shadow-[inset_0_0_25px_rgba(16,185,129,0.06)]"
      aria-label="Terminal boot sequence"
    >
      {BOOT_LINES.slice(0, lineIndex + 1).map((line, idx) => {
        if (idx >= BOOT_LINES.length) {
          return null;
        }
        const isCurrent = idx === lineIndex;
        const visibleText = line.instant || !isCurrent ? line.text : line.text.slice(0, charIndex);

        return (
          <p key={idx} className={line.className}>
            {line.prompt && (
              <span className="mr-2 select-none text-emerald-500">{line.prompt}</span>
            )}
            <span>{visibleText}</span>
            {isCurrent && !line.instant && charIndex < line.text.length && (
              <span className="terminal-cursor" aria-hidden="true" />
            )}
          </p>
        );
      })}
      {lineIndex >= BOOT_LINES.length && (
        <p className="text-emerald-300">
          <span className="mr-2 select-none text-emerald-500">$</span>
          <span className="terminal-cursor" aria-hidden="true" />
        </p>
      )}
    </div>
  );
}
