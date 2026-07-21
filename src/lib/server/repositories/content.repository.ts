/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Smaller supporting collections: the roadmap, the community chat,
 * notifications, testimonials, and the singleton website settings /
 * founder / member-of-month rows (Website Settings).
 */

import { getPool } from '../db/pool';
import {
  ChatMessage,
  ClubSettings,
  ContactMessage,
  FounderInfo,
  MemberOfMonth,
  NotificationItem,
  Role,
  RoadmapNode,
  RoadmapProgress,
  Testimonial,
} from '../types';

function toIso(v: string | Date): string {
  return v instanceof Date ? v.toISOString() : v;
}

// ------------------------------- Roadmap --------------------------------

interface RoadmapRow {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  quarter: string;
}

function toRoadmap(row: RoadmapRow): RoadmapNode {
  return { id: row.id, step: row.step, title: row.title, description: row.description, status: row.status, quarter: row.quarter };
}

export async function listRoadmap(): Promise<RoadmapNode[]> {
  const { rows } = await getPool().query<RoadmapRow>('SELECT * FROM roadmap ORDER BY step ASC');
  return rows.map(toRoadmap);
}

export async function updateRoadmapNode(id: string, updates: Partial<RoadmapNode>): Promise<RoadmapNode | null> {
  const { rows } = await getPool().query<RoadmapRow>(
    `UPDATE roadmap SET
       title = COALESCE($2, title), description = COALESCE($3, description),
       status = COALESCE($4, status), quarter = COALESCE($5, quarter), step = COALESCE($6, step)
     WHERE id = $1 RETURNING *`,
    [id, updates.title ?? null, updates.description ?? null, updates.status ?? null, updates.quarter ?? null, updates.step ?? null]
  );
  if (rows.length === 0) return null;
  return toRoadmap(rows[0]);
}

export async function createRoadmapNode(input: Omit<RoadmapNode, 'id'>): Promise<RoadmapNode> {
  const { rows } = await getPool().query<RoadmapRow>(
    `INSERT INTO roadmap (step, title, description, status, quarter) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.step, input.title, input.description ?? '', input.status || 'LOCKED', input.quarter ?? '']
  );
  return toRoadmap(rows[0]);
}

export async function deleteRoadmapNode(id: string): Promise<RoadmapNode | null> {
  const { rows } = await getPool().query<RoadmapRow>('DELETE FROM roadmap WHERE id = $1 RETURNING *', [id]);
  if (rows.length === 0) return null;
  return toRoadmap(rows[0]);
}

interface RoadmapProgressRow {
  start_date: string | Date;
  end_date: string | Date;
}

function toDateOnly(v: string | Date): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v.slice(0, 10);
}

function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

function toUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toRoadmapProgress(row: RoadmapProgressRow): RoadmapProgress {
  const startDate = toDateOnly(row.start_date);
  const endDate = toDateOnly(row.end_date);
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);
  const today = toUtcDate(new Date().toISOString().slice(0, 10));
  const totalDays = Math.max(daysBetween(start, end), 1);
  const elapsedDays = Math.min(Math.max(daysBetween(start, today), 0), totalDays);
  const remainingDays = Math.max(daysBetween(today, end), 0);
  const completionPercentage = Math.min(Math.max(Math.round((elapsedDays / totalDays) * 100), 0), 100);

  return { startDate, endDate, completionPercentage, remainingDays, elapsedDays, totalDays };
}

export async function getRoadmapProgress(): Promise<RoadmapProgress> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO roadmap_progress (id, start_date, end_date)
     VALUES (1, DATE '2025-11-09', DATE '2026-11-09')
     ON CONFLICT (id) DO NOTHING`
  );
  const { rows } = await pool.query<RoadmapProgressRow>('SELECT start_date, end_date FROM roadmap_progress WHERE id = 1');
  return toRoadmapProgress(rows[0]);
}

export async function updateRoadmapProgress(updates: { startDate?: string; endDate?: string }): Promise<RoadmapProgress> {
  const { rows } = await getPool().query<RoadmapProgressRow>(
    `UPDATE roadmap_progress SET
       start_date = COALESCE($1::date, start_date),
       end_date = COALESCE($2::date, end_date),
       updated_at = now()
     WHERE id = 1 RETURNING start_date, end_date`,
    [updates.startDate || null, updates.endDate || null]
  );
  if (rows.length > 0) return toRoadmapProgress(rows[0]);
  return getRoadmapProgress();
}
// ------------------------------ Chat ------------------------------------

interface ChatRow {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  user_title: string | null;
  avatar_url: string | null;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  created_at: string | Date;
}

function toChatMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id ?? '',
    userName: row.user_name,
    userRole: row.user_role as Role,
    userTitle: row.user_title ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    content: row.content,
    attachmentUrl: row.attachment_url ?? undefined,
    attachmentName: row.attachment_name ?? undefined,
    attachmentType: row.attachment_type ?? undefined,
    createdAt: toIso(row.created_at),
  };
}

export async function listChatMessages(limit = 100): Promise<ChatMessage[]> {
  const { rows } = await getPool().query<ChatRow>(
    'SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return rows.map(toChatMessage).reverse();
}

export async function createChatMessage(input: {
  userId: string;
  userName: string;
  userRole: string;
  userTitle?: string;
  avatarUrl?: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
}): Promise<ChatMessage> {
  const { rows } = await getPool().query<ChatRow>(
    `INSERT INTO chat_messages (user_id, user_name, user_role, user_title, avatar_url, content, attachment_url, attachment_name, attachment_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      input.userId,
      input.userName,
      input.userRole,
      input.userTitle ?? null,
      input.avatarUrl ?? null,
      input.content ?? '',
      input.attachmentUrl ?? null,
      input.attachmentName ?? null,
      input.attachmentType ?? null,
    ]
  );
  return toChatMessage(rows[0]);
}

// -------------------------- Notifications -------------------------------

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string | Date;
}

function toNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: toIso(row.created_at),
  };
}

export async function listNotificationsForUser(userId: string): Promise<NotificationItem[]> {
  const { rows } = await getPool().query<NotificationRow>(
    `SELECT * FROM notifications WHERE user_id = $1 OR user_id = 'all' ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(toNotification);
}

export async function createNotification(input: { userId?: string; title: string; message: string }): Promise<NotificationItem> {
  const { rows } = await getPool().query<NotificationRow>(
    `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3) RETURNING *`,
    [input.userId || 'all', input.title, input.message]
  );
  return toNotification(rows[0]);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getPool().query(`UPDATE notifications SET read = true WHERE user_id = $1 OR user_id = 'all'`, [userId]);
}

// -------------------------- Testimonials ---------------------------------

interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar_url: string;
}

function toTestimonial(row: TestimonialRow): Testimonial {
  return { id: row.id, name: row.name, role: row.role, content: row.content, avatarUrl: row.avatar_url };
}

export async function listTestimonials(): Promise<Testimonial[]> {
  const { rows } = await getPool().query<TestimonialRow>('SELECT * FROM testimonials ORDER BY id ASC');
  return rows.map(toTestimonial);
}

export async function createTestimonial(data: Omit<Testimonial, 'id'>): Promise<Testimonial> {
  const { rows } = await getPool().query<TestimonialRow>(
    `INSERT INTO testimonials (name, role, content, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, data.role ?? '', data.content, data.avatarUrl ?? '']
  );
  return toTestimonial(rows[0]);
}

export async function updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> {
  const { rows } = await getPool().query<TestimonialRow>(
    `UPDATE testimonials SET
       name = COALESCE($1, name), role = COALESCE($2, role),
       content = COALESCE($3, content), avatar_url = COALESCE($4, avatar_url)
     WHERE id = $5 RETURNING *`,
    [updates.name ?? null, updates.role ?? null, updates.content ?? null, updates.avatarUrl ?? null, id]
  );
  if (rows.length === 0) return null;
  return toTestimonial(rows[0]);
}

export async function deleteTestimonial(id: string): Promise<Testimonial | null> {
  const { rows } = await getPool().query<TestimonialRow>('DELETE FROM testimonials WHERE id = $1 RETURNING *', [id]);
  if (rows.length === 0) return null;
  return toTestimonial(rows[0]);
}

// ---------------------- Settings / Founder / MoM --------------------------

interface SettingsRow {
  club_name: string;
  club_arabic_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  whatsapp_channel_url: string | null;
  whatsapp_group_url: string | null;
  telegram_channel_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
}

function toSettings(row: SettingsRow, articlePublishingEnabled = true): ClubSettings {
  return {
    clubName: row.club_name,
    clubArabicName: row.club_arabic_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    address: row.address,
    whatsappChannelUrl: row.whatsapp_channel_url ?? row.whatsapp_group_url ?? undefined,
    whatsappGroupUrl: row.whatsapp_group_url ?? row.whatsapp_channel_url ?? undefined,
    telegramChannelUrl: row.telegram_channel_url ?? undefined,
    tiktokUrl: row.tiktok_url ?? undefined,
    facebookUrl: row.facebook_url ?? undefined,
    xUrl: row.x_url ?? undefined,
    articlePublishingEnabled,
  };
}

export async function getArticleSettings(): Promise<{ articlePublishingEnabled: boolean }> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO article_settings (id, publishing_enabled)
     VALUES (1, true)
     ON CONFLICT (id) DO NOTHING`
  );
  const { rows } = await pool.query<{ publishing_enabled: boolean }>('SELECT publishing_enabled FROM article_settings WHERE id = 1');
  return { articlePublishingEnabled: rows[0]?.publishing_enabled ?? true };
}

export async function getSettings(): Promise<ClubSettings | null> {
  const pool = getPool();
  const [{ rows }, articleSettings] = await Promise.all([
    pool.query<SettingsRow>('SELECT * FROM club_settings WHERE id = 1'),
    getArticleSettings(),
  ]);
  if (rows.length === 0) return null;
  return toSettings(rows[0], articleSettings.articlePublishingEnabled);
}

export async function updateSettings(updates: Partial<ClubSettings>): Promise<ClubSettings> {
  const { rows } = await getPool().query<SettingsRow>(
    `UPDATE club_settings SET
       club_name = COALESCE($1, club_name), club_arabic_name = COALESCE($2, club_arabic_name),
       contact_email = COALESCE($3, contact_email), contact_phone = COALESCE($4, contact_phone),
       address = COALESCE($5, address), whatsapp_channel_url = COALESCE($6, whatsapp_channel_url),
       whatsapp_group_url = COALESCE($7, whatsapp_group_url), telegram_channel_url = COALESCE($8, telegram_channel_url),
       tiktok_url = COALESCE($9, tiktok_url), facebook_url = COALESCE($10, facebook_url),
       x_url = COALESCE($11, x_url), updated_at = now()
     WHERE id = 1 RETURNING *`,
    [
      updates.clubName ?? null,
      updates.clubArabicName ?? null,
      updates.contactEmail ?? null,
      updates.contactPhone ?? null,
      updates.address ?? null,
      updates.whatsappChannelUrl ?? updates.whatsappGroupUrl ?? null,
      updates.whatsappGroupUrl ?? updates.whatsappChannelUrl ?? null,
      updates.telegramChannelUrl ?? null,
      updates.tiktokUrl ?? null,
      updates.facebookUrl ?? null,
      updates.xUrl ?? null,
    ]
  );

  let articlePublishingEnabled = (await getArticleSettings()).articlePublishingEnabled;
  if (typeof updates.articlePublishingEnabled === 'boolean') {
    await getPool().query(
      `INSERT INTO article_settings (id, publishing_enabled)
       VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET publishing_enabled = EXCLUDED.publishing_enabled, updated_at = now()`,
      [updates.articlePublishingEnabled]
    );
    articlePublishingEnabled = updates.articlePublishingEnabled;
  }

  return toSettings(rows[0], articlePublishingEnabled);
}
interface FounderRow {
  name: string;
  title: string;
  bio: string;
  image_url: string;
  message: string;
}

function toFounder(row: FounderRow): FounderInfo {
  return { name: row.name, title: row.title, bio: row.bio, imageUrl: row.image_url, message: row.message };
}

export async function getFounder(): Promise<FounderInfo | null> {
  const { rows } = await getPool().query<FounderRow>('SELECT * FROM founder_info WHERE id = 1');
  if (rows.length === 0) return null;
  return toFounder(rows[0]);
}

export async function updateFounder(updates: Partial<FounderInfo>): Promise<FounderInfo> {
  const { rows } = await getPool().query<FounderRow>(
    `UPDATE founder_info SET
       name = COALESCE($1, name), title = COALESCE($2, title), bio = COALESCE($3, bio),
       image_url = COALESCE($4, image_url), message = COALESCE($5, message)
     WHERE id = 1 RETURNING *`,
    [updates.name ?? null, updates.title ?? null, updates.bio ?? null, updates.imageUrl ?? null, updates.message ?? null]
  );
  return toFounder(rows[0]);
}

interface MoMRow {
  name: string;
  avatar_url: string;
  achievement: string;
  bio: string;
  month: string;
}

function toMoM(row: MoMRow): MemberOfMonth {
  return { name: row.name, avatarUrl: row.avatar_url, achievement: row.achievement, bio: row.bio, month: row.month };
}

export async function getMemberOfMonth(): Promise<MemberOfMonth | null> {
  const { rows } = await getPool().query<MoMRow>('SELECT * FROM member_of_month WHERE id = 1');
  if (rows.length === 0) return null;
  return toMoM(rows[0]);
}

export async function updateMemberOfMonth(updates: Partial<MemberOfMonth>): Promise<MemberOfMonth> {
  const { rows } = await getPool().query<MoMRow>(
    `UPDATE member_of_month SET
       name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url),
       achievement = COALESCE($3, achievement), bio = COALESCE($4, bio), month = COALESCE($5, month)
     WHERE id = 1 RETURNING *`,
    [updates.name ?? null, updates.avatarUrl ?? null, updates.achievement ?? null, updates.bio ?? null, updates.month ?? null]
  );
  return toMoM(rows[0]);
}

// --------------------------- Contact Messages -----------------------------

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string | Date;
}

function toContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    isRead: row.is_read,
    createdAt: toIso(row.created_at),
  };
}

export async function createContactMessage(input: { name: string; email: string; message: string }): Promise<ContactMessage> {
  const { rows } = await getPool().query<ContactMessageRow>(
    `INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING *`,
    [input.name, input.email, input.message]
  );
  return toContactMessage(rows[0]);
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const { rows } = await getPool().query<ContactMessageRow>('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return rows.map(toContactMessage);
}

export async function markContactMessageRead(id: string, isRead: boolean): Promise<ContactMessage | null> {
  const { rows } = await getPool().query<ContactMessageRow>(
    'UPDATE contact_messages SET is_read = $2 WHERE id = $1 RETURNING *',
    [id, isRead]
  );
  if (rows.length === 0) return null;
  return toContactMessage(rows[0]);
}

export async function deleteContactMessage(id: string): Promise<ContactMessage | null> {
  const { rows } = await getPool().query<ContactMessageRow>('DELETE FROM contact_messages WHERE id = $1 RETURNING *', [id]);
  if (rows.length === 0) return null;
  return toContactMessage(rows[0]);
}
