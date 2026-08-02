import React from 'react';
import { Video, MessageSquare, CheckSquare, Settings } from 'lucide-react';

export type MobileTab = 'call' | 'chat' | 'tasks' | 'settings';

interface MobileNavigationProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  isCallActive: boolean;
  pendingTaskCount?: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onSelectTab,
  isCallActive,
  pendingTaskCount = 0,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 px-3 py-2 shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Video Call Icon */}
        <button
          onClick={() => onSelectTab('call')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'call'
              ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Chamada de Vídeo"
        >
          <div className="relative">
            <Video className="w-5 h-5" />
            {isCallActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
            )}
          </div>
          <span className="text-[10px] mt-1">Chamada</span>
        </button>

        {/* 2. AI Chat Icon */}
        <button
          onClick={() => onSelectTab('chat')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Chat com IA"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-1">Chat IA</span>
        </button>

        {/* 3. Task Cards List Icon */}
        <button
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Lista de Cards e Tarefas"
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5" />
            {pendingTaskCount > 0 && (
              <span className="absolute -top-1.5 -right-2 text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full font-bold border border-slate-900">
                {pendingTaskCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Tarefas</span>
        </button>

        {/* 4. Settings Icon */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Configurações & API"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1">Config</span>
        </button>
      </div>
    </nav>
  );
};
