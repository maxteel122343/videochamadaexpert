import React, { useState } from 'react';
import { X, Key, Volume2, Sparkles, CheckCircle2, Sliders, ShieldCheck, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { DEFAULT_GEMINI_KEY, playAIVoice } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [useCustomApiKey, setUseCustomApiKey] = useState<boolean>(settings.useCustomApiKey ?? false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(settings.geminiApiKey || DEFAULT_GEMINI_KEY);
  const [ttsVoice, setTtsVoice] = useState<string>(settings.ttsVoice || 'Kore');
  const [aiPersonality, setAiPersonality] = useState<string>(settings.aiPersonality || 'Acolhedora, Inteligente e Atraente');
  const [customInstructions, setCustomInstructions] = useState<string>(settings.customInstructions || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: AppSettings = {
      useCustomApiKey,
      geminiApiKey: geminiApiKey.trim() || DEFAULT_GEMINI_KEY,
      ttsVoice,
      aiPersonality,
      autoSpeak: true,
      customInstructions: customInstructions.trim(),
    };
    onSaveSettings(updated);
    onClose();
  };

  const handleResetDefaultKey = () => {
    setGeminiApiKey(DEFAULT_GEMINI_KEY);
  };

  const handleTestKey = async () => {
    setTestStatus('testing');
    setTestMessage('Conectando à API do Gemini...');
    try {
      const keyToTest = geminiApiKey.trim() || DEFAULT_GEMINI_KEY;
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': keyToTest,
        },
        body: JSON.stringify({
          message: 'Olá Gemini, teste de conexão.',
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.replyText) {
        setTestStatus('success');
        setTestMessage(`✓ Conexão bem-sucedida! Gemini respondeu: "${data.data.replyText.slice(0, 60)}..."`);
      } else {
        setTestStatus('error');
        setTestMessage(`❌ Falha: ${data.error || 'A chave informada não respondeu.'}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`❌ Erro de rede ou chave inválida: ${err.message}`);
    }
  };

  const handlePreviewVoice = async () => {
    setIsTestingVoice(true);
    try {
      await playAIVoice('Olá! Esta é a minha voz atraente para a nossa videochamada.', ttsVoice);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingVoice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Área de Configuração & API Gemini</h3>
              <p className="text-xs text-slate-300">Ajuste a chave de API, voz atraente da IA e personalidade</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm">
          {/* Gemini API Key Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Chave de API do Gemini (Google AI Studio)</span>
              </label>

              {/* TOGGLE SWITCH */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  {useCustomApiKey ? 'Chave Customizada' : 'Chave Padrão (.env)'}
                </span>
                <button
                  type="button"
                  onClick={() => setUseCustomApiKey(!useCustomApiKey)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    useCustomApiKey ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={useCustomApiKey}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      useCustomApiKey ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {!useCustomApiKey ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Chave do Arquivo .ENV Ativada com Prioridade!
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
                    GEMINI_API_KEY
                  </span>
                </div>
                <p className="text-slate-600">
                  O sistema está utilizando a chave de API oficial configurada no servidor (.env). A chave personalizada abaixo está desativada pelo toggle.
                </p>
              </div>
            ) : null}

            <div className={`relative ${!useCustomApiKey ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="text"
                disabled={!useCustomApiKey}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Cole sua GEMINI_API_KEY personalizada aqui"
                className="w-full pl-3 pr-24 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testStatus === 'testing' || !useCustomApiKey}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {testStatus === 'testing' ? 'Testando...' : 'Testar Key'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-start gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  {useCustomApiKey
                    ? 'Com o toggle ativado, a sua chave customizada é enviada nas requisições, com fallback automático para o .env caso haja falha.'
                    : 'Ative o toggle acima se preferir utilizar uma cota própria ou chave de API pessoal.'}
                </p>
              </div>

              {useCustomApiKey && (
                <button
                  type="button"
                  onClick={handleResetDefaultKey}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 shrink-0 ml-2"
                  title="Restaurar chave padrão"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restaurar
                </button>
              )}
            </div>

            {testMessage && useCustomApiKey && (
              <div
                className={`p-2.5 rounded-lg text-xs border font-medium ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : testStatus === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}
              >
                {testMessage}
              </div>
            )}
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Voz Atraente da IA para Videochamada</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'Kore', name: 'Kore', desc: 'Feminina Acolhedora, Fluida e Atraente' },
                { id: 'Aoede', name: 'Aoede', desc: 'Feminina Expressiva e Vibrante' },
                { id: 'Fenrir', name: 'Fenrir', desc: 'Masculina Envolvente e Marcante' },
                { id: 'Puck', name: 'Puck', desc: 'Masculina Jovem e Dinâmica' },
                { id: 'Charon', name: 'Charon', desc: 'Masculina Profunda e Executiva' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setTtsVoice(v.id)}
                  className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                    ttsVoice === v.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm">{v.name}</span>
                    {ttsVoice === v.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <span className="text-xs text-slate-500 mt-1">{v.desc}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handlePreviewVoice}
                disabled={isTestingVoice}
                className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isTestingVoice ? 'animate-pulse' : ''}`} />
                <span>{isTestingVoice ? 'Ouvindo...' : 'Ouvir Exemplo de Voz'}</span>
              </button>
            </div>
          </div>

          {/* AI Personality */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Estilo & Personalidade da IA Consultora</span>
            </label>
            <select
              value={aiPersonality}
              onChange={(e) => setAiPersonality(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Acolhedora, Inteligente e Atraente">Acolhedora, Inteligente e Atraente (Recomendado)</option>
              <option value="Executiva, Focada e Produtiva">Executiva, Focada e Produtiva (Direta ao ponto)</option>
              <option value="Motivacional, Energética e Inspiradora">Motivacional, Energética e Inspiradora</option>
              <option value="Consultora Criativa e Descontraída">Consultora Criativa e Descontraída</option>
            </select>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 text-xs">
              Instruções Customizadas para o Gemini (Opcional)
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ex: Fale sempre me chamando de Rodrigo, seja breve nas respostas e me ajude a focar em programação..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
