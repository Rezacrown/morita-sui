# Enoki HTTP API

## Base URL

`https://api.enoki.mystenlabs.com`

## Versioning

Current version: `v1`
Versioned base URL: `https://api.enoki.mystenlabs.com/v1`

## Authentication

API keys from Enoki Portal:
```
Authorization: Bearer <YOUR_ENOKI_API_KEY>
```

- **Public keys** — Frontend use, rate limited
- **Private keys** — Backend use, higher rate limits, required for sponsored transactions

## Request IDs

Include for debugging:
```
Request-Id: <UUID>
```

## API Endpoints

Full OpenAPI specification at `/http-api/openapi`.

### zkLogin Flow
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/v1/zklogin/nonce` | Get OAuth nonce |
| POST | `/v1/zklogin/salt` | Derive user salt from JWT |
| POST | `/v1/zklogin/address` | Get Sui address from JWT + salt |
| POST | `/v1/zklogin/proof` | Get ZK proof for transaction signing |

### Sponsored Transactions
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/transaction-blocks/sponsor` | Sponsor a transaction |
| POST | `/v1/transaction-blocks/sponsor/:digest` | Execute sponsored transaction |

**Sponsor request:**
- Header: `zklogin-jwt: <JWT>`
- Body: `{ network, transactionBlockKindBytes, sender, allowedMoveCallTargets?, allowedAddresses? }`
- Response: `{ bytes, digest }`

**Execute request:**
- Body: `{ signature }`

### Subnames
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/subnames` | Create subname |
| GET | `/v1/subnames` | Query subnames by address/domain |
| DELETE | `/v1/subnames` | Delete subname (private key only) |

## Sources

- https://docs.enoki.mystenlabs.com/http-api
- https://docs.enoki.mystenlabs.com/http-api/openapi
