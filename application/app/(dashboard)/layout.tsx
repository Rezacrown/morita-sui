"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/actions/publisher";
import {
  LayoutDashboard,
  Swords,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react";
import Sidebar from "@/components/shared/sidebar";
import LoginModal from "@/components/landing/login-modal";
import CreateWorkspaceModal from "@/components/dashboard/create-workspace-modal";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoggedIn, displayName, suiAddress, logout } = useAuthStore();
  const [showLogin, setShowLogin] = React.useState(false);

  const { data: session, isSuccess } = useQuery({
    queryKey: ["session", suiAddress],
    queryFn: () => getSession(suiAddress!),
    enabled: !!suiAddress,
  });

  const hasPublisher = (session?.publishers?.length ?? 0) > 0;
  const publisherName = session?.publishers?.[0]?.name ?? "Workspace";

  const [pubConfirmed, setPubConfirmed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("morita_pub_done") === "1";
  });

  React.useEffect(() => {
    if (hasPublisher) {
      localStorage.setItem("morita_pub_done", "1");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPubConfirmed(true);
    }
  }, [hasPublisher]);

  const handleLogout = () => {
    sessionStorage.removeItem("morita_jwt");
    sessionStorage.removeItem("morita_address");
    sessionStorage.removeItem("morita_proof");
    sessionStorage.removeItem("morita_ephemeral_key");
    sessionStorage.removeItem("morita_randomness");
    sessionStorage.removeItem("morita_max_epoch");
    localStorage.removeItem("morita_pub_done");
    logout();
    router.push("/");
  };

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
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          redirectTo="/dashboard"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <Sidebar
        items={sidebarItems}
        publisherName={publisherName}
        className="hidden lg:flex"
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b-3 border-[#1E2044] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">
              Dashboard
            </h2>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-[#1E2044]/60 uppercase">
                {displayName ?? suiAddress?.slice(0, 8)}
              </span>
              <button
                onClick={handleLogout}
                className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 hover:text-red-500 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <CreateWorkspaceModal
        isOpen={!hasPublisher && isSuccess && !pubConfirmed}
        onCreated={() => setPubConfirmed(true)}
        onCancel={() => {}}
      />
    </div>
  );
}
