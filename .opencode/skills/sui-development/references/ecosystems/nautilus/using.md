# Using Nautilus — Weather Oracle Example

Complete walkthrough for deploying Nautilus on AWS Nitro Enclaves.

## Prerequisites
- AWS CLI v2, Rust/cargo, Make, Sui CLI
- Nautilus repo: github.com/MystenLabs/nautilus

## Repository Structure
```
/move/enclave          — Utility for enclave config registration
/move/weather-example   — Example onchain logic
/src/aws, /src/init, /src/system — AWS boilerplate (don't modify)
/src/nautilus-server/src/apps/weather-example/
    mod.rs               — process_data logic (customize this)
    allowed_endpoints.yaml — External API access
```

## AWS Setup
1. Create AWS developer account
2. `aws configure sso` (SSO start URL, us-east-1)
3. Log in via browser, choose account + AdministratorAccess role
4. EC2 key pair: `aws ec2 create-key-pair --key-name <alias> ...`
5. Set AWS env vars: `aws configure export-credentials --format env > ~/aws-temp-creds.sh && source ~/aws-temp-creds.sh`

## Deploy Enclave

```bash
cd nautilus
sh configure_enclave.sh weather-example
```
Launches EC2, allocates Nitro Enclave, builds EIF binary. Saves public IP.

Enter: instance base name, secret (y/n), secret name, secret value (API key).

```bash
# Copy changes to EC2
rsync -avz -e "ssh -i ~/.ssh/<alias>.pem" /path/to/nautilus/ ec2-user@<PUBLIC_IP>:~/nautilus/

# SSH and run
ssh -i ~/.ssh/<alias>.pem ec2-user@<PUBLIC_IP>
cd nautilus
make ENCLAVE_APP=weather-example && make run
sh expose_enclave.sh
```

## Test Endpoints
```bash
curl -X GET http://<PUBLIC_IP>:3000/health_check
curl -X GET http://<PUBLIC_IP>:3000/get_attestation
curl -X POST http://<PUBLIC_IP>:3000/process_data -H 'Content-Type: application/json' -d '{"payload":{"location":"San Francisco"}}'
```

## Onchain Registration

```bash
# Deploy enclave package
cd move/enclave && sui move build && sui client publish
ENCLAVE_PACKAGE_ID=<from_output>

# Deploy app
cd ../weather-example && sui move build && sui client publish
APP_PACKAGE_ID=<from_output>

# Get PCRs
cat out/nitro.pcrs

# Register
sui client call --function update_pcrs --module enclave --package $ENCLAVE_PACKAGE_ID \
  --type-args "$APP_PACKAGE_ID::weather::WEATHER" \
  --args $ENCLAVE_CONFIG_OBJECT_ID $CAP_OBJECT_ID 0x$PCR0 0x$PCR1 0x$PCR2

sh ../../register_enclave.sh $ENCLAVE_PACKAGE_ID $APP_PACKAGE_ID \
  $ENCLAVE_CONFIG_OBJECT_ID $ENCLAVE_URL weather WEATHER
```

## Development Mode
For local dev: inject deterministic private key + `make run-debug` (all-zero PCRs). **Never use in production.**

## Troubleshooting
- Traffic forwarder: check allowed_endpoints.yaml, /health_check
- Docker not running: wait for EC2 startup
- VSOCK issue: verify expose_enclave.sh
- SSO expired: `aws sso login` + re-export credentials
- PEM invalid format: recreate keypair
- Enclave unreachable: check expose_enclave.sh, instance running, correct IP

## Stop EC2
```bash
aws ec2 stop-instances --instance-ids <instance-id>
```
To restart: `aws ec2 start-instances`, then SSH + `make ENCLAVE_APP=weather-example && make run && sh expose_enclave.sh`
