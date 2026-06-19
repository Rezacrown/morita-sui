'use client';

import React, { useState } from 'react';
import { MOCK_PUBLISHER_ACTIVITIES, MOCK_GAMES } from '@/lib/mock-data';
import FilterBar from '@/components/shared/filter-bar';

export default function ActivityLogPage() {
  const [searchValue, setSearchValue] = useState('');
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const pubGames = MOCK_GAMES;

  const uniqueEventTypes = [...new Set(MOCK_PUBLISHER_ACTIVITIES.map((e) => e.eventType))];

  const filtered = MOCK_PUBLISHER_ACTIVITIES.filter((e) => {
    if (eventFilter && e.eventType !== eventFilter) return false;
    if (searchValue) { const q = searchValue.toLowerCase(); return e.description.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Activity Log</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Real-time event viewer for {pubGames.length} games</p>
      </div>

      <FilterBar
        filters={[{ label: 'Event Type', key: 'eventType', options: uniqueEventTypes.map((t) => ({ label: t, value: t })), value: eventFilter, onChange: setEventFilter }]}
        sortBy="newest" onSortChange={() => {}}
        searchValue={searchValue} onSearchChange={setSearchValue}
        searchPlaceholder="Search by address or item name..."
        className="mb-6"
      />

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] divide-y-2 divide-dashed divide-[#1E2044]/10">
        {filtered.map((event) => (
          <div key={event.id} className="p-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blueberry shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm text-[#1E2044]/80">{event.description}</p>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry/60 mt-1">{event.eventType}</span>
            </div>
            <span className="text-[10px] font-mono text-[#1E2044]/40 shrink-0">{new Date(event.timestamp).toLocaleString()}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <p className="font-sans text-sm text-[#1E2044]/40">No activity found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
