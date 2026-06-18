'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_API_KEYS } from '@/lib/mock-data';
import StatusBadge from '@/components/shared/status-badge';
import ConfirmModal from '@/components/shared/confirm-modal';

export default function APIKeysPage() {
  const params = useParams();
  const router = useRouter();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const gameId = typeof params.game_id === 'string' ? params.game_id : '0';
  const [keys, setKeys] = useState(MOCK_API_KEYS);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<number | null>(null);

  const handleGenerate = () => {
    const fakeKey = `morita_sk_${Math.random().toString(36).substring(2, 10)}`;
    setNewKey(fakeKey);
    setKeys([...keys, { id: keys.length + 1, prefix: `morita_sk_****${fakeKey.slice(-4)}`, isActive: true, lastUsedAt: null, createdAt: new Date().toISOString() }]);
  };

  const handleRevoke = () => {
    if (revokeTarget !== null) {
      setKeys(keys.map((k) => k.id === revokeTarget ? { ...k, isActive: false } : k));
      setRevokeTarget(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}`)} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-1 cursor-pointer">&larr; Game Detail</button>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">API Keys</h1>
        </div>
        <button onClick={handleGenerate} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">Generate New Key</button>
      </div>

      {newKey && (
        <div className="mb-6 p-4 bg-green-100 border-3 border-green-400 rounded-2xl shadow-[3px_3px_0px_0px_var(--color-border-dark)]">
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-green-800 mb-2">Key Generated — Copy it now</p>
          <div className="flex gap-3 items-center">
            <code className="flex-1 font-mono text-sm text-[#1E2044] bg-white px-4 py-2 border-2 border-green-300 rounded-xl">{newKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKey); setNewKey(null); }} className="px-4 py-2 bg-green-500 text-white border-2 border-[#1E2044] font-mono font-bold text-xs rounded-lg shadow-[2px_2px_0px_0px_var(--color-border-dark)] cursor-pointer">Copy</button>
          </div>
        </div>
      )}

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1E2044]/20 bg-blueberry-cream/30">
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Key</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Last Used</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-b border-[#1E2044]/10 last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs text-[#1E2044]">{key.prefix}</td>
                <td className="px-4 py-3"><StatusBadge status={key.isActive ? 'published' : 'paused'} /></td>
                <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '---'}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{new Date(key.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{key.isActive && <button onClick={() => setRevokeTarget(key.id)} className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-red-500 hover:text-red-600 cursor-pointer">Revoke</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal isOpen={revokeTarget !== null} title="Revoke API Key" message="Are you sure you want to revoke this API key? This action cannot be undone. Any service using this key will lose access immediately." confirmLabel="Revoke" variant="danger" onConfirm={handleRevoke} onCancel={() => setRevokeTarget(null)} />
    </div>
  );
}
