import { NextResponse } from 'next/server';
import { initPool, isDatabaseReady, getLastDatabaseError } from '@/lib/server/db/pool';
import { ensureSchema, isSchemaReady, getSchemaError } from '@/lib/server/db/schema';

export async function GET() {
  // Attempt to boot (connect + ensure schema) so health reflects reality
  // even on a cold start, matching the original always-answers health check.
  const connected = await initPool();
  if (connected) {
    try {
      await ensureSchema();
    } catch {
      // isSchemaReady()/getSchemaError() below will reflect the failure.
    }
  }

  const dbConnected = isDatabaseReady();
  const schemaOk = isSchemaReady();
  const healthy = dbConnected && schemaOk;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'not_ready',
      database: { connected: dbConnected, error: dbConnected ? null : getLastDatabaseError() },
      schema: { ready: schemaOk, error: schemaOk ? null : getSchemaError() },
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
