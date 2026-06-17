# Nautilus Design

## Enclave Endpoints

Three HTTP endpoints when enclave starts:

1. **GET /health_check** — Probes allowed external domains (debugging)
2. **GET /get_attestation** — Returns signed attestation document (onchain registration)
3. **POST /process_data** — Custom logic (app-specific, you implement)

## Platform Configuration Registers (PCRs)

Three SHA-384 hashes describing enclave code/config:

- **PCR0:** OS and boot environment
- **PCR1:** Application code
- **PCR2:** Runtime configuration (run.sh, traffic rules)

If a single byte changes → PCR changes → Sui detects mismatch.

## Inside the Enclave

1. **Enclave starts:** Generates ephemeral keypair in isolated memory. Private key never leaves. Public key via /get_attestation.
2. **Enclave signs data:** /process_data returns `{ response, signature }` — signed with enclave private key.
3. **Move contract verifies:** Checks signature matches registered enclave public key, PCRs correct, timestamp recent. If valid → computation accepted.

## Move Smart Contracts Role

1. **Register enclave:** Store PCRs, verify attestation document, store public key (EnclaveConfig + Enclave shared objects)
2. **Verify responses:** verify_signature() in Nautilus Move library. Accept only data from real, authenticated enclave.

## Developer Workflow

1. Create offchain server with reproducible build (template)
2. Publish server code to public repo (transparency)
3. Register PCRs onchain
4. Deploy to AWS Nitro Enclave
5. Register deployed enclave onchain (attestation + public key)

Verify attestation onchain only during registration (high gas). After registration, use enclave key for efficient message verification.

Route access through backend services for load balancing, rate limiting.

## User Workflow

1. (Optional) Verify code by building locally + confirming PCRs match onchain
2. Send request → receive signed response
3. Submit signed response onchain → verify → execute logic

## Trust Model

### Attestation Verification
AWS Nitro Enclave attestation includes cert chain verified onchain using AWS as root CA. Confirms: unmodified software (PCRs), computation aligns with source code.

### Reproducible Builds
Same source code → identical binary → identical PCRs. Verifiable by anyone. Unauthorized modifications → different PCRs → detectable.

### TEE Security
Cloud-based enclaves: rapid vulnerability patching, strong physical security, compliance standards (SOC 2, ISO 27001, CSA STAR). Single-byte code change = new PCR.
