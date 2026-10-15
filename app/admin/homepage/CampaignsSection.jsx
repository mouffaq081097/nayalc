'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Plus, UploadCloud, Pencil, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { campaignStatus, dateToDubaiInput } from '@/lib/campaignRules';

const STATUS_STYLE = {
  Live: 'bg-emerald-50 text-emerald-700',
  Scheduled: 'bg-purple-50 text-purple-700',
  Ended: 'bg-gray-100 text-gray-500',
  Off: 'bg-gray-100 text-gray-500',
};

const EMPTY = { title: '', subtitle: '', ctaLabel: 'Shop now', link: '/sales', imageUrl: '', startsAt: '', endsAt: '', showCountdown: true, isActive: true };

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const inputClass = 'w-full rounded-lg border border-purple-100 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200';
const labelClass = 'block text-xs font-medium text-purple-400 mb-1';

function CampaignForm({ initial, onCancel, onSaved }) {
  const { fetchWithAuth } = useAppContext();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetchWithAuth('/api/admin/campaigns/image', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm((f) => ({ ...f, imageUrl: data.imageUrl }));
    } catch (err) {
      setError(err.message || 'The upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetchWithAuth(form.id ? `/api/admin/campaigns/${form.id}` : '/api/admin/campaigns', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save the campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="border border-purple-100 rounded-xl bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-purple-100 bg-purple-50/40">
        <p className="text-sm font-medium text-purple-700">{form.id ? 'Edit campaign' : 'New campaign'}</p>
      </div>
      <div className="p-6 grid gap-5 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div>
            <label htmlFor="cmp-title" className={labelClass}>Title</label>
            <input id="cmp-title" className={inputClass} value={form.title} onChange={set('title')} placeholder="White Friday: up to 30% off" required />
          </div>
          <div>
            <label htmlFor="cmp-subtitle" className={labelClass}>Line under the title (optional)</label>
            <input id="cmp-subtitle" className={inputClass} value={form.subtitle} onChange={set('subtitle')} placeholder="Our biggest offers of the year, on GERnétic and Zorah." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cmp-cta" className={labelClass}>Button text</label>
              <input id="cmp-cta" className={inputClass} value={form.ctaLabel} onChange={set('ctaLabel')} />
            </div>
            <div>
              <label htmlFor="cmp-link" className={labelClass}>Button link</label>
              <input id="cmp-link" className={inputClass} value={form.link} onChange={set('link')} placeholder="/sales" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cmp-start" className={labelClass}>Starts (Dubai time)</label>
              <input id="cmp-start" type="datetime-local" className={inputClass} value={form.startsAt} onChange={set('startsAt')} required />
            </div>
            <div>
              <label htmlFor="cmp-end" className={labelClass}>Ends (Dubai time)</label>
              <input id="cmp-end" type="datetime-local" className={inputClass} value={form.endsAt} onChange={set('endsAt')} required />
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input id="cmp-countdown" type="checkbox" checked={form.showCountdown} onChange={set('showCountdown')} className="accent-purple-600" />
              Show a countdown
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input id="cmp-active" type="checkbox" checked={form.isActive} onChange={set('isActive')} className="accent-purple-600" />
              Switched on
            </label>
          </div>
        </div>

        <div>
          <span className={labelClass}>Photo</span>
          <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 border border-purple-100">
            {form.imageUrl && <Image src={form.imageUrl} alt="" fill sizes="260px" className="object-cover" />}
            {uploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="animate-spin text-purple-500" /></div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
          <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-purple-200 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50">
            <UploadCloud size={15} /> {form.imageUrl ? 'Replace photo' : 'Upload photo'}
          </button>
        </div>
      </div>
      {error && <p className="px-6 -mt-2 pb-3 text-sm text-red-600">{error}</p>}
      <div className="px-6 py-4 border-t border-purple-100 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-purple-200 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50">Cancel</button>
        <button type="submit" disabled={saving || uploading} className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}>
          {saving ? 'Saving…' : 'Save campaign'}
        </button>
      </div>
    </form>
  );
}

/** Homepage campaign banners: one shows while it's live; a countdown is optional. */
export default function CampaignsSection() {
  const { fetchWithAuth } = useAppContext();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // form values, or null
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/admin/campaigns');
      if (res.ok) setCampaigns(await res.json());
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    await fetchWithAuth(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
    setConfirmId(null);
    load();
  };

  const toForm = (c) => ({
    ...c,
    subtitle: c.subtitle || '',
    imageUrl: c.imageUrl || '',
    startsAt: dateToDubaiInput(c.startsAt),
    endsAt: dateToDubaiInput(c.endsAt),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Campaign banner</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            A banner under the categories for White Friday, National Day, Ramadan and other offers. It appears at the start
            time and disappears at the end time by itself. If two overlap, the one ending first shows.
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(EMPTY)} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#9333ea,#db2777)' }}>
            <Plus size={16} /> New campaign
          </button>
        )}
      </div>

      {editing && (
        <CampaignForm
          key={editing.id || 'new'}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        !editing && <p className="text-sm text-gray-400">No campaigns yet.</p>
      ) : (
        <ul className="border border-purple-100 rounded-xl bg-white divide-y divide-purple-50">
          {campaigns.map((c) => {
            const status = campaignStatus(c);
            return (
              <li key={c.id} className="px-5 py-4 flex flex-wrap items-center gap-4">
                <div className="relative w-20 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                  {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{fmt(c.startsAt)} – {fmt(c.endsAt)} · {c.link}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[status]}`}>{status}</span>
                {confirmId === c.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Delete?</span>
                    <button type="button" onClick={() => remove(c.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-white">Delete</button>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg border border-purple-200 px-3 py-1.5 text-purple-600">Keep</button>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <button type="button" aria-label={`Edit ${c.title}`} onClick={() => setEditing(toForm(c))} className="p-2 rounded-lg text-purple-600 hover:bg-purple-50"><Pencil size={16} /></button>
                    <button type="button" aria-label={`Delete ${c.title}`} onClick={() => setConfirmId(c.id)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
