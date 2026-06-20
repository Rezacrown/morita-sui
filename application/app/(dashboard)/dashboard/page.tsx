"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { getSession } from "@/actions/publisher";
import { list as listGames } from "@/actions/game";
import MetricCard from "@/components/shared/metric-card";
import StatusBadge from "@/components/shared/status-badge";
import { ArrowRight } from "lucide-react";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { suiAddress, displayName } = useAuthStore();

  const { data: session } = useQuery({
    queryKey: ["session", suiAddress],
    queryFn: () => getSession(suiAddress!),
    enabled: !!suiAddress,
  });

  const pubId = session?.publishers[0]?.id as number | undefined;

  const { data: games = [] } = useQuery({
    queryKey: ["games", pubId],
    queryFn: () => listGames(pubId!),
    enabled: !!pubId,
  });

  const publishedCount = games.filter((g) => g.status === "published").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">
          Dashboard
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <StatusBadge status="verified" />
          <span className="font-sans text-sm text-[#1E2044]/60">
            Welcome back, {displayName ?? "Dev"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Total Games" value={games.length} />
        <MetricCard
          label="Published"
          value={`${publishedCount}/${games.length}`}
        />
        <MetricCard label="Total Items" value={0} />
        {/* <MetricCard label="Status" value="Verified" /> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => router.push("/dashboard/games")}
          className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all text-left cursor-pointer group"
        >
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry flex items-center gap-2">
            Manage{" "}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mt-1">
            Games
          </h3>
          <p className="font-sans text-xs text-[#1E2044]/60 mt-1">
            {games.length} games
          </p>
        </button>
        <button
          onClick={() => router.push("/dashboard/analytics")}
          className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all text-left cursor-pointer group"
        >
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry flex items-center gap-2">
            View{" "}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mt-1">
            Analytics
          </h3>
          <p className="font-sans text-xs text-[#1E2044]/60 mt-1">
            Cross-game metrics
          </p>
        </button>
      </div>
    </div>
  );
}
