'use client';

/** Admin tabs added by the redesign: Comments moderation, Followers, Categories & Authors. */
import React, { useCallback, useEffect, useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import { formatDate } from '../lib/format';
import type { AdminComment, SubscriberRecord, TaxonomyEntry } from '../types';

const h = (token: string, json = false): HeadersInit => ({ Authorization: `Bearer ${token}`, ...(json ? { 'Content-Type': 'application/json' } : {}) });
const th = 'px-4 py-3';
const wrap = 'overflow-x-auto border border-gray-150 rounded-2xl';
const head = 'bg-emerald-950/[0.03] text-emerald-900 text-xs uppercase font-bold';

function useList<T>(url: string, token: string): [T[], () => void, boolean] {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    fetch(`${API_BASE_URL}${url}`, { headers: h(token) })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [url, token]);
  useEffect(load, [load]);
  return [data, load, loading];
}

export function CommentsTab({ token }: { token: string }) {
  const [rows, reload, loading] = useList<AdminComment>('/api/admin/comments', token);
  const remove = async (c: AdminComment) => {
    if (!confirm(`Delete this comment by ${c.authorName}?`)) return;
    await fetch(`${API_BASE_URL}/api/admin/comments/${c.id}`, { method: 'DELETE', headers: h(token) });
    reload();
  };
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-emerald-950 mb-1">Comments</h2>
      <p className="text-xs text-gray-500 mb-5">Emails are visible to admins only and are never shown on the public site.</p>
      <div className={wrap}>
        <table className="w-full text-sm text-left">
          <thead className={head}><tr><th className={th}>Name / Email</th><th className={th}>Comment</th><th className={th}>Article</th><th className={th}>Date</th><th className={`${th} text-right`}>Delete</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3"><div className="font-semibold text-emerald-950">{c.authorName}</div><div className="text-[11px] text-gray-400">{c.commenterEmail}</div></td>
                <td className="px-4 py-3 text-gray-600 max-w-sm"><p className="line-clamp-3">{c.content}</p></td>
                <td className="px-4 py-3 text-gray-500 max-w-[12rem] truncate">{c.articleTitle}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(c)} aria-label="Delete comment" className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No comments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FollowersTab({ token }: { token: string }) {
  const [rows, reload, loading] = useList<SubscriberRecord>('/api/admin/subscribers', token);
  const remove = async (s: SubscriberRecord) => {
    if (!confirm(`Remove ${s.email}?`)) return;
    await fetch(`${API_BASE_URL}/api/admin/subscribers/${s.id}`, { method: 'DELETE', headers: h(token) });
    reload();
  };
  const label = (s: SubscriberRecord) => (s.kind === 'all' ? 'All new articles' : `${s.kind === 'author' ? 'Author' : 'Category'}: ${s.value}`);
  return (
    <div>
      <h2 className="font-display font-bold text-xl text-emerald-950 mb-1">Followers & Subscribers <span className="text-gray-400 text-base">({rows.length})</span></h2>
      <p className="text-xs text-gray-500 mb-5">Signed-in followers get an in-app notification when a matching article is published. Email-only subscribers are listed here for your newsletter tool.</p>
      <div className={wrap}>
        <table className="w-full text-sm text-left">
          <thead className={head}><tr><th className={th}>Email</th><th className={th}>Follows</th><th className={th}>Member</th><th className={th}>Since</th><th className={`${th} text-right`}>Remove</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-semibold text-emerald-950">{s.email}</td>
                <td className="px-4 py-3 text-gray-600">{label(s)}</td>
                <td className="px-4 py-3 text-gray-500">{s.userId ? 'Yes' : '—'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => remove(s)} aria-label="Remove subscriber" className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No followers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxonomyTable({ kind, rows, token, onChanged }: { kind: 'category' | 'author'; rows: TaxonomyEntry[]; token: string; onChanged: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const save = async (from: string) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/taxonomy`, { method: 'PUT', headers: h(token, true), body: JSON.stringify({ kind, from, to: value }) });
    if (!res.ok) alert((await res.json().catch(() => ({}))).error || 'Could not rename.');
    setEditing(null);
    onChanged();
  };
  return (
    <div className={wrap}>
      <table className="w-full text-sm text-left">
        <thead className={head}><tr><th className={th}>{kind === 'category' ? 'Category' : 'Author'}</th><th className={th}>Articles</th><th className={`${th} text-right`}>Rename / merge</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="px-4 py-3 font-semibold text-emerald-950">
                {editing === r.name ? <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save(r.name)} className="w-full max-w-xs px-3 py-1.5 rounded-lg border border-gray-200 text-sm" /> : r.name}
              </td>
              <td className="px-4 py-3 text-gray-600">{r.count}</td>
              <td className="px-4 py-3 text-right">
                {editing === r.name ? (
                  <span className="inline-flex gap-1"><button onClick={() => save(r.name)} aria-label="Save" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700"><Check size={15} /></button><button onClick={() => setEditing(null)} aria-label="Cancel" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={15} /></button></span>
                ) : (
                  <button onClick={() => { setEditing(r.name); setValue(r.name); }} aria-label={`Rename ${r.name}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={15} /></button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nothing here yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function TaxonomyTab({ token }: { token: string }) {
  const [data, setData] = useState<{ categories: TaxonomyEntry[]; authors: TaxonomyEntry[] }>({ categories: [], authors: [] });
  const load = useCallback(() => {
    fetch(`${API_BASE_URL}/api/admin/taxonomy`, { headers: h(token) }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setData(d));
  }, [token]);
  useEffect(load, [load]);
  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display font-bold text-xl text-emerald-950 mb-1">Categories</h2>
        <p className="text-xs text-gray-500 mb-4">Categories are created by typing one in an article. Rename one here to update every article, or rename it to an existing name to merge them.</p>
        <TaxonomyTable kind="category" rows={data.categories} token={token} onChanged={load} />
      </div>
      <div>
        <h2 className="font-display font-bold text-xl text-emerald-950 mb-1">Authors</h2>
        <p className="text-xs text-gray-500 mb-4">Fix a display name across all of an author’s articles (e.g. spelling, or merging two spellings).</p>
        <TaxonomyTable kind="author" rows={data.authors} token={token} onChanged={load} />
      </div>
    </div>
  );
}
