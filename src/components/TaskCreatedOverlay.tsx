import React from 'react';
import { Sparkles, CheckCircle2, Clock, Tag, Play, CheckSquare, X } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface TaskCreatedOverlayProps {
  task: Task | null;
  onConfirmStatus: (status: TaskStatus) => void;
  onDismiss: () => void;
}

export const TaskCreatedOverlay: React.FC<TaskCreatedOverlayProps> = ({
  task,
  onConfirmStatus,
  onDismiss,
}) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-500 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 text-white p-5 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 animate-pulse">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30">
                Criada Pela IA
              </span>
              <h3 className="font-bold text-lg text-white mt-0.5">Nova Tarefa em Destaque</h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Card Details */}
        <div className="p-6 space-y-4 text-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-base text-slate-900 leading-snug">{task.name}</h4>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {task.category && (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-500" /> {task.category}
                </span>
              )}
              {task.estimatedTime && (
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" /> {task.estimatedTime}
                </span>
              )}
              {task.startDate && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">
                  Agendado: {task.startDate.replace('T', ' ')}
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️ Áudio da IA pausado enquanto esta tarefa estiver na tela.</span>
            </p>
            <p className="text-[11px] text-amber-800/90 mt-1">
              Clique em um dos botões abaixo para definir o status da tarefa e liberar o microfone/áudio:
            </p>
          </div>

          {/* Status Confirmation Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => onConfirmStatus('PENDENTE')}
              className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex flex-col items-center justify-center gap-1 border border-slate-300"
            >
              <Clock className="w-4 h-4 text-slate-600" />
              <span>PENDENTE</span>
            </button>

            <button
              onClick={() => onConfirmStatus('A FAZER')}
              className="py-2.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-md"
            >
              <Play className="w-4 h-4 text-white" />
              <span>A FAZER</span>
            </button>

            <button
              onClick={() => onConfirmStatus('CONCLUIDO')}
              className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>CONCLUÍDO</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">A IA aguarda sua confirmação</span>
          <button
            onClick={() => onConfirmStatus(task.status || 'A FAZER')}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition"
          >
            OK, Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
