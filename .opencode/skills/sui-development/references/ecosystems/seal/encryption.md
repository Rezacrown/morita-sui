# Seal Encryption & Decryption

Complete guide to encrypting and decrypting data using Seal, including session key management, PTB construction, and the full decryption flow.

## Installation

```bash
npm install @mysten/seal @mysten/sui
```

## Client Setup

```typescript
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SealClient } from "@mysten/seal";

const suiClient = new SuiGrpcClient({
    baseUrl: "https://fullnode.testnet.sui.io:443",
    network: "testnet",
});

const sealClient = new SealClient({
    suiClient,
    serverObjectIds: [
        "0x...", // KeyServer object IDs for your network
    ],
    verifyKeyServers: true,
});
```

See the [Seal documentation](https://seal-docs.wal.app/Pricing) for the full list of verified key server object IDs per network.

## How Seal Encryption Works

`SealClient.encrypt` uses identity-based encryption (IBE). Each piece of content is encrypted to a specific identity, composed of:

- **package ID** (prepended automatically by Seal)
- **`id`** (a `vector<u8>` you provide)

The same `id` is later used in the `seal_approve` PTB to gate decryption.

### Return Value

The `encrypt` call returns:
- `encryptedObject`: The ciphertext
- `key`: A backup key for disaster recovery (usable with `seal-cli symmetric-decrypt`)

```typescript
const { encryptedObject, key } = await sealClient.encrypt({
    threshold: 2,         // Minimum key servers required
    packageId: "0x...",   // Your deployed Move package
    id: encryptionIdBytes, // The identity id as bytes
    data: imageBytes,     // The data to encrypt
});
```

### Envelope Encryption for Large Files

For payloads larger than a few hundred KB, use envelope encryption: encrypt data with AES, then encrypt only the AES key with Seal.

```typescript
import crypto from "crypto";
import type { SealClient } from "@mysten/seal";

async function encryptLargeFile(
    sealClient: SealClient,
    fileData: Uint8Array,
    packageId: string,
    id: string,
    threshold: number,
) {
    // 1. Generate AES key
    const aesKey = crypto.randomBytes(32);

    // 2. Encrypt file with AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
    const encryptedPayload = Buffer.concat([cipher.update(fileData), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 3. Encrypt AES key with Seal
    const { encryptedObject, key: backupKey } = await sealClient.encrypt({
        threshold,
        packageId,
        id: new TextEncoder().encode(id),
        data: aesKey,
    });

    return { encryptedPayload, encryptedObject, iv, authTag, backupKey };
}
```

## Server-Side Encryption (OnlyFins Backend Pattern)

Backend script that encrypts images before uploading to Walrus:

```typescript
// encryptImages.ts
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SealClient } from "@mysten/seal";
import fs from "fs";
import path from "path";

const suiClient = new SuiGrpcClient({
    baseUrl: "https://fullnode.testnet.sui.io:443",
    network: "testnet",
});

const sealClient = new SealClient({
    suiClient,
    serverObjectIds: ["0x..."],
    verifyKeyServers: true,
});

const PACKAGE_ID = "0xyour_package_id";

async function encryptImages(imageDir: string) {
    const files = fs.readdirSync(imageDir);

    for (const [index, file] of files.entries()) {
        const imageBytes = fs.readFileSync(path.join(imageDir, file));

        // Generate unique encryption ID from timestamp + index
        const encryptionId = `${Date.now().toString(16)}${index.toString(16)}`;

        const { encryptedObject, key: backupKey } = await sealClient.encrypt({
            threshold: 1,
            packageId: PACKAGE_ID,
            id: new TextEncoder().encode(encryptionId),
            data: imageBytes,
        });

        // Save ciphertext to disk for Walrus CLI upload
        const outputPath = path.join("encrypted", `${file}.enc`);
        fs.writeFileSync(outputPath, encryptedObject);
        fs.writeFileSync(path.join("encrypted", `${file}.key`), backupKey);

        console.log(`Encrypted ${file} -> encryptionId: ${encryptionId}`);
    }
}
```

## Browser-Side Encryption

### React Hook: `useSealEncrypt`

```typescript
import { useState, useCallback } from "react";
import type { SealClient } from "@mysten/seal";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface UseSealEncryptOptions {
    sealClient: SealClient | null;
    packageId: string;
    threshold: number;
}

export function useSealEncrypt({ sealClient, packageId, threshold }: UseSealEncryptOptions) {
    const account = useCurrentAccount();
    const [isPending, setIsPending] = useState(false);

    const encryptMessage = useCallback(async (message: string) => {
        if (!sealClient || !account) return null;
        setIsPending(true);

        try {
            // Nonce-based key ID
            const nonce = crypto.randomUUID();
            const id = `${account.address}-${nonce}`;

            const { encryptedObject, key } = await sealClient.encrypt({
                threshold,
                packageId,
                id: new TextEncoder().encode(id),
                data: new TextEncoder().encode(message),
            });

            return { encryptedObject, key, nonce, encryptionId: id };
        } finally {
            setIsPending(false);
        }
    }, [sealClient, account, packageId, threshold]);

    return { encryptMessage, isPending };
}
```

### Standalone Utility: `encryptData`

```typescript
import type { SealClient } from "@mysten/seal";

interface EncryptParams {
    sealClient: SealClient;
    data: Uint8Array;
    packageId: string;
    encryptionId: string;
    threshold: number;
}

interface EncryptResult {
    encryptedObject: Uint8Array;
    backupKey: string;
}

export async function encryptData({
    sealClient, data, packageId, encryptionId, threshold,
}: EncryptParams): Promise<EncryptResult> {
    const { encryptedObject, key } = await sealClient.encrypt({
        threshold,
        packageId,
        id: new TextEncoder().encode(encryptionId),
        data,
    });

    return { encryptedObject, backupKey: key };
}
```

## Session Keys

A `SessionKey` is a short-lived credential that authorizes a browser app to fetch decryption keys without triggering a wallet popup on every request. The user approves a session once per package.

### Creating and Signing a Session Key

```typescript
import { SessionKey } from "@mysten/seal";
import type { SealClient } from "@mysten/seal";

interface SignPersonalMessageFn {
    (input: { message: string }): Promise<{ signature: string }>;
}

export async function createAndSignSessionKey(
    sealClient: SealClient,
    packageId: string,
    signPersonalMessage: SignPersonalMessageFn,
    ttlMs: number = 5 * 60 * 1000,
): Promise<SessionKey> {
    const sessionKey = new SessionKey({
        packageId,
        ttlMin: Math.floor(ttlMs / 60000),
        signPersonalMessage: async (message: Uint8Array) => {
            const { signature } = await signPersonalMessage({
                message: new TextDecoder().decode(message),
            });
            return signature;
        },
    });

    await sessionKey.create();
    return sessionKey;
}
```

### Session Key Management Hook

```typescript
import { useEffect, useState, useCallback } from "react";
import { SessionKey } from "@mysten/seal";
import type { SealClient } from "@mysten/seal";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";

interface UseSealSessionOptions {
    sealClient: SealClient;
    packageId: string;
    ttlMinutes?: number;
}

export function useSealSession({
    sealClient, packageId, ttlMinutes = 5,
}: UseSealSessionOptions) {
    const account = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isPending, setIsPending] = useState(false);

    // Auto-clear session when wallet disconnects or switches
    useEffect(() => {
        if (!account) setSessionKey(null);
    }, [account]);

    const createSession = useCallback(async () => {
        if (!account) return;
        setIsPending(true);
        try {
            const session = new SessionKey({
                packageId,
                ttlMin: ttlMinutes,
                signPersonalMessage: async (message: Uint8Array) => {
                    const result = await signPersonalMessage({
                        message: new TextDecoder().decode(message),
                    });
                    return result.signature;
                },
            });
            await session.create();
            setSessionKey(session);
        } finally {
            setIsPending(false);
        }
    }, [account, packageId, ttlMinutes, signPersonalMessage]);

    const clearSession = useCallback(() => setSessionKey(null), []);
    const isExpired = sessionKey?.isExpired() ?? true;

    return { sessionKey, isPending, isExpired, createSession, clearSession };
}
```

### Signature Format Requirements

- **Sui wallets** (`@mysten/wallet-standard`): Always include the personal message-signed Base64 signature in the `signature` field.
- **Non-Sui wallets** (Enoki, etc.): Ensure the personal message and signature scheme aligns with the expected format.
- `@mysten/seal` requires the signature as a Base64-encoded string.

## Decryption

### The Full 4-Step Flow

1. **Fetch the encrypted blob** from storage (Walrus, onchain, etc.)
2. **Build the approval PTB** calling your `seal_approve_*` function
3. **Fetch key shares** from key servers using PTB bytes and session key
4. **Decrypt locally** by combining key shares

### Decryption Function

```typescript
import { Transaction } from "@mysten/sui/transactions";
import type { SealClient, SessionKey } from "@mysten/seal";

async function decryptBlobWithSeal(
    sealClient: SealClient,
    sessionKey: SessionKey,
    packageId: string,
    moduleName: string,
    encryptionId: string,
    postObjectId: string,
    viewerTokenObjectId: string,
    encryptedBlob: Uint8Array,
    threshold: number,
): Promise<Uint8Array> {
    // Step 2: Build approval PTB (never executed onchain)
    const tx = new Transaction();
    tx.moveCall({
        target: `${packageId}::${moduleName}::seal_approve_access`,
        arguments: [
            tx.pure.vector("u8", new TextEncoder().encode(encryptionId)),
            tx.object(postObjectId),
            tx.object(viewerTokenObjectId),
        ],
    });

    const txBytes = await tx.build({ client: sealClient.suiClient });

    // Step 3: Fetch key shares
    // Key servers dry_run_transaction_block to evaluate the policy
    const keys = await sealClient.fetchKeys({
        txBytes,
        sessionKey,
        threshold,
    });

    // Step 4: Decrypt locally
    const decryptedBytes = await sealClient.decrypt({
        data: encryptedBlob,
        keys,
        checkShareConsistency: true,
    });

    return decryptedBytes;
}
```

### Decryption React Hook

```typescript
import { useState, useCallback } from "react";
import { Transaction } from "@mysten/sui/transactions";
import type { SealClient, SessionKey } from "@mysten/seal";

interface UseSealDecryptOptions {
    sealClient: SealClient | null;
    sessionKey: SessionKey | null;
    threshold: number;
}

interface DecryptRequest {
    packageId: string;
    moduleName: string;
    encryptionId: string;
    encryptedBlob: Uint8Array;
    // Object references for the seal_approve PTB
    objectRefs: { objectId: string }[];
}

export function useSealDecrypt({ sealClient, sessionKey, threshold }: UseSealDecryptOptions) {
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptedData, setDecryptedData] = useState<Uint8Array | null>(null);

    const decrypt = useCallback(async (req: DecryptRequest) => {
        if (!sealClient || !sessionKey) return;
        setIsDecrypting(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${req.packageId}::${req.moduleName}::seal_approve_access`,
                arguments: [
                    tx.pure.vector("u8", new TextEncoder().encode(req.encryptionId)),
                    ...req.objectRefs.map(r => tx.object(r.objectId)),
                ],
            });

            const txBytes = await tx.build({ client: sealClient.suiClient });

            const keys = await sealClient.fetchKeys({
                txBytes,
                sessionKey,
                threshold,
            });

            const decrypted = await sealClient.decrypt({
                data: req.encryptedBlob,
                keys,
                checkShareConsistency: true,
            });

            setDecryptedData(decrypted);
            return decrypted;
        } finally {
            setIsDecrypting(false);
        }
    }, [sealClient, sessionKey, threshold]);

    return { decrypt, isDecrypting, decryptedData };
}
```

### OnlyFins-Specific Decrypt Hook

```typescript
import { useEffect, useState, useCallback } from "react";
import { Transaction } from "@mysten/sui/transactions";
import type { SealClient, SessionKey } from "@mysten/seal";
import { useSuiClientQuery } from "@mysten/dapp-kit";

interface UsePostDecryptionOptions {
    sealClient: SealClient | null;
    sessionKey: SessionKey | null;
    postId: string;
    threshold: number;
}

export function usePostDecryption({
    sealClient, sessionKey, postId, threshold,
}: UsePostDecryptionOptions) {
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
    const [isDecrypting, setIsDecrypting] = useState(false);

    const decryptPost = useCallback(async (
        blobId: string,
        encryptionId: string,
        encryptionIdBytes: Uint8Array,
        postObjId: string,
        viewerTokenObjId: string,
    ) => {
        if (!sealClient || !sessionKey) return;
        setIsDecrypting(true);

        try {
            // Step 1: Fetch encrypted blob from Walrus aggregator
            const response = await fetch(
                `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`,
            );
            const encryptedBytes = new Uint8Array(await response.arrayBuffer());

            // Step 2: Build approval PTB
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::posts::seal_approve_access`,
                arguments: [
                    tx.pure.vector("u8", encryptionIdBytes),
                    tx.object(postObjId),
                    tx.object(viewerTokenObjId),
                ],
            });

            const txBytes = await tx.build({ client: sealClient.suiClient });

            // Step 3: Fetch key shares
            const keys = await sealClient.fetchKeys({
                txBytes,
                sessionKey,
                threshold,
            });

            // Step 4: Decrypt locally
            const decrypted = await sealClient.decrypt({
                data: encryptedBytes,
                keys,
                checkShareConsistency: false, // OnlyFins uses false
            });

            const blob = new Blob([decrypted], { type: "image/png" });
            setDecryptedUrl(URL.createObjectURL(blob));
        } finally {
            setIsDecrypting(false);
        }
    }, [sealClient, sessionKey, threshold]);

    return { decryptedUrl, isDecrypting, decryptPost };
}
```

## checkShareConsistency

When set to `true`, Seal verifies that key shares from different servers are consistent before combining them. For production apps handling sensitive data, set this to `true`. OnlyFins uses `false` for simplicity.

## Failure Modes

| Error | Cause | Resolution |
|---|---|---|
| Session key expired | TTL elapsed since wallet approval | Re-create session key; user re-approves |
| Key server unreachable | Network issue or server offline | Check server status; retry with exponential backoff |
| Decryption fails after grant | `ViewerToken` exists but `encryption_id` mismatch | Verify `encryption_id` matches the value stored on the object |
| `seal_approve` aborts | Access condition not met | Confirm user owns required object; check Move policy logic |
| Threshold not met | Fewer than `t` servers responded | Increase timeout; check key server configuration |

## Transport Migration

Some older examples use `SuiClient` from `@mysten/sui/client` or the deprecated `SuiJsonRpcClient` from `@mysten/sui/jsonRpc`. **`SuiGrpcClient` from `@mysten/sui/grpc` is the recommended transport** for all new integrations. All `SealClient` constructor and encrypt/decrypt APIs are identical regardless of transport.

## CLI Testing

The `seal-cli` provides local testing commands before SDK integration. See the [Seal CLI documentation](https://seal-docs.wal.app/SealCLI).

```bash
# Encrypt data
seal-cli encrypt --package-id <PACKAGE_ID> --id <ID> --data <FILE>

# Decrypt data
seal-cli decrypt --package-id <PACKAGE_ID> --encrypted <FILE>

# Fetch keys (tests key server connectivity)
seal-cli fetch-keys --tx-bytes <TX_BYTES_FILE> --session-key <KEY>

# Inspect encrypted object
seal-cli inspect <ENCRYPTED_FILE>
```

## Standalone Script: Full Encrypt + Decrypt

```typescript
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SealClient, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

async function fullSealWorkflow() {
    const suiClient = new SuiGrpcClient({
        baseUrl: "https://fullnode.testnet.sui.io:443",
        network: "testnet",
    });

    const sealClient = new SealClient({
        suiClient,
        serverObjectIds: ["0xSERVER_OBJ_ID"],
        verifyKeyServers: true,
    });

    const packageId = "0xYOUR_PACKAGE";
    const threshold = 2;

    // ENCRYPT
    const message = "Hello, Seal!";
    const encryptionId = "my-content-001";

    const { encryptedObject, key: backupKey } = await sealClient.encrypt({
        threshold,
        packageId,
        id: new TextEncoder().encode(encryptionId),
        data: new TextEncoder().encode(message),
    });

    console.log("Encrypted. Backup key:", backupKey);

    // Session key (in production, user signs via wallet)
    const keypair = new Ed25519Keypair();
    const sessionKey = new SessionKey({
        packageId,
        ttlMin: 5,
        signPersonalMessage: async (msg: Uint8Array) => {
            const signature = await keypair.signPersonalMessage(msg);
            return signature.signature;
        },
    });
    await sessionKey.create();

    // DECRYPT - Build PTB for owner-only access
    const tx = new Transaction();
    tx.moveCall({
        target: `${packageId}::private_seal::seal_approve`,
        arguments: [tx.pure.vector("u8", new TextEncoder().encode(encryptionId))],
    });

    const txBytes = await tx.build({ client: suiClient });

    const keys = await sealClient.fetchKeys({ txBytes, sessionKey, threshold });

    const decrypted = await sealClient.decrypt({
        data: encryptedObject,
        keys,
        checkShareConsistency: true,
    });

    console.log("Decrypted:", new TextDecoder().decode(decrypted));
    // Output: "Decrypted: Hello, Seal!"
}
```
