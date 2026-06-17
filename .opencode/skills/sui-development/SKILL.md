---
name: sui-development
description: "Sui blockchain development — Move smart contracts, TypeScript/Rust SDKs, dApp Kit frontend, CLI tooling, data access, and Walrus storage. Use when writing Sui Move code, building dApps on Sui, deploying packages, querying on-chain data, using Sui SDKs, or setting up Sui infrastructure. Don't use for Ethereum/Solana development (use viem/wagmi skills instead)."
---

# Sui Blockchain — Development

Complete Sui development skill covering Move language, object model, PTBs, SDKs, frontend integration, CLI tooling, data access, and decentralized storage. This skill routes to focused reference files — load only the ones relevant to the current task.

All patterns in this skill are derived from:
- https://docs.sui.io
- https://move-book.com
- https://sdk.mystenlabs.com
- https://docs.wal.app

If unsure about any API, fetch the relevant source before answering. Do not guess or extrapolate from other blockchains.

## Version & Resources

| | |
|---|---|
| **Sui CLI** | v1.63+ (use suiup to manage) |
| **TypeScript SDK** | `@mysten/sui` v2.x |
| **Rust SDK** | `sui-rust-sdk` crates (modular) |
| **dApp Kit** | `@mysten/dapp-kit-react` / `@mysten/dapp-kit-core` |
| **Docs** | https://docs.sui.io |
| **Move Book** | https://move-book.com |
| **SDK Docs** | https://sdk.mystenlabs.com |
| **GitHub** | https://github.com/MystenLabs/sui |

Check latest: `sui --version` / `npm view @mysten/sui version`

## Before You Start

1. **Identify the domain** — Is this Move smart contracts, frontend dApp, SDK integration, CLI tooling, or data access? Route to the correct reference file.
2. **Check Sui vs other chains** — Sui uses object-centric model + Move, not account-based + Solidity. Do not apply Ethereum patterns.
3. **Verify Sui CLI version** — Run `sui --version`. Must be v1.63+ for modern Move.toml format and 2024 edition.
4. **Check SDK version** — Run `npm ls @mysten/sui`. Must be v2.x. v1 (`@mysten/sui.js`) is deprecated.
5. **Read pattern.md** — Always read before writing any Sui code.

---

## Routing Guide

| Task | Load |
|------|------|
| "What is Sui?" / comparing blockchains / object model overview | `overview.md` |
| Installing Sui CLI (suiup), version management | `overview.md` |
| Networks (Mainnet/Testnet/Devnet/Localnet), gas, epochs, faucets | `overview.md` |
| Client config, addresses, key storage, explorers | `overview.md` |
| Writing Move smart contracts, abilities, TxContext, OTW, events, coins | `move-language.md` |
| 2024 edition syntax, method calls, macros, string literals, enums | `move-language.md` |
| Designing composable functions for PTBs, parameter ordering | `move-language.md` |
| Naming conventions (errors, events, capabilities, getters, constants) | `move-language.md` |
| Creating a Move project, Move.toml, dependencies, environments | `move-project.md` |
| Building packages, resolving build errors | `move-project.md` |
| Publishing, upgrading, deploy to Mainnet, multisig publishing | `move-project.md` |
| Writing Move unit tests, test_scenario, expected_failure | `move-testing.md` |
| Code coverage, test patterns | `move-testing.md` |
| Object model, ownership types, abilities, versioning | `object-model.md` |
| Dynamic fields, collections (Table, Bag, VecMap), derived objects | `object-model.md` |
| Object Display V2, transfer patterns, Receiving type | `object-model.md` |
| Capability pattern, hot potato, soulbound, inventory patterns | `object-model.md` |
| Programmable Transaction Blocks — building, commands, chaining | `ptbs.md` |
| PTB TypeScript SDK (`Transaction`), CLI PTBs (`sui client ptb`) | `ptbs.md` |
| PTB troubleshooting, sponsored transactions | `ptbs.md` |
| Choosing an SDK (TypeScript vs Rust vs community) | `sdks.md` |
| TypeScript SDK v2, gRPC client, PTB construction | `sdks.md` |
| Rust SDK, sui-rust-sdk crates | `sdks.md` |
| Community SDKs (Python, Go, Dart, Kotlin, Swift) | `sdks.md` |
| dApp Kit setup, wallet connection, network switching | `frontend.md` |
| React hooks (`useCurrentAccount`, `useCurrentClient`, `useDAppKit`) | `frontend.md` |
| TanStack Query patterns, cache invalidation after writes | `frontend.md` |
| Transaction signing and execution from frontend | `frontend.md` |
| Next.js / SSR with dApp Kit | `frontend.md` |
| Reading data from Sui — gRPC, GraphQL RPC | `accessing-data.md` |
| Custom indexers, archival data, event subscriptions | `accessing-data.md` |
| Walrus blob storage (large files, images, documents) | `accessing-data.md` |
| Deploying websites to Walrus Sites | `walrus-sites.md` |
| Walrus Sites portal, SPA routing, ws-resources.json | `walrus-sites.md` |
| Generating CLAUDE.md / AGENT.md for Sui projects | `agent-config.md` |
| zkLogin / OAuth login flow for wallets | `ecosystems/zklogin/overview.md` |
| DeepBook CLOB / on-chain order book | `ecosystems/deepbook/overview.md` |
| DeepBook architecture & design | `ecosystems/deepbook/design.md` |
| DeepBook contract addresses & pools | `ecosystems/deepbook/contract-info.md` |
| DeepBook indexer API | `ecosystems/deepbook/indexer.md` |
| Enoki / gasless onboarding | `ecosystems/enoki/overview.md` |
| Enoki TypeScript SDK | `ecosystems/enoki/sdk.md` |
| Enoki HTTP API reference | `ecosystems/enoki/http-api.md` |
| Enoki Connect (cross-dApp wallets) | `ecosystems/enoki/connect.md` |
| Enoki identity subnames | `ecosystems/enoki/subnames.md` |
| Enoki FAQ | `ecosystems/enoki/faq.md` |
| Messaging SDK / E2E encrypted group chat | `ecosystems/messaging/overview.md` |
| Messaging SDK setup & configuration | `ecosystems/messaging/setup.md` |
| Messaging SDK security model | `ecosystems/messaging/security.md` |
| Messaging chat app example | `ecosystems/messaging/chat-app.md` |
| Nautilus TEE / verifiable offchain compute | `ecosystems/nautilus/overview.md` |
| Nautilus architecture & design | `ecosystems/nautilus/design.md` |
| Nautilus AWS deployment walkthrough | `ecosystems/nautilus/using.md` |
| Nautilus customization & testing | `ecosystems/nautilus/customize.md` |
| Nautilus + Seal integration (encrypt enclave secrets) | `ecosystems/nautilus/seal-nautilus.md` |
| Nautilus community tools (Marlin Oyster etc.) | `ecosystems/nautilus/community-tools.md` |
| Seal / decentralized secrets management | `ecosystems/seal/overview.md` |
| Seal encryption & decryption guide | `ecosystems/seal/encryption.md` |
| SuiNS / name service overview | `ecosystems/suins/overview.md` |
| SuiNS domain names & resolution | `ecosystems/suins/domain-names.md` |
| Walrus blob storage deep dive | `ecosystems/walrus/overview.md` |
| Walrus upload, read, manage blobs | `ecosystems/walrus/storage.md` |
| Walrus Sites deployment guide | `ecosystems/walrus/sites.md` |
| Walrus + Seal encrypted social media (OnlyFins) | `ecosystems/walrus/only-fins.md` |
| SuiPlay0X1 gaming device development | `ecosystems/suiplay0x1/overview.md` |
| SuiPlay0X1 best practices | `ecosystems/suiplay0x1/best-practices.md` |
| SuiPlay0X1 SDK integration | `ecosystems/suiplay0x1/integration.md` |
| SuiPlay0X1 wallet integration options | `ecosystems/suiplay0x1/wallet-integration.md` |
| SuiPlay0X1 cross-platform migration | `ecosystems/suiplay0x1/migration-strategies.md` |
| Sagat / multisig management platform | `ecosystems/sagat/overview.md` |
| On-chain primitives (time & randomness) | `ecosystems/on-chain-primitives/overview.md` |
| Full Sui project from scratch (Move + frontend + deploy) | **all reference files** |
| Code review | **all reference files** |
| Security audit, access control review | `move-language.md` + `object-model.md` |

## Skill Content

### Key Concepts

- **Object-centric data model.** Every piece of Sui state is a typed object with a unique ID, version, and owner. No global contract storage like Ethereum.
- **Move language.** Compile-time resource safety — assets cannot be duplicated or silently dropped. This is fundamentally different from Solidity's gas-based approach.
- **Programmable Transaction Blocks.** Up to 1,024 commands in one atomic transaction. Batch multiple Move calls, coin splits/merges, and transfers atomically.
- **Parallel execution.** Transactions on non-overlapping owned objects execute in parallel without consensus. Shared objects go through Mysticeti consensus.
- **Two official SDKs.** TypeScript (`@mysten/sui` v2) and Rust (`sui-rust-sdk` crates). JSON-RPC is deprecated (sunset July 2026). Use gRPC or GraphQL RPC.
- **dApp Kit for frontends.** `@mysten/dapp-kit-react` (React) and `@mysten/dapp-kit-core` (Vue, vanilla, Svelte). The bare `@mysten/dapp-kit` is deprecated.
- **Walrus for blob storage.** On-chain object limit is 250 KB. Large files (images, documents, JSON) go to Walrus.

### Rules

1. Never use `@mysten/sui.js` — deprecated package. Always use `@mysten/sui`.
2. Never use `@mysten/dapp-kit` (no suffix) — deprecated. Use `@mysten/dapp-kit-react` or `@mysten/dapp-kit-core`.
3. JSON-RPC is deprecated for new code — default to gRPC or GraphQL RPC.
4. `SuiClient` is removed in v2 — use `SuiGrpcClient` from `@mysten/sui/grpc`.
5. Transaction construction in app code: pass `Transaction` instance to wallet, never `await tx.build()` bytes first.
6. Always `waitForTransaction` before invalidating TanStack Query caches after a write.
7. Move 2024 edition: use `edition = "2024"` in Move.toml, method syntax, single-line module declarations.
8. Do not apply Solidity/Ethereum patterns to Sui Move.

### Common Mistakes

- Using `tx.pure(value)` untyped — use `tx.pure.u64(n)`, `tx.pure.address(addr)`, `tx.pure.string(s)`.
- Calling `tx.build()` before handing to wallet — defeats wallet gas selection.
- Not `await client.waitForTransaction({ digest })` before cache invalidation in frontends.
- `sui client faucet` on Testnet — only works on Devnet/Localnet. Use web faucet for Testnet.
- Forgetting `update` + `switch` — `suiup update` downloads but doesn't switch. Must run `suiup switch` too.
- Using `SuiClient` and v1 hook names in new code (`useSuiClient`, `useSignAndExecuteTransaction`, `SuiClientProvider`).

## Self-Check

After generating any Sui-related code:

1. **Sui vs Ethereum check** — Is this code using Sui's object model, not Ethereum's account model?
2. **Import check** — Are imports from `@mysten/sui` (not `@mysten/sui.js`)? v2 APIs only?
3. **PTB check** — Are transactions constructed as PTBs? Is chaining correct? Are return values consumed?
4. **Move edition check** — Is `edition = "2024"` in Move.toml? Using method syntax not function-call syntax?
5. **Naming check** — Events in past tense? Capabilities suffixed with `Cap`? Error constants `E`-prefixed?
6. **Frontend check** — dApp Kit v2 hooks? `SuiGrpcClient`? `waitForTransaction` before cache invalidation?
7. **Data access check** — gRPC or GraphQL RPC (not JSON-RPC)? Correct client for the task?
8. **Source check** — If unsure, was a canonical source consulted before answering?
