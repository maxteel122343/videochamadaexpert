export type TaskStatus = 'PENDENTE' | 'A FAZER' | 'CONCLUIDO';
export type TaskPriority = 'baixa' | 'média' | 'alta';

export interface Task {
  id: string;
  name: string;
  startDate: string; // ISO datetime string: YYYY-MM-DDTHH:mm
  endDate: string;   // ISO datetime string: YYYY-MM-DDTHH:mm
  estimatedTime: string; // e.g., "30 minutos", "1 hora", "2h 15m"
  status: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  notes?: string;
  reminded?: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  audioUrl?: string;
  taskCreated?: Task;
  visionAnalysis?: string;
}

export interface AdviceTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface InCallReminder {
  task: Task;
  triggeredAt: string;
  active: boolean;
}

export interface AudioVisualizerData {
  volume: number;
  freqData: number[];
}

export interface AppSettings {
  useCustomApiKey: boolean;
  geminiApiKey: string;
  selectedPresetKey?: 'key1' | 'key2' | 'key3' | 'custom';
  ttsVoice: string;
  aiPersonality: string;
  autoSpeak: boolean;
  autoStartCall?: boolean;
  showTopHeader?: boolean;
  customInstructions?: string;
}
