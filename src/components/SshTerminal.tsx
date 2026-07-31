'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { resumeData } from '../data/resumeData';

type OutputLine = {
  text: string;
  className?: string;
};

const FILES = [
  'experience.log',
  'projects/',
  'research/',
  'skills.conf',
  'education.md',
  'achievements.txt',
  'contact.json'
];

const COMMANDS = ['help', 'ls', 'cat', 'ask', 'whoami', 'clear', 'sudo', 'gui', 'exit'];

function renderFile(name: string): OutputLine[] {
  const s = resumeData.sections;
  switch (name.replace(/\/$/, '')) {
    case 'experience.log':
      return s.experience.flatMap((job) => [
        { text: `[${job.period}] ${job.title} @ ${job.company} (${job.location})`, className: 'text-emerald-300' },
        ...job.points.map((p) => ({ text: `  ▸ ${p}`, className: 'text-white/70' })),
        { text: '' }
      ]);
    case 'projects':
      return s.projects.flatMap((p) => [
        { text: `${p.title}  [${p.technologies?.join(', ')}]`, className: 'text-[#38bdf8]' },
        ...p.points.map((pt) => ({ text: `  ▸ ${pt}`, className: 'text-white/70' })),
        { text: '' }
      ]);
    case 'research':
      return s.research.flatMap((r) => [
        { text: `(${r.year}) ${r.title}`, className: 'text-[#7dd3fc]' },
        { text: `  ${r.authors.join(', ')} — ${r.venue}`, className: 'text-white/50' },
        { text: `  ${r.link}`, className: 'text-white/40' },
        { text: '' }
      ]);
    case 'skills.conf':
      return [
        { text: `[languages]      ${s.skills.languages.join(' ')}`, className: 'text-white/80' },
        { text: `[ml_and_ai]      ${s.skills.mlAi.join(' ')}`, className: 'text-white/80' },
        { text: `[cloud_tools]    ${s.skills.cloudTools.join(' · ')}`, className: 'text-white/80' },
        { text: `[coursework]     ${s.skills.coursework.join(' · ')}`, className: 'text-white/60' }
      ];
    case 'education.md':
      return s.education.flatMap((e) => [
        { text: `# ${e.university} (${e.period})`, className: 'text-emerald-300' },
        { text: `  ${e.degree} · ${e.gpa}`, className: 'text-white/70' },
        { text: '' }
      ]);
    case 'achievements.txt':
      return s.achievements.map((a) => ({ text: `★ ${a.title} — ${a.description}`, className: 'text-white/80' }));
    case 'contact.json':
      return JSON.stringify(resumeData.contact, null, 2)
        .split('\n')
        .map((line) => ({ text: line, className: 'text-[#38bdf8]' }));
    default:
      return [{ text: `cat: ${name}: No such file or directory`, className: 'text-red-400' }];
  }
}

const BANNER: OutputLine[] = [
  { text: 'Connected to aryan@portfolio (ssh-rag v1.0)', className: 'text-emerald-300' },
  { text: `Last login: ${new Date().toUTCString()}`, className: 'text-white/50' },
  { text: '' },
  { text: `${resumeData.name} — ${resumeData.title}`, className: 'text-white' },
  { text: 'This is the command-line version of the portfolio.', className: 'text-white/60' },
  { text: "Type 'help' to get started, or ask the RAG agent directly: ask what does aryan do", className: 'text-white/60' },
  { text: '' }
];

export default function SshTerminal() {
  const [lines, setLines] = useState<OutputLine[]>(BANNER);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      let sid = window.localStorage.getItem('portfolio-session-id');
      if (!sid) {
        sid = crypto.randomUUID();
        window.localStorage.setItem('portfolio-session-id', sid);
      }
      sessionIdRef.current = sid;
    } catch {
      sessionIdRef.current = null;
    }
  }, []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const print = useCallback((newLines: OutputLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const runAsk = useCallback(
    async (question: string) => {
      if (!question) {
        print([{ text: 'usage: ask <question>   e.g. ask what did aryan build at cisco', className: 'text-white/50' }]);
        return;
      }
      setBusy(true);
      print([{ text: 'querying RAG agent…', className: 'text-white/40' }]);
      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: question, stream: true, sessionId: sessionIdRef.current ?? undefined })
        });
        if (!response.ok || !response.body) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? 'agent unavailable');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          // live-update the last block
          setLines((prev) => {
            const upToQuery = prev.slice(
              0,
              prev.findLastIndex((l) => l.text === 'querying RAG agent…') + 1
            );
            return [
              ...upToQuery,
              ...answer.split('\n').map((text) => ({ text, className: 'text-emerald-200' }))
            ];
          });
        }
        print([{ text: '' }]);
      } catch (err) {
        print([{ text: `error: ${err instanceof Error ? err.message : 'agent failed'}`, className: 'text-red-400' }]);
      } finally {
        setBusy(false);
      }
    },
    [print]
  );

  const execute = useCallback(
    (raw: string) => {
      const cmdLine = raw.trim();
      print([{ text: `aryan@portfolio:~$ ${cmdLine}`, className: 'text-white' }]);
      if (!cmdLine) return;

      const [cmd, ...args] = cmdLine.split(/\s+/);
      const arg = args.join(' ');

      switch (cmd) {
        case 'help':
          print([
            { text: 'Available commands:', className: 'text-white/80' },
            { text: '  ls                 list files', className: 'text-white/60' },
            { text: '  cat <file>         print a file (try: cat experience.log)', className: 'text-white/60' },
            { text: '  ask <question>     query the RAG agent about Aryan', className: 'text-white/60' },
            { text: '  whoami             who is this guy', className: 'text-white/60' },
            { text: '  clear              clear the screen', className: 'text-white/60' },
            { text: '  gui                back to the graphical portfolio', className: 'text-white/60' },
            { text: '  curl /api/resume   machine-readable resume (in a real shell)', className: 'text-white/40' }
          ]);
          break;
        case 'ls':
          print([{ text: FILES.join('   '), className: 'text-[#38bdf8]' }]);
          break;
        case 'cat':
          if (!arg) {
            print([{ text: 'usage: cat <file>', className: 'text-white/50' }]);
          } else {
            print(renderFile(arg));
          }
          break;
        case 'ask':
        case './ask':
          void runAsk(arg.replace(/^"|"$/g, ''));
          break;
        case 'whoami':
          print([
            { text: `${resumeData.name} — ${resumeData.title}`, className: 'text-emerald-300' },
            { text: resumeData.sections.summary[0], className: 'text-white/70' }
          ]);
          break;
        case 'clear':
          setLines([]);
          break;
        case 'sudo':
          print([
            { text: '[sudo] password for visitor: ********', className: 'text-white/60' },
            { text: 'ACCESS GRANTED 🔓  hire_sequence initiated.', className: 'text-emerald-300' },
            { text: `→ ${resumeData.contact.email}`, className: 'text-[#38bdf8]' }
          ]);
          break;
        case 'gui':
        case 'exit':
          window.location.href = '/';
          break;
        default:
          print([{ text: `${cmd}: command not found (try 'help')`, className: 'text-red-400' }]);
      }
    },
    [print, runAsk]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !busy) {
      const value = input;
      setInput('');
      setHistory((prev) => (value.trim() ? [...prev, value] : prev));
      setHistoryIndex(-1);
      execute(value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = prev === -1 ? history.length - 1 : Math.max(0, prev - 1);
        setInput(history[next] ?? '');
        return next;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex((prev) => {
        const next = prev === -1 ? -1 : Math.min(history.length - 1, prev + 1);
        setInput(next === -1 ? '' : (history[next] ?? ''));
        return next;
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const last = parts[parts.length - 1];
      const pool = parts.length > 1 ? FILES : COMMANDS;
      const match = pool.find((c) => c.startsWith(last));
      if (match) {
        parts[parts.length - 1] = match;
        setInput(parts.join(' ') + (parts.length === 1 ? ' ' : ''));
      }
    }
  };

  return (
    <div
      className="flex h-dvh flex-col bg-[#030712] p-4 font-mono text-[13px] leading-relaxed md:p-6"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto whitespace-pre-wrap break-words">
        {lines.map((line, i) => (
          <p key={i} className={line.className ?? 'text-white/80'}>
            {line.text || ' '}
          </p>
        ))}
        <div className="flex items-center">
          <span className="text-emerald-400">aryan@portfolio</span>
          <span className="text-white/40">:~$&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-white caret-emerald-400 outline-none"
            aria-label="Terminal input"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
