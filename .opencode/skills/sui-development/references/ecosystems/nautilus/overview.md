# Nautilus — Verifiable Offchain Compute on Sui

Nautilus is a verifiable offchain compute layer enabling builders to delegate sensitive or resource-intensive tasks to self-managed TEEs (Trusted Execution Environments) while preserving trust onchain through Move smart contract verification.

**IMPORTANT:** Nautilus is NOT just about privacy — the value proposition is **onchain verification** of computation integrity. PCRs must be registered and verified onchain. Every computation result can optionally be verified onchain.

## Components

1. **Offchain server:** Runs inside a TEE (AWS Nitro Enclave or Marlin Oyster), handles computations
2. **Onchain smart contract:** Move code verifying TEE attestations before executing transactions

## How It Works

1. Deploy server to TEE → 2. TEE generates cryptographic attestation → 3. Move contract verifies attestation → 4. TEE output accepted

## Features

- PCRs (Platform Configuration Registers) registered + verified onchain
- Computation results optionally verified onchain
- Initially AWS Nitro Enclaves (maturity, reproducible builds)
- Self-managed or Marlin Oyster marketplace (Docker-based)

## Use Cases

- **Trusted oracles:** Process offchain data (weather, sports, financial) tamper-resistant
- **AI agents:** Run models for inference, agentic workflows with data/model provenance onchain
- **DePIN:** Private data computation for IoT/supply chain
- **Fraud prevention:** DEX order matching, L2 collision prevention
- **Identity management:** Onchain verifiability for governance, proof of tamper resistance

## Seal Integration

TEEs can't persist keys across restarts. Seal stores long-term keys, grants access only to properly attested TEEs. Nautilus handles computation; Seal controls key access. Combined: shared encrypted state, private processing, updated on public networks.

## Template

Reference only — not audited, not feature-complete. Apache 2.0, provided as-is. GitHub: github.com/MystenLabs/nautilus
