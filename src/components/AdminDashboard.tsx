'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin Dashboard — the control center for the reading club website.
 * Every mutating request here hits an admin-protected backend route
 * (requireAdmin middleware); this component never assumes trust beyond
 * what the backend enforces.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL, mediaUrl } from '../lib/api';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  CalendarDays,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle2,
  X,
  Video as VideoIcon,
  Mic,
  ScrollText,
  Loader2,
  ImagePlus,
  ShieldCheck,
  UploadCloud,
  Star,
  Mail,
  MailOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageCropModal from './ImageCropModal';
import {
  Article,
  ArticleStatus,
  PdfBook,
  VideoItem,
  TalkItem,
  ClubEvent,
  EventVisibility,
  GalleryItem,
  ClubSettings,
  RoadmapNode,
  Role,
  User,
  AuditLog,
  MemberOfMonth,
  Testimonial,
  ContactMessage,
} from '../types';

interface AdminDashboardProps {
  token: string;
  articles: Article[];
  pdfs: PdfBook[];
  videos: VideoItem[];
  talks: TalkItem[];
  events: ClubEvent[];
  gallery: GalleryItem[];
  settings: ClubSettings | null;
  memberOfMonth: MemberOfMonth | null;
  testimonials: Testimonial[];
  onRefreshAll: () => void;
}

type Tab = 'overview' | 'users' | 'articles' | 'library' | 'events' | 'media' | 'community' | 'messages' | 'settings';
type MediaSubTab = 'videos' | 'talks' | 'gallery';

interface OverviewData {
  users: { total: number; admins: number; active: number };
  content: {
    articles: number;
    publishedArticles: number;
    draftArticles: number;
    pdfs: number;
    videos: number;
    talks: number;
    gallery: number;
    events: number;
    upcomingEvents: number;
  };
}

// -----------------------------------------------------------------------
// Small shared UI primitives
// -----------------------------------------------------------------------

function authHeaders(token: string, json = true): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all font-sans ${
        active
          ? 'bg-emerald-900 text-white shadow-md shadow-emerald-900/20'
          : 'text-emerald-900/70 hover:bg-emerald-900/5'
      }`}
    >
      <Icon size={16} strokeWidth={2.25} />
      {label}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, tint }: { label: string; value: number | string; icon: React.ElementType; tint: string }) {
  return (
    <div className="premium-card rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={20} strokeWidth={2.25} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-emerald-950 font-sans leading-none">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <h3 className="font-display font-bold text-lg text-emerald-950">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/30 focus:border-emerald-800 transition-all';

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-all font-sans"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {label}
    </button>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
      {message}
    </div>
  );
}

// -----------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------

export default function AdminDashboard({
  token,
  articles,
  pdfs,
  videos,
  talks,
  events,
  gallery,
  settings,
  memberOfMonth,
  testimonials,
  onRefreshAll,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [mediaTab, setMediaTab] = useState<MediaSubTab>('videos');

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [modal, setModal] = useState<null | { type: string; data?: unknown }>(null);

  const loadOverview = useCallback(() => {
    fetch(`${API_BASE_URL}/api/admin/overview`, { headers: authHeaders(token, false) })
      .then((r) => r.json())
      .then(setOverview)
      .catch(() => {});
  }, [token]);

  const loadUsers = useCallback(() => {
    fetch(`${API_BASE_URL}/api/admin/users`, { headers: authHeaders(token, false) })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setUsers(data))
      .catch(() => {});
  }, [token]);

  const loadLogs = useCallback(() => {
    fetch(`${API_BASE_URL}/api/admin/logs`, { headers: authHeaders(token, false) })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setLogs(data))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadOverview();
    loadUsers();
    loadLogs();
  }, [loadOverview, loadUsers, loadLogs]);

  const refresh = () => {
    onRefreshAll();
    loadOverview();
    loadUsers();
    loadLogs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="admin-dashboard-root">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <ShieldCheck size={18} />
          <span className="text-xs font-bold uppercase tracking-widest font-sans">Admin Control Center</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-emerald-950">Maamulka Naadiga</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Maamul xubnaha, maqaallada, kutubka, munaasabadaha, warbaahinta, iyo dejinta website-ka.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-8 border-b border-gray-150" id="admin-tabs">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={LayoutDashboard} label="Dashboard" />
        <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={Users} label="Users" />
        <TabButton active={tab === 'articles'} onClick={() => setTab('articles')} icon={BookOpen} label="Articles" />
        <TabButton active={tab === 'library'} onClick={() => setTab('library')} icon={Library} label="Library" />
        <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon={CalendarDays} label="Events" />
        <TabButton active={tab === 'media'} onClick={() => setTab('media')} icon={ImageIcon} label="Media" />
        <TabButton active={tab === 'community'} onClick={() => setTab('community')} icon={Star} label="Community" />
        <TabButton active={tab === 'messages'} onClick={() => setTab('messages')} icon={Mail} label="Messages" />
        <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={SettingsIcon} label="Settings" />
      </div>

      {tab === 'overview' && <OverviewTab data={overview} logs={logs} />}

      {tab === 'users' && (
        <UsersTab token={token} users={users} onChanged={refresh} openModal={setModal} />
      )}

      {tab === 'articles' && (
        <ArticlesTab token={token} articles={articles} onChanged={refresh} openModal={setModal} />
      )}

      {tab === 'library' && <LibraryTab token={token} pdfs={pdfs} onChanged={refresh} openModal={setModal} />}

      {tab === 'events' && <EventsTab token={token} events={events} onChanged={refresh} openModal={setModal} />}

      {tab === 'media' && (
        <MediaTab
          token={token}
          videos={videos}
          talks={talks}
          gallery={gallery}
          mediaTab={mediaTab}
          setMediaTab={setMediaTab}
          onChanged={refresh}
          openModal={setModal}
        />
      )}

      {tab === 'settings' && <SettingsTab token={token} settings={settings} onChanged={refresh} />}

      {tab === 'community' && (
        <CommunityTab
          token={token}
          memberOfMonth={memberOfMonth}
          testimonials={testimonials}
          onChanged={refresh}
          openModal={setModal}
        />
      )}

      {tab === 'messages' && <MessagesTab token={token} />}

      {/* ---------------------------------------------------------------- */}
      {/* Modals                                                           */}
      {/* ---------------------------------------------------------------- */}
      {modal?.type === 'user-create' && (
        <UserFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} />
      )}
      {modal?.type === 'user-edit' && (
        <UserFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} existing={modal.data as User | undefined} />
      )}
      {modal?.type === 'user-reset-password' && (
        <ResetPasswordModal token={token} user={modal.data as User} onClose={() => setModal(null)} onSaved={refresh} />
      )}
      {modal?.type === 'article-edit' && (
        <ArticleFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} existing={modal.data as Article | undefined} />
      )}
      {modal?.type === 'pdf-form' && (
        <PdfFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} existing={modal.data as PdfBook | undefined} />
      )}
      {modal?.type === 'event-form' && (
        <EventFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} existing={modal.data as ClubEvent | undefined} />
      )}
      {modal?.type === 'video-form' && (
        <VideoFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} existing={modal.data as VideoItem | undefined} />
      )}
      {modal?.type === 'talk-form' && (
        <TalkFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} existing={modal.data as TalkItem | undefined} />
      )}
      {modal?.type === 'gallery-form' && (
        <GalleryFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} />
      )}
      {modal?.type === 'testimonial-form' && (
        <TestimonialFormModal token={token} onClose={() => setModal(null)} onSaved={refresh} existing={modal.data as Testimonial | undefined} />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Overview
// -----------------------------------------------------------------------

function OverviewTab({ data, logs }: { data: OverviewData | null; logs: AuditLog[] }) {
  if (!data) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-16 justify-center">
        <Loader2 className="animate-spin" size={18} /> Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.users.total} icon={Users} tint="bg-emerald-100 text-emerald-800" />
        <StatCard label="Administrators" value={data.users.admins} icon={ShieldCheck} tint="bg-amber-100 text-amber-700" />
        <StatCard label="Active Accounts" value={data.users.active} icon={CheckCircle2} tint="bg-teal-100 text-teal-700" />
        <StatCard
          label="Published Articles"
          value={`${data.content.publishedArticles}/${data.content.articles}`}
          icon={BookOpen}
          tint="bg-blue-100 text-blue-700"
        />
        <StatCard label="Library Books" value={data.content.pdfs} icon={Library} tint="bg-purple-100 text-purple-700" />
        <StatCard label="Video Lectures" value={data.content.videos} icon={VideoIcon} tint="bg-rose-100 text-rose-700" />
        <StatCard label="Audio Talks" value={data.content.talks} icon={Mic} tint="bg-orange-100 text-orange-700" />
        <StatCard
          label="Upcoming Events"
          value={`${data.content.upcomingEvents}/${data.content.events}`}
          icon={CalendarDays}
          tint="bg-cyan-100 text-cyan-700"
        />
      </div>

      <div className="premium-card rounded-2xl p-6">
        <h3 className="font-display font-bold text-emerald-950 mb-4 flex items-center gap-2">
          <ScrollText size={18} className="text-amber-600" /> Recent Admin Activity
        </h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-emerald-950">{log.action.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {log.details} — <span className="italic">{log.userName}</span>
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------

function UsersTab({
  token,
  users,
  onChanged,
  openModal,
}: {
  token: string;
  users: User[];
  onChanged: () => void;
  openModal: (m: { type: string; data?: unknown } | null) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleActive = async (u: User) => {
    setBusyId(u.id);
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${u.id}/disable`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`Ma hubtaa inaad tirtirto akoonka ${u.name}? Tallaabadani lama noqon karto.`)) return;
    setBusyId(u.id);
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${u.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
      onChanged();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-emerald-950">User Management</h2>
        <button
          onClick={() => openModal({ type: 'user-create' })}
          className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          <Plus size={16} /> New User
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-150 rounded-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-emerald-950/[0.03] text-emerald-900 text-xs uppercase font-bold">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className={busyId === u.id ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-semibold text-emerald-950">
                  {u.name}
                  {u.title && <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wide">{u.title}</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      title="Edit"
                      onClick={() => openModal({ type: 'user-edit', data: u })}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title="Reset password"
                      onClick={() => openModal({ type: 'user-reset-password', data: u })}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      title={u.isActive ? 'Disable' : 'Enable'}
                      onClick={() => toggleActive(u)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      {u.isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                    </button>
                    <button
                      title="Delete"
                      onClick={() => remove(u)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserFormModal({
  token,
  existing,
  onClose,
  onSaved,
}: {
  token: string;
  existing?: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(existing?.role || 'MEMBER');
  const [studentId, setStudentId] = useState(existing?.studentId || '');
  const [department, setDepartment] = useState(existing?.department || '');
  const [title, setTitle] = useState(existing?.title || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = existing ? `${API_BASE_URL}/api/admin/users/${existing.id}` : `${API_BASE_URL}/api/admin/users`;
      const method = existing ? 'PUT' : 'POST';
      const body = existing
        ? { name, email, role, studentId, department, title }
        : { name, email, password, role, studentId, department, title };

      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit User' : 'Create New User'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Full name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        {!existing && (
          <Field label="Password">
            <input
              type="password"
              minLength={6}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
        )}
        <Field label="Role">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>
        <Field label="Title (e.g. Chairman, Vice Chairman, Secretary)">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional — shown next to their name" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Student ID">
            <input className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </Field>
          <Field label="Department">
            <input className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)} />
          </Field>
        </div>
        <SubmitButton loading={loading} label={existing ? 'Save Changes' : 'Create Account'} />
      </form>
    </Modal>
  );
}

function ResetPasswordModal({
  token,
  user,
  onClose,
  onSaved,
}: {
  token: string;
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Reset Password — ${user.name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="New password">
          <input
            type="password"
            minLength={6}
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Field>
        <SubmitButton loading={loading} label="Set New Password" />
      </form>
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Articles
// -----------------------------------------------------------------------

function ArticlesTab({
  token,
  articles,
  onChanged,
  openModal,
}: {
  token: string;
  articles: Article[];
  onChanged: () => void;
  openModal: (m: { type: string; data?: unknown } | null) => void;
}) {
  const remove = async (a: Article) => {
    if (!confirm(`Tirtir maqaalka "${a.title}"?`)) return;
    await fetch(`${API_BASE_URL}/api/articles/${a.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-emerald-950">Article Management</h2>
        <button
          onClick={() => openModal({ type: 'article-edit' })}
          className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          <Plus size={16} /> New Article
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-150 rounded-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-emerald-950/[0.03] text-emerald-900 text-xs uppercase font-bold">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Likes / Comments</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {articles.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-semibold text-emerald-950 max-w-xs truncate">{a.title}</td>
                <td className="px-4 py-3 text-gray-600">{a.authorName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      a.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : a.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {a.likesCount} / {a.commentsCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openModal({ type: 'article-edit', data: a })}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(a)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArticleFormModal({
  token,
  existing,
  onClose,
  onSaved,
}: {
  token: string;
  existing?: Article;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title || '');
  const [summary, setSummary] = useState(existing?.summary || '');
  const [content, setContent] = useState(existing?.content || '');
  const [category, setCategory] = useState(existing?.category || 'General');
  const [language, setLanguage] = useState(existing?.language || 'Somali');
  const [status, setStatus] = useState(existing?.status || 'DRAFT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = existing ? `${API_BASE_URL}/api/articles/${existing.id}` : `${API_BASE_URL}/api/articles`;
      const method = existing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify({ title, summary, content, category, language, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit Article' : 'New Article'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Summary">
          <textarea className={inputClass} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} required />
        </Field>
        <Field label="Content">
          <textarea className={inputClass} rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Category">
            <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Language">
            <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value as Article['language'])}>
              <option>Somali</option>
              <option>Arabic</option>
              <option>English</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ArticleStatus)}>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending Approval</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </Field>
        </div>
        <SubmitButton loading={loading} label={existing ? 'Save Changes' : 'Create Article'} />
      </form>
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Library (PDFs)
// -----------------------------------------------------------------------

function LibraryTab({
  token,
  pdfs,
  onChanged,
  openModal,
}: {
  token: string;
  pdfs: PdfBook[];
  onChanged: () => void;
  openModal: (m: { type: string; data?: unknown } | null) => void;
}) {
  const remove = async (p: PdfBook) => {
    if (!confirm(`Tirtir buugga "${p.title}"?`)) return;
    await fetch(`${API_BASE_URL}/api/pdfs/${p.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-emerald-950">Library Management</h2>
        <button
          onClick={() => openModal({ type: 'pdf-form' })}
          className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          <Plus size={16} /> New Book
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {pdfs.map((p) => (
          <div key={p.id} className="premium-card rounded-2xl overflow-hidden">
            <img loading="lazy" src={mediaUrl(p.coverUrl)} alt={p.title} className="w-full h-32 object-cover" />
            <div className="p-3">
              <p className="font-bold text-sm text-emerald-950 truncate">{p.title}</p>
              <p className="text-xs text-gray-500 truncate">{p.author}</p>
              <div className="flex items-center justify-end gap-1 mt-2">
                <button
                  onClick={() => openModal({ type: 'pdf-form', data: p })}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <Pencil size={13} />
                </button>
                <button onClick={() => remove(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfFormModal({
  token,
  existing,
  onClose,
  onSaved,
}: {
  token: string;
  existing?: PdfBook;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    author: existing?.author || '',
    description: existing?.description || '',
    category: existing?.category || 'General Studies',
    coverUrl: existing?.coverUrl || '',
    downloadUrl: existing?.downloadUrl || '',
    pagesCount: existing?.pagesCount || 0,
    language: existing?.language || 'Somali',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = existing ? `${API_BASE_URL}/api/pdfs/${existing.id}` : `${API_BASE_URL}/api/pdfs`;
      const method = existing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit Book' : 'New Book'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Author">
          <input className={inputClass} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label="Language">
            <input className={inputClass} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </Field>
        </div>
        <Field label="Cover image URL">
          <input className={inputClass} value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        </Field>
        <Field label="Download URL">
          <input className={inputClass} value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} />
        </Field>
        <Field label="Pages">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={form.pagesCount}
            onChange={(e) => setForm({ ...form, pagesCount: Number(e.target.value) })}
          />
        </Field>
        <SubmitButton loading={loading} label={existing ? 'Save Changes' : 'Add Book'} />
      </form>
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------

function EventsTab({
  token,
  events,
  onChanged,
  openModal,
}: {
  token: string;
  events: ClubEvent[];
  onChanged: () => void;
  openModal: (m: { type: string; data?: unknown } | null) => void;
}) {
  const remove = async (ev: ClubEvent) => {
    if (!confirm(`Tirtir kulanka "${ev.title}"?`)) return;
    await fetch(`${API_BASE_URL}/api/events/${ev.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-emerald-950">Events Management</h2>
        <button
          onClick={() => openModal({ type: 'event-form' })}
          className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-150 rounded-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-emerald-950/[0.03] text-emerald-900 text-xs uppercase font-bold">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((ev) => (
              <tr key={ev.id}>
                <td className="px-4 py-3 font-semibold text-emerald-950">{ev.title}</td>
                <td className="px-4 py-3 text-gray-600">
                  {ev.date} · {ev.time}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      ev.status === 'UPCOMING' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {ev.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{ev.registeredMembers.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openModal({ type: 'event-form', data: ev })}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(ev)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventFormModal({
  token,
  existing,
  onClose,
  onSaved,
}: {
  token: string;
  existing?: ClubEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    location: existing?.location || '',
    date: existing?.date || '',
    time: existing?.time || '',
    speaker: existing?.speaker || '',
    image: existing?.image || '',
    visibility: existing?.visibility || 'PUBLIC',
    status: existing?.status || 'UPCOMING',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/uploads/image`, { method: 'POST', headers: authHeaders(token, false), body: formData });
      const data = await res.json();
      if (res.ok) setForm((prev) => ({ ...prev, image: data.url }));
      else setError(data.error || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = existing ? `${API_BASE_URL}/api/events/${existing.id}` : `${API_BASE_URL}/api/events`;
      const method = existing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit Event' : 'New Event'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Time">
            <input
              type="text"
              placeholder="tusaale: 4:00 PM"
              className={inputClass}
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
            />
          </Field>
        </div>
        <Field label="Location">
          <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <Field label="Speaker">
          <input className={inputClass} value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
        </Field>
        <Field label="Event Image">
          <div className="flex items-center gap-3 flex-wrap">
            {form.image && (
              <img loading="lazy" src={mediaUrl(form.image)} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
            )}
            <label
              htmlFor="admin-event-image-input"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
            </label>
            <input
              type="file"
              id="admin-event-image-input"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={handleImageChange}
              disabled={uploading}
            />
          </div>
        </Field>
        <Field label="Visibility">
          <select className={inputClass} value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as EventVisibility })}>
            <option value="PUBLIC">Public — visible to everyone</option>
            <option value="MEMBERS">Members Only — signed-in members only</option>
          </select>
        </Field>
        {existing && (
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClubEvent['status'] })}>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </Field>
        )}
        <SubmitButton loading={loading} label={existing ? 'Save Changes' : 'Create Event'} />
      </form>
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Media (videos / talks / gallery)
// -----------------------------------------------------------------------

function MediaTab({
  token,
  videos,
  talks,
  gallery,
  mediaTab,
  setMediaTab,
  onChanged,
  openModal,
}: {
  token: string;
  videos: VideoItem[];
  talks: TalkItem[];
  gallery: GalleryItem[];
  mediaTab: MediaSubTab;
  setMediaTab: (t: MediaSubTab) => void;
  onChanged: () => void;
  openModal: (m: { type: string; data?: unknown } | null) => void;
}) {
  const removeVideo = async (v: VideoItem) => {
    if (!confirm(`Tirtir muuqaalka "${v.title}"?`)) return;
    await fetch(`${API_BASE_URL}/api/videos/${v.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    onChanged();
  };
  const removeTalk = async (t: TalkItem) => {
    if (!confirm(`Tirtir falanqaynta "${t.title}"?`)) return;
    await fetch(`${API_BASE_URL}/api/talks/${t.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    onChanged();
  };
  const removeGallery = async (g: GalleryItem) => {
    if (!confirm('Tirtir sawirkan?')) return;
    await fetch(`${API_BASE_URL}/api/gallery/${g.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display font-bold text-xl text-emerald-950">Media Management</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['videos', 'talks', 'gallery'] as MediaSubTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setMediaTab(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                mediaTab === t ? 'bg-white shadow text-emerald-900' : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            openModal({ type: mediaTab === 'videos' ? 'video-form' : mediaTab === 'talks' ? 'talk-form' : 'gallery-form' })
          }
          className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl"
        >
          <Plus size={16} /> Add {mediaTab === 'videos' ? 'Video' : mediaTab === 'talks' ? 'Talk' : 'Photo'}
        </button>
      </div>

      {mediaTab === 'videos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div key={v.id} className="premium-card rounded-2xl p-4">
              <p className="font-bold text-sm text-emerald-950 truncate">{v.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {v.speaker} · {v.duration}
              </p>
              <p className="text-[11px] text-gray-400 mt-1 truncate">{v.youtubeId ? `YouTube: ${v.youtubeId}` : v.videoUrl}</p>
              <div className="flex items-center justify-end gap-1.5 mt-3">
                <button onClick={() => openModal({ type: 'video-form', data: v })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <Pencil size={14} />
                </button>
                <button onClick={() => removeVideo(v)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mediaTab === 'talks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {talks.map((t) => (
            <div key={t.id} className="premium-card rounded-2xl p-4">
              <p className="font-bold text-sm text-emerald-950 truncate">{t.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t.speaker} · {t.duration}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-3">
                <button onClick={() => openModal({ type: 'talk-form', data: t })} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <Pencil size={14} />
                </button>
                <button onClick={() => removeTalk(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mediaTab === 'gallery' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {gallery.map((g) => (
            <div key={g.id} className="relative group rounded-2xl overflow-hidden aspect-square">
              <img loading="lazy" src={mediaUrl(g.imageUrl)} alt={g.title} className="w-full h-full object-cover" />
              <button
                onClick={() => removeGallery(g)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoFormModal({
  token,
  existing,
  onClose,
  onSaved,
}: {
  token: string;
  existing?: VideoItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    youtubeId: existing?.youtubeId || '',
    videoUrl: existing?.videoUrl || '',
    thumbnailUrl: existing?.thumbnailUrl || '',
    duration: existing?.duration || '',
    speaker: existing?.speaker || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Captures a single frame from an uploaded video file so it can be used
  // as an automatic thumbnail when the admin doesn't supply their own.
  const captureVideoFrame = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.muted = true;
      videoEl.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      videoEl.src = objectUrl;

      const cleanup = () => URL.revokeObjectURL(objectUrl);

      videoEl.onloadeddata = () => {
        // Seek slightly past the start so we don't grab a black first frame.
        videoEl.currentTime = Math.min(1, (videoEl.duration || 2) / 2);
      };
      videoEl.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth || 640;
          canvas.height = videoEl.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            return resolve(null);
          }
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            cleanup();
            resolve(blob);
          }, 'image/jpeg', 0.85);
        } catch {
          cleanup();
          resolve(null);
        }
      };
      videoEl.onerror = () => {
        cleanup();
        resolve(null);
      };
    });
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingVideo(true);
    setUploadProgress(`Uploading ${file.name}...`);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/uploads/video`, {
        method: 'POST',
        headers: authHeaders(token, false),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, videoUrl: data.url, youtubeId: '' }));
        setUploadProgress(`Uploaded: ${data.name}`);

        // Auto-generate a thumbnail from the video itself, unless the
        // admin has already provided a custom one.
        if (!form.thumbnailUrl) {
          setUploadingThumbnail(true);
          captureVideoFrame(file)
            .then(async (blob) => {
              if (!blob) return;
              const thumbFormData = new FormData();
              thumbFormData.append('file', new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
              const thumbRes = await fetch(`${API_BASE_URL}/api/uploads/image`, {
                method: 'POST',
                headers: authHeaders(token, false),
                body: thumbFormData,
              });
              const thumbData = await thumbRes.json();
              if (thumbRes.ok) {
                setForm((p) => (p.thumbnailUrl ? p : { ...p, thumbnailUrl: thumbData.url }));
              }
            })
            .finally(() => setUploadingThumbnail(false));
        }
      } else {
        setError(data.error || 'Video upload failed.');
        setUploadProgress('');
      }
    } catch {
      setError('Unable to upload the video. Please check your internet connectivity.');
      setUploadProgress('');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingThumbnail(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/uploads/image`, {
        method: 'POST',
        headers: authHeaders(token, false),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, thumbnailUrl: data.url }));
      } else {
        setError(data.error || 'Thumbnail upload failed.');
      }
    } catch {
      setError('Unable to upload the thumbnail. Please check your internet connectivity.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = existing ? `${API_BASE_URL}/api/videos/${existing.id}` : `${API_BASE_URL}/api/videos`;
      const method = existing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit Video' : 'Add Video'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="YouTube video ID (leave empty if using direct file below)">
          <input
            className={inputClass}
            placeholder="tusaale: dQw4w9WgXcQ"
            value={form.youtubeId}
            onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
          />
        </Field>
        <Field label="Direct video file — upload from your computer (.mp4, .webm, .mov, up to 300MB)">
          <div className="flex items-center gap-3">
            <label
              htmlFor="admin-video-upload-input"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                uploadingVideo
                  ? 'bg-gray-100 text-gray-400 border-gray-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{uploadingVideo ? 'Uploading...' : 'Choose Video File'}</span>
            </label>
            <input
              type="file"
              id="admin-video-upload-input"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              className="hidden"
              onChange={handleVideoFileChange}
              disabled={uploadingVideo}
            />
            {uploadProgress && <span className="text-[11px] text-gray-500 truncate">{uploadProgress}</span>}
          </div>
        </Field>
        <Field label="Thumbnail image (auto-generated from the uploaded video if you skip this)">
          <div className="flex items-center gap-3">
            {form.thumbnailUrl && (
              <img
                src={mediaUrl(form.thumbnailUrl)}
                alt="Thumbnail preview"
                className="w-20 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"
              />
            )}
            <label
              htmlFor="admin-thumbnail-upload-input"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                uploadingThumbnail
                  ? 'bg-gray-100 text-gray-400 border-gray-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {uploadingThumbnail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              <span>{uploadingThumbnail ? 'Uploading...' : form.thumbnailUrl ? 'Replace Thumbnail' : 'Upload Custom Thumbnail'}</span>
            </label>
            <input
              type="file"
              id="admin-thumbnail-upload-input"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleThumbnailFileChange}
              disabled={uploadingThumbnail}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">You can upload an image here. If you skip it, we&apos;ll automatically use a frame from your uploaded video as the thumbnail.</p>
        </Field>
        <Field label="...or a direct video file URL (.mp4) — optional alternative to YouTube">
          <input className={inputClass} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration">
            <input
              placeholder="12:30"
              className={inputClass}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </Field>
          <Field label="Speaker">
            <input className={inputClass} value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
          </Field>
        </div>
        <SubmitButton loading={loading} label={existing ? 'Save Changes' : 'Add Video'} />
      </form>
    </Modal>
  );
}

function TalkFormModal({
  token,
  existing,
  onClose,
  onSaved,
}: {
  token: string;
  existing?: TalkItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    audioUrl: existing?.audioUrl || '',
    speaker: existing?.speaker || '',
    duration: existing?.duration || '',
    date: existing?.date || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = existing ? `${API_BASE_URL}/api/talks/${existing.id}` : `${API_BASE_URL}/api/talks`;
      const method = existing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit Talk' : 'Add Talk'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Audio file URL (.mp3)">
          <input className={inputClass} value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Speaker">
            <input className={inputClass} value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} required />
          </Field>
          <Field label="Duration">
            <input
              placeholder="24:10"
              className={inputClass}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <SubmitButton loading={loading} label={existing ? 'Save Changes' : 'Add Talk'} />
      </form>
    </Modal>
  );
}

function GalleryFormModal({ token, onClose, onSaved }: { token: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', category: 'General' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/uploads/image`, {
        method: 'POST',
        headers: authHeaders(token, false),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        setError(data.error || 'Image upload failed.');
      }
    } catch {
      setError('Unable to upload the image. Please check your internet connectivity.');
    } finally {
      setUploadingImage(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/gallery`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Photo" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Image — upload from your computer, or paste a URL below">
          <div className="flex items-center gap-3 flex-wrap">
            {form.imageUrl && (
              <img loading="lazy" src={mediaUrl(form.imageUrl)} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
            )}
            <label
              htmlFor="admin-gallery-upload-input"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                uploadingImage
                  ? 'bg-gray-100 text-gray-400 border-gray-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{uploadingImage ? 'Uploading...' : 'Choose Photo'}</span>
            </label>
            <input
              type="file"
              id="admin-gallery-upload-input"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={uploadingImage}
            />
          </div>
        </Field>
        <Field label="...or Image URL">
          <input className={inputClass} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
        </Field>
        <Field label="Title">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Category">
          <input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </Field>
        <SubmitButton loading={loading} label="Add Photo" />
      </form>
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Community: Star of the Month + Testimonials
// -----------------------------------------------------------------------

function CommunityTab({
  token,
  memberOfMonth,
  testimonials,
  onChanged,
  openModal,
}: {
  token: string;
  memberOfMonth: MemberOfMonth | null;
  testimonials: Testimonial[];
  onChanged: () => void;
  openModal: (m: { type: string; data?: unknown } | null) => void;
}) {
  return (
    <div className="space-y-10">
      <StarOfMonthForm token={token} memberOfMonth={memberOfMonth} onChanged={onChanged} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-emerald-950">Testimonials</h2>
          <button
            onClick={() => openModal({ type: 'testimonial-form' })}
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Testimonial</span>
          </button>
        </div>

        {testimonials.length === 0 ? (
          <div className="premium-card rounded-2xl p-10 text-center text-sm text-gray-500">
            No testimonials have been added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((tItem) => (
              <motion.div
                key={tItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card rounded-2xl p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    loading="lazy"
                    src={mediaUrl(tItem.avatarUrl) || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBlnBaNdt9jJ4GBDAvze8FWARe-A6bXrNEtv8ZCnyn-w&s=10'}
                    alt={tItem.name}
                    className="w-11 h-11 rounded-full object-cover border border-amber-500/30"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-950 truncate">{tItem.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{tItem.role}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{tItem.content}</p>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-150">
                  <button
                    onClick={() => openModal({ type: 'testimonial-form', data: tItem })}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this testimonial?')) return;
                      await fetch(`${API_BASE_URL}/api/testimonials/${tItem.id}`, { method: 'DELETE', headers: authHeaders(token, false) });
                      onChanged();
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer ml-auto"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StarOfMonthForm({
  token,
  memberOfMonth,
  onChanged,
}: {
  token: string;
  memberOfMonth: MemberOfMonth | null;
  onChanged: () => void;
}) {
  const blank: MemberOfMonth = { name: '', avatarUrl: '', achievement: '', bio: '', month: '' };
  const [form, setForm] = useState<MemberOfMonth>(memberOfMonth || blank);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    if (memberOfMonth) setForm(memberOfMonth);
  }, [memberOfMonth]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropFile(file);
  };

  const uploadCroppedPhoto = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'star-of-month.jpg');
      const res = await fetch(`${API_BASE_URL}/api/uploads/image`, { method: 'POST', headers: authHeaders(token, false), body: formData });
      const data = await res.json();
      if (res.ok) setForm((prev) => ({ ...prev, avatarUrl: data.url }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await fetch(`${API_BASE_URL}/api/member-of-month`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(form) });
      onChanged();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear the Star of the Month content?')) return;
    setForm(blank);
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/api/member-of-month`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(blank) });
      onChanged();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-amber-500" />
        <h2 className="font-display font-bold text-xl text-emerald-950">Star of the Month</h2>
      </div>
      <form onSubmit={submit} className="premium-card rounded-2xl p-6">
        {saved && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
            Star of the Month updated successfully.
          </div>
        )}
        <Field label="Photo">
          <div className="flex items-center gap-3 flex-wrap">
            <img
              loading="lazy"
              src={mediaUrl(form.avatarUrl) || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBlnBaNdt9jJ4GBDAvze8FWARe-A6bXrNEtv8ZCnyn-w&s=10'}
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover border border-amber-500/30"
            />
            <label
              htmlFor="admin-mom-upload-input"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{uploading ? 'Uploading...' : 'Choose Photo'}</span>
            </label>
            <input
              type="file"
              id="admin-mom-upload-input"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={uploading}
            />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Month">
            <input className={inputClass} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} placeholder="e.g. July 2026" />
          </Field>
        </div>
        <Field label="Title / Achievement">
          <input className={inputClass} value={form.achievement} onChange={(e) => setForm({ ...form, achievement: e.target.value })} />
        </Field>
        <Field label="Description / Bio">
          <textarea className={inputClass} rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SubmitButton loading={loading} label="Save Star of the Month" />
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer"
          >
            Clear
          </button>
        </div>
      </form>
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          circular
          aspect={1}
          onCancel={() => setCropFile(null)}
          onCropped={uploadCroppedPhoto}
        />
      )}
    </div>
  );
}

function TestimonialFormModal({
  token,
  onClose,
  onSaved,
  existing,
}: {
  token: string;
  onClose: () => void;
  onSaved: () => void;
  existing?: Testimonial;
}) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    role: existing?.role || '',
    content: existing?.content || '',
    avatarUrl: existing?.avatarUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCropFile(file);
  };

  const uploadCroppedPhoto = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'testimonial.jpg');
      const res = await fetch(`${API_BASE_URL}/api/uploads/image`, { method: 'POST', headers: authHeaders(token, false), body: formData });
      const data = await res.json();
      if (res.ok) setForm((prev) => ({ ...prev, avatarUrl: data.url }));
      else setError(data.error || 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = existing ? `${API_BASE_URL}/api/testimonials/${existing.id}` : `${API_BASE_URL}/api/testimonials`;
      const method = existing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Wax baa qaldamay.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit Testimonial' : 'Add Testimonial'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBanner message={error} />
        <Field label="Photo">
          <div className="flex items-center gap-3 flex-wrap">
            {form.avatarUrl && (
              <img loading="lazy" src={mediaUrl(form.avatarUrl)} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-gray-200" />
            )}
            <label
              htmlFor="admin-testimonial-upload-input"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{uploading ? 'Uploading...' : 'Choose Photo'}</span>
            </label>
            <input
              type="file"
              id="admin-testimonial-upload-input"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={uploading}
            />
          </div>
        </Field>
        <Field label="Name">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Role / Affiliation">
          <input className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. 3rd-Year Student" />
        </Field>
        <Field label="Testimonial">
          <textarea className={inputClass} rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        </Field>
        <SubmitButton loading={loading} label={existing ? 'Save Changes' : 'Add Testimonial'} />
      </form>
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          circular
          aspect={1}
          onCancel={() => setCropFile(null)}
          onCropped={uploadCroppedPhoto}
        />
      )}
    </Modal>
  );
}

// -----------------------------------------------------------------------
// Contact Messages Inbox
// -----------------------------------------------------------------------

function MessagesTab({ token }: { token: string }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/admin/messages`, { headers: authHeaders(token, false) })
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMessages(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const toggleExpand = async (msg: ContactMessage) => {
    const opening = expandedId !== msg.id;
    setExpandedId(opening ? msg.id : null);
    if (opening && !msg.isRead) {
      await fetch(`${API_BASE_URL}/api/admin/messages/${msg.id}/read`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ isRead: true }),
      });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await fetch(`${API_BASE_URL}/api/admin/messages/${id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-emerald-950">
          Contact Messages
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-bold bg-amber-500 text-emerald-950 rounded-full px-2 py-0.5 align-middle">
              {unreadCount} new
            </span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-emerald-800 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="premium-card rounded-2xl p-10 text-center text-sm text-gray-500">
          No messages have been submitted through the Contact page yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`premium-card rounded-2xl overflow-hidden ${!msg.isRead ? 'ring-1 ring-amber-400/50' : ''}`}
            >
              <button
                onClick={() => toggleExpand(msg)}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
              >
                {msg.isRead ? (
                  <MailOpen className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${!msg.isRead ? 'font-bold text-emerald-950' : 'font-semibold text-gray-700'}`}>
                      {msg.name}
                    </p>
                    <span className="text-[11px] text-gray-400 truncate">{msg.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
              </button>
              <AnimatePresence>
                {expandedId === msg.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 border-t border-gray-150">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
                        >
                          Reply via Email
                        </a>
                        <button
                          onClick={() => remove(msg.id)}
                          className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer ml-auto"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------

function SettingsTab({
  token,
  settings,
  onChanged,
}: {
  token: string;
  settings: ClubSettings | null;
  onChanged: () => void;
}) {
  const [form, setForm] = useState<ClubSettings>(
    settings || {
      clubName: '',
      clubArabicName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      whatsappGroupUrl: '',
      telegramChannelUrl: '',
      tiktokUrl: '',
      facebookUrl: '',
      xUrl: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await fetch(`${API_BASE_URL}/api/settings`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify(form) });
      onChanged();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display font-bold text-xl text-emerald-950 mb-5">Website Settings</h2>
      <form onSubmit={submit} className="premium-card rounded-2xl p-6">
        {saved && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
            Settings saved successfully.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Club Name">
            <input className={inputClass} value={form.clubName} onChange={(e) => setForm({ ...form, clubName: e.target.value })} />
          </Field>
          <Field label="Club Name (Arabic)">
            <input
              className={inputClass}
              value={form.clubArabicName}
              onChange={(e) => setForm({ ...form, clubArabicName: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Email">
            <input
              type="email"
              className={inputClass}
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </Field>
          <Field label="Contact Phone">
            <input className={inputClass} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </Field>
        </div>
        <Field label="Address">
          <textarea className={inputClass} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp Channel URL">
            <input
              className={inputClass}
              value={form.whatsappGroupUrl || ''}
              onChange={(e) => setForm({ ...form, whatsappGroupUrl: e.target.value })}
            />
          </Field>
          <Field label="Telegram Channel URL">
            <input
              className={inputClass}
              value={form.telegramChannelUrl || ''}
              onChange={(e) => setForm({ ...form, telegramChannelUrl: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="TikTok URL">
            <input
              className={inputClass}
              placeholder="https://tiktok.com/@..."
              value={form.tiktokUrl || ''}
              onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
            />
          </Field>
          <Field label="Facebook URL">
            <input
              className={inputClass}
              placeholder="https://facebook.com/..."
              value={form.facebookUrl || ''}
              onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
            />
          </Field>
          <Field label="X (Twitter) URL">
            <input
              className={inputClass}
              placeholder="https://x.com/..."
              value={form.xUrl || ''}
              onChange={(e) => setForm({ ...form, xUrl: e.target.value })}
            />
          </Field>
        </div>
        <SubmitButton loading={loading} label="Save Settings" />
      </form>

      <RoadmapEditor token={token} />
    </div>
  );
}

function RoadmapEditor({ token }: { token: string }) {
  const [roadmap, setRoadmap] = useState<RoadmapNode[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    fetch(`${API_BASE_URL}/api/roadmap`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setRoadmap(data))
      .catch(() => {});
  };

  useEffect(load, []);

  const saveRoadmapNode = async (node: RoadmapNode) => {
    setSavingId(node.id);
    try {
      await fetch(`${API_BASE_URL}/api/roadmap/${node.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(node),
      });
    } finally {
      setSavingId(null);
    }
  };

  const addNode = async () => {
    setCreating(true);
    try {
      const nextStep = roadmap.length > 0 ? Math.max(...roadmap.map((n) => n.step)) + 1 : 1;
      const res = await fetch(`${API_BASE_URL}/api/roadmap`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ title: 'New Milestone', description: '', status: 'LOCKED', quarter: '', step: nextStep }),
      });
      const node = await res.json();
      setRoadmap((prev) => [...prev, node]);
    } finally {
      setCreating(false);
    }
  };

  const deleteNode = async (id: string) => {
    if (!confirm('Delete this roadmap milestone?')) return;
    await fetch(`${API_BASE_URL}/api/roadmap/${id}`, { method: 'DELETE', headers: authHeaders(token, false) });
    setRoadmap((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="premium-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-emerald-950">Roadmap Milestones</h3>
          <button
            onClick={addNode}
            disabled={creating}
            className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus size={13} />
            <span>{creating ? 'Adding…' : 'Add Milestone'}</span>
          </button>
        </div>
        <div className="space-y-3">
          {roadmap.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-6">No roadmap milestones yet. Add the first one above.</p>
          )}
          {roadmap.map((node, idx) => (
            <div key={node.id} className="border border-gray-150 rounded-xl p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <span className="text-[10px] font-bold text-gray-400 shrink-0">Step {node.step}</span>
                <input
                  className={`${inputClass} flex-1`}
                  placeholder="Title"
                  value={node.title}
                  onChange={(e) => {
                    const next = [...roadmap];
                    next[idx] = { ...node, title: e.target.value };
                    setRoadmap(next);
                  }}
                />
                <select
                  className={inputClass}
                  value={node.status}
                  onChange={(e) => {
                    const next = [...roadmap];
                    next[idx] = { ...node, status: e.target.value as RoadmapNode['status'] };
                    setRoadmap(next);
                  }}
                >
                  <option value="LOCKED">Locked</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <input
                  className={`${inputClass} sm:w-32`}
                  placeholder="Quarter"
                  value={node.quarter}
                  onChange={(e) => {
                    const next = [...roadmap];
                    next[idx] = { ...node, quarter: e.target.value };
                    setRoadmap(next);
                  }}
                />
              </div>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Description"
                value={node.description}
                onChange={(e) => {
                  const next = [...roadmap];
                  next[idx] = { ...node, description: e.target.value };
                  setRoadmap(next);
                }}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveRoadmapNode(roadmap[idx])}
                  disabled={savingId === node.id}
                  className="text-xs font-bold text-emerald-900 hover:text-emerald-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {savingId === node.id ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => deleteNode(node.id)}
                  className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 whitespace-nowrap cursor-pointer ml-auto"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
