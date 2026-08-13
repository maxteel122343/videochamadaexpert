import React from 'react';
import {
  Video,
  MessageSquare,
  CheckSquare,
  Settings,
  Bot,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type DesktopTab = 'call' | 'chat' | 'tasks';

interface DesktopSidebarProps {
  activeTab: DesktopTab;
  onSelectTab: (tab: DesktopTab) => void;
  isCallActive: boolean;
  onOpenSettings: () => void;
  onOpenAdviceModal: () => void;
  pendingTaskCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCallActive,
  onOpenSettings,
  onOpenAdviceModal,
  pendingTaskCount,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`hidden md:flex flex-col justify-between bg-slate-950 text-slate-300 border-r border-slate-800/80 p-3 shrink-0 select-none shadow-xl transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-16 lg:w-60'
      }`}
    >
      {/* Top Section: Logo & Main Navigation Icons */}
      <div className="space-y-6">
        {/* Brand Header + Collapse Button */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="hidden lg:block overflow-hidden">
                <h1 className="font-extrabold text-white text-sm tracking-tight leading-none">
                  IA Advisor
                </h1>
                <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-1">
                  Video & Task Copilot
                </p>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={isCollapsed ? 'Expandir Menu Lateral' : 'Ocultar / Minimizar Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800/80 mx-1" />

        {/* Organized Navigation Bar Icons */}
        <nav className="space-y-2">
          {/* 1. Icon Chamada de Vídeo (Horizontal Split: Left Cam, Right Chat) */}
          <button
            onClick={() => onSelectTab('call')}
            className={`w-full flex items-center gap-3.5 p-3 rounded-xl font-medium transition-all group ${
              activeTab === 'call'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/30 font-bold'
                : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
            title="Chamada de Vídeo (Dividida)"
          >
            <div className="relative shrink-0">
              <Video className="w-5 h-5" />
              {isCallActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
              )}
            </div>
            {!isCollapsed && (
              <span className="hidden lg:inline text-xs tracking-wide">
                {isCallActive ? 'Chamada Dividida (Ativa)' : 'Chamada de Vídeo'}
              </span>
            )}
          </button>

          {/* 2. Icon Chat com IA (Exclusivo Chat) */}
          <button
            onClick={() => onSelectTab('chat')}
            className={`w-full flex items-center gap-3.5 p-3 rounded-xl font-medium transition-all group ${
              activeTab === 'chat'
                ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/20 font-bold'
                : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
            title="Chat com IA (Apenas Chat)"
          >
            <MessageSquare className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="hidden lg:inline text-xs tracking-wide">Chat com IA</span>
            )}
          </button>

          {/* 3. Icon Lista de Cards & Tarefas (Exclusivo Cards) */}
          <button
            onClick={() => onSelectTab('tasks')}
            className={`w-full flex items-center justify-between p-3 rounded-xl font-medium transition-all group ${
              activeTab === 'tasks'
                ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-900/20 font-bold'
                : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
            title="Lista de Cards (Apenas Tarefas)"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <CheckSquare className="w-5 h-5" />
                {pendingTaskCount > 0 && (
                  <span className="lg:hidden absolute -top-1.5 -right-2 text-[9px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full font-bold border border-slate-900">
                    {pendingTaskCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="hidden lg:inline text-xs tracking-wide">Lista de Cards</span>
              )}
            </div>
            {!isCollapsed && pendingTaskCount > 0 && (
              <span className="hidden lg:inline text-[10px] bg-slate-800 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-slate-700">
                {pendingTaskCount}
              </span>
            )}
          </button>

          {/* 4. Icon Configurações & API */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all group"
            title="Configurações & Chave API"
          >
            <Settings className="w-5 h-5 shrink-0 group-hover:rotate-45 transition-transform duration-300" />
            {!isCollapsed && (
              <span className="hidden lg:inline text-xs tracking-wide">Configurações</span>
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Section: Quick AI Advice & Status */}
      <div className="space-y-3">
        <button
          onClick={onOpenAdviceModal}
          className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 transition-all flex items-center justify-center lg:justify-start gap-2.5 group shadow-sm"
          title="Conselho Proativo"
        >
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
          {!isCollapsed && (
            <span className="hidden lg:inline text-xs font-bold">Conselho de Produtividade</span>
          )}
        </button>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          {!isCollapsed && (
            <div className="hidden lg:block overflow-hidden">
              <p className="text-[11px] font-bold text-slate-200 leading-none">Gemini 2.5 Active</p>
              <p className="text-[9px] text-slate-400 mt-0.5 truncate">Chave Padrão Ativa</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

