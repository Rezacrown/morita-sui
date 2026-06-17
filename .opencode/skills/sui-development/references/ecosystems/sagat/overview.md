# Sagat — Sui Multisig Management Platform

Sagat is a full-stack multisig management platform for Sui multisig wallets, built by Mysten Labs.

- **Stack**: Bun + TypeScript API (backend) + React (frontend)
- **Web UI**: [sagat.mystenlabs.com](https://sagat.mystenlabs.com)
- **SDK**: `@mysten/sagat` (npm) — [github.com/MystenLabs/sagat/tree/main/sdk](https://github.com/MystenLabs/sagat/tree/main/sdk)
- **Self-host**: `git clone`, `bun run dev`

## What is Multisig?

Multisig requires multiple signatures from different parties before a Sui transaction executes. Each multisig has configurable voting thresholds with per-member weights.

For the underlying cryptography, see the [TypeScript SDK Multisig docs](https://sdk.mystenlabs.com/typescript/cryptography/multisig).

## Key Concepts

| Concept | Description |
|---|---|
| **Multisig** | Group of addresses that must collectively approve transactions |
| **Threshold** | Minimum combined weight of signatures needed to execute |
| **Weight** | Per-member voting power (u8) |
| **Invitation** | Members must accept their invitation before the multisig is valid |
| **Proposal** | A proposed transaction that members vote on |
| **Proposer** | External address that can create proposals (cannot vote/execute) |
| **Verification** | Marking a proposal as executed/failed after the transaction settles on-chain |

## Signature Schemes Supported

`ed25519`, `secp256r1`, `secp256k1` — **zkLogin is NOT supported** for multisig wallets.

## Sagat API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/connect` | Authenticate with signed message |
| `POST` | `/auth/disconnect` | Disconnect session |
| `GET` | `/auth/check` | Check auth status |
| `POST` | `/addresses` | Register public keys |
| `GET` | `/addresses/:address` | Look up registered address info |
| `GET` | `/addresses/connections` | Get all multisig connections |
| `GET` | `/addresses/invitations/:publicKey` | List invitations |
| `POST` | `/multisig` | Create multisig |
| `GET` | `/multisig/:address` | Get multisig details |
| `POST` | `/multisig/:address/accept` | Accept invitation |
| `POST` | `/multisig/:address/reject` | Reject invitation |
| `POST` | `/multisig/:address/add-proposer` | Add external proposer |
| `POST` | `/multisig/:address/remove-proposer` | Remove external proposer |
| `POST` | `/proposals` | Create proposal |
| `GET` | `/proposals` | List proposals (with filters + pagination) |
| `GET` | `/proposals/digest/:digest` | Get proposal by transaction digest |
| `POST` | `/proposals/:id/vote` | Vote on proposal |
| `POST` | `/proposals/:id/cancel` | Cancel proposal |
| `POST` | `/proposals/:id/verify` | Verify proposal execution (by ID) |
| `POST` | `/proposals/:digest/verify-by-digest` | Verify proposal execution (by digest) |

## SagatClient — TypeScript SDK

Package: `@mysten/sagat`

### Constructor

```typescript
import { SagatClient } from '@mysten/sagat';

const client = new SagatClient(
  'https://api.sagat.mystenlabs.com', // apiUrl
  'cookie',                            // mode: 'cookie' | 'script'
  // optional custom fetch
);
```

Modes:
- `'cookie'` — browser usage; auth stored in cookies via `credentials: 'include'`
- `'script'` — server/programmatic usage; JWT stored internally and sent via `Authorization: Bearer`

### Personal Messages (Signed Messages)

```typescript
import { PersonalMessages, defaultExpiry } from '@mysten/sagat';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const keypair = new Ed25519Keypair();
const publicKey = keypair.getPublicKey();

const expiry = new Date();
expiry.setMinutes(expiry.getMinutes() + 10);
const expiryISO = expiry.toISOString();

// Connect
const connectMessage = new TextEncoder().encode(
  `Verifying address ownership until: ${expiryISO}`,
);
const connectSig = await keypair.signPersonalMessage(connectMessage);

// Accept multisig invitation
const acceptMsg = new TextEncoder().encode(
  `Participating in multisig ${multisigAddress}`,
);
const acceptSig = await keypair.signPersonalMessage(acceptMsg);

// Reject multisig invitation
const rejectMsg = new TextEncoder().encode(
  `Rejecting multisig invitation ${multisigAddress}`,
);
const rejectSig = await keypair.signPersonalMessage(rejectMsg);

// Add proposer
const addProposerMsg = new TextEncoder().encode(
  `Adding proposer ${proposerAddress} to multisig ${multisigAddress}. Valid until: ${expiryISO}`,
);
const addProposerSig = await keypair.signPersonalMessage(addProposerMsg);

// Remove proposer
const removeProposerMsg = new TextEncoder().encode(
  `Removing proposer ${proposerAddress} from multisig ${multisigAddress}. Valid until: ${expiryISO}`,
);
const removeProposerSig = await keypair.signPersonalMessage(removeProposerMsg);

// Cancel proposal
const cancelMsg = new TextEncoder().encode(`Cancel proposal ${proposalId}`);
const cancelSig = await keypair.signPersonalMessage(cancelMsg);
```

Or use the helpers:

```typescript
const msg = PersonalMessages.connect(defaultExpiry());
const sig = await keypair.signPersonalMessage(new TextEncoder().encode(msg));
```

### Authentication

```typescript
const keypair = new Ed25519Keypair();
const expiry = defaultExpiry();
const message = new TextEncoder().encode(PersonalMessages.connect(expiry));
const { signature } = await keypair.signPersonalMessage(message);

const auth = await client.connect(signature, expiry);
// { success: true }

const check = await client.checkAuth();
// { authenticated: boolean; addresses: Address[] }

await client.disconnect();
// { success: true }
```

### Register Public Keys

```typescript
// Register all connected keys
await client.registerAddresses();

// Register specific public keys (Sui format, not base64)
await client.registerPublicKeys([publicKey1.toSuiPublicKey(), publicKey2.toSuiPublicKey()]);

// Register a single key
await client.registerPublicKey(publicKey.toSuiPublicKey());
```

### Creating a Multisig

```typescript
// 2-of-2 multisig (both members must sign)
const multisig = await client.createMultisig({
  publicKeys: [pk1.toSuiPublicKey(), pk2.toSuiPublicKey()],
  weights: [1, 1],
  threshold: 2,
  name: 'Treasury Multisig', // optional
});

// 2-of-3 multisig with custom weights
const multisig = await client.createMultisig({
  publicKeys: [pk1.toSuiPublicKey(), pk2.toSuiPublicKey(), pk3.toSuiPublicKey()],
  weights: [1, 2, 1],
  threshold: 3,
  name: 'DAO Multisig',
});
```

The response is a `MultisigWithMembers`:

```typescript
interface MultisigWithMembers {
  address: string;
  isVerified: boolean;
  threshold: number;
  name: string | null;
  members: MultisigMember[];
  totalMembers: number;
  totalWeight: number;
  proposers: Omit<MultisigProposer, 'multisigAddress'>[];
}

interface MultisigMember {
  multisigAddress: string;
  publicKey: string;
  weight: number;
  isAccepted: boolean;
  isRejected: boolean;
  order: number;
}
```

### Get Multisig Details

```typescript
const details = await client.getMultisig(multisigAddress);
// MultisigWithMembers

const connections = await client.getMultisigConnections();
// Record<string, MultisigWithMembers[]>
```

### Address Lookup

```typescript
const info = await client.getAddressInfo(suiAddress);
// { address: string; publicKey: string }
```

### Invitations

```typescript
// List pending invitations for a public key
const invitations = await client.getInvitations(publicKey);
// MultisigWithMembers[]

// Include rejected invitations
const allInvites = await client.getInvitations(publicKey, { showRejected: true });

// Accept invitation
const msg = new TextEncoder().encode(
  PersonalMessages.acceptMultisigInvitation(multisigAddress)
);
const { signature } = await keypair.signPersonalMessage(msg);
await client.acceptMultisigInvite(multisigAddress, { signature });

// Reject invitation
const rejectMsg = new TextEncoder().encode(
  PersonalMessages.rejectMultisigInvitation(multisigAddress)
);
const { signature: rejectSig } = await keypair.signPersonalMessage(rejectMsg);
await client.rejectMultisigInvite(multisigAddress, { signature: rejectSig });
```

### Proposals

#### Create a Proposal

Build a Sui transaction, sign it, and submit the proposal:

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

const tx = new Transaction();
tx.setSender(multisigAddress);
const [coin] = tx.splitCoins(tx.gas, [1_000_000]);
tx.transferObjects([coin], recipientAddress);

const builtTx = await tx.build({ client: suiClient });

const txSig = await keypair.signTransaction(builtTx);

const proposal = await client.createProposal({
  multisigAddress: multisigAddress,
  transactionBytes: builtTx.toBase64(),
  signature: txSig.signature,
  description: 'Transfer 1 MIST to recipient',
  network: 'testnet',
});
// Proposal
```

#### Proposal Type

```typescript
interface Proposal {
  id: number;
  multisigAddress: string;
  digest: string;
  status: ProposalStatus;
  transactionBytes: string;
  proposerAddress: string;
  description: string | null;
  totalWeight: number;
  currentWeight: number;
  network: string;
}

enum ProposalStatus {
  PENDING = 0,
  CANCELLED = 1,
  SUCCESS = 2,
  FAILURE = 3,
}
```

#### List Proposals with Pagination

```typescript
const proposals = await client.getProposals(
  multisigAddress,
  'testnet',
  {
    status: ProposalStatus.PENDING,
    nextCursor: 0,
    perPage: 10,
  },
);
// PaginatedResponse<ProposalWithSignatures>

interface PaginatedResponse<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor: string;
}

// Get proposal by transaction digest
const proposal = await client.getProposalByDigest(txDigest);
// PublicProposal
```

#### Full Pagination Loop

```typescript
let cursor: number | undefined;
let hasNextPage = true;
const allProposals: ProposalWithSignatures[] = [];

while (hasNextPage) {
  const page = await client.getProposals(multisigAddress, 'testnet', {
    nextCursor: cursor,
    perPage: 10,
  });
  allProposals.push(...page.data);
  hasNextPage = page.hasNextPage;
  cursor = page.nextCursor ? Number(page.nextCursor) : undefined;
}
```

### Voting on Proposals

```typescript
const builtTx = Transaction.from(proposal.transactionBytes);
const txSig = await keypair.signTransaction(await builtTx.build({ client: suiClient }));

const vote = await client.voteForProposal(proposal.id, {
  signature: txSig.signature,
});
// { hasReachedThreshold: boolean }

if (vote.hasReachedThreshold) {
  // Execute the combined multisig transaction on-chain via the Sui SDK
}
```

### Cancel a Proposal

Only the proposer can cancel their own pending proposal:

```typescript
const msg = new TextEncoder().encode(
  PersonalMessages.cancelProposal(proposal.id),
);
const { signature } = await keypair.signPersonalMessage(msg);

await client.cancelProposal(proposal.id, { signature });
// { success: true }
```

### Verify Proposal Execution

After the multisig transaction has been executed on-chain, mark it as done:

```typescript
// Verify by proposal ID
await client.verifyProposal(proposal.id);
// { success: true }

// Verify by transaction digest
await client.verifyProposalByDigest(txDigest);
// { success: true }
```

### Managing Proposers

External proposers can create proposals but cannot vote or execute:

```typescript
// Add a proposer
const expiry = defaultExpiry();
const msg = new TextEncoder().encode(
  PersonalMessages.addMultisigProposer(proposerAddress, multisigAddress, expiry),
);
const { signature } = await keypair.signPersonalMessage(msg);

await client.addMultisigProposer(
  multisigAddress,
  proposerAddress,
  signature,
  expiry,
);
// { success: true }

// Remove a proposer
const removeMsg = new TextEncoder().encode(
  PersonalMessages.removeMultisigProposer(proposerAddress, multisigAddress, expiry),
);
const { signature: removeSig } = await keypair.signPersonalMessage(removeMsg);

await client.removeMultisigProposer(
  multisigAddress,
  proposerAddress,
  removeSig,
  expiry,
);
// { success: true }
```

## Full End-to-End Workflow

Complete example: create a funded verified multisig → create proposal → vote → reach threshold:

```typescript
import { SagatClient, ProposalStatus } from '@mysten/sagat';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
const sagat = new SagatClient('https://api.sagat.mystenlabs.com', 'cookie');

const kp1 = new Ed25519Keypair();
const kp2 = new Ed25519Keypair();
const kp3 = new Ed25519Keypair();

// 1. Connect & register all members
async function connect(kp: Ed25519Keypair) {
  const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const msg = new TextEncoder().encode(`Verifying address ownership until: ${expiry}`);
  const { signature } = await kp.signPersonalMessage(msg);
  await sagat.connect(signature, expiry);
  await sagat.registerAddresses();
}

await connect(kp1);
await connect(kp2);
await connect(kp3);

// 2. Create 2-of-3 multisig
const multisig = await sagat.createMultisig({
  publicKeys: [kp1, kp2, kp3].map(k => k.getPublicKey().toSuiPublicKey()),
  weights: [1, 1, 1],
  threshold: 2,
  name: 'Team Treasury',
});

// 3. Members accept invitations
async function acceptInvite(kp: Ed25519Keypair) {
  const msg = new TextEncoder().encode(
    `Participating in multisig ${multisig.address}`,
  );
  const { signature } = await kp.signPersonalMessage(msg);
  await sagat.acceptMultisigInvite(multisig.address, { signature });
}

await acceptInvite(kp2);
await acceptInvite(kp3);

// 4. Create a proposal (signed by kp1)
const recipient = '0x1234567890123456789012345678901234567890123456789012345678901234';

const tx = new Transaction();
tx.setSender(multisig.address);
const [coin] = tx.splitCoins(tx.gas, [1_000_000]);
tx.transferObjects([coin], recipient);
const builtTx = await tx.build({ client: suiClient });

const txSig = await kp1.signTransaction(builtTx);
const proposal = await sagat.createProposal({
  multisigAddress: multisig.address,
  transactionBytes: builtTx.toBase64(),
  signature: txSig.signature,
  description: 'Transfer 1 MIST to team member',
  network: 'testnet',
});

// 5. kp2 votes → reaches threshold (2 of 3)
const voteSig = await kp2.signTransaction(
  Transaction.from(proposal.transactionBytes),
);
const voteResult = await sagat.voteForProposal(proposal.id, {
  signature: voteSig.signature,
});
// { hasReachedThreshold: true }

// 6. Execute the combined multisig transaction on-chain
// (use @mysten/sui/multisig to combine signatures, then submit via SuiClient)

// 7. Mark as verified
await sagat.verifyProposal(proposal.id);
```

## Sui Multisig Cryptography (Low-Level)

The Sui TypeScript SDK provides `MultiSigPublicKey` for creating multisig addresses and combining signatures.

### Create a Multisig Public Key

```typescript
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { MultiSigPublicKey } from '@mysten/sui/multisig';

const kp1 = new Ed25519Keypair();
const kp2 = new Ed25519Keypair();
const kp3 = new Ed25519Keypair();

const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
  threshold: 2,
  publicKeys: [
    { publicKey: kp1.getPublicKey(), weight: 1 },
    { publicKey: kp2.getPublicKey(), weight: 1 },
    { publicKey: kp3.getPublicKey(), weight: 2 },
  ],
});

const multisigAddress = multiSigPublicKey.toSuiAddress();
```

### Combine Partial Signatures

```typescript
const message = new TextEncoder().encode('hello world');

const sig1 = (await kp1.signPersonalMessage(message)).signature;
const sig2 = (await kp2.signPersonalMessage(message)).signature;

const combinedSignature = multiSigPublicKey.combinePartialSignatures([sig1, sig2]);

const isValid = await multiSigPublicKey.verifyPersonalMessage(message, combinedSignature);
// true (weight 1 + weight 1 >= threshold 2)
```

### MultiSigSigner — Simplified Signing

```typescript
const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
  threshold: 1,
  publicKeys: [
    { publicKey: kp1.getPublicKey(), weight: 1 },
    { publicKey: kp2.getPublicKey(), weight: 1 },
  ],
});

const signer = multiSigPublicKey.getSigner(kp1, kp2);
// getSigner requires enough signers to meet threshold

const message = new TextEncoder().encode('hello world');
const { signature } = await signer.signPersonalMessage(message);
const isValid = await multiSigPublicKey.verifyPersonalMessage(message, signature);
// true
```

## Web Interface Features

### Connect Wallet
- Any Sui wallet supporting ed25519/secp256r1/secp256k1 (Slush, Suiet)
- Test Mode toggle (switches between Testnet and Mainnet)
- Wallet must approve two transactions: connect + authenticate

### Create Multisig
- Minimum 2 addresses required
- Set approval threshold per member weight
- Look up public keys by Sui address (magnifying glass icon)
- Real-time multisig preview before creation

### Invitations
- All invited addresses must accept for the multisig to be valid
- Pending invitations shown in **Invitations** tab

### Dashboard
- **Create Proposal** button
- All proposals with status (pending, executed)
- Multisig overview: members, external proposers
- Asset overview

### External Proposers
- Create proposals without being multisig members
- Cannot approve or execute transactions
- Proposals auto-cancel when a proposer is removed

### Signature Analyzer Tool
- Decode and analyze base64-encoded signatures
- Supports both single and multisig signature schemes
- Access at: `https://sagat.mystenlabs.com/tools/signature-analyzer`

### Transaction Signer Tool
- Preview and sign transactions via raw JSON or base64 input
- Supports Testnet and Mainnet
- Access at: `https://sagat.mystenlabs.com/tools/sign`

## Security Considerations

1. **Mysten Labs Infrastructure**: The API and frontend are hosted by Mysten Labs. Relying on third-party infrastructure means trusting Mysten Labs operational security.

2. **Validate Transactions Independently**: Always verify transaction previews in a secondary location (your wallet), not solely from the Sagat web interface.

3. **Self-Host for Trustless Operation**:
   ```bash
   git clone https://github.com/MystenLabs/sagat
   cd sagat
   bun run dev
   ```

4. **zkLogin Not Supported**: Multisig wallets require ed25519, secp256r1, or secp256k1 keys. zkLogin addresses cannot participate in multisig compositions.

5. **Signature Expiry**: Signed personal messages include an expiry timestamp (default 10 minutes). Expired signatures are rejected.

6. **Proposer Removal Auto-Cancellation**: When an external proposer is removed from a multisig, all their pending proposals are automatically cancelled.

## Package Information

```json
{
  "name": "@mysten/sagat",
  "version": "0.0.1",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
    }
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  }
}
```

## Export Map

```typescript
export { SagatClient, type Fetch } from './client.js';
export { ProposalStatus } from './types.js';
export { PersonalMessages, defaultExpiry } from './constants.js';
export type {
  Address,
  AuthCheckResponse,
  AuthConnectRequest,
  AuthResponse,
  CreateMultisigRequest,
  CreateProposalRequest,
  Multisig,
  MultisigMember,
  MultisigProposer,
  MultisigWithMembers,
  PaginatedResponse,
  Proposal,
  ProposalSignature,
  ProposalWithSignatures,
  PublicProposal,
  SignedMessageRequest,
  VoteProposalRequest,
  VoteProposalResponse,
} from './types.js';
```

## Default API URL

```typescript
import { getDefaultSagatApiUrl } from '@mysten/sagat';

getDefaultSagatApiUrl('live');   // 'https://api.sagat.mystenlabs.com'
getDefaultSagatApiUrl('local');  // 'http://localhost:3000'
```

## Tests

The Sagat repository uses `bun:test` for its test suite. Test files are in `api/test/` and cover:

- **`addresses.test.ts`** — address registration, lookup, multi-user sessions
- **`multisig.test.ts`** — multisig creation (2-of-2, 2-of-3, custom names), acceptance, rejection, invitations, connections, validation
- **`multisig-api.test.ts`** — authentication, multisig management, complete workflow (creation → verification → proposal → voting → execution), session management, error handling
- **`proposal-business-logic.test.ts`** — transaction validation, weighted voting, duplicate voting prevention, member access control, proposer access control, proposal state management, pagination, cancellation, digest-based lookup

## Error Types

Common error messages from the API:

| Error | Context |
|---|---|
| `Not a multisig member` | Non-member tried to vote, create proposal, or add proposer |
| `Threshold must be less than total weight` | Threshold exceeds combined member weights |
| `Threshold must be greater or equal to 1` | Threshold set to 0 |
| `Invalid Sui signature` | Signature doesn't match the transaction |
| `already voted` | Duplicate vote attempt by same member |
| `not pending` | Vote/cancel on a non-pending proposal |
| `same digest` | Duplicate proposal with identical transaction |
| `Signature has expired` | Expired expiry timestamp |

## Dependencies

- `@mysten/sui` — Sui TypeScript SDK (keypairs, transactions, multisig, utils, client)
- `typescript` (peer, ^5.0.0)
- `@types/bun` (dev)
- `tsup` (dev, build tool)
