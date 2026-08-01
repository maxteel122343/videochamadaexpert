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
  inCallReminder: InCallReminder | null;
  onUpdateTaskStatus: (taskId: string, status: 'PENDENTE' | 'A FAZER' | 'CONCLUIDO') => void;
  onPostponeReminder: (taskId: string) => void;
  onAskTaskAdviceInCall: (task: Task) => void;
  onCaptureFrameAndAnalyze: (base64Image: string) => void;
  isAnalyzingVision: boolean;
  isMutedAI: boolean;
  onToggleMuteAI: () => void;
}

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

  return (
    <div className="relative w-full h-[520px] md:h-[600px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between p-4">
      {/* Offscreen Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP BAR OVERLAY: WebRTC Status & Mode */}
      <div className="z-10 flex items-center justify-between gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-xs text-white">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          <span className="font-medium text-slate-100 tracking-wide">
            WebRTC LIVE <span className="opacity-50 ml-2 font-normal hidden sm:inline">Low Latency</span>
          </span>
        </div>

        {/* AI Persona state tag & API badge */}
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

          <div className="hidden md:block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 text-[10px] font-mono">
            API: GEMINI LIVE
          </div>

          <button
            onClick={onToggleMuteAI}
            title={isMutedAI ? 'Ativar Voz da IA' : 'Silenciar Voz da IA'}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isMutedAI ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* MAIN STAGE: AI AVATAR OR IDLE SCREEN */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-6">
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
        ) : (
          /* Active Call AI Avatar Visualizer */
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Dynamic Glowing Avatar Orb (Matching Design Spec) */}
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-400 p-1 shadow-[0_0_80px_rgba(99,102,241,0.3)] transition-all duration-300">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
                <div className="relative flex items-center justify-center">
                  <div className={`w-36 h-36 md:w-44 md:h-44 border-4 border-indigo-400/30 rounded-full absolute ${aiState === 'SPEAKING' ? 'animate-ping' : ''}`} />
                  <div className={`w-36 h-36 md:w-44 md:h-44 border-2 border-indigo-400/50 rounded-full scale-110 opacity-50 absolute ${aiState === 'ALERT' ? 'animate-bounce' : ''}`} />
                  <div className="w-36 h-36 md:w-44 md:h-44 bg-slate-800 rounded-full flex flex-col items-center justify-center border border-white/10">
                    <Sparkles
                      className={`w-14 h-14 transition-all ${
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
              <div className="mt-6 text-center max-w-xl px-4">
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-[0.2em] mb-1">IA Conselheira</p>
                <h1 className="text-base md:text-lg text-white font-light leading-relaxed">
                  "{latestAiText}"
                </h1>
              </div>
            )}

            {/* Live User Speech Feedback Banner */}
            {interimTranscript && (
              <div className="mt-3 px-4 py-1.5 bg-cyan-950/80 border border-cyan-500/50 rounded-full text-cyan-200 text-xs animate-pulse flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                <span>Ouvindo você: "<strong>{interimTranscript}</strong>"</span>
              </div>
            )}

            {/* Direct Voice Input Button (Push-to-Talk / Click to Speak fallback) */}
            {onToggleVoiceRecording && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={onToggleVoiceRecording}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg ${
                    isRecordingAudio
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse border border-red-400'
                      : 'bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200'
                  }`}
                  title="Clique para falar e enviar áudio direto para a IA"
                >
                  <Mic className={`w-4 h-4 ${isRecordingAudio ? 'text-white' : 'text-indigo-300'}`} />
                  <span>{isRecordingAudio ? '🔴 Gravando Voz... (Clique para Concluir)' : '🎤 Clique para Falar com IA'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROACTIVE IN-CALL TASK REMINDER OVERLAY */}
        {isCallActive && inCallReminder && (
          <div className="absolute inset-x-4 top-16 z-30 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40 animate-bounce">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                      🔔 LEMBRETE AUTOMÁTICO NA CHAMADA
                    </span>
                    <span className="text-xs text-amber-300 font-mono">
                      {inCallReminder.task.estimatedTime && `⏱️ ${inCallReminder.task.estimatedTime}`}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {inCallReminder.task.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Horário agendado chegou! Status atual:{' '}
                    <strong className="text-amber-400">{inCallReminder.task.status}</strong>
                  </p>
                </div>
              </div>

              {/* Action buttons inside call overlay */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => onUpdateTaskStatus(inCallReminder.task.id, 'A FAZER')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Marcar "A Fazer"</span>
                </button>

                <button
                  onClick={() => onUpdateTaskStatus(inCallReminder.task.id, 'CONCLUIDO')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluir Tarefa</span>
                </button>

                <button
                  onClick={() => onAskTaskAdviceInCall(inCallReminder.task)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-300" />
                  <span>Pedir Conselho na Chamada</span>
                </button>

                <button
                  onClick={() => onPostponeReminder(inCallReminder.task.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                  title="Adiar por 5 minutos"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Adiar 5m</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIP: USER CAMERA VIDEO FEED */}
        {isCallActive && (
          <div className="absolute bottom-4 right-4 z-20 w-36 h-28 sm:w-48 sm:h-36 bg-slate-900/90 rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-2xl group flex flex-col justify-between p-1.5">
            {isVideoOn ? (
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs">
                <VideoOff className="w-6 h-6 mb-1 text-slate-600" />
                <span>Câmera Desligada</span>
              </div>
            )}

            {/* User PIP Overlay Details */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] text-white bg-slate-950/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
              <span className="font-semibold truncate">Você</span>
              <div className="flex items-center gap-1">
                {isMicOn ? (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[9px] text-emerald-300">{audioLevel}%</span>
                  </div>
                ) : (
                  <MicOff className="w-3 h-3 text-red-400" />
                )}
              </div>
            </div>

            {/* Quick Vision Scan Button on PIP */}
            {isVideoOn && (
              <button
                onClick={handleSnapVision}
                disabled={isAnalyzingVision}
                className="absolute bottom-2 left-2 right-2 py-1 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold flex items-center justify-center gap-1 shadow transition opacity-90 group-hover:opacity-100"
                title="Tirar foto da câmera e enviar para análise da IA"
              >
                <Camera className="w-3 h-3" />
                <span>{isAnalyzingVision ? 'Analisando...' : 'Analisar com IA'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* FOOTER BAR: Instant Call Status & Vision Trigger */}
      <div className="z-10 flex items-center justify-between text-xs text-slate-400 px-2">
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
