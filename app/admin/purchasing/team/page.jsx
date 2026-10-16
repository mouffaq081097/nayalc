'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import PageLoader from '@/app/components/PageLoader';
import { PURCHASING_ROLES } from '@/lib/erp/roles';
import { ErrorBanner, Notice, PageHeader, api, secondary, subdued, text, usePurchasing } from '../_components/purchasingUi';

export default function TeamPage() {
  const { data, error, setData } = usePurchasing('/api/admin/purchasing/team');
  const [saving, setSaving] = useState(null);

  if (!data && !error) return <PageLoader />;
  const access = data?.access;
  const manage = access?.full;

  const save = async (member, body) => {
    setSaving(member.id);
    try {
      const result = await api('/api/admin/purchasing/team', { method: 'PUT', body: { userId: member.id, ...body } });
      setData(d => ({ ...d, team: d.team.map(m => (m.id === member.id ? { ...m, full: result.full, roles: result.roles } : m)) }));
      toast.success('Roles saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  const toggleRole = (member, role) => {
    const roles = member.roles.includes(role) ? member.roles.filter(r => r !== role) : [...member.roles, role];
    save(member, { roles });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Team & roles" subtitle="Who can request, approve, buy, receive and cost stock" />
      <ErrorBanner>{error}</ErrorBanner>

      <Notice tone="info">
        Only people with admin access appear here — give it from their page under <Link href="/admin/users" className="underline">Customers</Link>.
        Admins start with full access. Untick it to limit someone to the roles below: they then see <strong>only</strong> the purchasing pages for those roles and none of the rest of the admin (orders, customers, payments…). An approver-only member sees just the requisitions waiting for approval. A requester can&apos;t approve their own requisition unless they have full access.
      </Notice>
      {!manage && data && <Notice tone="warning">Only an admin with full purchasing access can change roles.</Notice>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {PURCHASING_ROLES.map(r => (
          <div key={r.id} className="sp-card sp-card-pad">
            <p className="text-[13px] font-semibold" style={text}>{r.label}</p>
            <p className="text-[12px] mt-1 leading-relaxed" style={subdued}>{r.description}</p>
          </div>
        ))}
      </div>

      {data && (
        <div className="sp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="sp-table">
              <thead>
                <tr>
                  <th>Team member</th>
                  <th className="text-center">Full access</th>
                  {PURCHASING_ROLES.map(r => <th key={r.id} className="text-center">{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.team.map(m => {
                  const self = m.id === access.userId;
                  const disabled = !manage || saving === m.id;
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className="font-medium" style={text}>{[m.first_name, m.last_name].filter(Boolean).join(' ') || m.email}{self ? ' (you)' : ''}</span>
                        <span className="block text-[12px]" style={subdued}>{m.email}</span>
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                          style={{ accentColor: 'var(--sp-primary)' }}
                          checked={m.full}
                          disabled={disabled || (self && m.full)}
                          onChange={() => save(m, m.full ? { roles: [] } : { full: true })}
                          aria-label={`Full access for ${m.email}`}
                        />
                      </td>
                      {PURCHASING_ROLES.map(r => (
                        <td key={r.id} className="text-center">
                          {m.full ? <span style={secondary}>✓</span> : (
                            <input
                              type="checkbox"
                              className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                              style={{ accentColor: 'var(--sp-primary)' }}
                              checked={m.roles.includes(r.id)}
                              disabled={disabled}
                              onChange={() => toggleRole(m, r.id)}
                              aria-label={`${r.label} for ${m.email}`}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
