export type TaskStatus =
  | 'NEW'
  | 'ROUTED'
  | 'RUNNING'
  | 'WAITING_CONFIRMATION'
  | 'DONE'
  | 'FAILED'
  | 'DEAD_LETTER';

export interface TaskEnvelope {
  taskId: string;
  profile: string;
  source: {
    channel: 'telegram' | 'api' | 'system';
    chatId?: string;
    userId?: string;
    username?: string;
  };
  text: string;
  intent?: string;
  targetAgent?: string;
  priority?: number;
  budgetTokens?: number;
  status: TaskStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TaskResult {
  taskId: string;
  profile: string;
  fromAgent: string;
  status: Extract<TaskStatus, 'DONE' | 'FAILED' | 'WAITING_CONFIRMATION'>;
  summary: string;
  fullResponse: string;
  needsConfirmation: boolean;
  suggestedAction?: string;
  tokenUsage?: number;
  costEstimate?: number;
  source?: TaskEnvelope['source'];
  createdAt: string;
}

export interface ConfirmationCommand {
  taskId: string;
  profile: string;
  decision: 'confirm' | 'reject';
  note?: string;
  actor: string;
  createdAt: string;
}

export interface QueueStats {
  stream: string;
  messages: number;
  bytes: number;
  firstSeq: number;
  lastSeq: number;
}
