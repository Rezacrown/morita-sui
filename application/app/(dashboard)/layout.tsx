'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_PUBLISHERS } from '@/lib/mock-data';
import { Swords, BarChart3, Activity, Settings } from 'lucide-react';
import Sidebar from '@/components/shared/sidebar';
import PublisherSwitcher from '@/components/shared/publisher-switcher';
import StatusBadge from '@/components/shared/status-badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, userMode, displayName, activePublisherId, setActivePublisher, login } = useAuthStore();
  const [activePath, setActivePath] = React.useState('');

  React.useEffect(() => { setActivePath(window.location.pathname); }, []);

  if (!isLoggedIn || userMode !== 'dev') {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] p-8 text-center max-w-md">
          <h1 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-3">Developer Dashboard</h1>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">Connect as a developer to access your publisher workspace.</p>
          <button onClick={() => login('dev')} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Login as Developer</button>
        </div>
      </div>
    );
  }

  const activePub = MOCK_PUBLISHERS.find((p) => p.id === activePublisherId);
  const publisherName = activePub?.name ?? 'Unknown Publisher';
  const isVerified = activePub?.isVerified ?? false;

  const sidebarItems = [
    { label: 'Games', href: `/dashboard/${activePublisherId}/games`, icon: <Swords className="w-4 h-4" /> },
    { label: 'Analytics', href: `/dashboard/${activePublisherId}/analytics`, icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Activity', href: `/dashboard/${activePublisherId}/activity`, icon: <Activity className="w-4 h-4" /> },
    { label: 'Settings', href: `/dashboard/${activePublisherId}/settings`, icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <Sidebar items={sidebarItems} activePath={activePath} publisherName={publisherName} isVerified={isVerified} className="hidden lg:flex" />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b-3 border-[#1E2044] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-xs">
              <PublisherSwitcher publishers={MOCK_PUBLISHERS} activeId={activePublisherId ?? ''} onSwitch={(id) => setActivePublisher(id)} />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-[#1E2044]/60 uppercase">{displayName}</span>
              <StatusBadge status={isVerified ? 'verified' : 'draft'} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
