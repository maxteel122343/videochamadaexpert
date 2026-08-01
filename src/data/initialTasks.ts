import { Task } from "../types";

const now = new Date();
const formatIso = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Create a task starting in 1 minute for easy instant testing
const startTest = new Date(now.getTime() + 1 * 60 * 1000);
const endTest = new Date(now.getTime() + 31 * 60 * 1000);

// Create task starting in 2 hours
const startLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
const endLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    name: "Revisar Plano de Estudos com IA",
    startDate: formatIso(startTest),
    endDate: formatIso(endTest),
    estimatedTime: "30 minutos",
    status: "PENDENTE",
    priority: "alta",
    category: "Estudos",
    notes: "Analisar cronograma e tirar dúvidas com a IA no vídeo",
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    name: "Sessão Foco Foco Total (React & WebRTC)",
    startDate: formatIso(startLater),
    endDate: formatIso(endLater),
    estimatedTime: "1 hora",
    status: "A FAZER",
    priority: "média",
    category: "Trabalho",
    notes: "Implementar novas rotas e otimizar latência de chamada",
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    name: "Organizar Agenda Semanal e Metas",
    startDate: formatIso(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    endDate: formatIso(new Date(now.getTime() - 23 * 60 * 60 * 1000)),
    estimatedTime: "45 minutos",
    status: "CONCLUIDO",
    priority: "baixa",
    category: "Pessoal",
    notes: "Concluído com sucesso na chamada anterior",
    createdAt: new Date().toISOString(),
  },
];

export const SAMPLE_ADVICE_TOPICS = [
  {
    id: "productivity",
    title: "Técnica Pomodoro & Foco",
    description: "Como organizar blocos de trabalho sem se esgotar.",
    prompt: "Me dê conselhos de como usar a técnica Pomodoro no meu dia a dia de estudos.",
    icon: "Zap",
  },
  {
    id: "time-management",
    title: "Gestão do Tempo e Prioridades",
    description: "Métodos para definir o que é PENDENTE, A FAZER e CONCLUÍDO.",
    prompt: "Como posso priorizar minhas tarefas urgentes vs importantes hoje?",
    icon: "Clock",
  },
  {
    id: "career",
    title: "Planejamento de Carreira Tech",
    description: "Conselhos estratégicos para crescer na área de tecnologia.",
    prompt: "Quais habilidades devo focar para me destacar como desenvolvedor Full-Stack?",
    icon: "Briefcase",
  },
  {
    id: "wellness",
    title: "Equilíbrio & Gestão de Estresse",
    description: "Dicas para manter a calma sob pressão e prazos curtos.",
    prompt: "Estou me sentindo sobrecarregado com os prazos. Como posso recuperar a calma?",
    icon: "Heart",
  },
];
