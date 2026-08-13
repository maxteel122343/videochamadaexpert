import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VideoCallStage } from './components/VideoCallStage';
import { CallControls } from './components/CallControls';
import { TaskManager } from './components/TaskManager';
import { ChatDrawer } from './components/ChatDrawer';
import { AdviceModal } from './components/AdviceModal';
import { SettingsModal } from './components/SettingsModal';
import { TaskCreatedOverlay } from './components/TaskCreatedOverlay';
import { MobileNavigation, MobileTab } from './components/MobileNavigation';
import { DesktopSidebar } from './components/DesktopSidebar';
import { Task, TaskStatus, ChatMessage, InCallReminder, AppSettings } from './types';
import { INITIAL_TASKS } from './data/initialTasks';
import {
  sendChatMessage,
  sendAudioChatMessage,
  analyzeVideoFrame,
  generateReminderVoice,
  playAIVoice,
  getSavedSettings,
  stopAllAIAudio,
  getIsAITalking,
} from './services/api';

export default function App() {
  // Settings state
  const [settings, setSettings] = useState<AppSettings>(() => getSavedSettings());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Application States
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('app_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TASKS;
  });

  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isMutedAI, setIsMutedAI] = useState<boolean>(false);

  const [aiState, setAiState] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ALERT'>('IDLE');
  const [latestAiText, setLatestAiText] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'system',
      text: 'Bem-vindo à IA Videochamada com Lembrete de Tarefas em tempo real! Clique em "Iniciar Chamada" para começar.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inCallReminder, setInCallReminder] = useState<InCallReminder | null>(null);
  const [pendingCreatedTask, setPendingCreatedTask] = useState<Task | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('call');
  const [desktopTab, setDesktopTab] = useState<'call' | 'chat' | 'tasks'>('call');

  const [isHandsFreeMode, setIsHandsFreeMode] = useState<boolean>(true);
  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState<boolean>(false);
  const [isUserCamPrimary, setIsUserCamPrimary] = useState<boolean>(true);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.warn);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.warn);
      }
    }
  };
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<any>(null);
  const pendingInterimRef = useRef<string>('');

  // VAD Continuous Voice Streamer Refs
  const vadStreamRef = useRef<MediaStream | null>(null);
  const vadAudioCtxRef = useRef<AudioContext | null>(null);
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const vadRecorderRef = useRef<MediaRecorder | null>(null);
  const vadChunksRef = useRef<Blob[]>([]);
  const isVadRecordingRef = useRef<boolean>(false);
  const lastSpeechTimeRef = useRef<number>(0);
  const speechStartTimeRef = useRef<number>(0);

  // Save tasks to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('app_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Auto-start video call if configured in settings
  useEffect(() => {
    const saved = getSavedSettings();
    if (saved.autoStartCall && !isCallActive) {
      handleStartCall();
    }
  }, []);

  // Audio chime synthesizer for in-call task reminders
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // 🔔 REAL-TIME AUTOMATED TASK REMINDER TICKER
  // Checks active tasks scheduled times during open call
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isCallActive) return;

      const now = new Date();
      const nowMs = now.getTime();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const currentIsoMinutes = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Find an active task (PENDENTE or A FAZER) whose start time is due and hasn't reminded yet
      const dueTask = tasks.find((t) => {
        if ((t.status !== 'PENDENTE' && t.status !== 'A FAZER') || t.reminded) {
          return false;
        }
        if (!t.startDate) return false;

        // Date parse check
        const taskDate = new Date(t.startDate);
        const taskMs = taskDate.getTime();

        if (!isNaN(taskMs)) {
          return taskMs <= nowMs + 10000;
        }

        return t.startDate <= currentIsoMinutes;
      });

      if (dueTask && (!inCallReminder || inCallReminder.task.id !== dueTask.id)) {
        // Trigger In-Call Reminder!
        playAlertSound();
        setInCallReminder({
          task: dueTask,
          triggeredAt: new Date().toISOString(),
          active: true,
        });
        setAiState('ALERT');

        // Mark task as reminded
        setTasks((prev) =>
          prev.map((t) => (t.id === dueTask.id ? { ...t, reminded: true } : t))
        );

        // Generate AI voice reminder
        const reminderSpeech = await generateReminderVoice(
          dueTask.name,
          dueTask.estimatedTime,
          dueTask.startDate
        );

        setLatestAiText(reminderSpeech);
        setMessages((prev) => [
          ...prev,
          {
            id: `rem-msg-${Date.now()}`,
            sender: 'system',
            text: `🔔 LEMBRETE AUTOMÁTICO NA CHAMADA: Hora da tarefa "${dueTask.name}"! Status: ${dueTask.status}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (!isMutedAI) {
          playAIVoice(reminderSpeech);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isCallActive, tasks, inCallReminder, isMutedAI]);

  // Handle Web Speech Recognition (Continuous Hands-Free Speech Input during Call)
  useEffect(() => {
    let isStoppedIntentionally = false;

    if (isCallActive && isMicOn) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'pt-BR';

          recognition.onstart = () => {
            setAiState((prev) => (prev === 'SPEAKING' || prev === 'THINKING' ? prev : 'LISTENING'));
          };

          recognition.onresult = (event: any) => {
            // Ignore mic speech if AI is currently thinking/speaking or a task popup is blocking screen
            if (isLoadingAi || aiState === 'SPEAKING' || getIsAITalking() || pendingCreatedTask) {
              return;
            }

            let finalTranscript = '';
            let interimText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcriptChunk = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcriptChunk;
              } else {
                interimText += transcriptChunk;
              }
            }

            if (isHandsFreeMode) {
              if (finalTranscript.trim()) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                pendingInterimRef.current = '';
                setInterimTranscript('');
                handleUserMessage(finalTranscript.trim());
              } else if (interimText.trim()) {
                const cleaned = interimText.trim();
                setInterimTranscript(cleaned);
                pendingInterimRef.current = cleaned;

                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                  if (pendingInterimRef.current && pendingInterimRef.current.length >= 2) {
                    const textToSend = pendingInterimRef.current;
                    pendingInterimRef.current = '';
                    setInterimTranscript('');
                    handleUserMessage(textToSend);
                  }
                }, 900);
              }
            } else {
              // Manual mode: display live transcript only
              if (interimText.trim() || finalTranscript.trim()) {
                setInterimTranscript((interimText || finalTranscript).trim());
              }
            }
          };

          recognition.onerror = (err: any) => {
            if (err.error !== 'no-speech') {
              console.warn('Aviso de reconhecimento de voz:', err.error || err);
            }
            if (err.error === 'not-allowed') {
              setInterimTranscript('Permissão do microfone negada no navegador.');
            }
          };

          recognition.onend = () => {
            if (!isStoppedIntentionally && isCallActive && isMicOn) {
              setTimeout(() => {
                try {
                  recognition.start();
                } catch (e) {}
              }, 200);
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('Erro ao configurar reconhecimento de voz:', err);
        }
      }
    } else {
      isStoppedIntentionally = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setInterimTranscript('');
    }

    return () => {
      isStoppedIntentionally = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isCallActive, isMicOn, isHandsFreeMode, isLoadingAi, aiState]);

  // Handle direct audio recording with MediaRecorder (Push-to-talk / Direct Voice button)
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size < 500) {
          console.warn('Áudio de voz muito curto ou vazio.');
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await handleAudioMessage(base64Audio, 'audio/webm');
        };
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecordingAudio(true);
      setAiState('LISTENING');
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acionar o microfone. Verifique as permissões do seu navegador.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      mediaRecorderRef.current = null;
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecordingAudio) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  // Helper to extract task from user speech/text if AI didn't return newTask object
  const extractTaskFromText = (userText: string): string | null => {
    if (!userText) return null;
    const lower = userText.toLowerCase();
    const keywords = [
      'criar tarefa de ', 'criar tarefa da ', 'criar tarefa do ', 'criar tarefa ',
      'criar a tarefa de ', 'criar a tarefa ', 'agendar tarefa de ', 'agendar tarefa ',
      'adicionar tarefa ', 'lembrar de ', 'lembrar do ', 'lembrar da ', 'tarefa de ', 'tarefa '
    ];

    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const idx = lower.indexOf(kw);
        let rawName = userText.slice(idx + kw.length).trim();
        // Remove trailing polite or punctuation marks
        rawName = rawName.replace(/(\.|\!|\?|por favor|obrigado)$/i, '').trim();
        if (rawName.length >= 2) {
          return rawName.charAt(0).toUpperCase() + rawName.slice(1);
        }
      }
    }
    return null;
  };

  // Process Direct Audio Voice Message with Gemini Multimodal API
  const handleAudioMessage = async (audioBase64: string, mimeType: string) => {
    setIsLoadingAi(true);
    setAiState('THINKING');

    try {
      const result = await sendAudioChatMessage(audioBase64, mimeType, tasks);

      const userText = result.userTranscribedText || 'Áudio enviado na chamada';
      const aiReply = result.replyText || 'Te ouvi perfeitamente! Como posso te ajudar com suas tarefas agora?';

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          text: `🎤 [Voz] ${userText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      setLatestAiText(aiReply);
      setAiState('SPEAKING');

      let createdTask: Task | undefined = undefined;

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const endObj = new Date(now.getTime() + 60 * 60 * 1000);
      const defaultEnd = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}T${pad(endObj.getHours())}:${pad(endObj.getMinutes())}`;

      if (result.newTask && result.newTask.name) {
        const taskToAdd: Task = {
          id: `task-${Date.now()}`,
          name: result.newTask.name,
          startDate: result.newTask.startDate || defaultStart,
          endDate: result.newTask.endDate || defaultEnd,
          estimatedTime: result.newTask.estimatedTime || '30 minutos',
          status: (result.newTask.status as TaskStatus) || 'PENDENTE',
          priority: (result.newTask.priority as any) || 'média',
          category: result.newTask.category || 'Geral',
          createdAt: new Date().toISOString(),
        };

        setTasks((prev) => [taskToAdd, ...prev]);
        createdTask = taskToAdd;
      } else {
        // Fallback extraction
        const fallbackName = extractTaskFromText(userText);
        if (fallbackName) {
          const taskToAdd: Task = {
            id: `task-${Date.now()}`,
            name: fallbackName,
            startDate: defaultStart,
            endDate: defaultEnd,
            estimatedTime: '30 minutos',
            status: 'PENDENTE',
            priority: 'média',
            category: 'Pessoal',
            createdAt: new Date().toISOString(),
          };
          setTasks((prev) => [taskToAdd, ...prev]);
          createdTask = taskToAdd;
        }
      }

      if (createdTask) {
        setPendingCreatedTask(createdTask);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-msg-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          taskCreated: createdTask,
        },
      ]);

      if (!isMutedAI) {
        await playAIVoice(aiReply);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingAi(false);
      setTimeout(() => {
        setAiState('LISTENING');
      }, 3000);
    }
  };

  // CONTINUOUS VOICE PACKET STREAMER (VAD - Voice Activity Detection)
  // Automatically captures audio chunks as the user speaks hands-free and sends them to Gemini AI!
  useEffect(() => {
    let vadInterval: any = null;
    let activeStream: MediaStream | null = null;
    let activeAudioCtx: AudioContext | null = null;

    if (isCallActive && isMicOn && isHandsFreeMode && !isRecordingAudio) {
      const initVad = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          vadStreamRef.current = stream;
          activeStream = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          vadAudioCtxRef.current = audioCtx;
          activeAudioCtx = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          vadAnalyserRef.current = analyser;

          const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm'))
            ? 'audio/webm'
            : 'audio/mp4';

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          vadInterval = setInterval(() => {
            // Do not capture voice packets while AI is thinking/speaking, AI audio is outputting, or task overlay is open
            if (isLoadingAi || aiState === 'SPEAKING' || getIsAITalking() || isRecordingAudio || pendingCreatedTask) {
              if (isVadRecordingRef.current && vadRecorderRef.current && vadRecorderRef.current.state !== 'inactive') {
                try { vadRecorderRef.current.stop(); } catch (e) {}
                isVadRecordingRef.current = false;
              }
              return;
            }

            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avgVolume = sum / dataArray.length;
            const now = Date.now();

            // Speech detected (volume threshold > 12)
            if (avgVolume > 12) {
              lastSpeechTimeRef.current = now;

              if (!isVadRecordingRef.current) {
                isVadRecordingRef.current = true;
                speechStartTimeRef.current = now;
                vadChunksRef.current = [];

                try {
                  const recorder = new MediaRecorder(stream, { mimeType });
                  recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                      vadChunksRef.current.push(e.data);
                    }
                  };

                  recorder.onstop = () => {
                    const duration = Date.now() - speechStartTimeRef.current;
                    const chunks = vadChunksRef.current;
                    isVadRecordingRef.current = false;

                    if (duration > 500 && chunks.length > 0) {
                      const audioBlob = new Blob(chunks, { type: mimeType });
                      if (audioBlob.size > 600) {
                        setInterimTranscript('⚡ Enviando pacote de voz para a IA...');
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
                          setInterimTranscript('');
                          await handleAudioMessage(base64, mimeType);
                        };
                      }
                    }
                  };

                  recorder.start(100);
                  vadRecorderRef.current = recorder;
                  setInterimTranscript('🎙️ Capturando sua voz (pacote em tempo real)...');
                  setAiState('LISTENING');
                } catch (recErr) {
                  console.warn('Erro ao ligar gravador VAD:', recErr);
                  isVadRecordingRef.current = false;
                }
              }
            } else if (isVadRecordingRef.current) {
              // Silence detected after speech (800ms)
              if (now - lastSpeechTimeRef.current > 800) {
                if (vadRecorderRef.current && vadRecorderRef.current.state !== 'inactive') {
                  try {
                    vadRecorderRef.current.stop();
                  } catch (e) {}
                }
              }
            }
          }, 70);
        } catch (err) {
          console.warn('Erro ao inicializar VAD Audio Stream:', err);
        }
      };

      initVad();
    }

    return () => {
      if (vadInterval) clearInterval(vadInterval);
      if (vadRecorderRef.current && vadRecorderRef.current.state !== 'inactive') {
        try { vadRecorderRef.current.stop(); } catch (e) {}
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (activeAudioCtx && activeAudioCtx.state !== 'closed') {
        try { activeAudioCtx.close(); } catch (e) {}
      }
      isVadRecordingRef.current = false;
    };
  }, [isCallActive, isMicOn, isHandsFreeMode, isRecordingAudio, isLoadingAi, aiState]);

  // Main User Query Handler (Calls Gemini Backend Chat API)
  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    // If AI is currently loading/speaking, wait a short moment to avoid dropping hands-free speech
    if (isLoadingAi) {
      setTimeout(() => {
        handleUserMessage(text);
      }, 800);
      return;
    }

    const userMsgId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text, timestamp },
    ]);

    setIsLoadingAi(true);
    setAiState('THINKING');

    try {
      const data = await sendChatMessage(text, messages, tasks);

      const aiReply = data.replyText || 'Entendi! Como posso te ajudar com suas tarefas?';
      setLatestAiText(aiReply);
      setAiState('SPEAKING');

      let createdTask: Task | undefined = undefined;

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const endObj = new Date(now.getTime() + 60 * 60 * 1000);
      const defaultEnd = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}T${pad(endObj.getHours())}:${pad(endObj.getMinutes())}`;

      // Handle Automatic Task Creation from AI response
      if (data.newTask && data.newTask.name) {
        const taskToAdd: Task = {
          id: `task-${Date.now()}`,
          name: data.newTask.name,
          startDate: data.newTask.startDate || defaultStart,
          endDate: data.newTask.endDate || defaultEnd,
          estimatedTime: data.newTask.estimatedTime || '30 minutos',
          status: (data.newTask.status as TaskStatus) || 'PENDENTE',
          priority: (data.newTask.priority as any) || 'média',
          category: data.newTask.category || 'Geral',
          createdAt: new Date().toISOString(),
        };

        setTasks((prev) => [taskToAdd, ...prev]);
        createdTask = taskToAdd;
      } else {
        // Fallback extraction if AI didn't return newTask object
        const fallbackName = extractTaskFromText(text);
        if (fallbackName) {
          const taskToAdd: Task = {
            id: `task-${Date.now()}`,
            name: fallbackName,
            startDate: defaultStart,
            endDate: defaultEnd,
            estimatedTime: '30 minutos',
            status: 'PENDENTE',
            priority: 'média',
            category: 'Pessoal',
            createdAt: new Date().toISOString(),
          };
          setTasks((prev) => [taskToAdd, ...prev]);
          createdTask = taskToAdd;
        }
      }

      if (createdTask) {
        setPendingCreatedTask(createdTask);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-msg-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          taskCreated: createdTask,
        },
      ]);

      // Speak response aloud if not muted
      if (!isMutedAI) {
        await playAIVoice(aiReply);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'system',
          text: `Erro ao obter conselho da IA: ${err.message || 'Tente novamente.'}`,
          timestamp,
        },
      ]);
    } finally {
      setIsLoadingAi(false);
      setTimeout(() => {
        setAiState('LISTENING');
      }, 3000);
    }
  };

  // Add Task manually
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Update Task Status (PENDENTE, A FAZER, CONCLUIDO)
  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    // If active in-call reminder matches this task, close reminder
    if (inCallReminder && inCallReminder.task.id === taskId) {
      setInCallReminder(null);
      setAiState('LISTENING');
    }

    const taskName = tasks.find((t) => t.id === taskId)?.name;
    const msgText = `Status da tarefa "${taskName}" atualizado para: ${status}`;
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `✓ ${msgText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (isCallActive && !isMutedAI) {
      playAIVoice(`Ótimo! Marquei a tarefa como ${status.toLowerCase()}.`);
    }
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (inCallReminder && inCallReminder.task.id === taskId) {
      setInCallReminder(null);
    }
  };

  // Postpone Reminder by 5 mins
  const handlePostponeReminder = (taskId: string) => {
    setInCallReminder(null);
    setAiState('LISTENING');

    // Reset reminded flag and update start date 5 min ahead
    const now = new Date();
    const future5 = new Date(now.getTime() + 5 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const newStart = `${future5.getFullYear()}-${pad(future5.getMonth() + 1)}-${pad(future5.getDate())}T${pad(future5.getHours())}:${pad(future5.getMinutes())}`;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, startDate: newStart, reminded: false } : t))
    );

    if (isCallActive && !isMutedAI) {
      playAIVoice('Lembrete adiado em 5 minutos! Falamos em breve.');
    }
  };

  // Test Reminder Trigger (For Immediate Testing in Open Call)
  const handleTestReminderForTask = (taskToTest?: Task) => {
    const targetTask = taskToTest || tasks[0];
    if (!targetTask) return;

    if (!isCallActive) {
      setIsCallActive(true);
    }

    playAlertSound();
    setInCallReminder({
      task: targetTask,
      triggeredAt: new Date().toISOString(),
      active: true,
    });
    setAiState('ALERT');

    const alertText = `Atenção! Este é o lembrete automático para a tarefa "${targetTask.name}". O tempo estimado é de ${targetTask.estimatedTime}.`;
    setLatestAiText(alertText);

    setMessages((prev) => [
      ...prev,
      {
        id: `test-rem-${Date.now()}`,
        sender: 'system',
        text: `🔔 TESTE DE LEMBRETE NA CHAMADA: ${targetTask.name}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (!isMutedAI) {
      playAIVoice(alertText);
    }
  };

  // Ask Advice for a Specific Task
  const handleAskAdviceForTask = (task: Task) => {
    if (!isCallActive) {
      setIsCallActive(true);
    }
    const prompt = `Me dê conselhos práticos de como realizar a tarefa "${task.name}" (Tempo estimado: ${task.estimatedTime}) com o máximo de foco e eficiência.`;
    handleUserMessage(prompt);
  };

  // Vision Camera Snapshot Analysis
  const handleCaptureFrameAndAnalyze = async (base64Image: string) => {
    setIsAnalyzingVision(true);
    setAiState('THINKING');

    try {
      const analysisText = await analyzeVideoFrame(base64Image, tasks);
      setLatestAiText(analysisText);
      setAiState('SPEAKING');

      setMessages((prev) => [
        ...prev,
        {
          id: `vision-${Date.now()}`,
          sender: 'ai',
          text: analysisText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          visionAnalysis: analysisText,
        },
      ]);

      if (!isMutedAI) {
        await playAIVoice(analysisText);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAnalyzingVision(false);
      setTimeout(() => {
        setAiState('LISTENING');
      }, 3000);
    }
  };

  const handleStartCall = () => {
    setIsCallActive(true);
    setAiState('LISTENING');
    if (vadAudioCtxRef.current && vadAudioCtxRef.current.state === 'suspended') {
      vadAudioCtxRef.current.resume().catch(() => {});
    }
    const greeting = 'Olá! Estou online na sua videochamada WebRTC. Como posso ajudar com conselhos ou organizar suas tarefas hoje?';
    setLatestAiText(greeting);
    if (!isMutedAI) {
      playAIVoice(greeting);
    }
  };

  const handleEndCall = () => {
    stopAllAIAudio();
    setIsCallActive(false);
    setAiState('IDLE');
    setInCallReminder(null);
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 text-slate-900 flex flex-col overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <Header
        isCallActive={isCallActive}
        onToggleCall={() => (isCallActive ? handleEndCall() : handleStartCall())}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onOpenAdviceModal={() => setIsAdviceModalOpen(true)}
        onTestReminder={() => handleTestReminderForTask()}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        tasks={tasks}
        showTopHeader={settings.showTopHeader ?? false}
      />

      {/* TASK CREATED OVERLAY (BLOCKING POPUP UNTIL USER CONFIRMS STATUS) */}
      <TaskCreatedOverlay
        task={pendingCreatedTask}
        onConfirmStatus={(status) => {
          if (pendingCreatedTask) {
            handleUpdateTaskStatus(pendingCreatedTask.id, status);
          }
          setPendingCreatedTask(null);
        }}
        onDismiss={() => setPendingCreatedTask(null)}
      />

      {/* DESKTOP SIDEBAR + MAIN CONTENT CONTAINER (md:flex) */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
        {/* LEFT PC SIDEBAR */}
        <DesktopSidebar
          activeTab={desktopTab}
          onSelectTab={(tab) => setDesktopTab(tab)}
          isCallActive={isCallActive}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenAdviceModal={() => setIsAdviceModalOpen(true)}
          pendingTaskCount={tasks.filter((t) => t.status !== 'CONCLUIDO').length}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* MAIN DESKTOP CONTENT */}
        <main className="flex-1 p-3 md:p-4 max-w-7xl w-full mx-auto flex flex-col gap-4 overflow-hidden h-full">
          {/* 1. HORIZONTAL SPLIT VIEW FOR CHAMADA (LEFT CAMERA / STAGE, RIGHT AI CHAT) */}
          {desktopTab === 'call' && (
            <div className={`grid gap-4 h-full overflow-hidden ${isChatOpen ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Left Column: User Camera & Video Call Stage */}
              <div className="flex flex-col gap-3 h-full overflow-hidden">
                <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-slate-900">
                  <VideoCallStage
                    isCallActive={isCallActive}
                    onStartCall={handleStartCall}
                    onEndCall={handleEndCall}
                    isMicOn={isMicOn}
                    onToggleMic={() => setIsMicOn(!isMicOn)}
                    isVideoOn={isVideoOn}
                    onToggleVideo={() => setIsVideoOn(!isVideoOn)}
                    aiState={aiState}
                    latestAiText={latestAiText}
                    interimTranscript={interimTranscript}
                    isRecordingAudio={isRecordingAudio}
                    onToggleVoiceRecording={toggleVoiceRecording}
                    isHandsFreeMode={isHandsFreeMode}
                    onToggleHandsFreeMode={() => setIsHandsFreeMode(!isHandsFreeMode)}
                    inCallReminder={inCallReminder}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onPostponeReminder={handlePostponeReminder}
                    onAskTaskAdviceInCall={handleAskAdviceForTask}
                    onCaptureFrameAndAnalyze={handleCaptureFrameAndAnalyze}
                    isAnalyzingVision={isAnalyzingVision}
                    isMutedAI={isMutedAI}
                    onToggleMuteAI={() => setIsMutedAI(!isMutedAI)}
                    isUserCamPrimary={isUserCamPrimary}
                    onToggleUserCamPrimary={() => setIsUserCamPrimary(!isUserCamPrimary)}
                  />
                </div>

                <CallControls
                  isCallActive={isCallActive}
                  onToggleCall={() => (isCallActive ? handleEndCall() : handleStartCall())}
                  isMicOn={isMicOn}
                  onToggleMic={() => setIsMicOn(!isMicOn)}
                  isVideoOn={isVideoOn}
                  onToggleVideo={() => setIsVideoOn(!isVideoOn)}
                  isMutedAI={isMutedAI}
                  onToggleMuteAI={() => setIsMutedAI(!isMutedAI)}
                  isHandsFreeMode={isHandsFreeMode}
                  onToggleHandsFreeMode={() => setIsHandsFreeMode(!isHandsFreeMode)}
                  isTasksOpen={isTasksOpen}
                  onToggleTasks={() => setIsTasksOpen(!isTasksOpen)}
                  isChatOpen={isChatOpen}
                  onToggleChat={() => setIsChatOpen(!isChatOpen)}
                  onOpenAdviceModal={() => setIsAdviceModalOpen(true)}
                  onAnalyzeCameraVision={() => {
                    const btn = document.querySelector<HTMLButtonElement>('[title*="Analisar Foto"]');
                    btn?.click();
                  }}
                  isAnalyzingVision={isAnalyzingVision}
                  isRecordingAudio={isRecordingAudio}
                  onToggleVoiceRecording={toggleVoiceRecording}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={handleToggleFullscreen}
                  aiState={aiState}
                  isUserCamPrimary={isUserCamPrimary}
                  onToggleUserCamPrimary={() => setIsUserCamPrimary(!isUserCamPrimary)}
                />
              </div>

              {/* Right Column: AI Chat Transcript (Visible when isChatOpen is true) */}
              {isChatOpen && (
                <div className="h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                  <ChatDrawer
                    messages={messages}
                    onSendMessage={handleUserMessage}
                    isCallActive={isCallActive}
                    isLoadingAi={isLoadingAi}
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. EXCLUSIVE AI CHAT VIEW */}
          {desktopTab === 'chat' && (
            <div className="h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
              <ChatDrawer
                messages={messages}
                onSendMessage={handleUserMessage}
                isCallActive={isCallActive}
                isLoadingAi={isLoadingAi}
              />
            </div>
          )}

          {/* 3. EXCLUSIVE CARDS & TASKS VIEW */}
          {desktopTab === 'tasks' && (
            <div className="h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
              <TaskManager
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
                onAskAdviceForTask={handleAskAdviceForTask}
                onTestReminderForTask={handleTestReminderForTask}
                isOpenModal={isNewTaskModalOpen}
                onOpenModal={() => setIsNewTaskModalOpen(true)}
                onCloseModal={() => setIsNewTaskModalOpen(false)}
              />
            </div>
          )}
        </main>
      </div>

      {/* MOBILE RESPONSIVE LAYOUT (md:hidden) */}
      <main className="md:hidden flex-1 min-h-0 p-2 pb-16 flex flex-col overflow-hidden h-full">
        {activeMobileTab === 'call' && (
          <div className="flex flex-col h-full overflow-hidden gap-2">
            {/* Top Section: User Camera / Video Stage */}
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-slate-900 flex flex-col">
              <VideoCallStage
                isCallActive={isCallActive}
                onStartCall={handleStartCall}
                onEndCall={handleEndCall}
                isMicOn={isMicOn}
                onToggleMic={() => setIsMicOn(!isMicOn)}
                isVideoOn={isVideoOn}
                onToggleVideo={() => setIsVideoOn(!isVideoOn)}
                aiState={aiState}
                latestAiText={latestAiText}
                interimTranscript={interimTranscript}
                isRecordingAudio={isRecordingAudio}
                onToggleVoiceRecording={toggleVoiceRecording}
                isHandsFreeMode={isHandsFreeMode}
                onToggleHandsFreeMode={() => setIsHandsFreeMode(!isHandsFreeMode)}
                inCallReminder={inCallReminder}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onPostponeReminder={handlePostponeReminder}
                onAskTaskAdviceInCall={handleAskAdviceForTask}
                onCaptureFrameAndAnalyze={handleCaptureFrameAndAnalyze}
                isAnalyzingVision={isAnalyzingVision}
                isMutedAI={isMutedAI}
                onToggleMuteAI={() => setIsMutedAI(!isMutedAI)}
                isUserCamPrimary={isUserCamPrimary}
                onToggleUserCamPrimary={() => setIsUserCamPrimary(!isUserCamPrimary)}
              />
            </div>

            {/* Middle Section: Integrated Control Bar */}
            <div className="shrink-0">
              <CallControls
                isCallActive={isCallActive}
                onToggleCall={() => (isCallActive ? handleEndCall() : handleStartCall())}
                isMicOn={isMicOn}
                onToggleMic={() => setIsMicOn(!isMicOn)}
                isVideoOn={isVideoOn}
                onToggleVideo={() => setIsVideoOn(!isVideoOn)}
                isMutedAI={isMutedAI}
                onToggleMuteAI={() => setIsMutedAI(!isMutedAI)}
                isHandsFreeMode={isHandsFreeMode}
                onToggleHandsFreeMode={() => setIsHandsFreeMode(!isHandsFreeMode)}
                isTasksOpen={isTasksOpen}
                onToggleTasks={() => setIsTasksOpen(!isTasksOpen)}
                isChatOpen={isChatOpen}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                onOpenAdviceModal={() => setIsAdviceModalOpen(true)}
                onAnalyzeCameraVision={() => {
                  const btn = document.querySelector<HTMLButtonElement>('[title*="Analisar Foto"]');
                  btn?.click();
                }}
                isAnalyzingVision={isAnalyzingVision}
                isRecordingAudio={isRecordingAudio}
                onToggleVoiceRecording={toggleVoiceRecording}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                aiState={aiState}
                isUserCamPrimary={isUserCamPrimary}
                onToggleUserCamPrimary={() => setIsUserCamPrimary(!isUserCamPrimary)}
              />
            </div>

            {/* Optional AI Chat Transcript inside Call Tab when enabled */}
            {isChatOpen && (
              <div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white flex flex-col">
                <ChatDrawer
                  messages={messages}
                  onSendMessage={handleUserMessage}
                  isCallActive={isCallActive}
                  isLoadingAi={isLoadingAi}
                />
              </div>
            )}
          </div>
        )}

        {activeMobileTab === 'chat' && (
          <div className="h-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
            <ChatDrawer
              messages={messages}
              onSendMessage={handleUserMessage}
              isCallActive={isCallActive}
              isLoadingAi={isLoadingAi}
            />
          </div>
        )}

        {activeMobileTab === 'tasks' && (
          <div className="h-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
            <TaskManager
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onAskAdviceForTask={handleAskAdviceForTask}
              onTestReminderForTask={handleTestReminderForTask}
              isOpenModal={isNewTaskModalOpen}
              onOpenModal={() => setIsNewTaskModalOpen(true)}
              onCloseModal={() => setIsNewTaskModalOpen(false)}
            />
          </div>
        )}
      </main>

      {/* HORIZONTAL MOBILE NAVBAR WITH 4 ICONS (Call, Chat IA, Cards Tasks, Settings) */}
      <MobileNavigation
        activeTab={activeMobileTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setActiveMobileTab(tab);
          }
        }}
        isCallActive={isCallActive}
        pendingTaskCount={tasks.filter((t) => t.status !== 'CONCLUIDO').length}
      />

      {/* ADVICE SELECTION MODAL */}
      <AdviceModal
        isOpen={isAdviceModalOpen}
        onClose={() => setIsAdviceModalOpen(false)}
        onSelectPrompt={(prompt) => {
          if (!isCallActive) handleStartCall();
          handleUserMessage(prompt);
        }}
      />

      {/* CONFIG & GEMINI SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('app_settings', JSON.stringify(newSettings));
        }}
      />
    </div>
  );
}
