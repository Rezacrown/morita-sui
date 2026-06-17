# Nautilus Community Developer Tools

Community-contributed tools. Do your own due diligence before production use.

## Marlin Oyster — Docker-Based TEE Deployment

Marlin Oyster removes operational overhead of managing AWS Nitro Enclaves. Deploy enclave-powered apps with Docker image + Oyster CLI + Sui. No direct AWS interaction.

**Benefits:** Same Nitro security guarantees, deterministic enclave builds + provisioning + attestation, transparent decentralized marketplace

**Workflow:**
1. Build app → package as Docker image
2. Deploy as job on Oyster marketplace (pay stablecoin)
3. Oyster operator provisions Nitro Enclave, runs workload (cannot alter application)
4. Enclave generates PCR measurement → Move contract verifies onchain

**Reference:** github.com/marlinprotocol/sui-oyster-demo (decentralized price oracle)

## Nautilus-Ops

CLI tool for build/deploy enclave images, register onchain, verify signatures.
GitHub: github.com/Ashwin-3cS/nautilus-ops

## nautilus-ts

TypeScript framework for Nautilus apps in AWS Nitro Enclaves. Uses @mysten/sui and @mysten/seal. Handles VSOCK networking, NSM attestation, traffic forwarding, key management.
GitHub: github.com/unconfirmedlabs/nautilus-ts
