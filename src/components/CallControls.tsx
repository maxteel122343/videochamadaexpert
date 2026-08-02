import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MessageSquare,
  CheckSquare,
  PhoneOff,
  PhoneCall,
  Sparkles,
  Camera,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CallControlsProps {
  isCallActive: boolean;
  onToggleCall: () => void;
  isMicOn: boolean;
  onToggleMic: () => void;
  isVideoOn: boolean;
  onToggleVideo: () => void;
  isMutedAI: boolean;
  onToggleMuteAI: () => void;
  isHandsFreeMode?: boolean;
  onToggleHandsFreeMode?: () => void;
  isTasksOpen: boolean;
  onToggleTasks: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onOpenAdviceModal: () => void;
  onAnalyzeCameraVision: () => void;
  isAnalyzingVision: boolean;
  isRecordingAudio?: boolean;
  onToggleVoiceRecording?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isCallActive,
  onToggleCall,
  isMicOn,
  onToggleMic,
  isVideoOn,
  onToggleVideo,
  isMutedAI,
  onToggleMuteAI,
  isHandsFreeMode = true,
  onToggleHandsFreeMode,
  isTasksOpen,
  onToggleTasks,
  isChatOpen,
  onToggleChat,
  onOpenAdviceModal,
  onAnalyzeCameraVision,
  isAnalyzingVision,
  isRecordingAudio,
  onToggleVoiceRecording,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Compact Minimized Bar
  if (isMinimized) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-full px-4 py-2 text-white flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCall}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              isCallActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}
            title={isCallActive ? 'Encerrar Chamada' : 'Iniciar Chamada'}
          >
            {isCallActive ? <PhoneOff className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleMic}
            disabled={!isCallActive}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isMicOn ? 'bg-slate-800 text-white' : 'bg-red-500/30 text-red-400'
            }`}
            title="Alternar Microfone"
          >
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {onToggleVoiceRecording && (
            <button
              onClick={onToggleVoiceRecording}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                isRecordingAudio ? 'bg-red-600 text-white animate-pulse' : 'bg-indigo-600 text-white'
              }`}
              title="Clique para Falar com a IA"
            >
              <Mic className="w-3 h-3" />
              <span>{isRecordingAudio ? 'Gravando...' : 'Falar'}</span>
            </button>
          )}

          <button
            onClick={onToggleMuteAI}
            disabled={!isCallActive}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300"
            title="Mudar Áudio IA"
          >
            {isMutedAI ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 transition flex items-center gap-1 text-xs font-bold px-2.5"
          title="Expandir Painel Completo de Controles"
        >
          <span>Controles</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Full Control Panel Modal Box
  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white flex flex-wrap items-center justify-center sm:justify-between gap-4 shadow-xl">
      {/* Top Header Minimize Icon */}
      <button
        onClick={() => setIsMinimized(true)}
        className="absolute top-2 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 text-[11px] font-medium"
        title="Minimizar este painel de controles"
      >
        <span>Minimizar</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Left Media Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMic}
          disabled={!isCallActive}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
            !isCallActive
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
              : isMicOn
              ? 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700'
              : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
          }`}
          title={isMicOn ? 'Desativar Microfone' : 'Ativar Microfone'}
        >
          {isMicOn ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
        </button>

        {/* Dedicated "Falar com IA" (Push To Talk / Voice Recording Mic Icon) */}
        {onToggleVoiceRecording && (
          <button
            onClick={onToggleVoiceRecording}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md border ${
              isRecordingAudio
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40'
            }`}
            title="Clique para Gravar Voz e Falar com a IA"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">{isRecordingAudio ? 'Gravando...' : '🎤 Falar com IA'}</span>
          </button>
        )}

        {onToggleHandsFreeMode && (
          <button
            onClick={onToggleHandsFreeMode}
            disabled={!isCallActive || !isMicOn}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-sm ${
              !isCallActive || !isMicOn
                ? 'bg-slate-800/50 text-slate-600 border-white/5 cursor-not-allowed'
                : isHandsFreeMode
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900/80'
                : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700'
            }`}
            title={isHandsFreeMode ? 'Mãos Livres Ativo: Fale diretamente sem clicar' : 'Ativar Conversa Mãos Livres Contínua'}
          >
            <span className={`w-2 h-2 rounded-full ${isHandsFreeMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="hidden lg:inline">{isHandsFreeMode ? 'Mãos Livres: ON' : 'Mãos Livres: OFF'}</span>
          </button>
        )}

        <button
          onClick={onToggleVideo}
          disabled={!isCallActive}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
            !isCallActive
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
              : isVideoOn
              ? 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700'
              : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
          }`}
          title={isVideoOn ? 'Desativar Câmera' : 'Ativar Câmera'}
        >
          {isVideoOn ? <VideoIcon className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
        </button>

        <button
          onClick={onToggleMuteAI}
          disabled={!isCallActive}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
            !isCallActive
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
              : !isMutedAI
              ? 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
          }`}
          title={isMutedAI ? 'Ativar Áudio da IA' : 'Silenciar IA'}
        >
          {isMutedAI ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
        </button>
      </div>

      {/* Center Call Primary Control (Matching Design Spec: w-16 to w-20 rounded-full) */}
      <div className="flex items-center gap-3 my-1">
        <button
          onClick={onToggleCall}
          className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-xl ${
            isCallActive
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
          }`}
          title={isCallActive ? 'Encerrar Chamada' : 'Iniciar Chamada'}
        >
          {isCallActive ? (
            <PhoneOff className="w-7 h-7 md:w-8 md:h-8" />
          ) : (
            <PhoneCall className="w-7 h-7 md:w-8 md:h-8" />
          )}
        </button>
      </div>

      {/* Right Feature & Panel Controls */}
      <div className="flex items-center gap-3">
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white flex items-center justify-center transition-all shadow-md"
            title={isFullscreen ? 'Sair do Modo Tela Cheia' : 'Modo Tela Cheia (Câmera & Chamada)'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-300" /> : <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        )}

        {isCallActive && isVideoOn && (
          <button
            onClick={onAnalyzeCameraVision}
            disabled={isAnalyzingVision}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 flex items-center justify-center transition-all shadow-md"
            title="Enviar foto da câmera para a IA ver e analisar"
          >
            <Camera className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        <button
          onClick={onOpenAdviceModal}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600/30 flex items-center justify-center transition-all"
          title="Pedir Conselhos de Produtividade"
        >
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
        </button>

        <button
          onClick={onToggleChat}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
            isChatOpen
              ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-md'
              : 'bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700'
          }`}
          title={isChatOpen ? 'Ocultar Chat (Expande Câmera)' : 'Exibir Chat'}
        >
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <button
          onClick={onToggleTasks}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
            isTasksOpen
              ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-md'
              : 'bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700'
          }`}
          title="Alternar Painel de Tarefas"
        >
          <CheckSquare className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};

