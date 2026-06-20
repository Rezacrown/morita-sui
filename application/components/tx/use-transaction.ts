"use client";

import { useState, useCallback } from "react";
import { EnokiKeypair } from "@mysten/enoki";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { useAuthStore } from "@/stores/auth-store";
import {
  sponsorTransaction,
  executeTransaction,
} from "@/actions/user-transaction";
import { getZkp } from "@/actions/zkp";
import { fromBase64, toBase64 } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

export type TxState = "idle" | "submitting" | "confirmed" | "error";

type TxResult = {
  state: TxState;
  digest?: string;
  error?: string;
};

function readSession() {
  if (typeof window === "undefined") return null;
  const jwt = sessionStorage.getItem("morita_jwt");
  const address = sessionStorage.getItem("morita_address");
  const proofRaw = sessionStorage.getItem("morita_proof");
  const ephemeralKeyRaw = sessionStorage.getItem("morita_ephemeral_key");
  const maxEpoch = sessionStorage.getItem("morita_max_epoch");
  const randomness = sessionStorage.getItem("morita_randomness");
  if (!jwt || !address || !proofRaw || !ephemeralKeyRaw || !maxEpoch || !randomness) return null;
  return { jwt, address, proof: JSON.parse(proofRaw), ephemeralKey: ephemeralKeyRaw, maxEpoch: parseInt(maxEpoch), randomness };
}

export function useTransaction() {
  const suiAddress = useAuthStore((s) => s.suiAddress);
  const [state, setState] = useState<TxState>("idle");
  const [digest, setDigest] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const execute = useCallback(
    async (
      buildTx: () => Transaction,
      targets: string[],
    ): Promise<TxResult> => {
      if (!suiAddress) {
        setState("error");
        setError("Not connected");
        return { state: "error", error: "Not connected" };
      }

      setState("submitting");
      setDigest(undefined);
      setError(undefined);

      try {
        const tx = buildTx();
        const txBytes = toBase64(await tx.build({ onlyTransactionKind: true }));

        const sponsored = await sponsorTransaction(
          txBytes,
          suiAddress,
          targets,
        );

        const session = readSession();
        if (!session) throw new Error("Session not found. Please log in again.");

        const ephemeralKeypair = Ed25519Keypair.fromSecretKey(session.ephemeralKey)

        const proof = session.proof ?? await getZkp({
          jwt: session.jwt,
          ephemeralPublicKey: toBase64(ephemeralKeypair.getPublicKey().toRawBytes()),
          randomness: session.randomness,
          maxEpoch: session.maxEpoch,
        });

        const keypair = new EnokiKeypair({
          address: suiAddress,
          maxEpoch: session.maxEpoch,
          proof,
          ephemeralKeypair,
        });

        const { signature } = await keypair.signTransaction(
          fromBase64(sponsored.bytes),
        );

        const result = await executeTransaction(sponsored.digest, signature);

        setState("confirmed");
        setDigest(result.digest);
        return { state: "confirmed", digest: result.digest };
      } catch (e: unknown) {
        console.log(e);

        const msg = e instanceof Error ? e.message : "Transaction failed";
        setState("error");
        setError(msg);
        return { state: "error", error: msg };
      }
    },
    [suiAddress],
  );

  const reset = useCallback(() => {
    setState("idle");
    setDigest(undefined);
    setError(undefined);
  }, []);

  return { state, digest, error, execute, reset };
}
