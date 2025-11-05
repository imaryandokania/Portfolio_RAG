'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeData } from '../data/resumeData';
import { computeExperienceMetrics } from '../utils/resumeMetrics';
import SkillClusterBars from './SkillClusterBars';
import CyberBackground from './CyberBackground';

type ResumeDocument = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  content?: string;
  points?: string[];
  link?: string;
};

type IndexedDocument = ResumeDocument & {
  tokens: string[];
  rawText: string;
};

type TrendRecord = {
  query: string;
  hits: number;
  lastSearched: string;
};

export default function SearchInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [searchResults, setSearchResults] = useState<ResumeDocument[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const [missionClock, setMissionClock] = useState('--:--:--');
  const [trendRecords, setTrendRecords] = useState<TrendRecord[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [semanticReady, setSemanticReady] = useState(false);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const embeddingPipelineRef = useRef<any>(null);
  const [docEmbeddings, setDocEmbeddings] = useState<number[][]>([]);

  const contactEntries = useMemo(
    () => [
      {
        label: 'Location',
        value: resumeData.contact.location
      },
      {
        label: 'Phone',
        value: resumeData.contact.phone,
        href: `tel:${resumeData.contact.phone.replace(/[^0-9+]/g, '')}`
      },
      {
        label: 'Email',
        value: resumeData.contact.email,
        href: `mailto:${resumeData.contact.email}`
      },
      {
        label: 'LinkedIn',
        value: resumeData.contact.linkedin,
        href: `https://${resumeData.contact.linkedin}`
      },
      {
        label: 'GitHub',
        value: resumeData.contact.github,
        href: `https://${resumeData.contact.github}`
      }
    ],
    []
  );

  const highlightProjects = useMemo(
    () => resumeData.sections.projects?.slice(0, 2) ?? [],
    []
  );

  const skillHighlights = useMemo(() => {
    const skills = resumeData.sections.skills;
    if (!skills) {
      return [];
    }
    return [
      {
        label: 'Languages',
        items: skills.languages?.slice(0, 4) ?? []
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

  const refreshTrends = useCallback(async () => {
    try {
      const response = await fetch('/api/search-trends?count=6');
      if (!response.ok) {
        throw new Error('failed');
      }
      const data = await response.json();
      if (Array.isArray(data?.records)) {
        setTrendRecords(data.records as TrendRecord[]);
      }
    } catch (error) {
      console.warn('Trend fetch failed', error);
    } finally {
      setTrendLoading(false);
    }
  }, []);

useEffect(() => {
  refreshTrends();
}, [refreshTrends]);

  const logSearch = useCallback(async (term: string) => {
    try {
      await fetch('/api/search-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: term })
      });
      refreshTrends();
    } catch (error) {
      console.warn('Search analytics failed', error);
    }
  }, [refreshTrends]);

  const telemetryMetrics = useMemo(() => {
    const aggregated = computeExperienceMetrics();

    return [
      {
        label: 'AI Systems Index',
        value: `${aggregated.aiScore}`,
        suffix: '/100',
        detail: `${aggregated.mlMentions} ML-specific highlights across roles & projects`,
        accent: '#00fff5'
      },
      {
        label: 'Experience Depth',
        value: `${aggregated.experienceScore}`,
        suffix: '/100',
        detail: `${aggregated.experienceYears.toFixed(1)} yrs (${aggregated.experienceMonths} months) of hands-on work`,
        accent: '#b026ff'
      },
      {
        label: 'Cloud Coverage',
        value: `${aggregated.cloudScore}`,
        suffix: '/100',
        detail: `${aggregated.cloudToolCount} tools · ${aggregated.cloudMentions} infra mentions`,
        accent: '#00b3ff'
      },
      {
        label: 'Project Velocity',
        value: `${aggregated.projectScore}`,
        suffix: '/100',
        detail: `${aggregated.projectPoints} impactful project bullet points`,
        accent: '#f5f3ff'
      }
    ];
  }, []);

  function tokenize(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  function cosineSimilarity(a: number[], b: number[]) {
    if (!a.length || !b.length || a.length !== b.length) {
      return 0;
    }
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    if (!magA || !magB) {
      return 0;
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  function buildDocuments(): ResumeDocument[] {
    const docs: ResumeDocument[] = [];
    const { sections } = resumeData;

    if (sections.summary) {
      sections.summary.forEach((line, index) => {
        docs.push({
          id: `summary-${index}`,
          section: 'summary',
          title: 'Professional Summary',
          content: line
        });
      });
    }

    sections.education?.forEach((item, index) => {
      docs.push({
        id: `education-${index}`,
        section: 'education',
        title: item.university,
        subtitle: `${item.location} | ${item.period}`,
        content: `${item.degree}${item.gpa ? ` | ${item.gpa}` : ''}`
      });
    });

    sections.experience?.forEach((item, index) => {
      docs.push({
        id: `experience-${index}`,
        section: 'experience',
        title: `${item.company} — ${item.title}`,
        subtitle: `${item.location} | ${item.period}`,
        points: item.points
      });
    });

    sections.projects?.forEach((item, index) => {
      docs.push({
        id: `projects-${index}`,
        section: 'projects',
        title: item.title,
        subtitle: item.technologies?.join(', '),
        content: item.link,
        points: item.points
      });
    });

    if (sections.skills) {
      const { languages, mlAi, cloudTools, certifications, coursework } = sections.skills;

      docs.push({
        id: 'skills-languages',
        section: 'skills',
        title: 'Programming Languages',
        points: languages
      });

      docs.push({
        id: 'skills-ml',
        section: 'skills',
        title: 'ML & AI',
        points: mlAi
      });

      docs.push({
        id: 'skills-cloud',
        section: 'skills',
        title: 'Cloud & Tools',
        points: cloudTools
      });

      docs.push({
        id: 'skills-coursework',
        section: 'skills',
        title: 'Coursework',
        points: coursework
      });

      if (certifications) {
        docs.push({
          id: 'skills-certifications',
          section: 'skills',
          title: 'Certifications',
          points: certifications.map((cert) =>
            cert.link ? `${cert.name} (${cert.link})` : cert.name
          )
        });
      }
    }

    sections.achievements?.forEach((item, index) => {
      docs.push({
        id: `achievements-${index}`,
        section: 'achievements',
        title: item.title,
        content: item.description,
        points: item.links
      });
    });

    return docs;
  }

const indexedDocuments = useMemo<IndexedDocument[]>(() => {
  const docs = buildDocuments();
  return docs.map((doc) => {
    const aggregateText = [
      doc.title,
        doc.subtitle,
        doc.content,
        doc.points?.join(' ')
      ]
        .filter(Boolean)
        .join(' ');

      return {
        ...doc,
        tokens: tokenize(aggregateText),
        rawText: aggregateText
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialiseSemanticSearch() {
      if (typeof window === 'undefined') {
        return;
      }
      if (semanticReady || semanticLoading) {
        return;
      }
      setSemanticLoading(true);
      try {
        const { pipeline } = await import('@xenova/transformers');
        if (cancelled) {
          return;
        }
        const featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        if (cancelled) {
          return;
        }
        embeddingPipelineRef.current = featureExtractor;

        const embeddings: number[][] = [];
        for (const doc of indexedDocuments) {
          const text = doc.rawText || doc.title;
          const output = await featureExtractor(text, {
            pooling: 'mean',
            normalize: true
          });
          if (cancelled) {
            return;
          }
          const vector = Array.from(output.data as Float32Array);
          embeddings.push(vector);
        }
        if (!cancelled) {
          setDocEmbeddings(embeddings);
          setSemanticReady(true);
        }
      } catch (error) {
        console.warn('Semantic search initialisation failed', error);
      } finally {
        if (!cancelled) {
          setSemanticLoading(false);
        }
      }
    }
    initialiseSemanticSearch();

    return () => {
      cancelled = true;
    };
  }, [indexedDocuments, semanticReady, semanticLoading]);

  const primaryEducation = resumeData.sections.education?.[0];

  function scoreDocument(queryTokens: string[], docTokens: string[]) {
    if (!queryTokens.length || !docTokens.length) {
      return 0;
    }

    const docFrequency = docTokens.reduce<Record<string, number>>((acc, token) => {
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});

    return queryTokens.reduce((score, token) => {
      return score + (docFrequency[token] || 0);
    }, 0);
  }

  const performSearch = useCallback(async (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setSearchResults([]);
      setActiveSection('');
      setLastQuery('');
      return;
    }

    setIsSearching(true);
    setLastQuery(normalizedQuery);
    logSearch(normalizedQuery);

    let results: ResumeDocument[] = [];

    if (
      semanticReady &&
      docEmbeddings.length === indexedDocuments.length &&
      embeddingPipelineRef.current
    ) {
      try {
        const semanticOutput = await embeddingPipelineRef.current(normalizedQuery, {
          pooling: 'mean',
          normalize: true
        });
        const queryVector = Array.from(semanticOutput.data as Float32Array);
        const semanticRanking = docEmbeddings
          .map((vector, idx) => ({
            doc: indexedDocuments[idx],
            score: cosineSimilarity(vector, queryVector)
          }))
          .filter(({ score }) => score > 0.18)
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map(({ doc }) => {
            const { tokens, rawText, ...rest } = doc;
            return rest;
          });

        results = semanticRanking;
      } catch (error) {
        console.warn('Semantic search failed, falling back to keyword', error);
      }
    }

    if (!results.length) {
      const queryTokens = tokenize(normalizedQuery);
      results = indexedDocuments
        .map((doc) => ({
          ...doc,
          score: scoreDocument(queryTokens, doc.tokens)
        }))
        .filter((doc) => doc.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
        .map(({ tokens, rawText, score, ...rest }) => rest);
    }

    setTimeout(() => {
      setSearchResults(results);
      setActiveSection('');
      setIsSearching(false);
    }, 400);
  }, [docEmbeddings, indexedDocuments, logSearch, semanticReady]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void performSearch(searchQuery);
  };

  const handleSectionSelect = (section: string) => {
    setActiveSection(section);
    setSearchQuery('');
    setIsSearching(false);

    const filtered = indexedDocuments
      .filter((doc) => doc.section === section)
      .map(({ tokens, ...rest }) => rest);

    setSearchResults(filtered);
    setLastQuery('');
  };

  return (
    <div className="relative">
      <CyberBackground />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,245,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(255,45,85,0.15),_transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-screen"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(0, 255, 245, 0.15) 1px, transparent 1px), linear-gradient(0deg, rgba(176, 38, 255, 0.12) 1px, transparent 1px)',
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
            className="relative overflow-hidden rounded-3xl border border-[#00fff5]/30 bg-black/50 backdrop-blur-xl shadow-[0_0_45px_rgba(0,255,245,0.1)]"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,245,0.12),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(176,38,255,0.18),_transparent_55%)] mix-blend-screen" />
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] relative p-8 lg:p-12">
              <div className="space-y-6">
                <div className="text-left space-y-4">
                  <motion.div 
                    className="flex w-fit items-center gap-2 rounded-full border border-[#00fff5]/50 bg-black/60 px-4 py-2 text-sm uppercase tracking-widest text-[#00fff5]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Neural Portfolio Interface
                  </motion.div>
                  <motion.h1 
                    className="text-5xl md:text-6xl font-bold text-white leading-tight cyberpunk-glow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    {resumeData.name}
                  </motion.h1>
                  <motion.p 
                    className="text-[#00fff5] text-lg md:text-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {primaryEducation?.degree} @ {primaryEducation?.university}
                  </motion.p>
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
                  {contactEntries.map(({ label, value, href }) => (
                    <motion.a
                      key={label}
                      href={href}
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-[#00fff5]/60 hover:bg-[#00fff5]/10"
                      whileHover={{ y: -4 }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top,_rgba(0,255,245,0.18),_transparent_60%)]" />
                      <div className="relative space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</p>
                        <p className="text-sm md:text-base text-white/90 break-words">{value}</p>
                      </div>
                    </motion.a>
                  ))}
                </motion.div>
              </div>

              <motion.div 
                className="relative rounded-2xl border border-[#ff2d55]/30 bg-black/60 p-6 lg:p-8 backdrop-blur-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,45,85,0.15),_transparent_55%)]" />
                <div className="absolute -top-10 -right-12 h-40 w-40 rounded-full bg-[#ff2d55]/30 blur-3xl" />
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
                          className="block rounded-xl border border-white/10 bg-black/40 p-4 transition-colors duration-300 hover:border-[#ff2d55]/60 hover:bg-[#ff2d55]/10"
                          whileHover={{ x: 6 }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[#ff2d55]">{project.title}</p>
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
                          <span className="rounded-full border border-[#00fff5]/40 bg-[#00fff5]/10 px-3 py-1 text-xs uppercase tracking-wide text-[#00fff5]">
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

          {/* Search Panel */}
          <motion.div
            className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-[0_0_55px_rgba(176,38,255,0.08)]"
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:flex-1">
                  <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#00fff5]/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 rounded-2xl bg-black/70 px-6 text-lg md:text-xl text-white shadow-[inset_0_0_20px_rgba(0,255,245,0.05)]
                    focus:outline-none focus:ring-2 focus:ring-[#ff2d55] focus:ring-offset-2 focus:ring-offset-black transition-all duration-300"
                    placeholder="Query the neural archive (skills, experience, projects...)"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#ff2d55] via-[#b026ff] to-[#00fff5]
                    px-6 py-3 text-sm md:text-base font-semibold text-white shadow-[0_0_18px_rgba(255,45,85,0.4)] transition-all duration-300 hover:shadow-[0_0_28px_rgba(176,38,255,0.6)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSearching ? 'Scanning…' : 'Execute Search'}
                </motion.button>
              </div>
            </motion.form>

            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
            {Object.keys(resumeData.sections).map((section) => (
              <motion.button
                key={section}
                onClick={() => handleSectionSelect(section)}
                className={`group relative overflow-hidden rounded-2xl border ${
                    activeSection === section ? 'border-[#ff2d55]' : 'border-white/10'
                  } bg-white/5 p-4 text-left transition-all duration-300 hover:border-[#ff2d55]/70 hover:bg-[#ff2d55]/15 capitalize`}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top,_rgba(255,45,85,0.15),_transparent_65%)]" />
                  <div className="relative space-y-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/50">Jump To</p>
                    <p className="text-lg font-semibold text-white">{section}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            <div className="flex items-center gap-2 text-xs text-white/60">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  semanticReady
                    ? 'bg-[#00fff5]'
                    : semanticLoading
                      ? 'bg-[#ff2d55] animate-pulse'
                      : 'bg-white/30'
                }`}
              />
              <span>
                {semanticReady
                  ? 'Semantic search active'
                  : semanticLoading
                    ? 'Loading semantic search model…'
                    : 'Falling back to keyword search'}
              </span>
            </div>

            {!trendLoading && trendRecords.length > 0 && (
              <motion.div
                className="space-y-2 pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3 text-[#00fff5]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 1 0 0-2H4V4a1 1 0 0 0-1-1zm4.4 9.2 2.3-3.45 1.7 2.55 2.8-4.2a1 1 0 1 1 1.66 1.1l-3.5 5.25a1 1 0 0 1-1.66 0l-1.76-2.63-1.57 2.35a1 1 0 1 1-1.7-1.17z" />
                  </svg>
                  <span>Trending</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendRecords.slice(0, 6).map((trend) => (
                    <button
                      key={`${trend.query}-${trend.hits}`}
                      type="button"
                    onClick={() => {
                      setSearchQuery(trend.query);
                      void performSearch(trend.query);
                    }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-[#00fff5]/60 hover:text-[#00fff5]"
                    >
                      {trend.query}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,255,245,0.06)]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,245,0.08),_transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(0,255,245,0.12), rgba(0,255,245,0.12) 1px, transparent 1px, transparent 24px)'
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

          {searchResults.length === 0 && !activeSection && !searchQuery && (
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
              {isSearching && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-[#00fff5] animate-pulse text-xl">
                    Scanning neural network...
                  </div>
                  <div className="mt-4 h-1 bg-black/30 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#ff2d55]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              )}

              {searchResults.map((result, idx) => (
                <motion.div
                  key={idx}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-[#00fff5]/60 hover:bg-[#00fff5]/10"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top,_rgba(0,255,245,0.18),_transparent_60%)]" />
                  <div className="relative flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-[#00fff5]/40 bg-[#00fff5]/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-[#00fff5]">
                        {result.section}
                      </span>
                      <h3 className="text-[#ff2d55] text-xl font-semibold">
                        {result.title || result.section}
                      </h3>
                    </div>
                    {result.subtitle && (
                      <p className="text-[#00fff5] text-sm md:text-base">{result.subtitle}</p>
                    )}
                    {result.content && (
                      <p className="text-white/80 text-sm md:text-base leading-relaxed break-words">
                        {result.content}
                      </p>
                    )}
                    {result.points && result.points.length > 0 && (
                      <ul className="grid gap-2 text-white/80 text-sm md:text-base">
                        {result.points.map((point, i) => (
                          <li key={i} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#ff2d55]">
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              ))}

              {lastQuery && !isSearching && searchResults.length === 0 && (
                <motion.div 
                  className="text-center text-[#ff2d55]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No matches found for “{lastQuery}”. Try different keywords or browse a section.
                  {!trendLoading && trendRecords.length > 0 && (
                    <div className="mt-4 text-xs text-white/60">
                      Trending searches:
                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {trendRecords.slice(0, 3).map((trend) => (
                          <button
                            key={`noresults-${trend.query}`}
                            type="button"
                            onClick={() => {
                              setSearchQuery(trend.query);
                              void performSearch(trend.query);
                            }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-[#00fff5]/60 hover:text-[#00fff5]"
                          >
                            {trend.query}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
