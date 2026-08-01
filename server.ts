import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Default fallback key from environment
const DEFAULT_KEY = process.env.GEMINI_API_KEY || "";

// Official supported Gemini API models
const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview";

// Helper to execute a Gemini API call with proper key priority & fallback
async function callGeminiWithFallback<T>(
  req: express.Request,
  actionFn: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const customKey = (req?.headers["x-gemini-api-key"] as string) || req?.body?.apiKey;
  const envKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY"
    ? process.env.GEMINI_API_KEY
    : "";

  // 1. Try Custom Header Key if provided by user
  if (customKey && customKey.trim() && customKey.trim() !== envKey) {
    try {
      const customAI = new GoogleGenAI({
        apiKey: customKey.trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      return await actionFn(customAI);
    } catch (customErr: any) {
      console.warn("⚠️ Chave customizada falhou. Ativando fallback automático para a chave de ambiente .env...", customErr?.message || customErr);
    }
  }

  // 2. Try process.env.GEMINI_API_KEY or DEFAULT_KEY
  const fallbackAI = new GoogleGenAI({
    apiKey: envKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return await actionFn(fallbackAI);
}

// API Routes

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.VERCEL ? "vercel" : "local", timestamp: new Date().toISOString() });
});
// 2. Chat & Advisor Route (With Task Function Calling / Extraction)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, currentTasks, userContext, personality, customInstructions } = req.body;

    const systemInstruction = `Você é a "IA Consultora de Vídeo & Produtividade", uma assistente de vídeo chamada em tempo real de altíssima inteligência.
Seu objetivo é conversar diretamente com o usuário com um tom de voz atraente, envolvente, humano e cativante em português do Brasil (pt-BR).
Você oferece conselhos valiosos, perspicazes e extremamente práticos sobre vida, carreira, estudos, rotina, saúde e planejamento.

Personalidade e estilo de comunicação: ${personality || "Acolhedora, Atraente e Muito Inteligente"}.
${customInstructions ? `Instruções adicionais do usuário: ${customInstructions}` : ''}

Mantenha respostas conversacionais fluidas de 2 a 4 frases, ideais para serem lidas em voz alta na videochamada.

Se o usuário pedir a criação de uma tarefa (ou se o contexto da fala implicar uma ação programada ou compromisso com nome, horário ou tempo estimado), preencha o campo "newTask" na resposta JSON.
Status válidos para tarefas: "PENDENTE", "A FAZER", "CONCLUIDO".

Sua resposta DEVE ser um objeto JSON no seguinte formato:
{
  "replyText": "Sua resposta conversacional em português com voz atraente e tom perspicaz.",
  "adviceBullets": ["Conselho prático 1", "Conselho prático 2"],
  "newTask": {
    "name": "Nome da tarefa",
    "startDate": "YYYY-MM-DDTHH:mm (Data e hora de início)",
    "endDate": "YYYY-MM-DDTHH:mm (Data e hora de término)",
    "estimatedTime": "Ex: 30 minutos, 1 hora",
    "status": "PENDENTE" | "A FAZER" | "CONCLUIDO",
    "priority": "baixa" | "média" | "alta",
    "category": "Estudos | Trabalho | Pessoal | Saúde"
  } (opcional)
}

Lista atual de tarefas do usuário:
${JSON.stringify(currentTasks || [], null, 2)}
`;

    const promptText = `Usuário diz: "${message}"\n${userContext ? `Contexto adicional: ${userContext}` : ''}`;

    const response = await callGeminiWithFallback(req, (ai) =>
      ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: { type: Type.STRING, description: "Resposta conversacional para áudio" },
              adviceBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Tópicos de conselhos resumidos",
              },
              newTask: {
                type: Type.OBJECT,
                description: "Nova tarefa extraída a pedido do usuário",
                properties: {
                  name: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING },
                  status: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
              },
            },
            required: ["replyText"],
          },
        },
      })
    );

    const text = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = { replyText: text };
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ success: false, error: error.message || "Erro na comunicação com a API do Gemini" });
  }
});

// 3. Vision Analysis of User Video Frame
app.post("/api/gemini/analyze-frame", async (req, res) => {
  try {
    const { imageBase64, personality } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "Nenhuma imagem enviada." });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await callGeminiWithFallback(req, (ai) =>
      ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: `Análise de visão em tempo real na videochamada.
Com tom de voz ${personality || "atraente, expressivo e observador"}, analise a imagem da câmera do usuário (postura, ambiente, cadernos, foco).
Faça um comentário inteligente e encorajador em 2 a 3 frases em português do Brasil.`,
            },
          ],
        },
      })
    );

    res.json({ success: true, analysis: response.text });
  } catch (error: any) {
    console.error("Gemini Vision Error:", error);
    res.status(500).json({ success: false, error: error.message || "Erro na análise de visão do Gemini" });
  }
});

// 4. TTS (Text-to-Speech) API for AI Voice in Video Call
app.post("/api/gemini/speak", async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: "Texto é obrigatório" });
    }

    const customKey = (req?.headers["x-gemini-api-key"] as string) || req?.body?.apiKey;
    const envKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY"
      ? process.env.GEMINI_API_KEY
      : "";

    if (!customKey && !envKey) {
      return res.json({ success: false, message: "Síntese nativa do navegador ativada (Sem chave de API configurada no servidor)" });
    }

    const chosenVoice = voiceName || "Kore"; // Kore, Aoede, Fenrir, Puck, Charon

    const response = await callGeminiWithFallback(req, (ai) =>
      ai.models.generateContent({
        model: GEMINI_TTS_MODEL,
        contents: [{ parts: [{ text: `Fale em português com tom muito natural, fluido, atraente e expressivo: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ success: true, audioBase64: base64Audio, voiceUsed: chosenVoice });
    }
    return res.json({ success: false, message: "Áudio nativo não retornado; o navegador usará síntese de voz." });
  } catch (error: any) {
    console.warn("Gemini TTS Warning:", error?.message || error);
    // Return non-500 graceful status so frontend seamlessly uses Web Speech API synthesis without crashing
    return res.json({ success: false, message: "Síntese nativa do navegador ativada", error: error?.message });
  }
});

// 5. Proactive Task Reminder Voice Alert Generator
app.post("/api/gemini/reminder-voice", async (req, res) => {
  try {
    const { taskName, estimatedTime, startDate } = req.body;

    const prompt = `Gere uma aviso falado em voz alta com tom atraente e cativante em português do Brasil para avisar o usuário que a tarefa "${taskName}" agendada para ${startDate} (Tempo estimado: ${estimatedTime}) está começando agora!`;

    const response = await callGeminiWithFallback(req, (ai) =>
      ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: {
          systemInstruction: "Você é a assistente da chamada avisando o usuário sobre o início de um compromisso. Responda em 1 a 2 frases faladas cativantes e amigáveis.",
        },
      })
    );

    res.json({ success: true, reminderSpeech: response.text });
  } catch (error: any) {
    console.error("Reminder voice error:", error);
    res.status(500).json({ success: false, error: error.message || "Erro na API Gemini" });
  }
});

// 6. Download Full Project as ZIP
app.get("/api/download-zip", (req, res) => {
  let tmpPath = "";
  try {
    const zip = new AdmZip();
    const rootDir = process.cwd();

    zip.addLocalFolder(rootDir, "", (filename) => {
      const normalized = filename.replace(/\\/g, "/");
      if (
        normalized.includes("node_modules") ||
        normalized.includes(".git") ||
        normalized.includes("dist") ||
        normalized.includes(".cache") ||
        normalized.includes(".vite") ||
        normalized.endsWith(".log")
      ) {
        return false;
      }
      return true;
    });

    tmpPath = path.join("/tmp", `projeto_completo_${Date.now()}.zip`);
    zip.writeZip(tmpPath);

    return res.download(tmpPath, "projeto-completo-ia-videochamada.zip", (err) => {
      if (fs.existsSync(tmpPath)) {
        try {
          fs.unlinkSync(tmpPath);
        } catch (e) {}
      }
    });
  } catch (error: any) {
    console.error("Zip error:", error);
    if (tmpPath && fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch (e) {}
    }
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend with Vite locally (only if not running on Vercel serverless)
if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server rodando em http://localhost:${PORT}`);
    });
  }

  startServer();
}

export default app;
