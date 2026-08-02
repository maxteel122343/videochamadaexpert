import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Bell,
  Sparkles,
  Camera,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Maximize2,
  Minimize2,
  Move,
  Layout,
  User,
  Bot,
} from 'lucide-react';
import { Task, InCallReminder } from '../types';

interface VideoCallStageProps {
  isCallActive: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  isMicOn: boolean;
  onToggleMic: () => void;
  isVideoOn: boolean;
  onToggleVideo: () => void;
  aiState: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ALERT';
  latestAiText: string;
  interimTranscript?: string;
  isRecordingAudio?: boolean;
  onToggleVoiceRecording?: () => void;
  isHandsFreeMode?: boolean;
  onToggleHandsFreeMode?: () => void;
  inCallReminder: InCallReminder | null;
  onUpdateTaskStatus: (taskId: string, status: 'PENDENTE' | 'A FAZER' | 'CONCLUIDO') => void;
  onPostponeReminder: (taskId: string) => void;
  onAskTaskAdviceInCall: (task: Task) => void;
  onCaptureFrameAndAnalyze: (base64Image: string) => void;
  isAnalyzingVision: boolean;
  isMutedAI: boolean;
  onToggleMuteAI: () => void;
}

type PipPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type PipSize = 'sm' | 'md' | 'lg';

export const VideoCallStage: React.FC<VideoCallStageProps> = ({
  isCallActive,
  onStartCall,
  onEndCall,
  isMicOn,
  onToggleMic,
  isVideoOn,
  onToggleVideo,
  aiState,
  latestAiText,
  interimTranscript,
  isRecordingAudio,
  onToggleVoiceRecording,
  isHandsFreeMode = true,
  onToggleHandsFreeMode,
  inCallReminder,
  onUpdateTaskStatus,
  onPostponeReminder,
  onAskTaskAdviceInCall,
  onCaptureFrameAndAnalyze,
  isAnalyzingVision,
  isMutedAI,
  onToggleMuteAI,
}) => {
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // States for user camera view mode & customization
  const [isUserCamPrimary, setIsUserCamPrimary] = useState<boolean>(false);
  const [pipPosition, setPipPosition] = useState<PipPosition>('bottom-right');
  const [pipSize, setPipSize] = useState<PipSize>('md');

  // Initialize camera stream when video is active
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let animFrame: number | null = null;

    if (isCallActive && isVideoOn) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
        .then((s) => {
          activeStream = s;
          setStream(s);
          setCameraError(null);
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = s;
          }

          // Audio level meter
          try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(s);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateMeter = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
              animFrame = requestAnimationFrame(updateMeter);
            };
            updateMeter();
          } catch (e) {
            console.warn('Audio meter init error', e);
          }
        })
        .catch((err) => {
          console.warn('Camera permission denied or unavailable:', err);
          setCameraError('Câmera indisponível ou permissão negada.');
          setStream(null);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (animFrame) cancelAnimationFrame(animFrame);
      if (audioCtx) audioCtx.close();
    };
  }, [isCallActive, isVideoOn]);

  // Ensure stream stays bound to video ref if view mode changes
  useEffect(() => {
    if (stream && userVideoRef.current) {
      userVideoRef.current.srcObject = stream;
    }
  }, [isUserCamPrimary, stream]);

  // Capture current user video frame to base64 JPEG
  const handleSnapVision = () => {
    if (!userVideoRef.current || !canvasRef.current) return;
    const video = userVideoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCaptureFrameAndAnalyze(dataUrl);
    }
  };

  // Move PIP box to next position corner
  const cyclePipPosition = () => {
    const positions: PipPosition[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    const nextIdx = (positions.indexOf(pipPosition) + 1) % positions.length;
    setPipPosition(positions[nextIdx]);
  };

  // Helper classes for PIP sizing
  const getPipSizeClasses = () => {
    switch (pipSize) {
      case 'sm':
        return 'w-32 h-24 sm:w-40 sm:h-28';
      case 'lg':
        return 'w-64 h-48 sm:w-80 sm:h-60';
      case 'md':
      default:
        return 'w-44 h-32 sm:w-56 sm:h-40';
    }
  };

  // Helper classes for PIP position
  const getPipPositionClasses = () => {
    switch (pipPosition) {
      case 'bottom-left':
        return 'bottom-12 left-4';
      case 'top-left':
        return 'top-14 left-4';
      case 'top-right':
        return 'top-14 right-4';
      case 'bottom-right':
      default:
        return 'bottom-12 right-4';
    }
  };

  return (
    <div className="relative w-full h-[520px] md:h-[620px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between p-3.5 select-none">
      {/* Offscreen Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP BAR OVERLAY: WebRTC Status & Mode Controls */}
      <div className="z-30 flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <span className="font-medium text-slate-100 tracking-wide">
            WebRTC LIVE <span className="opacity-50 ml-2 font-normal hidden sm:inline">Low Latency</span>
          </span>
        </div>

        {/* AI Persona state tag & View Mode Toggle */}
        <div className="flex items-center gap-2">
          {aiState === 'LISTENING' && (
            <span className="flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 animate-pulse font-medium">
              <Mic className="w-3 h-3" /> Ouvindo você...
            </span>
          )}
          {aiState === 'THINKING' && (
            <span className="flex items-center gap-1 text-[11px] text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30 animate-pulse font-medium">
              <Sparkles className="w-3 h-3 animate-spin" /> IA Processando...
            </span>
          )}
          {aiState === 'SPEAKING' && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              <Volume2 className="w-3 h-3 animate-bounce" /> IA Falando
            </span>
          )}
          {aiState === 'ALERT' && (
            <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-bold animate-bounce">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> LEMBRETE ATIVO!
            </span>
          )}

          {/* Toggle Primary View: User Camera vs AI Stage */}
          {isCallActive && isVideoOn && (
            <button
              onClick={() => setIsUserCamPrimary(!isUserCamPrimary)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 border ${
                isUserCamPrimary
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title={isUserCamPrimary ? 'Alternar para IA no Estágio Principal' : 'Expansão: Deixar Câmera do Usuário na Tela Toda'}
            >
              {isUserCamPrimary ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isUserCamPrimary ? 'Ver IA no Estágio' : 'Câmera do Usuário na Tela Toda'}
              </span>
            </button>
          )}

          <button
            onClick={onToggleMuteAI}
            title={isMutedAI ? 'Ativar Voz da IA' : 'Silenciar Voz da IA'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isMutedAI ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* MAIN STAGE CONTAINER */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-2 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
        {!isCallActive ? (
          /* Pre-call Welcome Screen */
          <div className="text-center max-w-md px-4 py-8 z-10 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-400 p-1 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-light text-white mb-2">
              Pronto para conversar com a IA?
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Inicie a videochamada em tempo real para pedir conselhos de produtividade, criar tarefas faladas e receber lembretes automáticos na chamada aberta.
            </p>

            <button
              onClick={onStartCall}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:scale-105"
            >
              <VideoIcon className="w-5 h-5" />
              <span>Entrar na Videochamada WebRTC</span>
            </button>
          </div>
        ) : isUserCamPrimary && isVideoOn ? (
          /* MODE A: FULL USER CAMERA STAGE BACKGROUND */
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* AI Avatar Floating PIP Badge in Upper Corner */}
            <div className="absolute top-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className={`w-5 h-5 text-white ${aiState === 'SPEAKING' ? 'animate-bounce' : ''}`} />
                {aiState === 'SPEAKING' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">IA Conselheira</p>
                <p className="text-xs text-white font-medium">
                  {aiState === 'SPEAKING' ? 'Falando agora...' : aiState === 'LISTENING' ? 'Ouvindo você...' : 'Online na Chamada'}
                </p>
              </div>
            </div>

            {/* Subtitles Overlay over user video */}
            {latestAiText && (
              <div className="absolute bottom-6 inset-x-4 z-20 mx-auto max-w-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl text-center shadow-2xl">
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">IA Conselheira</p>
                <p className="text-sm md:text-base text-white font-medium leading-tight">
                  "{latestAiText}"
                </p>
              </div>
            )}
          </div>
        ) : (
          /* MODE B: STANDARD AI AVATAR STAGE */
          <div className="w-full h-full flex flex-col items-center justify-center relative p-4 overflow-y-auto">
            {/* Dynamic Glowing Avatar Orb */}
            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-400 p-1 shadow-[0_0_80px_rgba(99,102,241,0.3)] transition-all duration-300 shrink-0">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
                <div className="relative flex items-center justify-center">
                  <div className={`w-28 h-28 sm:w-36 sm:h-36 border-4 border-indigo-400/30 rounded-full absolute ${aiState === 'SPEAKING' ? 'animate-ping' : ''}`} />
                  <div className={`w-28 h-28 sm:w-36 sm:h-36 border-2 border-indigo-400/50 rounded-full scale-110 opacity-50 absolute ${aiState === 'ALERT' ? 'animate-bounce' : ''}`} />
                  <div className="w-28 h-28 sm:w-36 sm:h-36 bg-slate-800 rounded-full flex flex-col items-center justify-center border border-white/10">
                    <Sparkles
                      className={`w-10 h-10 sm:w-12 sm:h-12 transition-all ${
                        aiState === 'SPEAKING'
                          ? 'text-indigo-400 scale-110'
                          : aiState === 'ALERT'
                          ? 'text-amber-400 animate-bounce'
                          : 'text-white opacity-90'
                      }`}
                    />
                    {aiState === 'SPEAKING' && (
                      <div className="flex items-end gap-1 mt-2 h-3">
                        <span className="w-1 bg-indigo-400 rounded-full h-2 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 bg-purple-400 rounded-full h-3 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 bg-pink-400 rounded-full h-2.5 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="w-1 bg-indigo-400 rounded-full h-3 animate-bounce" style={{ animationDelay: '100ms' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Voice Subtitles */}
            {latestAiText && (
              <div className="mt-3 text-center max-w-xl px-3 shrink-0">
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">IA Conselheira</p>
                <h1 className="text-sm md:text-base text-white font-light leading-snug">
                  "{latestAiText}"
                </h1>
              </div>
            )}

            {/* Live User Speech Feedback & Hands-Free Mode Banner */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 shrink-0">
              {interimTranscript ? (
                <div className="px-3 py-1 bg-cyan-950/90 border border-cyan-500/60 rounded-full text-cyan-200 text-xs animate-pulse flex items-center gap-1.5 shadow-lg">
                  <Mic className="w-3 h-3 text-cyan-400 animate-bounce" />
                  <span>Ouvindo: "<strong>{interimTranscript}</strong>"</span>
                </div>
              ) : isHandsFreeMode ? (
                <div className="px-2.5 py-0.5 bg-emerald-950/70 border border-emerald-500/50 rounded-full text-emerald-300 text-[10px] flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Modo Mãos Livres ON</span>
                </div>
              ) : (
                <div className="px-2.5 py-0.5 bg-slate-800/80 border border-slate-600/50 rounded-full text-slate-300 text-[10px] flex items-center gap-1.5">
                  <MicOff className="w-3 h-3 text-slate-400" />
                  <span>Mãos Livres OFF</span>
                </div>
              )}

              {onToggleHandsFreeMode && (
                <button
                  onClick={onToggleHandsFreeMode}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                    isHandsFreeMode
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400/50 shadow-md'
                  }`}
                  title="Alternar Modo Mãos Livres"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isHandsFreeMode ? 'Mãos Livres ON' : 'Ativar Mãos Livres'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PROACTIVE IN-CALL TASK REMINDER OVERLAY */}
        {isCallActive && inCallReminder && (
          <div className="absolute inset-x-4 top-14 z-40 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-2 border-amber-500/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40 animate-bounce">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                      🔔 LEMBRETE AUTOMÁTICO
                    </span>
                    <span className="text-xs text-amber-300 font-mono">
                      {inCallReminder.task.estimatedTime && `⏱️ ${inCallReminder.task.estimatedTime}`}
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white mt-1">
                    {inCallReminder.task.name}
                  </h3>
                </div>
              </div>

              {/* Action buttons inside call overlay */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => onUpdateTaskStatus(inCallReminder.task.id, 'A FAZER')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Marcar "A Fazer"</span>
                </button>

                <button
                  onClick={() => onUpdateTaskStatus(inCallReminder.task.id, 'CONCLUIDO')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluir</span>
                </button>

                <button
                  onClick={() => onPostponeReminder(inCallReminder.task.id)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                  title="Adiar por 5 minutos"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Adiar 5m</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING USER PIP CAMERA (WHEN AI IS PRIMARY STAGE) */}
        {isCallActive && !isUserCamPrimary && (
          <div
            className={`absolute z-20 bg-slate-950/95 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl group flex flex-col justify-between p-1 transition-all duration-300 ${getPipSizeClasses()} ${getPipPositionClasses()}`}
          >
            {isVideoOn ? (
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs">
                <VideoOff className="w-6 h-6 mb-1 text-slate-600" />
                <span>Câmera Desligada</span>
              </div>
            )}

            {/* Top Info Tag & Move / Size Controls */}
            <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] text-white bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
              <span className="font-semibold truncate">Você</span>
              <div className="flex items-center gap-1">
                {/* Reposition Corner Button */}
                <button
                  onClick={cyclePipPosition}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                  title="Mover Câmera de Canto (Direita/Esquerda/Topo/Base)"
                >
                  <Move className="w-3 h-3" />
                </button>

                {/* Resize PIP Button */}
                <button
                  onClick={() => {
                    const sizes: PipSize[] = ['sm', 'md', 'lg'];
                    const next = sizes[(sizes.indexOf(pipSize) + 1) % sizes.length];
                    setPipSize(next);
                  }}
                  className="p-0.5 rounded hover:bg-slate-800 text-indigo-300 hover:text-indigo-200"
                  title={`Aumentar/Diminuir Tamanho da Câmera (Atual: ${pipSize.toUpperCase()})`}
                >
                  <Layout className="w-3 h-3" />
                </button>

                {/* Expand to Full Stage Button */}
                <button
                  onClick={() => setIsUserCamPrimary(true)}
                  className="p-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                  title="Expandir Câmera do Usuário na Tela Toda"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Vision Analysis Trigger */}
            {isVideoOn && (
              <button
                onClick={handleSnapVision}
                disabled={isAnalyzingVision}
                className="absolute bottom-1.5 left-1.5 right-1.5 py-1 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 shadow transition opacity-90 group-hover:opacity-100"
                title="Enviar foto da câmera para análise da IA"
              >
                <Camera className="w-3 h-3" />
                <span>{isAnalyzingVision ? 'Analisando...' : 'Analisar Foto'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* FOOTER BAR: Instant Call Status & Vision Trigger */}
      <div className="z-10 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>Modo: <strong className="text-slate-200">Videochamada com Lembretes</strong></span>
        </div>
        {cameraError && (
          <span className="text-red-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {cameraError}
          </span>
        )}
      </div>
    </div>
  );
};

