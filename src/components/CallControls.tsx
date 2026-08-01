import React from 'react';
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
  isTasksOpen: boolean;
  onToggleTasks: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onOpenAdviceModal: () => void;
  onAnalyzeCameraVision: () => void;
  isAnalyzingVision: boolean;
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
  isTasksOpen,
  onToggleTasks,
  isChatOpen,
  onToggleChat,
  onOpenAdviceModal,
  onAnalyzeCameraVision,
  isAnalyzingVision,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white flex flex-wrap items-center justify-center sm:justify-between gap-4 shadow-xl">
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

      {/* Center Call Primary Control (Matching Design Spec: w-20 h-20 rounded-full) */}
      <div className="flex items-center gap-3">
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
        {isCallActive && isVideoOn && (
          <button
            onClick={onAnalyzeCameraVision}
            disabled={isAnalyzingVision}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 flex items-center justify-center transition-all shadow-md"
            title="Enviar frame da câmera para a IA ver e comentar"
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
          title="Alternar Transcrição & Chat"
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
