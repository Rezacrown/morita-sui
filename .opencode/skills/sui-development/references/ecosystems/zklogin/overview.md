# zkLogin Integration

zkLogin enables users to authenticate with Sui using existing Web2 OAuth credentials (Google, Facebook, Twitch, etc.) instead of managing a traditional private key. A zero-knowledge proof attests that the user controls an ephemeral key pair linked to their OAuth identity, without revealing the link on-chain.

## High-Level Flow

1. Wallet creates an ephemeral key pair.
2. Wallet prompts user to complete an OAuth login flow with a nonce corresponding to the ephemeral public key.
3. After receiving the JWT, the wallet obtains a zero-knowledge proof.
4. Wallet obtains a unique user salt based on the JWT. Uses the OAuth subject identifier and salt to compute the zkLogin Sui address.
5. Wallet signs transactions with the ephemeral private key.
6. Wallet submits the transaction with the ephemeral signature and the ZK proof.

## Installation

```sh
npm install @mysten/sui
```

For the latest experimental version:

```sh
npm install @mysten/sui@experimental
```

## Get JWT

### 1. Generate an Ephemeral Key Pair

Follow the same process as generating a key pair in a traditional wallet. See [Sui SDK cryptography docs](https://sdk.mystenlabs.com/typescript/cryptography/keypairs) for details.

### 2. Set Ephemeral Key Pair Expiration

The wallet decides whether `maxEpoch` is the current epoch or later. The wallet also determines whether this is user-adjustable.

### 3. Build the OAuth URL

Assemble the OAuth URL with the configured client ID, redirect URL, and a computed nonce from the ephemeral public key.

```typescript
const FULLNODE_URL = 'https://fullnode.testnet.sui.io:443'; // or mainnet: https://fullnode.mainnet.sui.io:443
const suiClient = new SuiGrpcClient({ baseUrl: FULLNODE_URL, network: 'testnet' });
const { epoch, epochDurationMs, epochStartTimestampMs } = await suiClient.core.getLatestSuiSystemState();

const maxEpoch = Number(epoch) + 2; // ephemeral key active for 2 epochs from now
const ephemeralKeyPair = new Ed25519Keypair();
const randomness = generateRandomness();
const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
```

### Supported OAuth Providers

| Provider  | Auth Flow URL                                                                                                                                                                           | Token Exchange URL                                                                                                                  | Auth Flow Only |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Google    | `https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&response_type=id_token&redirect_uri=$REDIRECT_URL&scope=openid&nonce=$NONCE`                                         | N/A                                                                                                                                 | Yes            |
| Facebook  | `https://www.facebook.com/v17.0/dialog/oauth?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&scope=openid&nonce=$NONCE&response_type=id_token`                                          | N/A                                                                                                                                 | Yes            |
| Twitch    | `https://id.twitch.tv/oauth2/authorize?client_id=$CLIENT_ID&force_verify=true&lang=en&login_type=login&redirect_uri=$REDIRECT_URL&response_type=id_token&scope=openid&nonce=$NONCE`     | N/A                                                                                                                                 | Yes            |
| Kakao     | `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&nonce=$NONCE`                                                               | `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&code=$AUTH_CODE` | No             |
| Apple     | `https://appleid.apple.com/auth/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&scope=email&response_mode=form_post&response_type=code%20id_token&nonce=$NONCE`               | N/A                                                                                                                                 | Yes            |
| Slack     | `https://slack.com/openid/connect/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&nonce=$NONCE&scope=openid`                                               | `https://slack.com/api/openid.connect.token?code=$AUTH_CODE&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET`                      | Yes            |
| Microsoft | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=$CLIENT_ID&scope=openid&response_type=id_token&nonce=$NONCE&redirect_uri=$REDIRECT_URL`                       | N/A                                                                                                                                 | Yes            |

**Auth Flow Only = Yes**: The JWT can be found immediately in the redirect URL after the auth flow (as `id_token` parameter).

**Auth Flow Only = No**: The auth flow only returns a code (`$AUTH_CODE`) in the redirect URL. An additional POST call to the token exchange URL is required to retrieve the JWT.

## Decoding JWT

Upon successful redirection, the OpenID provider attaches the JWT as a URL parameter:

```
http://host/auth?id_token=tokenPartA.tokenPartB.tokenPartC&authuser=0&prompt=none
```

The `id_token` parameter is the JWT in encoded format. Validate the token at [jwt.io](https://jwt.io).

Decode the JWT using a library like `jwt_decode`:

```typescript
const decodedJwt = jwt_decode(encodedJWT) as JwtPayload;
```

### `JwtPayload` Fields

```typescript
interface JwtPayload {
    iss?: string;   // Issuer
    sub?: string;   // Subject ID
    aud?: string[] | string; // Audience
    exp?: number;   // Expiration timestamp
    nbf?: number;   // Not before timestamp
    iat?: number;   // Issued at timestamp
    jti?: string;   // JWT ID
}
```

## User Salt Management

The user salt is used to compute the zkLogin Sui address. The salt must be a **16-byte value** or an integer smaller than `2n**128n`.

The salt disconnects the OAuth identifier (`sub`) from the on-chain Sui address, avoiding linkage between Web2 and Web3 credentials. Losing or misusing the salt could enable this link but does not compromise fund control or zkLogin asset authority.

### Salt Storage Options

| Option | Location     | Description                                                                                                             |
| ------ | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1      | Client-side  | Request user input for the salt during wallet access. User must remember it.                                            |
| 2      | Client-side  | Browser or mobile storage. Email the salt during new wallet setup to prevent loss on device/browser change.             |
| 3      | Backend      | Store a mapping from user identifier (e.g. `sub`) to user salt in a conventional database. Salt is unique per user.     |
| 4      | Backend      | Keep a master seed value and derive a user salt via key derivation: `HKDF(ikm=seed, salt=iss||aud, info=sub)`.          |

**Option 4 caveat**: Does not allow rotation of the master seed or change in client ID (`aud`), otherwise a different user address is derived, resulting in loss of funds.

### Mysten Labs Salt Server

Example request/response for the Mysten Labs-maintained salt server (uses option 4):

```sh
curl -X POST https://salt.api.mystenlabs.com/get_salt \
  -H 'Content-Type: application/json' \
  -d '{"token": "$JWT_TOKEN"}'
```

```
Response: {"salt":"129390038577185583942388216820280642146"}
```

Only valid JWTs authenticated with whitelisted client IDs are accepted. Contact via [Enoki docs](https://docs.enoki.mystenlabs.com/) for access.

## Get the User's Sui Address

Once the OAuth flow completes and the JWT is obtained from the redirect URL, derive the zkLogin address using the JWT and user salt:

```typescript
const zkLoginUserAddress = jwtToAddress(jwt, userSalt, false);
```

## Get the Zero-Knowledge Proof

The ZK proof is an attestation over the ephemeral key pair that proves the ephemeral key pair is valid. Generate the extended ephemeral public key as input to the ZKP:

```typescript
const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());
```

You need to fetch a new ZK proof if the previous ephemeral key pair is expired or otherwise inaccessible. Because generating a ZK proof is resource-intensive, use a backend service for proof generation.

### Option 1: Mysten Labs-Maintained Proving Service

Contact via [Enoki docs](https://docs.enoki.mystenlabs.com/) for access.

You can use **BigInt** or **Base64** encoding for `extendedEphemeralPublicKey`, `jwtRandomness`, and `salt`.

**BigInt encoding:**

```sh
curl -X POST $PROVER_URL -H 'Content-Type: application/json' \
  -d '{"jwt":"$JWT_TOKEN", \
  "extendedEphemeralPublicKey":"84029355920633174015103288781128426107680789454168570548782290541079926444544", \
  "maxEpoch":"10", \
  "jwtRandomness":"100681567828351849884072155819400689117", \
  "salt":"248191903847969014646285995941615069143", \
  "keyClaimName":"sub" \
  }'
```

**Base64 encoding:**

```sh
curl -X POST $PROVER_URL -H 'Content-Type: application/json' \
  -d '{"jwt":"$JWT_TOKEN", \
  "extendedEphemeralPublicKey":"ucbuFjDvPnERRKZI2wa7sihPcnTPvuU//O5QPMGkkgA=", \
  "maxEpoch":"10", \
  "jwtRandomness":"S76Qi8c/SZlmmotnFMr13Q==", \
  "salt":"urgFnwIxJ++Ooswtf0Nn1w==", \
  "keyClaimName":"sub" \
  }'
```

**Response format:**

```json
{
    "proofPoints": {
        "a": [
            "17267520948013237176538401967633949796808964318007586959472021003187557716854",
            "14650660244262428784196747165683760208919070184766586754097510948934669736103",
            "1"
        ],
        "b": [
            [
                "21139310988334827550539224708307701217878230950292201561482099688321320348443",
                "10547097602625638823059992458926868829066244356588080322181801706465994418281"
            ],
            [
                "12744153306027049365027606189549081708414309055722206371798414155740784907883",
                "17883388059920040098415197241200663975335711492591606641576557652282627716838"
            ],
            ["1", "0"]
        ],
        "c": [
            "14769767061575837119226231519343805418804298487906870764117230269550212315249",
            "19108054814174425469923382354535700312637807408963428646825944966509611405530",
            "1"
        ]
    },
    "issBase64Details": {
        "value": "wiaXNzIjoiaHR0cHM6Ly9pZC50d2l0Y2gudHYvb2F1dGgyIiw",
        "indexMod4": 2
    },
    "headerBase64": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ"
}
```

### Handling CORS Errors

To avoid CORS errors in frontend apps, delegate prover calls to a backend service. Map the response to the `PartialZkLoginSignature` type:

```typescript
const proofResponse = await post('/your-internal-api/zkp/get', zkpRequestPayload);

type PartialZkLoginSignature = Omit<
    Parameters<typeof getZkLoginSignature>['0']['inputs'],
    'addressSeed'
>;
const partialZkLoginSignature = proofResponse as PartialZkLoginSignature;
```

### Option 2: Self-Hosted Proving Service (Docker)

#### Prerequisites

Install [Git Large File Storage](https://git-lfs.com/) before downloading the zkey.

#### Download the zkey

**Mainnet & Testnet:**

```sh
wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-main-zkey.sh | bash
```

**Devnet:**

```sh
wget -O - https://raw.githubusercontent.com/sui-foundation/zklogin-ceremony-contributions/main/download-test-zkey.sh | bash
```

#### zkey Hash Verification

Verify the download with Blake2b hash:

```sh
b2sum ${file_name}.zkey
```

| Network          | zkey File Name       | Hash (Blake2b)                                                                                                                     |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Mainnet, Testnet | `zkLogin-main.zkey`  | `060beb961802568ac9ac7f14de0fbcd55e373e8f5ec7cc32189e26fb65700aa4e36f5604f868022c765e634d14ea1cd58bd4d79cef8f3cf9693510696bcbcbce` |
| Devnet           | `zkLogin-test.zkey`  | `686e2f5fd969897b1c034d7654799ee2c3952489814e4eaaf3d7e1bb539841047ae8ee5fdcdaca5f4ddd76abb5a8e8eb77b44b693a2ba9d4be57e94292b26ce2` |

#### Docker Compose Setup

Two Docker images from [mysten/zklogin](https://hub.docker.com/r/mysten/zklogin): `prover-stable` (backend) and `prover-fe-stable` (frontend).

```yaml
services:
  backend:
    image: mysten/zklogin:prover-stable
    volumes:
      - ${ZKEY}:/app/binaries/zkLogin.zkey
    environment:
      - ZKEY=/app/binaries/zkLogin.zkey
      - WITNESS_BINARIES=/app/binaries

  frontend:
    image: mysten/zklogin:prover-fe-stable
    command: '8080'
    ports:
      - '${PROVER_PORT}:8080'
    environment:
      - PROVER_URI=http://backend:8080/input
      - NODE_ENV=production
      - DEBUG=zkLogin:info,jwks
      # Default timeout is 15 seconds. Uncomment to change:
      # - PROVER_TIMEOUT=30
```

```sh
ZKEY=<path_to_zkLogin.zkey> PROVER_PORT=<PROVER_PORT> docker compose up
```

#### Endpoints

| Endpoint | Method | Description                         |
| -------- | ------ | ----------------------------------- |
| `/ping`  | GET    | Health check. Returns `pong`.       |
| `/v1`    | POST   | Proving endpoint. Same request/response format as Mysten Labs service. |

#### Hardware Requirements

- **Minimum**: 16 cores, 16 GB RAM
- Using weaker instances can lead to timeout errors: `"Call to rapidsnark service took longer than 15s"`
- Adjust timeout via `PROVER_TIMEOUT` environment variable (e.g. `PROVER_TIMEOUT=30` for 30 seconds)

#### Compiling Prover from Source

For performance optimization, see the [rapidsnark fork](https://github.com/MystenLabs/rapidsnark#compile-prover-in-server-mode). Compile and launch the prover in server mode.

#### Logging

Setting `DEBUG=*` enables all logs in the prover-fe service, some of which may contain PII. Use `DEBUG=zkLogin:info,jwks` in production environments.

## Assemble the zkLogin Signature & Submit Transaction

### 1. Sign Transaction Bytes

Sign the transaction bytes with the ephemeral private key:

```typescript
const ephemeralKeyPair = new Ed25519Keypair();

const client = new SuiGrpcClient({ baseUrl: '<YOUR_RPC_URL>', network: 'mainnet' });

const txb = new Transaction();
txb.setSender(zkLoginUserAddress);

const { bytes, signature: userSignature } = await txb.sign({
    client,
    signer: ephemeralKeyPair, // Must be the same ephemeral key pair used in the ZKP request
});
```

### 2. Generate Address Seed & Serialize Signature

Combine the ZK proof with the address seed, `maxEpoch`, and ephemeral signature:

```typescript
const addressSeed = genAddressSeed(
    BigInt(userSalt!),
    'sub',
    decodedJwt.sub,
    decodedJwt.aud,
).toString();

const zkLoginSignature = getZkLoginSignature({
    inputs: {
        ...partialZkLoginSignature,
        addressSeed,
    },
    maxEpoch,
    userSignature,
});
```

### 3. Execute Transaction

```typescript
client.executeTransaction({
    transaction: bytes,
    signatures: [zkLoginSignature],
});
```

## Caching

Each ZK proof is tied to an ephemeral key pair and can be reused for any number of transactions until the ephemeral key pair expires (current epoch crosses `maxEpoch`).

- Cache the ephemeral key pair along with the ZKP for the session duration.
- **The ephemeral private key must be treated as a secret.** If both the ephemeral private key and ZK proof are revealed to an attacker, they can sign any transaction on behalf of the user.
- On browsers, use `sessionStorage` (not `localStorage`) to store the ephemeral key pair and ZK proof. `sessionStorage` automatically clears when the browser session ends.

## Efficiency Considerations

| Metric                | Value                                      |
| --------------------- | ------------------------------------------ |
| Typical proving time  | ~3 seconds (16 vCPU / 64 GB RAM)           |
| Right metric          | Active user sessions, not signature count  |
| Proof reuse           | 1 ZKP = many transactions until `maxEpoch` |
| Mysten prover scaling | Auto-scales horizontally                   |

- Using more powerful machines (physical CPUs or GPUs) can reduce proving time further.
- For example, 1 million active user sessions per day requires a prover that can handle ~1-2 requests per second with evenly distributed traffic.
- Contact [Sui Discord](https://discord.gg/sui) for questions about prover scalability.
