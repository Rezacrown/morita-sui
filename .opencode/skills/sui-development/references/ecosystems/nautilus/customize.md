# Customizing Nautilus

## Custom Server Logic

Modify `src/nautilus-server/src/apps/<your_app>/mod.rs` to define process_data logic. Add external domains to `allowed_endpoints.yaml`.

Files NOT modified: `common.rs` (attestation), `main.rs` (keypair + HTTP server setup).

## Local Testing

```bash
cd src/nautilus-server/
RUST_LOG=debug API_KEY=your_api_key cargo run --features=weather-example --bin nautilus-server
curl -X POST http://localhost:3000/process_data -H 'Content-Type: application/json' -d '{"payload":{"location":"San Francisco"}}'
```

Note: /get_attestation doesn't work locally (needs Nitro Secure Module driver).

## Reproducibility

Every enclave from same source code produces identical PCRs:
```bash
make ENCLAVE_APP=weather-example
cat out/nitro.pcrs
```

PCR2=21b9ef... is common across examples (same runtime config).

## Enclave Management

- Multiple Enclave objects per EnclaveConfig (one PCR set, many instances with different keys)
- Update PCRs: `make ENCLAVE_APP=<app> && cat out/nitro.pcrs` → sui client call update_pcrs
- Register new instances: reuse register_enclave.sh

## Verified Computation in Move

Frontend calls /process_data → gets signed response → submits to Move contract:
```bash
sh ../../update_weather.sh $APP_PACKAGE_ID weather WEATHER $ENCLAVE_OBJECT_ID \
  "signature..." 1744683300000 "San Francisco" 13
```

BCS serialization must match between Rust and Move for signature verification.

## FAQs

**Why AWS Nitro?** Maturity, reproducible builds. More TEE providers may be added.

**Root of trust?** Stored in Sui framework, verifiable against AWS:
```bash
curl https://raw.githubusercontent.com/MystenLabs/sui/.../nitro_root_certificate.pem -o cert_sui.pem
sha256sum cert_sui.pem  # Compare with AWS NitroEnclaves Root
```
