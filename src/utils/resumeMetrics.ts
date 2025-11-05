import { resumeData } from '../data/resumeData';

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11
};

export type ResumeExperience = (typeof resumeData.sections.experience)[number];
export type ResumeProject = (typeof resumeData.sections.projects)[number];

export const ML_KEYWORDS = [
  'ml',
  'machine learning',
  'ai',
  'llm',
  'rag',
  'meta-learning',
  'meta learning',
  'optimizer',
  'embedding',
  'embeddings',
  'pytorch',
  'tensor',
  'faiss',
  'classifier',
  'language model',
  'sbert',
  'sb bert',
  'llama'
];

function parseDatePart(part: string) {
  const cleaned = part.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return undefined;
  }
  if (/present/i.test(cleaned)) {
    return new Date();
  }
  const monthMatch = cleaned.match(/[A-Za-z]+/);
  const yearMatch = cleaned.match(/(19|20)\d{2}/);
  if (!monthMatch || !yearMatch) {
    return undefined;
  }
  const key = monthMatch[0].replace('.', '').toLowerCase();
  const monthIndex = MONTH_MAP[key];
  if (typeof monthIndex !== 'number') {
    return undefined;
  }
  const year = parseInt(yearMatch[0], 10);
  return new Date(year, monthIndex, 1);
}

export function monthsBetween(period: string) {
  const [startPart, endPart] = period.split('-').map((segment) => segment.trim());
  const start = parseDatePart(startPart);
  const end = parseDatePart(endPart ?? startPart);
  if (!start || !end) {
    return 0;
  }
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

export function formatPeriod(period: string) {
  return period.replace(/\s+/, ' ').trim();
}

export function computeExperienceMetrics() {
  const experiences = resumeData.sections.experience ?? [];
  const projects = resumeData.sections.projects ?? [];
  const skills = resumeData.sections.skills;

  const experienceMonths = experiences.reduce((total, role) => total + monthsBetween(role.period), 0);
  const experienceYears = experienceMonths / 12;
  const experienceScore = Math.max(20, Math.min(100, Math.round((experienceMonths / 60) * 100)));

  const textSegments: string[] = [];
  experiences.forEach((item) => {
    textSegments.push(item.title, item.company, ...(item.points ?? []));
  });
  projects.forEach((project) => {
    textSegments.push(project.title, ...(project.points ?? []));
  });

  const mlMentions = textSegments.reduce((count, text) => {
    const lower = text.toLowerCase();
    return count + (ML_KEYWORDS.some((keyword) => lower.includes(keyword)) ? 1 : 0);
  }, 0);
  const aiCoverage = textSegments.length ? mlMentions / textSegments.length : 0;
  const aiScore = Math.max(25, Math.min(100, Math.round(aiCoverage * 130)));

  const cloudToolCount = skills?.cloudTools?.length ?? 0;
  const cloudScore = Math.max(30, Math.min(100, Math.round((cloudToolCount / 10) * 100)));

  const projectPoints = projects.reduce((total, project) => total + (project.points?.length ?? 0), 0);
  const projectScore = Math.max(25, Math.min(100, Math.round((projectPoints / 12) * 100)));

  return {
    experienceMonths,
    experienceYears,
    experienceScore,
    mlMentions,
    aiScore,
    cloudToolCount,
    cloudScore,
    projectPoints,
    projectScore
  };
}

export function computeRoleAnalytics(experience: ResumeExperience) {
  const months = monthsBetween(experience.period);
  const aiMentions = (experience.points ?? []).reduce((count, point) => {
    const lower = point.toLowerCase();
    return count + (ML_KEYWORDS.some((keyword) => lower.includes(keyword)) ? 1 : 0);
  }, 0);
  const aiDensity = (experience.points?.length ?? 1) ? aiMentions / (experience.points?.length ?? 1) : 0;
  const aiScore = Math.round(Math.min(1, aiDensity * 1.4) * 100);

  return {
    months,
    aiMentions,
    aiScore
  };
}
