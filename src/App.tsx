import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VideoCallStage } from './components/VideoCallStage';
import { CallControls } from './components/CallControls';
import { TaskManager } from './components/TaskManager';
import { ChatDrawer } from './components/ChatDrawer';
import { AdviceModal } from './components/AdviceModal';
import { SettingsModal } from './components/SettingsModal';
import { Task, TaskStatus, ChatMessage, InCallReminder, AppSettings } from './types';
import { INITIAL_TASKS } from './data/initialTasks';
import { sendChatMessage, analyzeVideoFrame, generateReminderVoice, playAIVoice, getSavedSettings } from './services/api';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'system',
      text: 'Bem-vindo à IA Videochamada com Lembrete de Tarefas em tempo real! Clique em "Iniciar Chamada" para começar.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inCallReminder, setInCallReminder] = useState<InCallReminder | null>(null);
  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState<boolean>(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Save tasks to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('app_tasks', JSON.stringify(tasks));
  }, [tasks]);

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
      const pad = (n: number) => n.toString().padStart(2, '0');
      const currentIsoMinutes = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Find an active task (PENDENTE or A FAZER) whose start time is due and hasn't reminded yet
      const dueTask = tasks.find(
        (t) =>
          (t.status === 'PENDENTE' || t.status === 'A FAZER') &&
          !t.reminded &&
          t.startDate <= currentIsoMinutes
      );

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
    }, 4000);

    return () => clearInterval(interval);
  }, [isCallActive, tasks, inCallReminder, isMutedAI]);

  // Handle Web Speech Recognition (Mic Voice Input during Call)
  useEffect(() => {
    if (isCallActive && isMicOn) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'pt-BR';

          recognition.onresult = (event: any) => {
            const lastResultIndex = event.results.length - 1;
            const transcript = event.results[lastResultIndex][0].transcript.trim();
            if (transcript) {
              handleUserMessage(transcript);
            }
          };

          recognition.onerror = (err: any) => {
            console.warn('Speech recognition error:', err);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('Speech recognition setup error:', err);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isCallActive, isMicOn]);

  // Main User Query Handler (Calls Gemini Backend Chat API)
  const handleUserMessage = async (text: string) => {
    if (!text.trim() || isLoadingAi) return;

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

      // Handle Automatic Task Creation from AI response
      if (data.newTask && data.newTask.name) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const endObj = new Date(now.getTime() + 60 * 60 * 1000);
        const defaultEnd = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}T${pad(endObj.getHours())}:${pad(endObj.getMinutes())}`;

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
    const greeting = 'Olá! Estou online na sua videochamada WebRTC. Como posso ajudar com conselhos ou organizar suas tarefas hoje?';
    setLatestAiText(greeting);
    if (!isMutedAI) {
      playAIVoice(greeting);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setAiState('IDLE');
    setInCallReminder(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <Header
        isCallActive={isCallActive}
        onToggleCall={() => (isCallActive ? handleEndCall() : handleStartCall())}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onOpenAdviceModal={() => setIsAdviceModalOpen(true)}
        onTestReminder={() => handleTestReminderForTask()}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        tasks={tasks}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-3 md:p-5 max-w-7xl w-full mx-auto flex flex-col gap-4">
        {/* VIDEO CALL STAGE */}
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
          inCallReminder={inCallReminder}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onPostponeReminder={handlePostponeReminder}
          onAskTaskAdviceInCall={handleAskAdviceForTask}
          onCaptureFrameAndAnalyze={handleCaptureFrameAndAnalyze}
          isAnalyzingVision={isAnalyzingVision}
          isMutedAI={isMutedAI}
          onToggleMuteAI={() => setIsMutedAI(!isMutedAI)}
        />

        {/* CALL CONTROLS TOOLBAR */}
        <CallControls
          isCallActive={isCallActive}
          onToggleCall={() => (isCallActive ? handleEndCall() : handleStartCall())}
          isMicOn={isMicOn}
          onToggleMic={() => setIsMicOn(!isMicOn)}
          isVideoOn={isVideoOn}
          onToggleVideo={() => setIsVideoOn(!isVideoOn)}
          isMutedAI={isMutedAI}
          onToggleMuteAI={() => setIsMutedAI(!isMutedAI)}
          isTasksOpen={isTasksOpen}
          onToggleTasks={() => setIsTasksOpen(!isTasksOpen)}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onOpenAdviceModal={() => setIsAdviceModalOpen(true)}
          onAnalyzeCameraVision={() => {
            const btn = document.querySelector<HTMLButtonElement>('[title*="Tirar foto da câmera"]');
            btn?.click();
          }}
          isAnalyzingVision={isAnalyzingVision}
        />

        {/* BOTTOM PANELS GRID: TASK MANAGER & CHAT DRAWER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[480px]">
          {/* Task Manager Panel */}
          {isTasksOpen && (
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
          )}

          {/* Chat Transcript Panel */}
          {isChatOpen && (
            <ChatDrawer
              messages={messages}
              onSendMessage={handleUserMessage}
              isCallActive={isCallActive}
              isLoadingAi={isLoadingAi}
            />
          )}
        </div>
      </main>

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
