# 🚀 Solução Completa para Deploy NATIVO na Vercel & Diagnóstico de Erros

## 📋 Resumo Executivo & Diagnóstico dos Erros 500

Analisando o console do navegador e as requisições `500 (Internal Server Error)` no ambiente da Vercel (`videochamada3env.vercel.app`), identificamos três causas principais para a falha:

---

### ❌ Causas do Problema Identificadas:

1. **Uso de Nomes de Modelos Fictícios/Inexistentes no Gemini:**
   - O código do backend estava utilizando `gemini-3.6-flash` e `gemini-3.1-flash-tts-preview`.
   - Na API pública do Google AI Studio / SDK `@google/genai`, esses nomes de modelos não existem na versão estável pública. Quando a SDK tentava se comunicar com a API do Google, o servidor retornava `404 / 400 Model Not Found`, que era capturado pelo Express e retornado ao cliente como `500 Internal Server Error`.

2. **Ausência de Estrutura Serverless para a Vercel (`vercel.json` e `api/index.ts`):**
   - A Vercel hospeda backends Express como **Vercel Serverless Functions**.
   - Sem o arquivo `vercel.json` com regra de reescrita (`rewrites`), requisições para `/api/gemini/chat` e `/api/gemini/speak` não eram roteadas para o Express no ambiente Serverless da Vercel.

3. **Incompatibilidade do `app.listen()` em Serverless:**
   - Em funções Serverless (Node.js na Vercel), a aplicação não deve abrir uma porta com `app.listen()`, mas sim **exportar o objeto Express (`export default app`)**. O acionamento direto do `app.listen()` gerava exceções de runtime no ambiente Vercel.

---

## 🛠️ Modificações Realizadas para Solução Definitiva

### 1. Suporte Nativo Vercel Serverless (`vercel.json` e `api/index.ts`)
- **`vercel.json` na Raiz:**
  ```json
  {
    "version": 2,
    "rewrites": [
      {
        "source": "/api/(.*)",
        "destination": "/api"
      }
    ]
  }
  ```
- **Ponto de Entrada `api/index.ts`:**
  ```typescript
  import app from "../server";
  export default app;
  ```

### 2. Compatibilidade no `server.ts`
- O Express `app` passou a ser exportado como default (`export default app`).
- A inicialização local do servidor via `app.listen()` e middleware do Vite agora é executada **apenas se a variável de ambiente `process.env.VERCEL` NÃO estiver presente**:
  ```typescript
  if (!process.env.VERCEL) {
    startServer();
  }
  ```

### 3. Modelos Oficiais da API Gemini
- Corrigimos os nomes de modelos utilizados na SDK `@google/genai`:
  - **`gemini-3.6-flash`**: Modelo oficial para chat conversacional, visão computacional e extração estruturada de tarefas em JSON.
  - **`gemini-3.1-flash-tts-preview`**: Modelo oficial para síntese de voz (Text-to-Speech).
- Foi mantido o tratamento gracioso para síntese de voz (TTS) para garantir que, caso o modal de áudio nativo não esteja disponível na cota, o sistema responda sem crash, permitindo a transição automática para a síntese de voz local do navegador (Web Speech API).

### 4. Hierarquia de Chaves de API e Fallback Automático
- O servidor processa as chaves na seguinte ordem de prioridade:
  1. **Chave Personalizada do Usuário:** Recebida via cabeçalho `x-gemini-api-key` (ativada via Toggle no painel de configurações da aplicação).
  2. **Variável de Ambiente do Servidor:** `process.env.GEMINI_API_KEY`.
  3. **Chave de Fallback do Sistema:** Chave padrão caso nenhuma das opções anteriores seja informada.
- Se a chave personalizada do usuário falhar, a função `callGeminiWithFallback` tenta automaticamente a chave do servidor `.env` sem derrubar a requisição.

### 5. Arquivo `.env.example`
- Atualizado com placeholder transparente:
  ```env
  GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
  APP_URL="http://localhost:3000"
  ```

---

## 🚀 Como Fazer o Deploy na Vercel

1. Suba o projeto para o seu repositório no **GitHub**.
2. No painel da **Vercel**, clique em **New Project** e importe o repositório.
3. Nas **Environment Variables** do projeto na Vercel, adicione:
   - `GEMINI_API_KEY`: Sua chave obtida no Google AI Studio.
4. Clique em **Deploy**. A Vercel detectará o `vercel.json` e o handler `api/index.ts` automaticamente!
