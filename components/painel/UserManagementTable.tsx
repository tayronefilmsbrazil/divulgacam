'use client';

import { useState, useTransition } from 'react';
import type { Manager, Campaign, ManagerRole, ManagerStatus } from '@/lib/supabase/types';
import {
  approveUser,
  rejectUser,
  assignCampaign,
  toggleGestorRole,
  resetUserPassword,
} from '@/app/painel/usuarios/actions';

const STATUS_CONFIG: Record<ManagerStatus, { label: string; classes: string }> = {
  pending: { label: 'Pendente', classes: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Aprovado', classes: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejeitado', classes: 'bg-red-100 text-red-700' },
};

const ROLE_LABEL: Record<ManagerRole, string> = {
  master: 'Master',
  gestor: 'Gestor',
  user: 'Usuário',
};

interface Props {
  managers: Manager[];
  campaigns: Pick<Campaign, 'id' | 'name' | 'slug'>[];
  campaignMap: Record<string, string>;
  currentManagerRole: ManagerRole;
  currentManagerId: string;
}

export function UserManagementTable({
  managers,
  campaigns,
  campaignMap,
  currentManagerRole,
  currentManagerId,
}: Props) {
  const [filter, setFilter] = useState<'all' | ManagerStatus>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  const filtered =
    filter === 'all'
      ? managers
      : managers.filter((m) => m.status === filter);

  const pendingFirst = [...filtered].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return 0;
  });

  return (
    <div>
      {/* Feedback messages */}
      {feedback && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {feedback}
          <button onClick={() => setFeedback(null)} className="ml-2 font-bold">
            x
          </button>
        </div>
      )}
      {newPassword && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Nova senha gerada:</p>
          <code className="mt-1 block rounded bg-white px-3 py-2 font-mono text-base">
            {newPassword}
          </code>
          <p className="mt-2 text-xs text-green-600">
            Copie e envie ao usuário. Esta senha não será exibida novamente.
          </p>
          <button
            onClick={() => setNewPassword(null)}
            className="mt-2 text-xs font-semibold underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? 'bg-brand-dark text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todos' : STATUS_CONFIG[f].label}
            {f === 'pending' && (
              <span className="ml-1">
                ({managers.filter((m) => m.status === 'pending').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {pendingFirst.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Papel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Campanha</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingFirst.map((m) => (
                  <UserRow
                    key={m.id}
                    manager={m}
                    campaigns={campaigns}
                    campaignMap={campaignMap}
                    currentManagerRole={currentManagerRole}
                    currentManagerId={currentManagerId}
                    onFeedback={setFeedback}
                    onNewPassword={setNewPassword}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({
  manager: m,
  campaigns,
  campaignMap,
  currentManagerRole,
  currentManagerId,
  onFeedback,
  onNewPassword,
}: {
  manager: Manager;
  campaigns: Pick<Campaign, 'id' | 'name' | 'slug'>[];
  campaignMap: Record<string, string>;
  currentManagerRole: ManagerRole;
  currentManagerId: string;
  onFeedback: (msg: string) => void;
  onNewPassword: (pw: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isSelf = m.id === currentManagerId;
  const isMaster = currentManagerRole === 'master';
  const { label: statusLabel, classes: statusClasses } = STATUS_CONFIG[m.status];

  function handleAction(action: () => Promise<{ error?: string; newPassword?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) onFeedback(result.error);
      if ('newPassword' in result && result.newPassword) {
        onNewPassword(result.newPassword);
      }
    });
  }

  return (
    <tr
      className={`border-t border-gray-100 transition ${
        m.status === 'pending'
          ? 'bg-amber-50/50'
          : 'hover:bg-gray-50'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      {/* User info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-xs font-bold text-brand-dark">
            {(m.name || m.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{m.name || '—'}</p>
            <p className="text-xs text-gray-500">{m.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            m.role === 'master'
              ? 'bg-purple-100 text-purple-800'
              : m.role === 'gestor'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {ROLE_LABEL[m.role]}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </td>

      {/* Campaign */}
      <td className="px-4 py-3">
        {m.status === 'approved' ? (
          <select
            value={m.campaign_id ?? ''}
            disabled={isPending || isSelf}
            onChange={(e) => {
              if (e.target.value) {
                handleAction(() => assignCampaign(m.id, e.target.value));
              }
            }}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 disabled:opacity-50"
          >
            <option value="">Sem campanha</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {new Date(m.created_at).toLocaleDateString('pt-BR')}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {m.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction(() => approveUser(m.id))}
                disabled={isPending}
                className="rounded bg-green-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                onClick={() => handleAction(() => rejectUser(m.id))}
                disabled={isPending}
                className="rounded bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                Rejeitar
              </button>
            </>
          )}

          {m.status === 'rejected' && (
            <button
              onClick={() => handleAction(() => approveUser(m.id))}
              disabled={isPending}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              Aprovar
            </button>
          )}

          {m.status === 'approved' && !isSelf && (
            <button
              onClick={() => handleAction(() => resetUserPassword(m.id))}
              disabled={isPending}
              className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Resetar senha
            </button>
          )}

          {isMaster && m.role !== 'master' && m.status === 'approved' && !isSelf && (
            <button
              onClick={() =>
                handleAction(() => toggleGestorRole(m.id, m.role !== 'gestor'))
              }
              disabled={isPending}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                m.role === 'gestor'
                  ? 'border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m.role === 'gestor' ? 'Remover gestor' : 'Tornar gestor'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
