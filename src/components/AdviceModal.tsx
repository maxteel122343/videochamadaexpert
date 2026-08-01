import React from 'react';
import { Sparkles, X, Zap, Clock, Briefcase, Heart, ArrowRight } from 'lucide-react';
import { SAMPLE_ADVICE_TOPICS } from '../data/initialTasks';

interface AdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const AdviceModal: React.FC<AdviceModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-indigo-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-purple-400" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-pink-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-lg text-white">Pedir Conselho à IA na Chamada</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Escolha um dos tópicos abaixo ou pergunte qualquer dúvida durante a videochamada. A IA responderá com voz em tempo real e criará tarefas automaticamente se você desejar.
        </p>

        <div className="space-y-2.5">
          {SAMPLE_ADVICE_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                onSelectPrompt(topic.prompt);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:bg-purple-900/40 transition">
                {getIcon(topic.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                    {topic.title}
                  </h4>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{topic.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
