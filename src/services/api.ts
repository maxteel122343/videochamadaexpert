import { Task, ChatMessage, AppSettings } from "../types";
import { GoogleGenAI, Modality } from "@google/genai";

export const DEFAULT_GEMINI_KEY = "AQ.Ab8RN6LQI_k-dZOrvRJk_7mXFiSyKvPZZ17WmpYrU9kG5vs-1w";

export function getSavedSettings(): AppSettings {
  const saved = localStorage.getItem('app_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        useCustomApiKey: parsed.useCustomApiKey ?? false,
        geminiApiKey: parsed.geminiApiKey || DEFAULT_GEMINI_KEY,
        ttsVoice: parsed.ttsVoice || "Kore",
        aiPersonality: parsed.aiPersonality || "Acolhedora, Inteligente e Atraente",
        autoSpeak: parsed.autoSpeak ?? true,
        customInstructions: parsed.customInstructions || '',
      };
    } catch (e) {
      console.error(e);
    }
  }
  return {
    useCustomApiKey: false,
    geminiApiKey: DEFAULT_GEMINI_KEY,
    ttsVoice: "Kore", // Kore, Aoede, Fenrir, Puck, Charon
    aiPersonality: "Acolhedora, Inteligente e Atraente",
    autoSpeak: true,
    customInstructions: "",
  };
}

function getHeaders() {
  const settings = getSavedSettings();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (settings.useCustomApiKey && settings.geminiApiKey) {
    headers["x-gemini-api-key"] = settings.geminiApiKey.trim();
  }
  
  return headers;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  currentTasks: Task[],
  userContext?: string
): Promise<{ replyText: string; adviceBullets?: string[]; newTask?: Partial<Task> }> {
  try {
    const settings = getSavedSettings();

    // 1. If custom key is enabled on client, try direct browser call first for ultimate resilience
    if (settings.useCustomApiKey && settings.geminiApiKey && settings.geminiApiKey.trim()) {
      try {
        const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey.trim() });
        const systemInstruction = `Você é a "IA Consultora de Vídeo & Produtividade", uma assistente de vídeo chamada em tempo real de altíssima inteligência.
Seu objetivo é conversar diretamente com o usuário com um tom de voz atraente, envolvente, humano e cativante em português do Brasil (pt-BR).
Personalidade: ${settings.aiPersonality}.
${settings.customInstructions ? `Instruções: ${settings.customInstructions}` : ''}
Mantenha respostas conversacionais de 2 a 4 frases.
Formato da resposta obrigatoriamente JSON com a propriedade "replyText" e opcionalmente "adviceBullets" e "newTask".`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Usuário diz: "${message}"\n${userContext ? `Contexto: ${userContext}` : ''}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

        const rawText = response.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed.replyText) {
          return parsed;
        }
      } catch (clientErr) {
        console.warn("Chamada direta do cliente falhou. Tentando servidor proxy...", clientErr);
      }
    }

    // 2. Proxy call to Server API
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        message,
        history,
        currentTasks,
        userContext,
        personality: settings.aiPersonality,
        customInstructions: settings.customInstructions,
      }),
    });

    const result = await response.json().catch(() => ({ success: false }));
    if (result.success && result.data) {
      return result.data;
    }

    return result.data || {
      replyText: "Entendido! Continuaremos nossa chamada de vídeo e o acompanhamento de suas tarefas normalmente.",
      adviceBullets: ["Ative sua chave de API do Gemini nas configurações se desejar respostas gerativas mais profundas."]
    };
  } catch (err: any) {
    console.warn("Aviso na chamada de chat:", err?.message || err);
    return {
      replyText: "Compreendido! Estou aqui na chamada com você para ajudar a organizar sua rotina.",
      adviceBullets: ["Sua chamada está ativa com recursos locais."]
    };
  }
}

export async function analyzeVideoFrame(
  imageBase64: string,
  currentTasks: Task[]
): Promise<string> {
  try {
    const settings = getSavedSettings();

    // Direct client check if custom key enabled
    if (settings.useCustomApiKey && settings.geminiApiKey && settings.geminiApiKey.trim()) {
      try {
        const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey.trim() });
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: {
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
              { text: `Análise de visão em tempo real na videochamada em português do Brasil.` }
            ]
          }
        });
        if (response.text) return response.text;
      } catch (clientErr) {
        console.warn("Visão direta cliente falhou, tentando backend:", clientErr);
      }
    }

    const response = await fetch("/api/gemini/analyze-frame", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        imageBase64,
        currentTasks,
        personality: settings.aiPersonality,
      }),
    });

    const result = await response.json().catch(() => ({ success: false }));
    return result.analysis || "Câmera ativa na videochamada. Mantenha o foco em suas atividades!";
  } catch (err) {
    return "Vídeo ativo na chamada. Excelente postura de estudos e trabalho!";
  }
}

export async function generateReminderVoice(
  taskName: string,
  estimatedTime: string,
  startDate: string
): Promise<string> {
  try {
    const response = await fetch("/api/gemini/reminder-voice", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ taskName, estimatedTime, startDate }),
    });
    const result = await response.json().catch(() => ({ success: false }));
    if (result.success && result.reminderSpeech) {
      return result.reminderSpeech;
    }
    return result.reminderSpeech || `Atenção! A tarefa "${taskName}" agendada para ${startDate} (Duração: ${estimatedTime}) está começando agora!`;
  } catch (err: any) {
    return `Atenção! A tarefa "${taskName}" agendada para ${startDate} está começando agora!`;
  }
}

// Resilient Audio Speech Handler with Gemini TTS + Client Direct Call + Seamless Web Speech API
export async function playAIVoice(text: string, customVoice?: string): Promise<void> {
  const settings = getSavedSettings();
  const selectedVoice = customVoice || settings.ttsVoice || "Kore";

  // Option A: Direct Client SDK Call if Custom API Key is active on client
  if (settings.useCustomApiKey && settings.geminiApiKey && settings.geminiApiKey.trim()) {
    try {
      const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey.trim() });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Fale em português com tom muito natural, fluido e atraente: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playPcmBase64(base64Audio);
        return;
      }
    } catch (clientErr) {
      console.warn("Síntese nativa com chave do cliente indisponível, recorrendo ao backend ou voz local:", clientErr);
    }
  }

  // Option B: Server Proxy Call
  try {
    const response = await fetch("/api/gemini/speak", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        text,
        voiceName: selectedVoice,
      }),
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({ success: false }));
      if (data.success && data.audioBase64) {
        await playPcmBase64(data.audioBase64);
        return;
      }
    }
  } catch (err) {
    console.warn("Voz nativa do Gemini indisponível. Ativando síntese local do navegador...");
  }

  // Option C: Native Web Speech API Fallback (Smooth, zero red console errors)
  speakWithWebSpeech(text);
}

// Fallback to Web Speech API
function speakWithWebSpeech(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt') || v.lang.includes('PT'));
    if (ptVoice) utterance.voice = ptVoice;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Erro ao acionar síntese Web Speech:", err);
  }
}

// Decodes PCM Base64 24kHz audio from Gemini TTS
async function playPcmBase64(base64Data: string) {
  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    const buffer = audioCtx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (err) {
    console.warn("Audio playback warn:", err);
  }
}


