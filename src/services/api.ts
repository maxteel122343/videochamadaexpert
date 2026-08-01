import { Task, ChatMessage, AppSettings } from "../types";

export const DEFAULT_GEMINI_KEY = "";

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
  const settings = getSavedSettings();
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na API do Gemini (${response.status})`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Erro ao processar mensagem com Gemini");
  }

  return result.data;
}

export async function analyzeVideoFrame(
  imageBase64: string,
  currentTasks: Task[]
): Promise<string> {
  const settings = getSavedSettings();
  const response = await fetch("/api/gemini/analyze-frame", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      imageBase64,
      currentTasks,
      personality: settings.aiPersonality,
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Erro ao analisar frame com visão computacional do Gemini");
  }

  return result.analysis;
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
    const result = await response.json();
    if (result.success && result.reminderSpeech) {
      return result.reminderSpeech;
    }
    throw new Error(result.error || "Erro na geração do lembrete");
  } catch (err: any) {
    throw new Error(`Erro na API de lembrete: ${err.message || 'Falha no Gemini'}`);
  }
}

// Audio Speech Handler (Calls Gemini TTS with user selected voice)
export async function playAIVoice(text: string, customVoice?: string): Promise<void> {
  const settings = getSavedSettings();
  const selectedVoice = customVoice || settings.ttsVoice || "Kore";

  try {
    const response = await fetch("/api/gemini/speak", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        text,
        voiceName: selectedVoice,
      }),
    });
    const data = await response.json();

    if (data.success && data.audioBase64) {
      await playPcmBase64(data.audioBase64);
      return;
    }
  } catch (err) {
    console.warn("Falha no Gemini TTS, ativando síntese local do navegador:", err);
  }

  // Fallback to Web Speech API if Audio Context or network fails
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt') || v.lang.includes('PT'));
    if (ptVoice) utterance.voice = ptVoice;

    window.speechSynthesis.speak(utterance);
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
    console.error("Audio playback error:", err);
  }
}

