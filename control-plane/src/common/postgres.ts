import { Pool } from 'pg';

export function createPgPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export async function migrate(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      task_id TEXT PRIMARY KEY,
      profile TEXT NOT NULL,
      source_channel TEXT,
      chat_id TEXT,
      user_id TEXT,
      intent TEXT,
      target_agent TEXT,
      status TEXT NOT NULL,
      needs_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
      text_payload TEXT,
      summary TEXT,
      result_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS task_events (
      id BIGSERIAL PRIMARY KEY,
      task_id TEXT NOT NULL,
      profile TEXT NOT NULL,
      event_type TEXT NOT NULL,
      from_agent TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_task_id ON task_events(task_id);
  `);
}
