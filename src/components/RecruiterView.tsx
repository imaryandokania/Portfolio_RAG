'use client';

import { resumeData } from '../data/resumeData';

export default function RecruiterView({ onExit }: { onExit: () => void }) {
  const { contact, sections } = resumeData;

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Controls — hidden when printing */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur print:hidden">
        <p className="font-mono text-xs text-neutral-500">
          recruiter mode · zero effects · optimized for reading &amp; printing
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Print / Save PDF
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            ← Back to full site
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        {/* Header */}
        <header className="border-b border-neutral-200 pb-5">
          <h1 className="text-3xl font-bold tracking-tight">{resumeData.name}</h1>
          <p className="mt-1 text-lg text-neutral-600">{resumeData.title}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {contact.location} · <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a> ·{' '}
            <a className="underline" href={`https://${contact.linkedin}`}>LinkedIn</a> ·{' '}
            <a className="underline" href={`https://${contact.github}`}>GitHub</a> ·{' '}
            <a className="underline" href={`https://${contact.scholar}`}>Scholar</a>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">{sections.summary[0]}</p>
        </header>

        {/* Experience */}
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Experience</h2>
          <div className="mt-3 space-y-4">
            {sections.experience.map((job) => (
              <div key={`${job.company}-${job.period}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="font-semibold">
                    {job.title} · <span className="font-normal">{job.company}</span>
                  </p>
                  <p className="text-xs text-neutral-500">{job.period} · {job.location}</p>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-neutral-700">
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Research */}
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Publications</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700">
            {sections.research.map((paper) => (
              <li key={paper.title}>
                <a className="font-medium underline" href={paper.link}>{paper.title}</a>{' '}
                — {paper.authors.join(', ')} · <span className="italic">{paper.venue}</span>, {paper.year}
              </li>
            ))}
          </ul>
        </section>

        {/* Projects */}
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Projects</h2>
          <div className="mt-3 space-y-3">
            {sections.projects.map((project) => (
              <div key={project.title}>
                <p className="text-sm font-semibold">
                  {project.title}{' '}
                  <span className="font-normal text-neutral-500">
                    ({project.technologies?.join(', ')})
                  </span>
                </p>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-neutral-700">
                  {project.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education + Skills */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Education</h2>
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              {sections.education.map((school) => (
                <div key={school.university}>
                  <p className="font-semibold">{school.university}</p>
                  <p>{school.degree}</p>
                  <p className="text-xs text-neutral-500">{school.period} · {school.gpa}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Skills</h2>
            <div className="mt-3 space-y-1.5 text-sm text-neutral-700">
              <p><span className="font-semibold">Languages:</span> {sections.skills.languages.join(', ')}</p>
              <p><span className="font-semibold">ML &amp; AI:</span> {sections.skills.mlAi.join(', ')}</p>
              <p><span className="font-semibold">Cloud &amp; Tools:</span> {sections.skills.cloudTools.join(', ')}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
