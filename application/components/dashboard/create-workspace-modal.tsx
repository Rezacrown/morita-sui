"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { createPublisher as createPublisherTx } from "@/lib/sui/ptb";
import { useTransaction } from "@/components/tx/use-transaction";
import { finalizeCreatePublisher } from "@/actions/publisher";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onCreated: () => void;
  onCancel: () => void;
}

export default function CreateWorkspaceModal({
  isOpen,
  onCreated,
  onCancel,
}: CreateWorkspaceModalProps) {
  const { suiAddress } = useAuthStore();
  const {
    state: txState,
    digest: txDigest,
    error: txError,
    execute: executeTx,
    reset: resetTx,
  } = useTransaction();
  const [name, setName] = useState("");

  const handleCancel = useCallback(() => {
    if (txState === "submitting") return;
    resetTx();
    onCancel();
  }, [txState]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    },
    [handleCancel],
  );

  const handleCreate = async () => {
    if (!name.trim() || !suiAddress) return;

    const result = await executeTx(
      () => createPublisherTx(name.trim(), suiAddress),
      [`${process.env.NEXT_PUBLIC_PACKAGE_ID}::registry::create_publisher`],
    );

    console.log({ suiAddress, packageID: process.env.NEXT_PUBLIC_PACKAGE_ID });

    if (result.state === "confirmed" && result.digest) {
      await finalizeCreatePublisher(suiAddress, name.trim(), result.digest);
      onCreated();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#1E2044]/40 backdrop-blur-sm"
        onClick={handleCancel}
      />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-dark)] p-8">
        {txState === "submitting" && (
          <div className="text-center py-4">
            <Loader2 className="w-10 h-10 text-blueberry animate-spin mx-auto mb-4" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              Creating Workspace
            </h3>
            <p className="font-sans text-sm text-[#1E2044]/60">
              Deploying on-chain, please wait...
            </p>
          </div>
        )}

        {txState === "confirmed" && (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              Workspace Created!
            </h3>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-2">
              {name} is now on-chain.
            </p>
            <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-blueberry underline break-all">
              {txDigest?.slice(0, 12)}...{txDigest?.slice(-8)}
            </a>
          </div>
        )}

        {txState === "error" && (
          <div className="text-center py-4">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              Failed
            </h3>
            <p className="font-sans text-sm text-red-500 mb-6">{txError}</p>
            <button
              onClick={resetTx}
              className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl text-xs uppercase cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {txState === "idle" && (
          <>
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              Create Your Workspace
            </h3>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">
              This will deploy a Publisher on-chain. Gas is sponsored by Morita.
            </p>

            <div className="mb-6">
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mythic Studios"
                className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-mono font-black rounded-lg text-xs uppercase tracking-wider hover:bg-blueberry-cream transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-lg text-xs uppercase tracking-wider hover:bg-blueberry-dark transition-all cursor-pointer disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
