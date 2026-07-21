/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPool } from '../db/pool';
import { ClubEvent } from '../types';

interface EventRow {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  speaker: string | null;
  image: string | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'MEMBERS';
  status: 'UPCOMING' | 'COMPLETED';
  created_at: string | Date;
}

function formatDate(d: string): string {
  return typeof d === 'string' ? d : new Date(d).toISOString().split('T')[0];
}

function normalizeVisibility(value?: string | null): 'PUBLIC' | 'PRIVATE' {
  return value === 'PRIVATE' || value === 'MEMBERS' ? 'PRIVATE' : 'PUBLIC';
}

async function attachRegistrations(rows: EventRow[]): Promise<ClubEvent[]> {
  if (rows.length === 0) return [];
  const pool = getPool();
  const ids = rows.map((r) => r.id);
  const { rows: regRows } = await pool.query<{ event_id: string; user_email: string }>(
    'SELECT event_id, user_email FROM event_registrations WHERE event_id = ANY($1)',
    [ids]
  );
  const byEvent = new Map<string, string[]>();
  for (const r of regRows) {
    if (!byEvent.has(r.event_id)) byEvent.set(r.event_id, []);
    byEvent.get(r.event_id)!.push(r.user_email);
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    date: formatDate(row.date),
    time: row.time,
    speaker: row.speaker ?? undefined,
    image: row.image ?? undefined,
    visibility: normalizeVisibility(row.visibility),
    status: row.status,
    registeredMembers: byEvent.get(row.id) ?? [],
  }));
}

export async function listEvents(): Promise<ClubEvent[]> {
  const { rows } = await getPool().query<EventRow>('SELECT * FROM events ORDER BY date DESC, created_at DESC');
  return attachRegistrations(rows);
}

export async function getEventById(id: string): Promise<ClubEvent | null> {
  const { rows } = await getPool().query<EventRow>('SELECT * FROM events WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  const [event] = await attachRegistrations(rows);
  return event;
}

export async function createEvent(input: Partial<ClubEvent>): Promise<ClubEvent> {
  const { rows } = await getPool().query<EventRow>(
    `INSERT INTO events (title, description, location, date, time, speaker, image, visibility, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UPCOMING') RETURNING *`,
    [
      input.title,
      input.description || '',
      input.location || 'Islamic University',
      input.date,
      input.time,
      input.speaker || null,
      input.image ||
        '/logoIUJJ.jpg',
      normalizeVisibility(input.visibility),
    ]
  );
  const [event] = await attachRegistrations(rows);
  return event;
}

export async function updateEvent(id: string, updates: Partial<ClubEvent>): Promise<ClubEvent | null> {
  const { rows } = await getPool().query<EventRow>(
    `UPDATE events SET
       title = COALESCE($2, title), description = COALESCE($3, description),
       location = COALESCE($4, location), date = COALESCE($5, date), time = COALESCE($6, time),
       speaker = COALESCE($7, speaker), image = COALESCE($8, image), status = COALESCE($9, status),
       visibility = COALESCE($10, visibility)
     WHERE id = $1 RETURNING *`,
    [
      id,
      updates.title ?? null,
      updates.description ?? null,
      updates.location ?? null,
      updates.date ?? null,
      updates.time ?? null,
      updates.speaker ?? null,
      updates.image ?? null,
      updates.status ?? null,
      normalizeVisibility(updates.visibility) ?? null,
    ]
  );
  if (rows.length === 0) return null;
  const [event] = await attachRegistrations(rows);
  return event;
}

export async function deleteEvent(id: string): Promise<ClubEvent | null> {
  const existing = await getEventById(id);
  if (!existing) return null;
  await getPool().query('DELETE FROM events WHERE id = $1', [id]);
  return existing;
}

/** Toggles registration for a user (register if absent, unregister if present). */
export async function toggleRegistration(eventId: string, userEmail: string): Promise<ClubEvent | null> {
  const pool = getPool();
  const event = await getEventById(eventId);
  if (!event) return null;

  const alreadyRegistered = event.registeredMembers.includes(userEmail);
  if (alreadyRegistered) {
    await pool.query('DELETE FROM event_registrations WHERE event_id = $1 AND user_email = $2', [
      eventId,
      userEmail,
    ]);
  } else {
    await pool.query(
      'INSERT INTO event_registrations (event_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventId, userEmail]
    );
  }
  return getEventById(eventId);
}
