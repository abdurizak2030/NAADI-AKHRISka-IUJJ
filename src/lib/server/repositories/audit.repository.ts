/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPool } from '../db/pool';
import { AuditLog } from '../types';

interface AuditRow {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  details: string;
  timestamp: string | Date;
}

function toAuditLog(row: AuditRow): AuditLog {
  return {
    id: row.id,
    userId: row.user_id ?? 'system',
    userName: row.user_name,
    action: row.action,
    details: row.details,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
  };
}

/** Fire-and-forget audit trail write — never blocks or fails the calling request. */
export function addAuditLog(userId: string, userName: string, action: string, details: string): void {
  getPool()
    .query('INSERT INTO audit_logs (user_id, user_name, action, details) VALUES ($1, $2, $3, $4)', [
      userId,
      userName,
      action,
      details,
    ])
    .catch((err) => console.error('[audit] Failed to write audit log:', err));
}

export async function listAuditLogs(limit = 200): Promise<AuditLog[]> {
  const { rows } = await getPool().query<AuditRow>(
    'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1',
    [limit]
  );
  return rows.map(toAuditLog);
}
