/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Data-access layer for authentication + user management. This is the
 * ONLY module allowed to read or write the `users` table. Every query
 * goes straight to Neon PostgreSQL via the shared pool.
 *
 * There is no public self-registration in this app: accounts are only
 * ever created by an administrator (see adminCreateUser below), which is
 * enforced at the route level by `requireAdmin` in admin.routes.ts.
 */

import bcrypt from 'bcryptjs';
import { getPool } from '../db/pool';
import { Achievement, Role, User } from '../types';

const SALT_ROUNDS = 10;

/** Raw shape of a row in the `users` table. */
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: Role;
  student_id: string | null;
  department: string | null;
  avatar_url: string | null;
  bio: string | null;
  title: string | null;
  achievements: Achievement[];
  is_verified: boolean;
  is_active: boolean;
  created_at: string | Date;
}

export interface AuthenticatedUserRecord extends User {
  passwordHash: string;
}

function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    studentId: row.student_id ?? undefined,
    department: row.department ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    title: row.title ?? undefined,
    achievements: row.achievements ?? [],
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    isVerified: row.is_verified,
    isActive: row.is_active,
  };
}

/**
 * Finds a user by email (case-insensitive) INCLUDING the password hash.
 * Only the login flow should call this — every other consumer must use
 * findUserById / findUserByEmail (public, no hash).
 */
export async function findUserWithPasswordByEmail(
  email: string
): Promise<AuthenticatedUserRecord | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );
  if (rows.length === 0) return null;
  return { ...toPublicUser(rows[0]), passwordHash: rows[0].password_hash };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );
  if (rows.length === 0) return null;
  return toPublicUser(rows[0]);
}

export async function findUserById(id: string): Promise<User | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  if (rows.length === 0) return null;
  return toPublicUser(rows[0]);
}

export async function listUsers(): Promise<User[]> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>('SELECT * FROM users ORDER BY created_at DESC');
  return rows.map(toPublicUser);
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
  studentId?: string;
  department?: string;
}

/**
 * Creates a new user account. This is only ever called from an
 * admin-protected route (`POST /api/admin/users`) — there is no public
 * registration endpoint in this application.
 */
export async function adminCreateUser(input: CreateUserInput): Promise<User> {
  const pool = getPool();

  const existing = await findUserByEmail(input.email);
  if (existing) {
    const err = new Error('EMAIL_TAKEN');
    err.name = 'EmailTakenError';
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, name, role, student_id, department, is_verified, is_active)
     VALUES (LOWER($1), $2, $3, $4, $5, $6, true, true)
     RETURNING *`,
    [
      input.email,
      passwordHash,
      input.name,
      input.role ?? 'MEMBER',
      input.studentId ?? null,
      input.department ?? null,
    ]
  );

  return toPublicUser(rows[0]);
}

/** Verifies a plaintext password against the stored bcrypt hash. */
export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

export interface UpdateUserProfileInput {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  department?: string;
}

/** Self-service profile update (name/bio/avatar/department only — never role or email). */
export async function updateUserProfile(
  id: string,
  updates: UpdateUserProfileInput
): Promise<User | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    `UPDATE users SET
       name = COALESCE($2, name),
       bio = COALESCE($3, bio),
       avatar_url = COALESCE($4, avatar_url),
       department = COALESCE($5, department),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, updates.name ?? null, updates.bio ?? null, updates.avatarUrl ?? null, updates.department ?? null]
  );
  if (rows.length === 0) return null;
  return toPublicUser(rows[0]);
}

export interface AdminUpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  studentId?: string;
  department?: string;
  title?: string;
}

/** Full admin-level edit of any user's account (name, email, role, etc). */
export async function adminUpdateUser(
  id: string,
  updates: AdminUpdateUserInput
): Promise<User | null> {
  const pool = getPool();

  if (updates.email) {
    const existing = await findUserByEmail(updates.email);
    if (existing && existing.id !== id) {
      const err = new Error('EMAIL_TAKEN');
      err.name = 'EmailTakenError';
      throw err;
    }
  }

  const { rows } = await pool.query<UserRow>(
    `UPDATE users SET
       name = COALESCE($2, name),
       email = COALESCE(LOWER($3), email),
       role = COALESCE($4, role),
       student_id = COALESCE($5, student_id),
       department = COALESCE($6, department),
       title = COALESCE($7, title),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      updates.name ?? null,
      updates.email ?? null,
      updates.role ?? null,
      updates.studentId ?? null,
      updates.department ?? null,
      updates.title ?? null,
    ]
  );
  if (rows.length === 0) return null;
  return toPublicUser(rows[0]);
}

/** Enables or disables login for an account without deleting it. */
export async function setUserActive(id: string, isActive: boolean): Promise<User | null> {
  const pool = getPool();
  const { rows } = await pool.query<UserRow>(
    'UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, isActive]
  );
  if (rows.length === 0) return null;
  return toPublicUser(rows[0]);
}

/** Admin-initiated password reset — sets a brand-new bcrypt hash directly. */
export async function adminResetPassword(id: string, newPassword: string): Promise<User | null> {
  const pool = getPool();
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const { rows } = await pool.query<UserRow>(
    'UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, passwordHash]
  );
  if (rows.length === 0) return null;
  return toPublicUser(rows[0]);
}

export async function deleteUser(id: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function countUsers(): Promise<{ total: number; admins: number; active: number }> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE role = 'ADMIN')::int AS admins,
       COUNT(*) FILTER (WHERE is_active = true)::int AS active
     FROM users`
  );
  return rows[0];
}
