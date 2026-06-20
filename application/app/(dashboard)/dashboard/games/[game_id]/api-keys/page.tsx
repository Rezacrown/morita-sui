/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getKeys, createKey, revokeKey } from "@/actions/api-keys";
import StatusBadge from "@/components/shared/status-badge";
import ConfirmModal from "@/components/shared/confirm-modal";

export default function APIKeysPage() {
  const params = useParams();
  const gameId =
    typeof params.game_id === "string" ? parseInt(params.game_id, 10) : 0;
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<number | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["api-keys", gameId],
    queryFn: () => getKeys(gameId),
    enabled: !!gameId,
  });

  const genMutation = useMutation({
    mutationFn: () => createKey(gameId),
    onSuccess: (raw) => {
      setNewKey(raw);
      queryClient.invalidateQueries({ queryKey: ["api-keys", gameId] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => revokeKey(id),
    onSuccess: () => {
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["api-keys", gameId] });
    },
  });

  const copyKey = useCallback(async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
    } catch {}
  }, []);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight text-[#1E2044]">
            API Keys
          </h1>
          <p className="font-sans text-sm text-[#1E2044]/60 mt-1">
            Authenticate your game server with Morita.
          </p>
        </div>
        <button
          onClick={() => genMutation.mutate()}
          disabled={genMutation.isPending}
          className="px-5 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer disabled:opacity-50"
        >
          {genMutation.isPending ? "Generating..." : "Generate New Key"}
        </button>
      </div>

      {newKey && (
        <div className="bg-yellow-100 border-3 border-yellow-400 rounded-2xl p-5 mb-6">
          <p className="font-mono font-bold text-xs text-yellow-800 mb-1">
            Key generated — copy it now. You won't see it again!
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm font-mono break-all">
              {newKey}
            </code>
            <button
              onClick={() => copyKey(newKey)}
              className="px-4 py-2 bg-white border-2 border-[#1E2044] rounded-lg text-xs font-mono font-bold hover:bg-blueberry-cream transition-all cursor-pointer"
            >
              Copy
            </button>
            <button
              onClick={() => setNewKey(null)}
              className="text-xs font-mono font-bold text-[#1E2044]/60 hover:text-red-500 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 text-center">
          <p className="font-display font-black text-sm uppercase text-[#1E2044]/60">
            No API keys yet
          </p>
          <p className="font-mono text-xs text-[#1E2044]/40 mt-1">
            Generate your first key to integrate your game server.
          </p>
        </div>
      ) : (
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-3 border-[#1E2044] bg-blueberry-cream/30">
                <th className="text-left px-5 py-3 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">
                  Key
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">
                  Last Used
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">
                  Created
                </th>
                <th className="text-right px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr
                  key={k.id}
                  className="border-b-2 border-[#1E2044]/10 hover:bg-blueberry-cream/20"
                >
                  <td className="px-5 py-3 font-mono text-xs text-[#1E2044]">
                    {k.keyPrefix}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={k.isActive ? "published" : "draft"} />
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-[#1E2044]/60">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-[#1E2044]/60">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {k.isActive && (
                      <button
                        onClick={() => setRevokeTarget(k.id)}
                        className="text-[10px] font-mono font-extrabold uppercase text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {revokeTarget !== null && (
        <ConfirmModal
          isOpen={true}
          title="Revoke API Key"
          message="This will permanently deactivate this key. Any services using it will lose access."
          confirmLabel="Revoke"
          onConfirm={() =>
            revokeTarget !== null && revokeMutation.mutate(revokeTarget)
          }
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
