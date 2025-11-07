'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resumeData } from '../data/resumeData';
import { computeExperienceMetrics } from '../utils/resumeMetrics';
import SkillClusterBars from './SkillClusterBars';
import CyberBackground from './CyberBackground';

export default function SearchInterface() {
  const MAX_QUERY_CHARS = 500;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [agentAnswer, setAgentAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  const [missionClock, setMissionClock] = useState('--:--:--');

  const contactEntries = useMemo(
    () => [
      {
        label: 'Location',
        value: resumeData.contact.location
      },
      // {
      //   label: 'Phone',
      //   value: resumeData.contact.phone,
      //   href: `tel:${resumeData.contact.phone.replace(/[^0-9+]/g, '')}`
      // },
      {
        label: 'Email',
        value: resumeData.contact.email,
        href: `mailto:${resumeData.contact.email}`
      },
      {
        label: 'LinkedIn',
        value: 'aryandokania',
        href: `https://${resumeData.contact.linkedin}`,
        icon: (
          <svg className="h-4 w-4 text-[#38bdf8]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 1 1-.01 5 2.5 2.5 0 0 1 .01-5ZM3 9h3.95v12H3zM10.5 9H14v1.64h.05c.49-.93 1.69-1.91 3.48-1.91 3.72 0 4.41 2.45 4.41 5.64V21H18V15.1c0-1.4-.03-3.21-2-3.21-2 0-2.31 1.56-2.31 3.09V21h-3.95z" />
          </svg>
        )
      },
      {
        label: 'GitHub',
        value: 'imaryandokania',
        href: `https://${resumeData.contact.github}`,
        icon: (
          <svg className="h-4 w-4 text-[#38bdf8]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.74 1.27 3.41.97.1-.76.41-1.27.75-1.56-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.52.11-3.17 0 0 .98-.31 3.21 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.64 1.65.24 2.87.12 3.17.74.81 1.19 1.84 1.19 3.1 0 4.41-2.69 5.38-5.25 5.66.42.36.8 1.08.8 2.17 0 1.57-.02 2.83-.02 3.22 0 .31.21.67.79.56A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
          </svg>
        )
      },
      {
        label: 'Scholar',
        value: 'Google Scholar',
        href: `https://${resumeData.contact.scholar}`,
        icon: (
          <svg className="h-4 w-4 text-[#38bdf8]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2 3 7l9 5 9-5-9-5Zm0 7.18L6.16 7 12 3.82 17.84 7 12 9.18Zm-9 4L12 18l9-4-4.5-2.5-4.5 2.5-4.5-2.5Zm0 4L12 22l9-4-4.5-2.5L12 17l-4.5-2.5Z" />
          </svg>
        )
      }
    ],
    []
  );

  const primaryEducation = resumeData.sections.education?.[0];

  const heroEducation = useMemo(() => {
    if (!primaryEducation) {
      return '';
    }
    const { degree = '', university = '' } = primaryEducation;

    let compactDegree = degree;
    if (/master of science/i.test(degree) && /computer science/i.test(degree)) {
      compactDegree = 'MS CS';
    } else if (/master of science/i.test(degree)) {
      compactDegree = 'MS';
    }

    let compactUniversity = university;
    if (/university of california san diego/i.test(university)) {
      compactUniversity = 'UC San Diego';
    }

    return `${compactDegree} @ ${compactUniversity}`.trim();
  }, [primaryEducation]);

  const highlightProjects = useMemo(
    () => resumeData.sections.projects?.slice(0, 2) ?? [],
    []
  );

  const skillHighlights = useMemo(() => {
    const skills = resumeData.sections.skills;
    if (!skills) {
      return [];
    }
    const languageHighlight = (() => {
      const langs = skills.languages ?? [];
      const selection = langs.slice(0, 4);
      if (langs.includes('Python') && !selection.includes('Python')) {
        if (selection.length >= 4) {
          selection.pop();
        }
        selection.push('Python');
      }
      return selection;
    })();
    return [
      {
        label: 'Languages',
        items: languageHighlight
      },
      {
        label: 'ML & AI',
        items: skills.mlAi?.slice(0, 4) ?? []
      },
      {
        label: 'Cloud & Tools',
        items: skills.cloudTools?.slice(0, 4) ?? []
      }
    ];
  }, []);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    });

    const updateClock = () => {
      setMissionClock(formatter.format(new Date()));
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const telemetryMetrics = useMemo(() => {
    const aggregated = computeExperienceMetrics();

    return [
      {
        label: 'AI Systems Index',
        value: `${aggregated.aiScore}`,
        suffix: '/100',
        detail: `${aggregated.mlMentions} ML-specific highlights across roles & projects`,
        accent: '#38bdf8'
      },
      {
        label: 'Experience Depth',
        value: `${aggregated.experienceScore}`,
        suffix: '/100',
        detail: `${aggregated.experienceYears.toFixed(1)} yrs (${aggregated.experienceMonths} months) of hands-on work`,
        accent: '#a855f7'
      },
      {
        label: 'Cloud Coverage',
        value: `${aggregated.cloudScore}`,
        suffix: '/100',
        detail: `${aggregated.cloudToolCount} tools · ${aggregated.cloudMentions} infra mentions`,
        accent: '#0ea5e9'
      },
      {
        label: 'Project Velocity',
        value: `${aggregated.projectScore}`,
        suffix: '/100',
        detail: `${aggregated.projectPoints} impactful project bullet points`,
        accent: '#f3e8ff'
      }
    ];
  }, []);

  const queryAgent = useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        setIsSearching(false);
        setAgentAnswer('');
        setLastQuery('');
        setError(null);
        return;
      }

      setIsSearching(true);
      setActiveSection('');
      setAgentAnswer('');
      setError(null);
      setLastQuery(normalizedQuery);

      try {
        if (normalizedQuery.length > MAX_QUERY_CHARS) {
          throw new Error(`Query is too long. Please stay under ${MAX_QUERY_CHARS} characters.`);
        }

        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: normalizedQuery })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? 'Failed to query the AI agent.');
        }

        const payload = (await response.json()) as {
          answer?: string;
        };

        setAgentAnswer(payload.answer ?? '');
      } catch (err) {
        console.error('Agent query failed', err);
        setAgentAnswer('');
        setError(err instanceof Error ? err.message : 'Unable to query the AI agent.');
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void queryAgent(searchQuery);
  };

  const handleSectionSelect = (section: string) => {
    const prompt = `Summarize about Aryan's ${section} `;
    setActiveSection(section);
    setSearchQuery(prompt);
    void queryAgent(prompt);
  };

  return (
    <div className="relative">
      <CyberBackground />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.15),_transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-screen"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 1px, transparent 1px), linear-gradient(0deg, rgba(168, 85, 247, 0.12) 1px, transparent 1px)',
            backgroundSize: '120px 120px'
          }}
        />
      </div>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative z-10">
        <motion.div 
          className="w-full max-w-6xl space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero */}
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-[#38bdf8]/30 bg-black/50 backdrop-blur-xl shadow-[0_0_45px_rgba(56,189,248,0.1)]"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.18),_transparent_55%)] mix-blend-screen" />
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] relative p-8 lg:p-12">
              <div className="space-y-6">
                <div className="text-left space-y-4">
                  <motion.div 
                    className="flex w-fit items-center gap-2 rounded-full border border-[#38bdf8]/50 bg-black/60 px-4 py-2 text-sm uppercase tracking-widest text-[#38bdf8]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Portfolio
                  </motion.div>
                  <motion.h1 
                    className="text-5xl md:text-6xl font-bold text-white leading-tight cyberpunk-glow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    {resumeData.name}
                  </motion.h1>
                  {heroEducation && (
                    <motion.p 
                      className="text-[#38bdf8] text-lg md:text-xl"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {heroEducation}
                    </motion.p>
                  )}
                </div>
                {resumeData.sections.summary && (
                  <motion.p 
                    className="text-white/70 text-base md:text-lg leading-relaxed max-w-2xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    {resumeData.sections.summary[0]}
                  </motion.p>
                )}

                <motion.div 
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {contactEntries.map(({ label, value, href, icon }) => (
                    <motion.a
                      key={label}
                      href={href}
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[#38bdf8]/60 hover:bg-[#38bdf8]/10"
                      whileHover={{ y: -4 }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />
                      <div className="relative space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
                        <div className="flex items-center gap-2 text-sm md:text-base text-white/90 break-all">
                          {icon && <span>{icon}</span>}
                          <span>{value}</span>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </motion.div>
              </div>

              <motion.div 
                className="relative rounded-2xl border border-[#6366f1]/30 bg-black/60 p-6 lg:p-8 backdrop-blur-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_55%)]" />
                <div className="absolute -top-10 -right-12 h-40 w-40 rounded-full bg-[#6366f1]/30 blur-3xl" />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/50">
                    <span>Systems Monitor</span>
                    <span>{missionClock}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Latest Projects</p>
                    <div className="mt-3 space-y-3">
                      {highlightProjects.map((project, idx) => (
                        <motion.a
                          key={project.title}
                          href={project.link}
                          target={project.link ? '_blank' : undefined}
                          rel={project.link ? 'noreferrer' : undefined}
                          className="block rounded-xl border border-white/10 bg-black/40 p-4 transition-colors duration-300 hover:border-[#6366f1]/60 hover:bg-[#6366f1]/10"
                          whileHover={{ x: 6 }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#6366f1]">{project.title}</p>
                            <span className="text-xs text-white/60">#{idx + 1}</span>
                          </div>
                          {project.technologies && (
                            <p className="mt-1 text-xs text-white/50">
                              {project.technologies.join(' • ')}
                            </p>
                          )}
                        </motion.a>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Skill Matrix</p>
                    <div className="mt-3 space-y-2">
                      {skillHighlights.map(({ label, items }) => (
                        <div key={label} className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/10 px-3 py-1 text-xs uppercase tracking-wide text-[#38bdf8]">
                            {label}
                          </span>
                          {items.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {!isSearching && agentAnswer && (
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 p-6 backdrop-blur-xl shadow-[0_0_45px_rgba(56,189,248,0.08)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48 }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_65%)]" />
              <div className="relative flex flex-col gap-4">
                <span className="rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#38bdf8] w-fit">
                  Agent Response
                </span>
                {lastQuery && (
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                    Query: “{lastQuery}”
                  </p>
                )}
                <div className="text-white/80 text-sm md:text-base leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      strong: ({ node, ...props }) => (
                        <span className="text-white font-semibold" {...props} />
                      ),
                      em: ({ node, ...props }) => (
                        <span className="italic text-white/80" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="mb-3 last:mb-0" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 space-y-2" {...props} />
                      ),
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />
                    }}
                  >
                    {agentAnswer}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search Panel */}
          <motion.div
            className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-[0_0_55px_rgba(99,102,241,0.12)]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.h1 
              className="sr-only"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {resumeData.name}
            </motion.h1>
            <motion.form
              onSubmit={handleSearch}
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative w-full sm:flex-1 pb-4 sm:pb-0">
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[#38bdf8]/15 via-transparent to-[#6366f1]/20 blur-xl" />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#38bdf8]/30" />
                  <div className="pointer-events-none absolute inset-x-6 top-3 flex items-center justify-between text-[11px] uppercase tracking-[0.34em] text-white/40">
                    <span>Query Console</span>
                    <span>Live</span>
                  </div>
                  <span className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[#38bdf8]">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.65" y1="16.65" x2="21" y2="21" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-20 rounded-2xl bg-black/80 pl-14 pr-6 text-lg md:text-xl text-white shadow-[inset_0_0_20px_rgba(56,189,248,0.08)]
                    focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 placeholder:text-white/40"
                    placeholder="What do you want to know about Aryan?"
                    aria-label="Search Aryan's portfolio"
                  />
                  <AnimatePresence>
                    {isSearching && (
                      <motion.div
                        key="search-progress"
                        className="pointer-events-none absolute -bottom-1 left-3 right-3 h-1 overflow-hidden rounded-full bg-white/10"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                      >
                        <motion.div
                          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#38bdf8] via-[#6366f1] to-transparent"
                          animate={{ x: ['-50%', '110%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.button
                  type="submit"
                  className="relative h-14 w-full sm:h-16 sm:w-48 overflow-hidden rounded-xl bg-[#101827] px-6 text-sm md:text-base font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/70 focus:ring-offset-2 focus:ring-offset-black flex items-center justify-center sm:ml-3"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#6366f1]/25 via-[#a855f7]/20 to-[#38bdf8]/25 opacity-70 blur-xl" />
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[#38bdf8]/50 to-transparent" />
                  <div className="relative flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: isSearching ? 360 : 0 }}
                      transition={{ duration: 1.2, repeat: isSearching ? Infinity : 0, ease: 'linear' }}
                    >
                      <svg className="h-4 w-4 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="9" opacity="0.3" />
                        <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
                      </svg>
                    </motion.span>
                    <span>{isSearching ? 'Searching …' : 'Search'}</span>
                  </div>
                </motion.button>
              </div>
            </motion.form>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
            {Object.keys(resumeData.sections)
              .filter((section) => section.toLowerCase() !== 'summary')
              .map((section) => (
              <motion.button
                key={section}
                onClick={() => handleSectionSelect(section)}
                className={`group relative overflow-hidden rounded-xl border ${
                    activeSection === section ? 'border-[#6366f1]' : 'border-white/10'
                  } bg-white/5 p-3 text-left transition-all duration-300 hover:border-[#6366f1]/70 hover:bg-[#6366f1]/15 capitalize`}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_65%)]" />
                  <div className="relative space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/50">Jump To</p>
                    <p className="text-sm font-semibold text-white">{section}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#38bdf8]" />
              <span>Keyword search ready</span>
            </div> */}
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(56,189,248,0.06)]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(56,189,248,0.12), rgba(56,189,248,0.12) 1px, transparent 1px, transparent 24px)'
              }}
            />
            <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4 auto-rows-fr">
              {telemetryMetrics.map((metric) => (
                <motion.div
                  key={metric.label}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 pb-6 backdrop-blur-xl flex flex-col justify-between"
                  whileHover={{ y: -6 }}
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at top, ${metric.accent}22, transparent 60%)`
                    }}
                  />
                  <div className="relative space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60 break-words">
                      {metric.label}
                    </p>
                    <p className="flex items-baseline gap-1 text-2xl font-semibold" style={{ color: metric.accent }}>
                      <span>{metric.value}</span>
                      {metric.suffix && (
                        <span className="text-sm text-white/60">{metric.suffix}</span>
                      )}
                    </p>
                    <p className="text-xs leading-relaxed text-white/50 break-words">{metric.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {!isSearching && !error && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <SkillClusterBars />
            </motion.div>
          )}

          {/* Results Area */}
          <AnimatePresence>
            <motion.div className="mt-8 space-y-4">
              {!isSearching && error && (
                <motion.div
                  className="text-center text-[#ef4444]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.div>
              )}

              {lastQuery && !isSearching && !agentAnswer && !error && (
                <motion.div 
                  className="text-center text-[#6366f1]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  The agent could not synthesize an answer. Try rephrasing or asking about another part of the resume.
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
