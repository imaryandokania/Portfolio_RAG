import { resumeData } from "../data/resumeData";

export type ResumeDocument = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  content?: string;
  points?: string[];
  link?: string;
};

export function buildResumeDocuments(): ResumeDocument[] {
  const docs: ResumeDocument[] = [];
  const { sections } = resumeData;

  if (sections.summary) {
    sections.summary.forEach((line, index) => {
      docs.push({
        id: `summary-${index}`,
        section: "summary",
        title: "Professional Summary",
        content: line,
      });
    });
  }

  sections.education?.forEach((item, index) => {
    docs.push({
      id: `education-${index}`,
      section: "education",
      title: item.university,
      subtitle: `${item.location} | ${item.period}`,
      content: `${item.degree}${item.gpa ? ` | ${item.gpa}` : ""}`,
    });
  });

  sections.experience?.forEach((item, index) => {
    docs.push({
      id: `experience-${index}`,
      section: "experience",
      title: `${item.company} — ${item.title}`,
      subtitle: `${item.location} | ${item.period}`,
      content: item.status,
      points: item.points,
    });
  });

  sections.projects?.forEach((item, index) => {
    docs.push({
      id: `projects-${index}`,
      section: "projects",
      title: item.title,
      subtitle: item.technologies?.join(", "),
      content: item.link,
      points: item.points,
    });
  });

  if (sections.skills) {
    const { languages, mlAi, cloudTools, certifications, coursework } =
      sections.skills;

    docs.push({
      id: "skills-languages",
      section: "skills",
      title: "Programming Languages",
      points: languages,
    });

    docs.push({
      id: "skills-ml",
      section: "skills",
      title: "ML & AI",
      points: mlAi,
    });

    docs.push({
      id: "skills-cloud",
      section: "skills",
      title: "Cloud & Tools",
      points: cloudTools,
    });

    docs.push({
      id: "skills-coursework",
      section: "skills",
      title: "Coursework",
      points: coursework,
    });

    if (certifications) {
      docs.push({
        id: "skills-certifications",
        section: "skills",
        title: "Certifications",
        points: certifications.map((cert) =>
          cert.link ? `${cert.name} (${cert.link})` : cert.name
        ),
      });
    }
  }

  sections.achievements?.forEach((item, index) => {
    docs.push({
      id: `achievements-${index}`,
      section: "achievements",
      title: item.title,
      content: item.description,
      points: item.links,
    });
  });

  sections.research?.forEach((paper, index) => {
    docs.push({
      id: `research-${index}`,
      section: "research",
      title: paper.title,
      subtitle: `${paper.venue} · ${paper.year}`,
      content: paper.link,
      points: paper.authors,
    });
  });

  return docs;
}

export function buildResumeContext(doc: ResumeDocument): string {
  const aggregateText = [
    `section ${doc.section}`,
    doc.title,
    doc.subtitle,
    doc.content,
    doc.points?.join(" "),
  ]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  return aggregateText;
}
