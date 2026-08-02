import React, { useState } from 'react';
import { Video, Sparkles, Plus, Clock, Bell, CheckCircle2, Download, Settings } from 'lucide-react';
import { Task } from '../types';

interface HeaderProps {
  isCallActive: boolean;
  onToggleCall: () => void;
  onOpenNewTask: () => void;
  onOpenAdviceModal: () => void;
  onTestReminder: () => void;
  onOpenSettings: () => void;
  tasks: Task[];
  showTopHeader?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isCallActive,
  onToggleCall,
  onOpenNewTask,
  onOpenAdviceModal,
  onTestReminder,
  onOpenSettings,
  tasks,
  showTopHeader = true,
}) => {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  if (!showTopHeader) {
    return null;
  }

  const pendingCount = tasks.filter((t) => t.status === 'PENDENTE').length;
  const inProgressCount = tasks.filter((t) => t.status === 'A FAZER').length;
  const completedCount = tasks.filter((t) => t.status === 'CONCLUIDO').length;

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      const response = await fetch('/api/download-zip');
      if (!response.ok) {
        throw new Error('Falha no servidor ao gerar o arquivo ZIP');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projeto-completo-ia-videochamada.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Erro ao baixar o projeto em formato .ZIP. Tente novamente.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 text-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
      {/* App Branding */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl shadow-md text-white flex items-center justify-center">
            <Video className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg text-slate-900 tracking-tight">
                IA Videochamada
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                WebRTC Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Conselhos em tempo real & Lembrete automático de tarefas</p>
          </div>
        </div>

        {/* Mobile Call Button */}
        <button
          onClick={onToggleCall}
          className={`md:hidden px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            isCallActive
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
          {isCallActive ? 'Encerrar' : 'Iniciar Chamada'}
        </button>
      </div>

      {/* Task Counters Badges */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 font-medium whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>PENDENTE: <strong className="text-slate-900 font-bold">{pendingCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-medium whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>A FAZER: <strong className="text-slate-900 font-bold">{inProgressCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>CONCLUÍDO: <strong className="text-slate-900 font-bold">{completedCount}</strong></span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <button
          onClick={onOpenSettings}
          title="Configurações da IA Gemini, Chave de API e Voz da Chamada"
          className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Settings className="w-3.5 h-3.5 text-indigo-600" />
          <span>Configuração API</span>
        </button>

        <button
          onClick={handleDownloadZip}
          disabled={isDownloadingZip}
          title="Baixar o código fonte do projeto completo em arquivo .ZIP"
          className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <Download className={`w-3.5 h-3.5 text-emerald-600 ${isDownloadingZip ? 'animate-bounce' : ''}`} />
          <span>{isDownloadingZip ? 'Gerando ZIP...' : 'Baixar ZIP'}</span>
        </button>

        <button
          onClick={onTestReminder}
          title="Testa o alarme/lembrete da IA diretamente na chamada"
          className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Bell className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Testar Lembrete</span>
        </button>

        <button
          onClick={onOpenAdviceModal}
          className="px-3 py-2 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Pedir Conselho</span>
        </button>

        <button
          onClick={onOpenNewTask}
          className="px-3.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>

        <button
          onClick={onToggleCall}
          className={`hidden md:flex px-4 py-2 rounded-lg text-xs font-bold items-center gap-2 transition ${
            isCallActive
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-red-500 animate-ping' : 'bg-emerald-300'}`} />
          {isCallActive ? 'Encerrar Chamada' : 'Iniciar Chamada'}
        </button>
      </div>
    </header>
  );
};
