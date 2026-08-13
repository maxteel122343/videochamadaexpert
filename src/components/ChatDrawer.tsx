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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoadingAi]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoadingAi) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="bg-white text-slate-900 flex flex-col h-full w-full overflow-hidden p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                TRANSCRIÇÃO & CHAT
              </h2>
              <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full flex items-center gap-1 ${
                isCallActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCallActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isCallActive ? 'Ao Vivo' : 'Aguardando'}
              </span>
            </div>
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
      <div
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-2.5 py-2 pr-1 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center">
            <Sparkles className="w-7 h-7 mb-2 text-indigo-400/40" />
            <p className="font-semibold text-slate-600">Nenhuma conversa iniciada.</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Envie uma mensagem ou fale na chamada para receber conselhos e criar tarefas automaticamente!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-600" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-2.5 text-xs leading-relaxed ${
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

                <p className="whitespace-pre-wrap font-medium text-[11px] sm:text-xs">{msg.text}</p>

                {/* If AI created a new task automatically */}
                {msg.taskCreated && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-left bg-indigo-50/80 p-2 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[10px] mb-0.5">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Nova Tarefa Criada:</span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{msg.taskCreated.name}</p>
                    <div className="text-[10px] text-slate-600 mt-0.5 flex flex-wrap gap-2">
                      <span>⏱️ {msg.taskCreated.estimatedTime}</span>
                      <span>STATUS: <strong className="text-amber-700">{msg.taskCreated.status}</strong></span>
                    </div>
                  </div>
                )}

                {/* Vision analysis output */}
                {msg.visionAnalysis && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-left bg-purple-50 p-2 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-1 text-purple-700 font-bold text-[10px] mb-0.5">
                      <Camera className="w-3 h-3 text-purple-600" />
                      <span>Análise de Visão em Tempo Real:</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-purple-900">{msg.visionAnalysis}</p>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoadingAi && (
          <div className="flex gap-2 items-center text-xs text-indigo-700 bg-indigo-50 p-2 rounded-xl border border-indigo-200 w-max">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span className="text-[11px]">IA gerando resposta...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="shrink-0 pt-2 border-t border-slate-100 flex items-center gap-2 mt-auto">
        <input
          type="text"
          placeholder="Digite sua dúvida ou peça um conselho..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoadingAi}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoadingAi}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-400 transition shadow-xs shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
