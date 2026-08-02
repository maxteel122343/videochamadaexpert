import React, { useState } from 'react';
import { X, Key, Volume2, Sparkles, CheckCircle2, Sliders, ShieldCheck, RefreshCw, Check } from 'lucide-react';
import { AppSettings } from '../types';
import { DEFAULT_GEMINI_KEY_1, DEFAULT_GEMINI_KEY_2, DEFAULT_GEMINI_KEY_3, playAIVoice } from '../services/api';

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
  const [selectedPresetKey, setSelectedPresetKey] = useState<'key1' | 'key2' | 'key3' | 'custom'>(
    settings.selectedPresetKey ||
      (settings.geminiApiKey === DEFAULT_GEMINI_KEY_2
        ? 'key2'
        : settings.geminiApiKey === DEFAULT_GEMINI_KEY_3
        ? 'key3'
        : 'key1')
  );
  const [geminiApiKey, setGeminiApiKey] = useState<string>(settings.geminiApiKey || DEFAULT_GEMINI_KEY_1);
  const [ttsVoice, setTtsVoice] = useState<string>(settings.ttsVoice || 'Kore');
  const [aiPersonality, setAiPersonality] = useState<string>(settings.aiPersonality || 'Acolhedora, Inteligente e Atraente');
  const [autoStartCall, setAutoStartCall] = useState<boolean>(settings.autoStartCall ?? false);
  const [showTopHeader, setShowTopHeader] = useState<boolean>(settings.showTopHeader ?? false);
  const [customInstructions, setCustomInstructions] = useState<string>(settings.customInstructions || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: 'key1' | 'key2' | 'key3' | 'custom') => {
    setSelectedPresetKey(preset);
    setUseCustomApiKey(true);
    if (preset === 'key1') {
      setGeminiApiKey(DEFAULT_GEMINI_KEY_1);
    } else if (preset === 'key2') {
      setGeminiApiKey(DEFAULT_GEMINI_KEY_2);
    } else if (preset === 'key3') {
      setGeminiApiKey(DEFAULT_GEMINI_KEY_3);
    }
  };

  const handleSave = () => {
    const updated: AppSettings = {
      useCustomApiKey,
      selectedPresetKey,
      geminiApiKey: geminiApiKey.trim() || DEFAULT_GEMINI_KEY_1,
      ttsVoice,
      aiPersonality,
      autoSpeak: true,
      autoStartCall,
      showTopHeader,
      customInstructions: customInstructions.trim(),
    };
    onSaveSettings(updated);
    onClose();
  };

  const handleResetDefaultKey = () => {
    setSelectedPresetKey('key1');
    setUseCustomApiKey(false);
    setGeminiApiKey(DEFAULT_GEMINI_KEY_1);
  };

  const handleTestKey = async () => {
    setTestStatus('testing');
    setTestMessage('Conectando à API do Gemini...');
    try {
      const keyToTest = geminiApiKey.trim();
      if (!keyToTest) {
        setTestStatus('error');
        setTestMessage('❌ Informe uma chave de API para realizar o teste.');
        return;
      }

      // 1. First try direct client-side call with GoogleGenAI SDK for instant validation
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: keyToTest });
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: 'Olá Gemini, este é um teste de conexão da chave de API. Responda OK.',
        });
        if (response.text) {
          setTestStatus('success');
          setTestMessage(`✓ Conexão bem-sucedida! Gemini respondeu: "${response.text.trim().slice(0, 60)}..."`);
          return;
        }
      } catch (clientErr: any) {
        console.warn('Teste direto no cliente falhou, tentando validação no backend:', clientErr);
        const errMsg = clientErr?.message || String(clientErr);
        if (errMsg.includes('401') || errMsg.includes('UNAUTHENTICATED') || errMsg.includes('invalid authentication credentials')) {
          setTestStatus('error');
          setTestMessage('❌ Chave de API do Gemini inválida ou sem permissão (Erro 401). Obtenha uma chave válida em https://aistudio.google.com/');
          return;
        }
      }

      // 2. Fallback to server API /api/gemini/chat
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

      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {
          success: false,
          error: 'No ambiente da Vercel, defina a variável GEMINI_API_KEY nas configurações do projeto Vercel (Environment Variables) ou use uma chave válida do Google AI Studio.',
        };
      }

      if (data.success && data.data?.replyText) {
        setTestStatus('success');
        setTestMessage(`✓ Conexão bem-sucedida! Gemini respondeu: "${data.data.replyText.slice(0, 60)}..."`);
      } else {
        setTestStatus('error');
        let errStr = data.error || 'A chave informada não respondeu.';
        if (errStr.includes('401') || errStr.includes('UNAUTHENTICATED')) {
          errStr = 'Chave de API do Gemini inválida ou sem permissão (Erro 401). Obtenha uma chave em https://aistudio.google.com/';
        }
        setTestMessage(`❌ Falha na Autenticação: ${errStr}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`❌ Erro de conexão: ${err.message}`);
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

            {/* PRESET KEYS SELECTION */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-700">Selecione uma das Chaves de API Padrão ou Insira a Sua:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('key1')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    selectedPresetKey === 'key1'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="text-xs font-bold text-indigo-900">⭐ Chave Padrão 1 (Principal)</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">AIzaSyBuJvwo...</p>
                  </div>
                  {selectedPresetKey === 'key1' && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('key2')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    selectedPresetKey === 'key2'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="text-xs font-bold">Chave Padrão 2</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">AIzaSyDMauXE...</p>
                  </div>
                  {selectedPresetKey === 'key2' && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('key3')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    selectedPresetKey === 'key3'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="text-xs font-bold">Chave Padrão 3</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">AQ.Ab8RN6IZ3...</p>
                  </div>
                  {selectedPresetKey === 'key3' && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('custom')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition ${
                    selectedPresetKey === 'custom'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="text-xs font-bold">Personalizada</p>
                    <p className="text-[10px] text-slate-500 truncate">Sua própria chave</p>
                  </div>
                  {selectedPresetKey === 'custom' && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                </button>
              </div>
            </div>

            {!useCustomApiKey ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Chave de Servidor (.ENV) Ativa
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-mono">
                    GEMINI_API_KEY
                  </span>
                </div>
                <p className="text-slate-600">
                  O servidor responde com prioridade. Se quiser forçar o uso da chave selecionada acima no navegador, ative o toggle de "Chave Customizada".
                </p>
              </div>
            ) : null}

            <div className="relative">
              <input
                type="text"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  setSelectedPresetKey('custom');
                  setUseCustomApiKey(true);
                }}
                placeholder="Cole sua GEMINI_API_KEY personalizada aqui"
                className="w-full pl-3 pr-24 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setUseCustomApiKey(true);
                  handleTestKey();
                }}
                disabled={testStatus === 'testing'}
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

          {/* AUTO-START VIDEO CALL TOGGLE */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>📹 Iniciar Chamada Automaticamente</span>
                {autoStartCall && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    ATIVADO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Ao abrir o aplicativo, a videochamada com a IA inicia imediatamente sem precisar clicar em nenhum botão.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAutoStartCall(!autoStartCall)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoStartCall ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={autoStartCall}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  autoStartCall ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* SHOW/HIDE TOP HEADER BANNER TOGGLE */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>🖼️ Ocultar / Exibir Banner de Destaque no Topo</span>
                {!showTopHeader && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    OCULTO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Oculta o cabeçalho superior/banner de destaque com contadores para liberar mais espaço na tela.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTopHeader(!showTopHeader)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showTopHeader ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={showTopHeader}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  showTopHeader ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
