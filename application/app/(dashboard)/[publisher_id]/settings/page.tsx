'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_PUBLISHERS } from '@/lib/mock-data';
import StatusBadge from '@/components/shared/status-badge';

export default function SettingsPage() {
  const params = useParams();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const pub = MOCK_PUBLISHERS.find((p) => p.id === publisherId);

  const [name, setName] = useState(pub?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(pub?.logoUrl ?? '');

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Settings</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Manage your publisher profile</p>
      </div>

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] mb-8">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-6">Publisher Profile</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Publisher Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Logo URL</label>
            <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 placeholder-[#1E2044]/40" />
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={pub?.isVerified ? 'verified' : 'draft'} />
            <span className="text-xs font-sans text-[#1E2044]/60">{pub?.isVerified ? 'Verified publisher' : 'Awaiting verification — contact us to request verification'}</span>
          </div>
          <button onClick={() => console.log('Save settings:', { name, logoUrl })} className="px-6 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Save Changes</button>
        </div>
      </div>

      <div className="bg-white border-3 border-red-300 rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-red-500 mb-4">Danger Zone</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div>
              <p className="font-display font-bold text-sm text-[#1E2044]">Transfer Ownership</p>
              <p className="text-[10px] font-mono text-[#1E2044]/60">Transfer this publisher to another Sui address</p>
            </div>
            <button disabled className="px-4 py-2 bg-gray-200 text-gray-400 border-2 border-gray-300 font-mono font-bold text-xs rounded-lg cursor-not-allowed">Coming Soon</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div>
              <p className="font-display font-bold text-sm text-[#1E2044]">Delete Publisher</p>
              <p className="text-[10px] font-mono text-[#1E2044]/60">Permanently delete this publisher and all associated games</p>
            </div>
            <button disabled className="px-4 py-2 bg-gray-200 text-gray-400 border-2 border-gray-300 font-mono font-bold text-xs rounded-lg cursor-not-allowed">Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  );
}
