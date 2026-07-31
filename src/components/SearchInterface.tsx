'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resumeData } from '../data/resumeData';
import { computeExperienceMetrics } from '../utils/resumeMetrics';
import dynamic from 'next/dynamic';
import SkillClusterBars from './SkillClusterBars';
import VoiceOrb from './VoiceOrb';
import TerminalBoot from './TerminalBoot';
import ResumeSections from './ResumeSections';
import MatrixRain from './MatrixRain';
import GithubHeatmap from './GithubHeatmap';

const CyberBackground = dynamic(() => import('./CyberBackground'), { ssr: false });
const CareerGraph = dynamic(() => import('./CareerGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] items-center justify-center rounded-3xl border border-white/10 bg-black/60 font-mono text-xs text-white/40 md:h-[440px]">
      loading career graph…
    </div>
  )
});
import RecruiterView from './RecruiterView';
import GuidedTour from './GuidedTour';

const SLASH_COMMANDS = [
  { cmd: '/tour', desc: 'AI-guided walkthrough' },
  { cmd: '/experience', desc: 'ask about work experience' },
  { cmd: '/projects', desc: 'ask about projects' },
  { cmd: '/research', desc: 'ask about publications' },
  { cmd: '/skills', desc: 'ask about the tech stack' },
  { cmd: '/education', desc: 'ask about education' },
  { cmd: '/achievements', desc: 'ask about awards' },
  { cmd: '/github', desc: 'live GitHub activity' },
  { cmd: '/ssh', desc: 'command-line version' },
  { cmd: '/recruiter', desc: 'clean printable resume' },
  { cmd: '/sudo', desc: 'hire_sequence.sh 🔓' },
  { cmd: '/clear', desc: 'reset the conversation' }
];

type MediumPost = {
  title: string;
  link: string;
  published: string;
};

type EnrichmentHint = 'skills' | 'impact';

export default function SearchInterface() {
  const MAX_QUERY_CHARS = 4000;
  const SILENCE_THRESHOLD = 0.02;
  const SILENCE_TIMEOUT_MS = 1500;
  const [searchQuery, setSearchQuery] = useState('');
  const { scrollYProgress } = useScroll();
  const PLACEHOLDERS = [
    'What do you want to know about me?',
    "What is Aryan working on at Microsoft?",
    'Tell me about the ICLR paper',
    'What did he build at Cisco?',
    'Paste a job description → instant fit check',
    "What's he pushing to GitHub lately?",
    'try: sudo hire aryan'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const visitCountedRef = useRef(false);
  const [crtOff, setCrtOff] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(false);
  const tickCtxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);
  const konamiRef = useRef<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [agentAnswer, setAgentAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  type ConversationTurn = { question: string; answer: string };
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  const [answerEnrichment, setAnswerEnrichment] = useState<EnrichmentHint[]>([]);
  const [missionClock, setMissionClock] = useState('--:--:--');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSessionStage, setVoiceSessionStage] = useState<'idle' | 'recording' | 'processing' | 'answer'>('idle');
  const [voiceSessionAnswer, setVoiceSessionAnswer] = useState('');
  const [isReplyAudioLoading, setIsReplyAudioLoading] = useState(false);
  const [replyAudioUrl, setReplyAudioUrl] = useState<string | null>(null);
  const [replyAudioError, setReplyAudioError] = useState<string | null>(null);
  const [speechContext, setSpeechContext] = useState<'answer' | 'greeting' | null>(null);
  const [voiceGreetingActive, setVoiceGreetingActive] = useState(false);
  const [voiceGreetingPlayed, setVoiceGreetingPlayed] = useState(false);
  const [voiceAnswerShortened, setVoiceAnswerShortened] = useState(false);
  const [mediumPosts, setMediumPosts] = useState<MediumPost[]>([]);
  const [isMediumLoading, setIsMediumLoading] = useState(true);
  const [mediumError, setMediumError] = useState<string | null>(null);
  const MAX_SPOKEN_CHARS = 600;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserBufferRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const replyAudioRef = useRef<HTMLAudioElement | null>(null);
  const queryInputRef = useRef<HTMLInputElement | null>(null);
  const replyAudioUrlRef = useRef<string | null>(null);
  const hasDetectedSpeechRef = useRef(false);
  const pendingRecorderStartRef = useRef<(() => void) | null>(null);
  const discardRecordingRef = useRef(false);

  const contactEntries = useMemo(
    () => [
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

  const playTick = useCallback(() => {
    if (!soundOnRef.current) return;
    const now = performance.now();
    if (now - lastTickRef.current < 45) return; // throttle
    lastTickRef.current = now;
    try {
      if (!tickCtxRef.current) {
        tickCtxRef.current = new AudioContext();
      }
      const ctx = tickCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1400 + Math.random() * 900;
      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // audio unavailable — ignore
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      soundOnRef.current = !prev;
      return !prev;
    });
  }, []);

  useEffect(() => {
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    const handler = (e: KeyboardEvent) => {
      konamiRef.current = [...konamiRef.current, e.key].slice(-KONAMI.length);
      if (KONAMI.every((k, i) => konamiRef.current[i] === k)) {
        konamiRef.current = [];
        setCrtOff(true);
        window.setTimeout(() => window.location.reload(), 1100);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (visitCountedRef.current) {
      return;
    }
    visitCountedRef.current = true;
    fetch('/api/visits', { method: 'POST' })
      .then((res) => res.json())
      .then((data: { enabled?: boolean; count?: number | null }) => {
        if (data?.enabled && typeof data.count === 'number') {
          setVisitorCount(data.count);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== '/') {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      queryInputRef.current?.focus();
      queryInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
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

  const stopVoicePlayback = useCallback(() => {
    const audio = replyAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (replyAudioUrlRef.current) {
      URL.revokeObjectURL(replyAudioUrlRef.current);
      replyAudioUrlRef.current = null;
    }
    setReplyAudioUrl(null);
    setSpeechContext(null);
  }, []);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => null);
      audioContextRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    analyserBufferRef.current = null;
    setVoiceLevel(0);
  }, []);

  const limitSpeechText = useCallback(
    (text: string): { value: string; shortened: boolean } => {
      if (text.length <= MAX_SPOKEN_CHARS) {
        return { value: text, shortened: false };
      }

      const clipped = text.slice(0, MAX_SPOKEN_CHARS);
      const lastSentence =
        Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('! '), clipped.lastIndexOf('? ')) + 1;
      const safeLength = lastSentence > MAX_SPOKEN_CHARS * 0.6 ? lastSentence : clipped.length;
      const trimmed = clipped.slice(0, safeLength).trim();

      return { value: `${trimmed}${trimmed.endsWith('…') ? '' : ' …'}`, shortened: true };
    },
    [MAX_SPOKEN_CHARS]
  );

  const speakText = useCallback(
    async (text: string, context: 'answer' | 'greeting') => {
      const trimmed = text.trim();
      if (!trimmed) {
        stopVoicePlayback();
        setReplyAudioError(null);
        if (context === 'greeting') {
          setVoiceGreetingActive(false);
        }
        return;
      }

      try {
        if (context === 'answer') {
          setReplyAudioError(null);
          setIsReplyAudioLoading(true);
        }
        if (context === 'greeting') {
          setVoiceGreetingActive(true);
        }
        stopVoicePlayback();

        const { value, shortened } = limitSpeechText(trimmed);
        if (context === 'answer') {
          setVoiceAnswerShortened(shortened);
        } else if (context === 'greeting') {
          setVoiceAnswerShortened(false);
        }

        const response = await fetch('/api/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: value })
        });

        if (!response.ok) {
          const message = await response.text().catch(() => '');
          throw new Error(message || 'Unable to synthesize speech.');
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        replyAudioUrlRef.current = url;
        setReplyAudioUrl(url);
        setSpeechContext(context);
      } catch (err) {
        stopVoicePlayback();
        if (context === 'answer') {
          setReplyAudioError(err instanceof Error ? err.message : 'Unable to speak the answer.');
        } else {
          console.error('Voice greeting failed', err);
          setVoiceGreetingActive(false);
        }
      } finally {
        if (context === 'answer') {
          setIsReplyAudioLoading(false);
        }
      }
    },
    [limitSpeechText, stopVoicePlayback]
  );

  const stopVoiceCapture = useCallback(
    (closeOverlay = false) => {
      discardRecordingRef.current = closeOverlay;
      isRecordingRef.current = false;
      silenceStartRef.current = null;
      hasDetectedSpeechRef.current = false;
      setVoiceGreetingActive(false);
      pendingRecorderStartRef.current = null;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        cleanupAudio();
        setIsRecording(false);
      }

      if (closeOverlay) {
        setVoiceSessionStage('idle');
        setVoiceSessionAnswer('');
        setVoiceError(null);
        setReplyAudioError(null);
        setVoiceAnswerShortened(false);
        stopVoicePlayback();
      }
    },
    [cleanupAudio, stopVoicePlayback]
  );

  const monitorVoiceLevel = useCallback(() => {
    if (!analyserRef.current || !analyserBufferRef.current) {
      return;
    }

    analyserRef.current.getByteTimeDomainData(
      analyserBufferRef.current as Uint8Array<ArrayBuffer>
    );
    const data = analyserBufferRef.current;
    let sumSquares = 0;
    for (let i = 0; i < data.length; i += 1) {
      const deviation = data[i] - 128;
      sumSquares += deviation * deviation;
    }
    const rms = Math.sqrt(sumSquares / data.length) / 128;
    const smoothedLevel = Math.min(1, rms);
    setVoiceLevel((prev) => prev * 0.6 + smoothedLevel * 0.4);

    if (isRecordingRef.current) {
      if (smoothedLevel > SILENCE_THRESHOLD * 1.5) {
        hasDetectedSpeechRef.current = true;
      }

      if (smoothedLevel < SILENCE_THRESHOLD) {
        if (hasDetectedSpeechRef.current) {
          if (silenceStartRef.current == null) {
            silenceStartRef.current = performance.now();
          } else if (performance.now() - silenceStartRef.current >= SILENCE_TIMEOUT_MS) {
            stopVoiceCapture();
            silenceStartRef.current = null;
            hasDetectedSpeechRef.current = false;
          }
        }
      } else {
        silenceStartRef.current = null;
      }
    } else {
      silenceStartRef.current = null;
    }

    animationFrameRef.current = window.requestAnimationFrame(monitorVoiceLevel);
  }, [SILENCE_THRESHOLD, SILENCE_TIMEOUT_MS, stopVoiceCapture]);

  const queryAgent = useCallback(
    async (
      query: string,
      options?: { viaVoice?: boolean; contextTurns?: ConversationTurn[] | undefined }
    ) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        if (!options?.viaVoice) {
          stopVoicePlayback();
          setVoiceSessionStage('idle');
          setVoiceSessionAnswer('');
        }
        setIsSearching(false);
        setAgentAnswer('');
        setLastQuery('');
        setError(null);
        setAnswerEnrichment([]);
        return;
      }

      if (!options?.viaVoice) {
        stopVoicePlayback();
        setVoiceSessionStage('idle');
        setVoiceSessionAnswer('');
      } else {
        setAgentAnswer('');
      }

      const payloadTurns = options?.contextTurns?.slice(-3) ?? [];

      setReplyAudioError(null);
      setIsSearching(true);
      setActiveSection('');
      if (!options?.viaVoice) {
        setAgentAnswer('');
      }
      setError(null);
      setAnswerEnrichment([]);
      if (!options?.viaVoice) {
        setLastQuery(normalizedQuery);
      }

      try {
        if (normalizedQuery.length > MAX_QUERY_CHARS) {
          throw new Error(`Query is too long. Please stay under ${MAX_QUERY_CHARS} characters.`);
        }

        const useStreaming = !options?.viaVoice;

        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: normalizedQuery,
            contextTurns: payloadTurns.length ? payloadTurns : undefined,
            stream: useStreaming
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? 'Failed to query the AI agent.');
        }

        let answerText = '';

        const contentType = response.headers.get('Content-Type') ?? '';
        if (useStreaming && contentType.includes('text/plain') && response.body) {
          // terminal-style token streaming
          const enrichmentHeader = response.headers.get('x-enrichment');
          try {
            setAnswerEnrichment(enrichmentHeader ? (JSON.parse(enrichmentHeader) as EnrichmentHint[]) : []);
          } catch {
            setAnswerEnrichment([]);
          }
          setLastQuery(normalizedQuery);
          setIsSearching(false);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            answerText += decoder.decode(value, { stream: true });
            playTick();
            setAgentAnswer(answerText + ' ▊');
          }
          answerText = answerText.trim();
          setAgentAnswer(answerText);
        } else {
          const payload = (await response.json()) as {
            answer?: string;
            enrichment?: EnrichmentHint[];
          };

          answerText = payload.answer ?? '';
          setAnswerEnrichment(payload.enrichment ?? []);
        }

        if (options?.viaVoice) {
          setVoiceSessionAnswer(answerText);
          setAgentAnswer('');
          setVoiceGreetingActive(false);
          if (answerText) {
            setVoiceSessionStage('answer');
            void speakText(answerText, 'answer');
          } else {
            setVoiceSessionStage('idle');
          }
        } else {
          setAgentAnswer(answerText);
          setVoiceSessionAnswer('');
          stopVoicePlayback();
        }

        if (answerText) {
          setConversationTurns((prev) => {
            const next = [...prev, { question: normalizedQuery, answer: answerText }];
            return next.slice(-3);
          });
        }
      } catch (err) {
        console.error('Agent query failed', err);
        setAgentAnswer('');
        setError(err instanceof Error ? err.message : 'Unable to query the AI agent.');
        setAnswerEnrichment([]);
        if (options?.viaVoice) {
          setVoiceSessionStage('idle');
          setVoiceSessionAnswer('');
          setVoiceGreetingActive(false);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [speakText, stopVoicePlayback, playTick]
  );

  const handleTranscription = useCallback(
    async (audioBlob: Blob) => {
      if (!audioBlob.size) {
        setIsVoiceProcessing(false);
        setVoiceSessionStage('idle');
        setVoiceGreetingActive(false);
        return;
      }

      try {
        setIsVoiceProcessing(true);
        setVoiceGreetingActive(false);
        setVoiceSessionStage('processing');
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speech.webm');

        const response = await fetch('/api/voice', {
          method: 'POST',
          body: formData
        });

        const payload = (await response.json().catch(() => null)) as
          | { transcript?: string; error?: string }
          | null;

        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? 'Unable to transcribe audio.');
        }

        const transcript = payload.transcript?.trim();
        if (!transcript) {
          throw new Error('I could not understand that. Please try again.');
        }

        setVoiceError(null);
        await queryAgent(transcript, { viaVoice: true });
      } catch (err) {
        console.error('Voice transcription failed', err);
        setVoiceError(err instanceof Error ? err.message : 'Voice assistant unavailable.');
        setVoiceSessionStage('idle');
        setVoiceSessionAnswer('');
        setVoiceGreetingActive(false);
      } finally {
        setIsVoiceProcessing(false);
      }
    },
    [queryAgent]
  );

  const startVoiceCapture = useCallback(async () => {
    if (isRecording || isVoiceProcessing) {
      return;
    }

    try {
      setVoiceError(null);
      stopVoicePlayback();
      setVoiceSessionAnswer('');
      setVoiceSessionStage('recording');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        isRecordingRef.current = false;
        silenceStartRef.current = null;
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        cleanupAudio();

        if (discardRecordingRef.current || pendingRecorderStartRef.current) {
          discardRecordingRef.current = false;
          pendingRecorderStartRef.current = null;
          setVoiceSessionStage('idle');
          setVoiceSessionAnswer('');
          setVoiceGreetingActive(false);
          setIsVoiceProcessing(false);
          return;
        }

        void handleTranscription(audioBlob);
      };

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      analyserBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      const beginRecording = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'inactive') {
          return;
        }
        discardRecordingRef.current = false;
        recorder.start();
        setIsRecording(true);
        isRecordingRef.current = true;
        silenceStartRef.current = null;
        hasDetectedSpeechRef.current = false;
        monitorVoiceLevel();
      };

      pendingRecorderStartRef.current = beginRecording;

      if (voiceGreetingPlayed) {
        beginRecording();
      } else {
        setVoiceGreetingActive(true);
        setVoiceGreetingPlayed(true);
        void speakText('Hi, I am Aryan. What do you want to know about me?', 'greeting');
      }
    } catch (err) {
      cleanupAudio();
      setIsRecording(false);
      isRecordingRef.current = false;
      silenceStartRef.current = null;
      setVoiceSessionStage('idle');
      setVoiceGreetingActive(false);
      setVoiceError(err instanceof Error ? err.message : 'Unable to start voice capture.');
    }
  }, [
    cleanupAudio,
    handleTranscription,
    isRecording,
    isVoiceProcessing,
    monitorVoiceLevel,
    voiceGreetingPlayed,
    speakText,
    stopVoicePlayback
  ]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      cleanupAudio();
    };
  }, [cleanupAudio]);

  useEffect(() => {
    const audio = replyAudioRef.current;
    if (!replyAudioUrl || !audio || !speechContext) {
      return;
    }
    if (speechContext === 'answer' && voiceSessionStage !== 'answer') {
      return;
    }

    const startPendingRecording = () => {
      pendingRecorderStartRef.current?.();
      pendingRecorderStartRef.current = null;
    };

    const handleEnded = () => {
      if (speechContext === 'answer') {
        if (!isRecordingRef.current && !isVoiceProcessing) {
          void startVoiceCapture();
        }
        setSpeechContext(null);
      } else if (speechContext === 'greeting') {
        setVoiceGreetingActive(false);
        setSpeechContext(null);
        startPendingRecording();
      }
    };

    const handleError = () => {
      if (speechContext === 'greeting') {
        setVoiceGreetingActive(false);
        startPendingRecording();
      }
      setSpeechContext(null);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    const play = async () => {
      audio.load();
      try {
        await audio.play();
      } catch (err) {
        console.warn('Unable to autoplay speech audio', err);
        handleError();
      }
    };

    void play();

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [
    replyAudioUrl,
    speechContext,
    voiceSessionStage,
    isVoiceProcessing,
    startVoiceCapture
  ]);

  useEffect(() => {
    return () => {
      stopVoicePlayback();
    };
  }, [stopVoicePlayback]);

  const formatMediumDate = useCallback((iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) {
      return 'Recently';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const aggregatedMetrics = useMemo(() => computeExperienceMetrics(), []);

  const impactHighlights = useMemo(() => {
    const aggregated = aggregatedMetrics;
    return [
      {
        label: 'Experience Depth',
        value: `${aggregated.experienceYears.toFixed(1)} yrs`,
        detail: `${aggregated.experienceMonths} months across ML platforms + infra`,
        accent: '#38bdf8'
      },
      {
        label: 'Delivery Velocity',
        value: `${aggregated.projectScore}/100`,
        detail: `${aggregated.projectPoints} quantified project bullet points`,
        accent: '#38bdf8'
      },
      {
        label: 'Research Signal',
        value: `${aggregated.researchCount}`,
        detail: 'peer-reviewed or publication-grade outputs',
        accent: '#34d399'
      }
    ];
  }, [aggregatedMetrics]);

  useEffect(() => {
    let cancelled = false;

    const fetchMediumPosts = async () => {
      try {
        setIsMediumLoading(true);
        setMediumError(null);
        const response = await fetch('/api/medium?limit=3', { cache: 'no-store' });
        const payload = (await response.json().catch(() => null)) as
          | { posts?: MediumPost[]; error?: string }
          | null;

        if (!response.ok || !payload) {
          throw new Error(payload?.error ?? 'Unable to load Medium posts.');
        }

        if (!cancelled) {
          setMediumPosts(payload.posts ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setMediumPosts([]);
          setMediumError(err instanceof Error ? err.message : 'Unable to load Medium posts.');
        }
      } finally {
        if (!cancelled) {
          setIsMediumLoading(false);
        }
      }
    };

    void fetchMediumPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSudoEgg = (query: string) => {
    setLastQuery(query || 'sudo hire aryan');
    setError(null);
    setAnswerEnrichment([]);
    setAgentAnswer(
      [
        '```',
        '[sudo] password for recruiter: ********',
        'ACCESS GRANTED 🔓',
        '',
        '> initiating hire_sequence.sh ...',
        '> compiling 4 publications ......... done',
        '> loading Microsoft · Cisco · Oracle experience ... done',
        '> deploying resume to your inbox ... ready',
        '```',
        '',
        `Nice try — you found the easter egg. Skip the queue: [email me](mailto:${resumeData.contact.email}) or ping me on [LinkedIn](https://${resumeData.contact.linkedin}).`
      ].join('\n')
    );
  };

  const slashMatches = searchQuery.startsWith('/')
    ? SLASH_COMMANDS.filter((c) => c.cmd.startsWith(searchQuery.trim().toLowerCase()))
    : [];

  const executeSlash = (cmd: string) => {
    setSearchQuery('');
    setSlashIndex(0);
    switch (cmd) {
      case '/tour':
        setTourActive(true);
        break;
      case '/ssh':
        window.location.href = '/ssh';
        break;
      case '/recruiter':
        setRecruiterMode(true);
        break;
      case '/sudo':
        runSudoEgg('sudo hire aryan');
        break;
      case '/clear':
        setConversationTurns([]);
        setAgentAnswer('');
        setLastQuery('');
        setError(null);
        setAnswerEnrichment([]);
        break;
      case '/github':
        void queryAgent('What has Aryan been pushing to GitHub lately?', { viaVoice: false });
        break;
      default:
        handleSectionSelect(cmd.slice(1));
    }
  };

  const handleConsoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!slashMatches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSlashIndex((i) => (i + 1) % slashMatches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSlashIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setSearchQuery(slashMatches[Math.min(slashIndex, slashMatches.length - 1)].cmd);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSlash(slashMatches[Math.min(slashIndex, slashMatches.length - 1)].cmd);
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setVoiceSessionStage('idle');
    setVoiceSessionAnswer('');
    stopVoicePlayback();

    const normalized = searchQuery.trim().toLowerCase();
    if (normalized.startsWith('/')) {
      const match = SLASH_COMMANDS.find((c) => c.cmd === normalized) ?? slashMatches[0];
      if (match) {
        executeSlash(match.cmd);
      }
      return;
    }
    if (normalized === 'ssh' || normalized === 'ssh aryan@portfolio') {
      window.location.href = '/ssh';
      return;
    }
    if (normalized === 'tour' || normalized === 'take the tour' || normalized === './tour.sh') {
      setSearchQuery('');
      setTourActive(true);
      return;
    }
    if (normalized.startsWith('sudo')) {
      runSudoEgg(searchQuery.trim());
      return;
    }

    const turns = conversationTurns.length ? conversationTurns : undefined;
    void queryAgent(searchQuery, { viaVoice: false, contextTurns: turns });
  };

  const handleResetConversation = useCallback(() => {
    setConversationTurns([]);
  }, []);

  const handleSectionSelect = (section: string) => {
    const prompt = `Summarize about your ${section} `;
    setActiveSection(section);
    setSearchQuery(prompt);
    setVoiceSessionStage('idle');
    setVoiceSessionAnswer('');
    stopVoicePlayback();
    const turns = conversationTurns.length ? conversationTurns : undefined;
    void queryAgent(prompt, { viaVoice: false, contextTurns: turns });
  };

  if (recruiterMode) {
    return <RecruiterView onExit={() => setRecruiterMode(false)} />;
  }

  return (
    <div className={`relative ${crtOff ? 'crt-off' : ''}`}>
      <audio ref={replyAudioRef} src={replyAudioUrl ?? undefined} className="hidden" aria-hidden="true" />
      <AnimatePresence>
        {voiceSessionStage !== 'idle' && (
          <motion.div
            key="voice-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#050b18]/90 p-8 text-center text-white shadow-[0_0_45px_rgba(56,189,248,0.25)] max-w-lg mx-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <VoiceOrb intensity={voiceLevel} />
              {(voiceSessionStage === 'recording' || voiceSessionStage === 'processing') && (
                <div className="text-center space-y-2">
                  <div>
                    <p className="text-lg font-semibold tracking-wide">
                      {voiceSessionStage === 'recording' ? 'Listening…' : 'Analyzing…'}
                    </p>
                    <p className="text-sm text-white/70">
                      {voiceSessionStage === 'recording'
                        ? 'Speak your question. Tap stop when you are done.'
                        : 'Transcribing and preparing your answer.'}
                    </p>
                  </div>
                  {voiceSessionStage === 'recording' && voiceGreetingActive && (
                    <p className="text-sm text-[#38bdf8] font-medium">
                      Hi, I’m Aryan. What do you want to know about me?
                    </p>
                  )}
                </div>
              )}
              {voiceSessionStage === 'answer' && (
                <div className="space-y-3 text-left w-full">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">Answer</p>
                  <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/90">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        strong: (props) => (
                          <span className="text-white font-semibold" {...props} />
                        ),
                        em: (props) => (
                          <span className="italic text-white/80" {...props} />
                        ),
                        p: (props) => (
                          <p className="mb-3 last:mb-0" {...props} />
                        ),
                        ul: (props) => (
                          <ul className="list-disc pl-5 space-y-2" {...props} />
                        ),
                        ol: (props) => (
                          <ol className="list-decimal pl-5 space-y-2" {...props} />
                        ),
                        li: (props) => <li className="pl-1" {...props} />
                      }}
                    >
                      {voiceSessionAnswer || agentAnswer}
                    </ReactMarkdown>
                  </div>
                  {(isReplyAudioLoading || replyAudioUrl) && (
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      {isReplyAudioLoading ? 'Preparing voice reply…' : 'Speaking… tap “Talk again” to interrupt'}
                    </p>
                  )}
                  {voiceAnswerShortened && (
                    <p className="text-xs text-white/60">
                      Voice reply shortened to keep the spoken response concise.
                    </p>
                  )}
                  {replyAudioError && (
                    <p className="text-xs text-[#f87171]">Voice reply unavailable. Tap “Talk again” to retry.</p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-3 justify-center">
                {voiceSessionStage === 'recording' && (
                  <button
                    type="button"
                    onClick={() => stopVoiceCapture(true)}
                    className="rounded-full border border-[#f87171]/50 bg-[#7f1d1d]/40 px-6 py-2 text-sm font-semibold text-white transition hover:border-[#f87171] hover:bg-[#7f1d1d]/70"
                  >
                    Stop recording
                  </button>
                )}
                {voiceSessionStage === 'answer' && !isVoiceProcessing && !isRecording && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyAudioError(null);
                      void startVoiceCapture();
                    }}
                    className="rounded-full border border-[#38bdf8]/60 bg-[#0f172a] px-6 py-2 text-sm font-semibold text-white transition hover:border-[#38bdf8] hover:bg-[#1e293b]"
                  >
                    Talk again
                  </button>
                )}
                {voiceSessionStage !== 'recording' && (
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceSessionStage('idle');
                      setVoiceSessionAnswer('');
                      setVoiceError(null);
                      setReplyAudioError(null);
                      setVoiceAnswerShortened(false);
                      setVoiceGreetingActive(false);
                      stopVoicePlayback();
                    }}
                    className="rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/70"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-emerald-400 via-[#38bdf8] to-emerald-400"
        style={{ scaleX: scrollYProgress }}
      />
      <CyberBackground />
      <MatrixRain />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(52,211,153,0.15),_transparent_60%)]" />
      </div>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 relative z-10">
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18),_transparent_55%)] mix-blend-screen" />
            <div className="relative flex items-center gap-2 border-b border-white/10 bg-black/50 px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <p className="ml-3 font-mono text-xs text-white/50">
                <span className="text-emerald-400">aryan@portfolio</span>
                <span className="text-white/40">:~$ </span>
                <span className="text-white/80">./init_portfolio --mode=rag</span>
              </p>
              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTourActive(true)}
                  className="rounded border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 transition hover:border-[#38bdf8]/60 hover:text-[#38bdf8]"
                  title="AI-guided walkthrough"
                >
                  ./tour.sh
                </button>
                <button
                  type="button"
                  onClick={() => setRecruiterMode(true)}
                  className="rounded border border-white/15 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 transition hover:border-emerald-400/60 hover:text-emerald-300"
                  title="Clean, printable resume view"
                >
                  --recruiter
                </button>
              </div>
            </div>
            <div className="relative grid gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
              <div className="space-y-5">
                <motion.h1
                  className="glitch text-4xl font-bold tracking-tight text-white leading-tight cyberpunk-glow md:text-6xl"
                  data-text={resumeData.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {resumeData.name}
                </motion.h1>
                <motion.p
                  className="text-lg text-[#38bdf8] md:text-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {resumeData.title}
                  {heroEducation && <span className="text-white/50"> · {heroEducation}</span>}
                </motion.p>
                {resumeData.sections.summary && (
                  <motion.p
                    className="text-base leading-relaxed text-white/70"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    {resumeData.sections.summary[0]}
                  </motion.p>
                )}
                <motion.div
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {contactEntries.map(({ label, value, href, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white/70 transition hover:border-[#38bdf8]/60 hover:text-white"
                    >
                      {icon && <span>{icon}</span>}
                      <span>{value}</span>
                    </a>
                  ))}
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <TerminalBoot />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <CareerGraph />
          </motion.div>

          {/* Query Console */}
          <motion.div
            className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_55px_rgba(52,211,153,0.08)]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <p className="ml-3 font-mono text-xs text-white/50">
                <span className="text-emerald-400">aryan@portfolio</span>
                <span className="text-white/40">:~$ </span>
                <span className="text-white/80">./ask_me_anything.sh</span>
              </p>
              <span className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                live
              </span>
            </div>
            <div className="p-5 md:p-6">
              <form onSubmit={handleSearch}>
                <div className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-black/70 px-4 transition focus-within:border-[#34d399]/60 focus-within:shadow-[0_0_25px_rgba(52,211,153,0.15)]">
                  <span className="hidden select-none whitespace-nowrap font-mono text-sm text-emerald-400 sm:block">
                    &gt;
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    ref={queryInputRef}
                    onKeyDown={handleConsoleKeyDown}
                    className="h-14 flex-1 bg-transparent font-mono text-base text-white outline-none placeholder:text-white/35 md:text-lg"
                    placeholder={PLACEHOLDERS[placeholderIndex]}
                    aria-label="Ask Aryan's AI agent"
                  />
                  <button
                    type="button"
                    onClick={isRecording ? () => stopVoiceCapture(true) : startVoiceCapture}
                    disabled={isVoiceProcessing}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                      isRecording
                        ? 'bg-[#7f1d1d]/60 text-[#fca5a5]'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    } ${isVoiceProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                    aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
                  >
                    {isVoiceProcessing ? (
                      <svg className="h-4 w-4 animate-spin text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 3a9 9 0 1 1-9 9" strokeLinecap="round" />
                      </svg>
                    ) : isRecording ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="8" y="8" width="8" height="8" rx="2" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                        <path d="M19 11a7 7 0 0 1-14 0" />
                        <path d="M12 19v3" />
                      </svg>
                    )}
                  </button>
                  <AnimatePresence>
                    {isSearching && (
                      <motion.div
                        key="search-progress"
                        className="pointer-events-none absolute -bottom-px left-3 right-3 h-px overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#38bdf8] via-[#34d399] to-transparent"
                          animate={{ x: ['-50%', '110%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {slashMatches.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/90">
                    <p className="border-b border-white/5 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/30">
                      commands · ↑↓ navigate · ⏎ run · tab complete
                    </p>
                    {slashMatches.map((c, i) => (
                      <button
                        type="button"
                        key={c.cmd}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          executeSlash(c.cmd);
                        }}
                        onMouseEnter={() => setSlashIndex(i)}
                        className={`flex w-full items-baseline gap-3 px-4 py-2 text-left font-mono text-sm transition ${
                          i === slashIndex
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <span>{c.cmd}</span>
                        <span className="text-xs text-white/40">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
              <p className="mt-2.5 px-1 text-xs text-white/40">
                {voiceError ? (
                  <span className="text-[#f87171]" role="alert">{voiceError}</span>
                ) : isVoiceProcessing ? (
                  <span className="text-[#38bdf8]">Transcribing your voice…</span>
                ) : (
                  <>
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 font-mono text-[10px] text-emerald-300">⏎</kbd> to ask
                    {' · '}
                    <kbd className="rounded border border-white/15 bg-white/5 px-1 font-mono text-[10px] text-emerald-300">/</kbd> for commands
                    {' · mic to speak · paste a job description for a fit check'}
                  </>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.keys(resumeData.sections)
                  .filter((section) => section.toLowerCase() !== 'summary')
                  .map((section) => (
                    <button
                      key={section}
                      onClick={() => handleSectionSelect(section)}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                        activeSection === section
                          ? 'border-[#34d399]/70 bg-[#34d399]/10 text-emerald-300'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-[#34d399]/50 hover:text-emerald-300'
                      }`}
                    >
                      <span className="text-emerald-500">$</span> {section}
                    </button>
                  ))}
              </div>
            </div>
          </motion.div>

          {voiceSessionStage === 'idle' && !isSearching && agentAnswer && (
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/70 p-6 backdrop-blur-xl shadow-[0_0_45px_rgba(56,189,248,0.08)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48 }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_65%)]" />
              <div className="relative flex flex-col gap-4">
                <span className="rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#38bdf8] w-fit">
                  Hi, I am Aryan 👋
                </span>
                {lastQuery && (
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                    Your Question: “{lastQuery}”
                  </p>
                )}
                <div className="text-white/80 text-sm md:text-base leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      strong: (props) => (
                        <span className="text-white font-semibold" {...props} />
                      ),
                      em: (props) => (
                        <span className="italic text-white/80" {...props} />
                      ),
                      p: (props) => (
                        <p className="mb-3 last:mb-0" {...props} />
                      ),
                      ul: (props) => (
                        <ul className="list-disc pl-5 space-y-2" {...props} />
                      ),
                      ol: (props) => (
                        <ol className="list-decimal pl-5 space-y-2" {...props} />
                      ),
                      li: (props) => <li className="pl-1" {...props} />,
                      a: (props) => (
                        <a className="text-[#38bdf8] underline decoration-[#38bdf8]/40 hover:text-white" {...props} />
                      ),
                      pre: (props) => (
                        <pre
                          className="my-3 overflow-x-auto rounded-xl border border-emerald-400/20 bg-black/80 p-4 font-mono text-xs leading-relaxed text-emerald-300"
                          {...props}
                        />
                      ),
                      code: (props) => <code className="font-mono" {...props} />
                    }}
                  >
                    {agentAnswer}
                  </ReactMarkdown>
                </div>
                {conversationTurns.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleResetConversation}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:border-white/40"
                    >
                      Reset conversation
                    </button>
                  </div>
                )}
                {answerEnrichment.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Context Boosters
                    </p>
                    <div className="space-y-4">
                      {answerEnrichment.includes('skills') && (
                        <motion.div
                          className="rounded-3xl border border-white/10 bg-white/5 p-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <SkillClusterBars />
                        </motion.div>
                      )}
                      {answerEnrichment.includes('impact') && (
                        <motion.div
                          className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#020617] p-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                              Measurable Impact
                            </p>
                            <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">
                              resume metrics
                            </span>
                          </div>
                          <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            {impactHighlights.map((highlight) => (
                              <div
                                key={highlight.label}
                                className="rounded-2xl border border-white/10 bg-black/30 p-4"
                              >
                                <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                                  {highlight.label}
                                </p>
                                <p className="mt-2 text-2xl font-semibold" style={{ color: highlight.accent }}>
                                  {highlight.value}
                                </p>
                                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                                  {highlight.detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                  className="text-center text-[#34d399]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  The agent could not synthesize an answer. Try rephrasing or asking about another part of the resume.
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <ResumeSections />

          <GithubHeatmap />

          {(mediumPosts.length > 0 || isMediumLoading || mediumError) && (
            <motion.div
              className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_45px_rgba(56,189,248,0.08)] space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Latest on Medium</p>
                  <h2 className="text-2xl font-semibold text-white">Fresh writing from me</h2>
                </div>
                {!isMediumLoading && (
                  <a
                    href={
                      process.env.NEXT_PUBLIC_MEDIUM_URL ??
                      (process.env.NEXT_PUBLIC_MEDIUM_USERNAME
                        ? `https://medium.com/@${process.env.NEXT_PUBLIC_MEDIUM_USERNAME}`
                        : undefined)
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[#38bdf8] hover:text-white transition"
                  >
                    View all →
                  </a>
                )}
              </div>
              {mediumError && (
                <p className="text-sm text-[#f87171]" role="alert">
                  {mediumError}
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                {isMediumLoading
                  ? [0, 1, 2].map((item) => (
                      <div
                        key={`medium-skeleton-${item}`}
                        className="rounded-2xl border border-white/5 bg-white/5 p-4 animate-pulse space-y-3"
                      >
                        <div className="h-3 w-24 rounded-full bg-white/10" />
                        <div className="h-4 w-3/4 rounded-full bg-white/20" />
                        <div className="h-4 w-2/3 rounded-full bg-white/10" />
                      </div>
                    ))
                  : mediumPosts.length > 0
                    ? mediumPosts.map((post) => (
                        <a
                          key={post.link}
                          href={post.link}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#38bdf8]/60 hover:bg-white/[0.08]"
                        >
                          <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                            {formatMediumDate(post.published)}
                          </span>
                          <h3 className="text-base font-semibold text-white group-hover:text-[#38bdf8] transition">
                            {post.title}
                          </h3>
                          <span className="text-xs text-[#38bdf8]">Read on Medium →</span>
                        </a>
                      ))
                    : !mediumError && (
                        <p className="text-sm text-white/60">
                          No recent articles to show yet. Check back soon!
                        </p>
                      )}
              </div>
            </motion.div>
          )}


          {/* Footer */}
          <footer className="flex flex-col items-center gap-2 pt-4 pb-2 font-mono text-xs text-white/40">
            <p>
              <span className="text-emerald-400">$</span> echo "built with Next.js · RAG · OpenAI · Three.js"
            </p>
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <a href="/ssh" className="text-emerald-300 hover:text-white transition">$ ssh aryan@portfolio ↗</a>
              <a href="/api/resume" target="_blank" rel="noreferrer" className="text-[#38bdf8] hover:text-white transition">$ curl /api/resume ↗</a>
              <a href="/api/mcp" target="_blank" rel="noreferrer" className="text-[#7dd3fc] hover:text-white transition">$ mcp add /api/mcp ↗</a>
            </p>
            <p>
              © 2026 Aryan Dokania ·{' '}
              <a
                href="https://github.com/imaryandokania/Portfolio_RAG"
                target="_blank"
                rel="noreferrer"
                className="text-[#38bdf8] hover:text-white transition"
              >
                view source ↗
              </a>
            </p>
          </footer>
        </motion.div>
      </div>

      {tourActive && <GuidedTour onExit={() => setTourActive(false)} />}

      {/* tmux-style status bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 hidden items-center gap-0 border-t border-emerald-400/20 bg-black/90 font-mono text-[11px] backdrop-blur md:flex">
        <span className="bg-emerald-400/90 px-3 py-1 font-semibold text-black">ARYAN.SYS</span>
        <span className="px-3 py-1 text-emerald-300">● online</span>
        <span className="px-3 py-1 text-white/50">{resumeData.contact.location.toLowerCase()}</span>
        <span className="px-3 py-1 text-white/50">{resumeData.sections.research.length} publications</span>
        {visitorCount !== null && (
          <span className="px-3 py-1 text-[#38bdf8]/80">visitor #{visitorCount}</span>
        )}
        <button
          type="button"
          onClick={toggleSound}
          className="ml-auto px-3 py-1 text-white/50 transition hover:text-emerald-300"
          title="Terminal keystroke sounds while the agent streams"
        >
          {soundOn ? 'snd:on' : 'snd:off'}
        </button>
        <button
          type="button"
          onClick={() => setRecruiterMode(true)}
          className="px-3 py-1 text-white/50 transition hover:text-emerald-300"
        >
          --recruiter
        </button>
        <span className="bg-white/10 px-3 py-1 text-white/70">{missionClock}</span>
      </div>
    </div>
  );
}
