# Seal-Nautilus Pattern — Encrypt Enclave Secrets

Secure secret management for enclave applications. Encrypt secrets configured with specific enclave PCRs. Only matching enclave can decrypt.

## Components
1. Nautilus server (port 3000 public, port 3001 localhost admin)
2. Seal CLI (encrypt + fetch-keys)
3. Move contract (seal_approve policy)

## Phase 1: Start & Register

1. Build and run enclave with /get_attestation
2. Get attestation → register PCRs + public key onchain
3. Record enclave object ID + initial_shared_version
4. /process_data returns error (SEAL_API_KEY not initialized)

## Phase 2: Init Key Load

```bash
# Step 1: Init
curl -X POST http://localhost:3001/admin/init_seal_key_load \
  -d '{"enclave_object_id":"0x...","initial_shared_version":722158400}'
# Returns: {"encoded_request":"<FETCH_KEY_REQUEST>"}

# Step 2: Fetch keys from Seal servers
cargo run --bin seal-cli fetch-keys --request <FETCH_KEY_REQUEST> \
  -k <SERVER_IDS> -t 2 -n testnet
# Returns: encoded seal responses

# Step 3: Complete
curl -X POST http://localhost:3001/admin/complete_seal_key_load \
  -d '{"seal_responses":"<ENCODED_SEAL_RESPONSES>"}'
# Returns: {"status":"OK"}
```

## Phase 3: Provision Secrets

```bash
# Encrypt secret (anywhere)
cargo run --bin seal-cli encrypt --secret <HEX_SECRET> \
  --id 0x00 -p $APP_PACKAGE_ID -t 2 -k <SERVER_IDS> -n testnet

# Provision to enclave
curl -X POST http://localhost:3001/admin/provision_weather_api_key \
  -d '{"encrypted_object":"<ENCRYPTED_OBJECT>"}'
# Returns: {"status":"OK"}

# Now /process_data works
curl -X POST http://<PUBLIC_IP>:3000/process_data -d '{"payload":{"location":"San Francisco"}}'
```

## Security Guarantees

3 keys in enclave memory (never leave):
1. Ephemeral keypair (Ed25519) — signs responses
2. Seal wallet (Ed25519) — certificate signing + tx sender
3. ElGamal encryption keypair (BLS) — decrypts Seal responses

seal_approve verifies: signature by enclave over wallet pubkey, key ID=0x00, sender matches wallet. Only enclave with both wallet + ephemeral key can create valid PTB.

## Why 2-Step Key Load?

Enclave has no internet. Host fetches from Seal servers as intermediary. Secure because: Seal responses encrypted to enclave's ElGamal key (only enclave can decrypt).

## Multiple Secrets

Encrypt many with same ID=0. Run key load once. Provision each via endpoint.

## Troubleshooting

- Certificate expired (30min TTL): redo Phase 2 step 1
- Enclave restart: all ephemeral keys lost → redo Phases 2-3
