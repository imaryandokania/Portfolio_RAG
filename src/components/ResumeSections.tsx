'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { resumeData } from '../data/resumeData';

const sectionReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 }
};

function TerminalPanel({
  command,
  children,
  id
}: {
  command: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <motion.section id={id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_45px_rgba(16,185,129,0.05)]" {...sectionReveal}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <p className="ml-3 font-mono text-xs text-white/50">
          <span className="text-emerald-400">aryan@portfolio</span>
          <span className="text-white/40">:~$ </span>
          <span className="text-white/80">{command}</span>
        </p>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </motion.section>
  );
}

export default function ResumeSections() {
  const { experience, projects, research, education, achievements, skills } = resumeData.sections;
  const [citations, setCitations] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    fetch('/api/citations')
      .then((res) => res.json())
      .then((data: { counts?: Record<string, number> }) => {
        if (!cancelled && data?.counts) {
          setCitations(data.counts);
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const skillGroups = [
    { label: 'languages', items: skills.languages },
    { label: 'ml_and_ai', items: skills.mlAi },
    { label: 'cloud_and_tools', items: skills.cloudTools }
  ];

  return (
    <div className="space-y-10">
      {/* Experience */}
      <TerminalPanel id="experience" command="cat experience.log">
        <div className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-emerald-400/60 before:via-[#38bdf8]/40 before:to-transparent">
          {experience.map((job, idx) => (
            <motion.div
              key={`${job.company}-${job.period}`}
              className="relative pl-8"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
            >
              <span
                className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 ${
                  idx === 0
                    ? 'border-emerald-400 bg-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                    : 'border-[#38bdf8]/60 bg-black'
                }`}
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                <span className="text-[#38bdf8]">@ {job.company}</span>
                {idx === 0 && (
                  <span className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                    current
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-xs text-white/50">
                {job.period} · {job.location}
              </p>
              <ul className="mt-3 space-y-2">
                {job.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm leading-relaxed text-white/70">
                    <span className="select-none text-emerald-500">▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </TerminalPanel>

      {/* Projects */}
      <TerminalPanel id="projects" command="ls projects/ --detail">
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <motion.a
              key={project.title}
              href={'link' in project ? (project as { link?: string }).link : undefined}
              target={'link' in project && (project as { link?: string }).link ? '_blank' : undefined}
              rel="noreferrer"
              className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-emerald-400/50 hover:bg-emerald-400/[0.06] hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition">
                  {project.title}
                </h3>
                {'link' in project && (project as { link?: string }).link && (
                  <span className="text-white/40 group-hover:text-emerald-300 transition">↗</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.technologies?.map((tech) => (
                  <span
                    key={tech}
                    className="rounded border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-[#38bdf8]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <ul className="space-y-1.5">
                {project.points.map((point) => (
                  <li key={point} className="flex gap-2 text-xs leading-relaxed text-white/60">
                    <span className="select-none text-emerald-500">▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.a>
          ))}
        </div>
      </TerminalPanel>

      {/* Skills */}
      <TerminalPanel id="skills" command="cat skills.conf">
        <div className="space-y-5">
          {skillGroups.map((group) => (
            <div key={group.label} className="flex flex-wrap items-baseline gap-2">
              <span className="w-full font-mono text-xs text-emerald-400 sm:w-40">
                [{group.label}]
              </span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs text-white/75 transition hover:border-emerald-400/50 hover:text-emerald-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline gap-2 border-t border-white/10 pt-4">
            <span className="w-full font-mono text-xs text-emerald-400 sm:w-40">[coursework]</span>
            <p className="flex-1 text-xs leading-relaxed text-white/60">
              {skills.coursework.join(' · ')}
            </p>
          </div>
        </div>
      </TerminalPanel>

      {/* Research */}
      <TerminalPanel id="research" command="grep -r 'publications' research/">
        <div className="space-y-4">
          {research.map((paper) => (
            <a
              key={paper.title}
              href={paper.link}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#38bdf8]/60 hover:bg-[#38bdf8]/[0.06]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#7dd3fc]">
                  {paper.year}
                </span>
                <h3 className="text-base font-semibold text-white group-hover:text-[#7dd3fc] transition">
                  {paper.title}
                </h3>
                {citations[paper.title] !== undefined && (
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                    cited by {citations[paper.title]}
                  </span>
                )}
              </div>
              <p className="mt-2 font-mono text-xs text-white/50">
                {paper.authors.join(', ')}
              </p>
              <p className="mt-1 text-xs italic text-white/60">{paper.venue}</p>
            </a>
          ))}
        </div>
      </TerminalPanel>

      {/* Education + Achievements */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-6">
        <TerminalPanel id="education" command="cat education.md">
          <div className="space-y-5">
            {education.map((school) => (
              <div key={school.university} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-base font-semibold text-white">{school.university}</h3>
                <p className="mt-1 text-sm text-white/70">{school.degree}</p>
                <p className="mt-2 font-mono text-xs text-white/50">
                  {school.period} · {school.location} · <span className="text-emerald-300">{school.gpa}</span>
                </p>
              </div>
            ))}
          </div>
        </TerminalPanel>

        <TerminalPanel id="achievements" command="cat achievements.txt">
          <div className="space-y-5">
            {achievements.map((achievement) => (
              <div key={achievement.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2">
                  <span className="text-[#34d399]">★</span>
                  <h3 className="text-base font-semibold text-white">{achievement.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{achievement.description}</p>
              </div>
            ))}
          </div>
        </TerminalPanel>
      </div>
    </div>
  );
}
