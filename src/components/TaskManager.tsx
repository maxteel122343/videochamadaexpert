import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Tag,
  AlertCircle,
  X,
  Bell,
  Check,
  Play,
  Filter,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onAskAdviceForTask: (task: Task) => void;
  onTestReminderForTask: (task: Task) => void;
  isOpenModal: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onAskAdviceForTask,
  onTestReminderForTask,
  isOpenModal,
  onOpenModal,
  onCloseModal,
}) => {
  const [filter, setFilter] = useState<'TODAS' | TaskStatus>('TODAS');

  // Form State
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const endObj = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultEnd = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}T${pad(endObj.getHours())}:${pad(endObj.getMinutes())}`;

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [estimatedTime, setEstimatedTime] = useState('30 minutos');
  const [status, setStatus] = useState<TaskStatus>('PENDENTE');
  const [priority, setPriority] = useState<TaskPriority>('média');
  const [category, setCategory] = useState('Estudos');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddTask({
      name: name.trim(),
      startDate,
      endDate,
      estimatedTime,
      status,
      priority,
      category,
      notes: notes.trim(),
    });

    // Reset Form
    setName('');
    setEstimatedTime('30 minutos');
    setStatus('PENDENTE');
    onCloseModal();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'TODAS') return true;
    return t.status === filter;
  });

  const getStatusBadge = (st: TaskStatus) => {
    switch (st) {
      case 'PENDENTE':
        return (
          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase tracking-wider">
            PENDENTE
          </span>
        );
      case 'A FAZER':
        return (
          <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold uppercase tracking-wider">
            A FAZER
          </span>
        );
      case 'CONCLUIDO':
        return (
          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase tracking-wider">
            CONCLUÍDO
          </span>
        );
    }
  };

  const getPriorityBadge = (pr?: TaskPriority) => {
    switch (pr) {
      case 'alta':
        return <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Alta</span>;
      case 'média':
        return <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Média</span>;
      default:
        return <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Baixa</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 flex flex-col h-full shadow-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">SUAS TAREFAS</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão por IA Inteligente</p>
        </div>

        <button
          onClick={onOpenModal}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 text-xs mb-3 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
        {(['TODAS', 'PENDENTE', 'A FAZER', 'CONCLUIDO'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`flex-1 py-1 rounded-lg font-medium transition text-center ${
              filter === st
                ? 'bg-white text-slate-900 shadow-xs font-semibold border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {st === 'TODAS' ? 'Todas' : st}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center">
            <AlertCircle className="w-8 h-8 mb-2 text-slate-300" />
            <p>Nenhuma tarefa encontrada no filtro "{filter}".</p>
            <button
              onClick={onOpenModal}
              className="mt-3 text-indigo-600 hover:underline font-semibold"
            >
              + Adicionar primeira tarefa
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isActive = task.status === 'A FAZER';
            const isCompleted = task.status === 'CONCLUIDO';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl transition-all ${
                  isCompleted
                    ? 'border border-emerald-100 bg-emerald-50/50'
                    : isActive
                    ? 'border-2 border-indigo-500 bg-white shadow-md ring-4 ring-indigo-50'
                    : 'border border-slate-100 bg-white shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                      {task.category && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-slate-400" /> {task.category}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`font-semibold text-sm ${
                        isCompleted ? 'line-through text-slate-500 italic' : 'text-slate-800'
                      }`}
                    >
                      {task.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-slate-50 transition"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Timing & Progress Bar */}
                <div className="mt-2.5">
                  <p className="text-[11px] text-slate-500">
                    Início: {task.startDate.replace('T', ' ')} | Término: {task.endDate.replace('T', ' ')}
                  </p>

                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500 w-full'
                            : isActive
                            ? 'bg-indigo-500 w-1/2'
                            : 'bg-slate-300 w-0'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {task.estimatedTime || '1h'}
                    </span>
                  </div>
                </div>

                {task.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                    "{task.notes}"
                  </p>
                )}

                {/* Action Toolbar on Card */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Status Switcher */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'PENDENTE')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        task.status === 'PENDENTE'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      Pendente
                    </button>
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'A FAZER')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        task.status === 'A FAZER'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      A Fazer
                    </button>
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'CONCLUIDO')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        task.status === 'CONCLUIDO'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      Concluído
                    </button>
                  </div>

                  {/* AI & Reminder triggers */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTestReminderForTask(task)}
                      title="Disparar alarme/lembrete da IA na chamada agora para testar"
                      className="p-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[10px] font-semibold flex items-center gap-1 transition"
                    >
                      <Bell className="w-3 h-3 text-amber-600" />
                      <span className="hidden sm:inline">Lembrete</span>
                    </button>

                    <button
                      onClick={() => onAskAdviceForTask(task)}
                      title="Pedir ajuda à IA sobre como realizar esta tarefa"
                      className="p-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[10px] font-semibold flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>Conselho</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100">
        <button
          onClick={onOpenModal}
          className="w-full py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          + Criar Nova Tarefa
        </button>
      </div>

      {/* CREATE TASK MODAL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900">Criar Nova Tarefa</h3>
              </div>
              <button
                onClick={onCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consultoria Estratégica"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data e Hora Início *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data e Hora Término *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tempo Estimado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2 horas"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="A FAZER">A FAZER</option>
                    <option value="CONCLUIDO">CONCLUIDO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria / Notas
                </label>
                <input
                  type="text"
                  placeholder="Ex: Estudos, Trabalho, Pessoal..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
