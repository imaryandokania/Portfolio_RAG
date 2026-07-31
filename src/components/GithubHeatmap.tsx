'use client';

import { useEffect, useState } from 'react';

type Contribution = { date: string; count: number; level: number };

const LEVEL_COLORS = [
  'rgba(255,255,255,0.06)',
  'rgba(52,211,153,0.25)',
  'rgba(52,211,153,0.45)',
  'rgba(52,211,153,0.7)',
  'rgba(52,211,153,1)'
];

export default function GithubHeatmap() {
  const [contributions, setContributions] = useState<Contribution[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/github-heatmap')
      .then((res) => res.json())
      .then((data: { enabled?: boolean; total?: number; contributions?: Contribution[] }) => {
        if (!cancelled && data?.enabled && data.contributions?.length) {
          setContributions(data.contributions);
          setTotal(data.total ?? 0);
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!contributions) {
    return null; // hide entirely if data unavailable
  }

  // group into weeks (columns of 7)
  const weeks: Contribution[][] = [];
  for (let i = 0; i < contributions.length; i += 7) {
    weeks.push(contributions.slice(i, i + 7));
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_45px_rgba(16,185,129,0.05)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <p className="ml-3 font-mono text-xs text-white/50">
          <span className="text-emerald-400">aryan@portfolio</span>
          <span className="text-white/40">:~$ </span>
          <span className="text-white/80">git log --oneline --graph</span>
        </p>
        <p className="ml-auto hidden font-mono text-[10px] text-white/40 sm:block">
          {total.toLocaleString()} contributions · last 12 months
        </p>
      </div>
      <div className="overflow-x-auto p-5">
        <div className="flex min-w-fit gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className="h-[10px] w-[10px] rounded-[2px] transition-transform hover:scale-125"
                  style={{ backgroundColor: LEVEL_COLORS[Math.min(day.level, 4)] }}
                  title={`${day.date}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-white/40">
          less
          {LEVEL_COLORS.map((color, i) => (
            <span key={i} className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: color }} />
          ))}
          more
        </div>
      </div>
    </div>
  );
}
