import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeData } from '../data/resumeData';
import {
  computeRoleAnalytics,
  formatPeriod,
  monthsBetween,
  ResumeExperience
} from '../utils/resumeMetrics';

type TimelineItem = {
  experience: ResumeExperience;
  months: number;
  widthPercent: number;
  startLabel: string;
  endLabel: string;
  aiScore: number;
  aiMentions: number;
};

function formatMonthLabel(period: string, position: 'start' | 'end') {
  const [startPart, endPart] = period.split('-').map((segment) => segment.trim());
  const target = position === 'start' ? startPart : endPart ?? startPart;
  if (!target) {
    return '';
  }

  return target.replace(/\s+/g, ' ');
}

export default function ExperienceTimeline() {
  const experiences = resumeData.sections.experience ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => {
    const totalMonths = experiences.reduce((total, role) => total + monthsBetween(role.period), 0) || 1;
    return experiences.map((experience) => {
      const analytics = computeRoleAnalytics(experience);
      const months = analytics.months || 1;
      return {
        experience,
        months,
        widthPercent: (months / totalMonths) * 100,
        startLabel: formatMonthLabel(experience.period, 'start'),
        endLabel: formatMonthLabel(experience.period, 'end'),
        aiScore: analytics.aiScore,
        aiMentions: analytics.aiMentions
      } as TimelineItem;
    });
  }, [experiences]);

  if (!items.length) {
    return null;
  }

  const activeItem = items[activeIndex] ?? items[0];

  return (
    <div className="relative rounded-3xl border border-white/10 bg-black/50 p-6 md:p-8 overflow-hidden backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(176,38,255,0.12),_transparent_65%)]" />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,255,245,0.15), rgba(0,255,245,0.15) 1px, transparent 1px, transparent 22px)'
        }}
      />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
          <span>Experience Trajectory</span>
          <span>AI insights per role</span>
        </div>

        <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="absolute h-full bg-gradient-to-r from-[#00fff5] via-[#b026ff] to-[#ff2d55]"
            initial={{ width: `${items[0].widthPercent}%` }}
            animate={{ width: `${items.slice(0, activeIndex + 1).reduce((sum, item) => sum + item.widthPercent, 0)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
          <div className="relative flex h-full">
            {items.map((item, index) => (
              <button
                key={item.experience.company + index}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                className="group relative h-full flex-1"
                style={{ minWidth: `${item.widthPercent}%` }}
                aria-label={`${item.experience.company} - ${item.experience.title}`}
              >
                <div className="absolute inset-y-0 w-px bg-white/10 group-first:hidden" />
                <motion.div
                  className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-black/80 group-hover:border-[#00fff5] group-hover:bg-[#00fff5]"
                  animate={{
                    scale: activeIndex === index ? 1.4 : 1,
                    boxShadow: activeIndex === index ? '0 0 16px rgba(0,255,245,0.6)' : '0 0 0 rgba(0,0,0,0)'
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                />
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.experience.company}
            className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#00fff5]/40 bg-[#00fff5]/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-[#00fff5]">
                  {activeItem.startLabel} → {activeItem.endLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  {activeItem.months} months
                </span>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white">{activeItem.experience.title}</h3>
                <p className="text-sm text-[#00fff5]">
                  {activeItem.experience.company} · {activeItem.experience.location}
                </p>
              </div>

              <ul className="space-y-2 text-sm text-white/80">
                {activeItem.experience.points?.slice(0, 3).map((point, index) => (
                  <li key={index} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#ff2d55]">
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs uppercase tracking-[0.35em] text-white/60">
                AI Signal Analysis
              </div>
              <div className="flex items-baseline gap-2 text-4xl font-bold text-[#00fff5]">
                <span>{activeItem.aiScore}</span>
                <span className="text-sm text-white/50">/100</span>
              </div>
              <p className="text-sm text-white/70">
                {activeItem.aiMentions} AI/ML signals detected across this role&apos;s highlights.
              </p>

              <div className="space-y-2 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-10 rounded-full bg-gradient-to-r from-[#00fff5] to-[#b026ff]" />
                  <span>Focus vectors updating in real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-10 rounded-full bg-gradient-to-r from-[#ff2d55] to-[#b026ff]" />
                  <span>Projects aligned with LLM & distributed systems</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
