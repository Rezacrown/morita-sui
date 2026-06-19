"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  Swords,
  BarChart3,
  Activity,
  Settings,
  LogOut,
} from "lucide-react";
import Sidebar from "@/components/shared/sidebar";
import LoginModal from "@/components/landing/login-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isLoggedIn,
    displayName,
    hasSetWorkspace,
    workspaceName,
    setWorkspace,
    logout,
  } = useAuthStore();
  const [inputWorkspace, setInputWorkspace] = useState("");
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  React.useEffect(() => {
    if (isLoggedIn && !hasSetWorkspace) {
      setShowWorkspaceModal(true);
    }
  }, [isLoggedIn, hasSetWorkspace]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] p-8 text-center max-w-md">
          <h1 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-3">
            Developer Dashboard
          </h1>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">
            Sign in to access your developer workspace and manage games.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
          >
            Sign In
          </button>
        </div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} redirectTo="/dashboard" />
      </div>
    );
  }

  const sidebarItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Games",
      href: "/dashboard/games",
      icon: <Swords className="w-4 h-4" />,
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: "Activity",
      href: "/dashboard/activity",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <Sidebar
        items={sidebarItems}
        publisherName={workspaceName}
        className="hidden lg:flex"
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b-3 border-[#1E2044] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">
              {workspaceName}
            </h2>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-[#1E2044]/60 uppercase">
                {displayName}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 hover:text-red-500 transition-colors cursor-pointer bg-red-200"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {showWorkspaceModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1E2044]/40 backdrop-blur-sm"
            onClick={() => {}}
          />
          <div className="relative z-10 w-full max-w-md bg-white border-3 border-[#1E2044] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-dark)] p-8">
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              Name Your Workspace
            </h3>
            <p className="font-sans text-sm text-[#1E2044]/70 mb-6">
              Choose a name for your developer workspace.
            </p>
            <input
              type="text"
              value={inputWorkspace}
              onChange={(e) => setInputWorkspace(e.target.value)}
              placeholder="e.g. My Game Studio"
              className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setWorkspace(inputWorkspace || "My Workspace");
                  setShowWorkspaceModal(false);
                }}
                disabled={!inputWorkspace.trim() && inputWorkspace !== ""}
                className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
