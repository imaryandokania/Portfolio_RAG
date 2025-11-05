import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { resumeData } from '../data/resumeData';
import { computeExperienceMetrics } from '../utils/resumeMetrics';

export default function SkillClusterBars() {
  const metrics = useMemo(() => computeExperienceMetrics(), []);

  const mlSkills = resumeData.sections.skills?.mlAi?.length ?? 0;
  const cloudSkills = resumeData.sections.skills?.cloudTools?.length ?? 0;
  const languageSkills = resumeData.sections.skills?.languages?.length ?? 0;

  const categories = [
    {
      label: 'AI / ML Intelligence',
      score: metrics.aiScore,
      descriptor: `${metrics.mlMentions} ML signals · ${mlSkills} core tools`,
      accent: '#00fff5'
    },
    {
      label: 'Cloud Infrastructure',
      score: metrics.cloudScore,
      descriptor: `${metrics.cloudMentions} cloud mentions · ${cloudSkills} platforms`,
      accent: '#00b3ff'
    },
    {
      label: 'Distributed Systems',
      score: metrics.distributedScore,
      descriptor: `${metrics.distributedMentions} distributed patterns detected`,
      accent: '#ff2d55'
    },
    {
      label: 'Languages & Foundations',
      score: Math.min(100, Math.round(((languageSkills + mlSkills) / 12) * 100)),
      descriptor: `${languageSkills} programming languages`,
      accent: '#b026ff'
    }
  ];

  return (
    <div className="relative rounded-3xl border border-white/10 bg-black/50 p-6 md:p-8 backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,245,0.1),_transparent_65%)]" />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(176,38,255,0.12), rgba(176,38,255,0.12) 1px, transparent 1px, transparent 22px)'
        }}
      />
      <div className="relative space-y-6">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
          <span>Capability Spectrum</span>
          <span>Scores normalised to 100</span>
        </div>
        <div className="space-y-4">
          {categories.map((category, idx) => (
            <div key={category.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span className="font-medium text-white">{category.label}</span>
                <span>{category.score}/100</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="absolute h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${category.accent}, rgba(0,0,0,0))`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, category.score)}%` }}
                  transition={{ delay: 0.15 * idx, type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">{category.descriptor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
