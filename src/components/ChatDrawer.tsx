import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, CheckSquare, Camera, X } from 'lucide-react';
import { ChatMessage, Task } from '../types';

interface ChatDrawerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isCallActive: boolean;
  isLoadingAi: boolean;
  onClose?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  messages,
  onSendMessage,
  isCallActive,
  isLoadingAi,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAi]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoadingAi) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">TRANSCRIÇÃO & CHAT</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCallActive ? '● Transmitindo ao vivo via WebRTC' : 'Aguardando chamada'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center">
            <Sparkles className="w-8 h-8 mb-2 text-indigo-400/40" />
            <p className="font-semibold text-slate-600">Nenhuma conversa iniciada.</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Envie uma mensagem ou fale na chamada para receber conselhos e criar tarefas automaticamente!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                    : msg.sender === 'system'
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-xl font-medium'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-[10px] uppercase opacity-75">
                    {msg.sender === 'user'
                      ? 'Você'
                      : msg.sender === 'system'
                      ? '⚡ Sistema'
                      : 'IA Conselheira'}
                  </span>
                  <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                </div>

                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                {/* If AI created a new task automatically */}
                {msg.taskCreated && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-left bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px] mb-1">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Nova Tarefa Criada pela IA:</span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{msg.taskCreated.name}</p>
                    <div className="text-[10px] text-slate-600 mt-1 flex flex-wrap gap-2">
                      <span>⏱️ {msg.taskCreated.estimatedTime}</span>
                      <span>STATUS: <strong className="text-amber-700">{msg.taskCreated.status}</strong></span>
                    </div>
                  </div>
                )}

                {/* Vision analysis output */}
                {msg.visionAnalysis && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 text-left bg-purple-50 p-2 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-1 text-purple-700 font-bold text-[10px] mb-1">
                      <Camera className="w-3 h-3 text-purple-600" />
                      <span>Análise de Visão em Tempo Real:</span>
                    </div>
                    <p className="text-[11px] text-purple-900">{msg.visionAnalysis}</p>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoadingAi && (
          <div className="flex gap-2 items-center text-xs text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 w-max">
            <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
            <span>IA está gerando resposta e conselho...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          placeholder="Digite sua dúvida ou peça um conselho..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoadingAi}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoadingAi}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-400 transition shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
