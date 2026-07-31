'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { resumeData } from '../data/resumeData';
import { computeExperienceMetrics } from '../utils/resumeMetrics';
import SkillClusterBars from './SkillClusterBars';
import CyberBackground from './CyberBackground';
import VoiceOrb from './VoiceOrb';
import TerminalBoot from './TerminalBoot';
import ResumeSections from './ResumeSections';

type MediumPost = {
  title: string;
  link: string;
  published: string;
};

type EnrichmentHint = 'skills' | 'impact';

export default function SearchInterface() {
  const MAX_QUERY_CHARS = 500;
  const SILENCE_THRESHOLD = 0.02;
  const SILENCE_TIMEOUT_MS = 1500;
  const [searchQuery, setSearchQuery] = useState('');
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

        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: normalizedQuery,
            contextTurns: payloadTurns.length ? payloadTurns : undefined
          })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? 'Failed to query the AI agent.');
        }

        const payload = (await response.json()) as {
          answer?: string;
          enrichment?: EnrichmentHint[];
        };

        const answerText = payload.answer ?? '';
        setAnswerEnrichment(payload.enrichment ?? []);

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
    [speakText, stopVoicePlayback]
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

  const telemetryMetrics = useMemo(() => {
    const aggregated = aggregatedMetrics;

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
  }, [aggregatedMetrics]);

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
        accent: '#a855f7'
      },
      {
        label: 'Research Signal',
        value: `${aggregated.researchCount}`,
        detail: 'peer-reviewed or publication-grade outputs',
        accent: '#fbbf24'
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setVoiceSessionStage('idle');
    setVoiceSessionAnswer('');
    stopVoicePlayback();
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

  return (
    <div className="relative">
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
            <div className="relative flex items-center gap-2 border-b border-white/10 bg-black/50 px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <p className="ml-3 font-mono text-xs text-white/50">
                <span className="text-emerald-400">aryan@portfolio</span>
                <span className="text-white/40">:~$ </span>
                <span className="text-white/80">./init_portfolio --mode=rag</span>
              </p>
              <p className="ml-auto hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-300 sm:flex">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                online
              </p>
            </div>
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
                  <motion.p
                    className="text-[#38bdf8] text-lg md:text-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {resumeData.title}
                    {heroEducation && (
                      <span className="text-white/50"> · {heroEducation}</span>
                    )}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <TerminalBoot />
                  </motion.div>
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
                      li: (props) => <li className="pl-1" {...props} />
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
                <div className="relative w-full sm:flex-1 pb-5 sm:pb-0">
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
                    ref={queryInputRef}
                    className="w-full h-20 rounded-2xl bg-black/80 pl-14 pr-20 text-lg md:text-xl text-white shadow-[inset_0_0_20px_rgba(56,189,248,0.08)]
                    focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 placeholder:text-white/40"
                    placeholder="What do you want to know about me?"
                    aria-label="Search Aryan's portfolio"
                  />
                  <button
                    type="button"
                    onClick={isRecording ? () => stopVoiceCapture(true) : startVoiceCapture}
                    disabled={isVoiceProcessing}
                    className={`absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border transition
                      ${
                        isRecording
                          ? 'border-[#f87171]/70 bg-[#7f1d1d]/50 text-[#fca5a5]'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-[#38bdf8]/60 hover:text-white'
                      }
                      ${isVoiceProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
                  >
                    {isVoiceProcessing ? (
                      <svg className="h-5 w-5 animate-spin text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 3a9 9 0 1 1-9 9" strokeLinecap="round" />
                      </svg>
                    ) : isRecording ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="8" y="8" width="8" height="8" rx="2" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
                  <div className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-center text-xs text-white/70 sm:text-left">
                    {voiceError ? (
                      <span className="text-[#f87171]" role="alert">
                        {voiceError}
                      </span>
                    ) : isVoiceProcessing ? (
                      <span className="text-[#38bdf8]">Transcribing your voice…</span>
                    ) : (
                      <span>
                        Tap the mic to speak, or press{' '}
                        <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">/</kbd>{' '}
                        to type your question.
                      </span>
                    )}
                  </div>
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
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-400/70">$ ask --about</p>
                    <p className="font-mono text-sm font-semibold text-white">{section}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#38bdf8]" />
              <span>Keyword search ready</span>
            </div> */}
          </motion.div>

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

          <ResumeSections />

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
