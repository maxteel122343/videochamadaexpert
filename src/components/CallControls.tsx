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
  Bot,
  User,
  Bell,
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
  aiState?: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ALERT';
  isUserCamPrimary?: boolean;
  onToggleUserCamPrimary?: () => void;
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
  aiState,
  isUserCamPrimary,
  onToggleUserCamPrimary,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Compact Minimized Bar
  if (isMinimized) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-white flex items-center justify-between gap-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 max-w-full overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
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

          {/* AI Status Badge inside Minimized Control */}
          {aiState === 'LISTENING' && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30 font-medium">
              <Mic className="w-3 h-3 text-cyan-400 animate-pulse" /> Ouvindo...
            </span>
          )}
          {aiState === 'SPEAKING' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" /> Falando
            </span>
          )}

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
          className="p-1.5 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 transition flex items-center gap-1 text-xs font-bold px-2.5 shrink-0"
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
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 text-white flex flex-col gap-3 shadow-2xl max-w-full overflow-hidden">
      {/* INTEGRATED STATUS BAR & VIEW TOGGLE (Replaces the old top modal overlay) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 text-xs">
        {/* WebRTC Status & AI Persona State Tag */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border border-white/10">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span className="font-bold text-[11px] text-slate-200">WebRTC LIVE</span>
          </div>

          {aiState === 'LISTENING' && (
            <span className="flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 animate-pulse font-medium">
              <Mic className="w-3 h-3 text-cyan-400" /> Ouvindo você...
            </span>
          )}
          {aiState === 'THINKING' && (
            <span className="flex items-center gap-1 text-[11px] text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30 animate-pulse font-medium">
              <Sparkles className="w-3 h-3 text-purple-400 animate-spin" /> IA Processando...
            </span>
          )}
          {aiState === 'SPEAKING' && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" /> IA Falando
            </span>
          )}
          {aiState === 'ALERT' && (
            <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-bold animate-bounce">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> LEMBRETE ATIVO!
            </span>
          )}
        </div>

        {/* View Toggle Button: Ver IA no Estágio vs Câmera na Tela Toda */}
        <div className="flex items-center gap-2">
          {onToggleUserCamPrimary && isCallActive && isVideoOn && (
            <button
              onClick={onToggleUserCamPrimary}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isUserCamPrimary
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
              title={isUserCamPrimary ? 'Alternar para IA no Estágio Principal' : 'Ver Câmera do Usuário na Tela Toda'}
            >
              {isUserCamPrimary ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isUserCamPrimary ? 'Ver IA no Estágio' : 'Câmera na Tela Toda'}
              </span>
            </button>
          )}

          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 text-[11px] font-medium"
            title="Minimizar este painel de controles"
          >
            <span className="hidden sm:inline">Minimizar</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CONTROLS BUTTONS ROW (Fully Responsive for Mobile Viewports) */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 w-full">
        {/* Left Media Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            onClick={onToggleMic}
            disabled={!isCallActive}
            className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
              !isCallActive
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                : isMicOn
                ? 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700'
                : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
            }`}
            title={isMicOn ? 'Desativar Microfone' : 'Ativar Microfone'}
          >
            {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
          </button>

          {/* Dedicated "Falar com IA" */}
          {onToggleVoiceRecording && (
            <button
              onClick={onToggleVoiceRecording}
              className={`px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md border shrink-0 ${
                isRecordingAudio
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40'
              }`}
              title="Clique para Gravar Voz e Falar com a IA"
            >
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[11px] sm:text-xs">{isRecordingAudio ? 'Gravando...' : 'Falar'}</span>
            </button>
          )}

          {onToggleHandsFreeMode && (
            <button
              onClick={onToggleHandsFreeMode}
              disabled={!isCallActive || !isMicOn}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-sm shrink-0 ${
                !isCallActive || !isMicOn
                  ? 'bg-slate-800/50 text-slate-600 border-white/5 cursor-not-allowed'
                  : isHandsFreeMode
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900/80'
                  : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700'
              }`}
              title={isHandsFreeMode ? 'Mãos Livres Ativo: Fale diretamente sem clicar' : 'Ativar Conversa Mãos Livres Contínua'}
            >
              <span className={`w-2 h-2 rounded-full ${isHandsFreeMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="hidden md:inline">{isHandsFreeMode ? 'Mãos Livres ON' : 'Mãos Livres OFF'}</span>
            </button>
          )}

          <button
            onClick={onToggleVideo}
            disabled={!isCallActive}
            className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
              !isCallActive
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                : isVideoOn
                ? 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700'
                : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
            }`}
            title={isVideoOn ? 'Desativar Câmera' : 'Ativar Câmera'}
          >
            {isVideoOn ? <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
          </button>

          <button
            onClick={onToggleMuteAI}
            disabled={!isCallActive}
            className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
              !isCallActive
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                : !isMutedAI
                ? 'bg-slate-800 border border-white/10 text-white hover:bg-slate-700'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title={isMutedAI ? 'Ativar Áudio da IA' : 'Silenciar IA'}
          >
            {isMutedAI ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
          </button>
        </div>

        {/* Center Call Primary Control */}
        <div className="flex items-center justify-center shrink-0">
          <button
            onClick={onToggleCall}
            className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-xl ${
              isCallActive
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
            }`}
            title={isCallActive ? 'Encerrar Chamada' : 'Iniciar Chamada'}
          >
            {isCallActive ? (
              <PhoneOff className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            ) : (
              <PhoneCall className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            )}
          </button>
        </div>

        {/* Right Feature & Panel Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white flex items-center justify-center transition-all shadow-md shrink-0"
              title={isFullscreen ? 'Sair do Modo Tela Cheia' : 'Modo Tela Cheia (Câmera & Chamada)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-300" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
            </button>
          )}

          {isCallActive && isVideoOn && (
            <button
              onClick={onAnalyzeCameraVision}
              disabled={isAnalyzingVision}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 flex items-center justify-center transition-all shadow-md shrink-0"
              title="Enviar foto da câmera para a IA ver e analisar"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
          )}

          <button
            onClick={onOpenAdviceModal}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600/30 flex items-center justify-center transition-all shrink-0"
            title="Pedir Conselhos de Produtividade"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-300" />
          </button>

          <button
            onClick={onToggleChat}
            className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isChatOpen
                ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-md'
                : 'bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700'
            }`}
            title={isChatOpen ? 'Ocultar Chat' : 'Exibir Chat'}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={onToggleTasks}
            className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isTasksOpen
                ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-md'
                : 'bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700'
            }`}
            title="Alternar Painel de Tarefas"
          >
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

