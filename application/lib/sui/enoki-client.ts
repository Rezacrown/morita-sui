import { EnokiClient } from '@mysten/enoki'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'
import { Transaction } from '@mysten/sui/transactions'
import { toBase64, fromBase64 } from '@mysten/sui/utils'

type EnokiNetwork = 'mainnet' | 'testnet' | 'devnet'

const apiKey = process.env.ENOKI_SECRET_KEY
export const enokiClient: EnokiClient | null = apiKey ? new EnokiClient({ apiKey }) : null

function getAdminSigner() {
  const key = process.env.ADMIN_PRIVATE_KEY
  if (!key) throw new Error('ADMIN_PRIVATE_KEY not set')
  const { secretKey } = decodeSuiPrivateKey(key)
  return Ed25519Keypair.fromSecretKey(secretKey)
}

// Backend builds, sponsors, signs with ADMIN key, executes. No user involvement.
export async function executeAsAdmin(tx: Transaction, targets: string[], network?: EnokiNetwork) {
  const admin = getAdminSigner()
  const sender = admin.toSuiAddress()
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not set')
  const txBytes = await tx.build({ onlyTransactionKind: true })
  const sponsored = await enokiClient.createSponsoredTransaction({
    network: network ?? 'testnet',
    transactionKindBytes: toBase64(txBytes),
    sender,
    allowedMoveCallTargets: targets,
  })
  const { signature } = await admin.signTransaction(fromBase64(sponsored.bytes))
  return enokiClient.executeSponsoredTransaction({ digest: sponsored.digest, signature })
}

// Backend sponsors on behalf of user. Returns bytes for user to sign.
export async function sponsorForUser(
  txBytesKind: string,
  userAddress: string,
  targets: string[],
  network?: EnokiNetwork,
) {
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not set')
  return enokiClient.createSponsoredTransaction({
    network: network ?? 'testnet',
    transactionKindBytes: txBytesKind,
    sender: userAddress,
    allowedMoveCallTargets: targets,
  })
}

// Backend executes after user signs the sponsored bytes.
export async function executeUserSigned(digest: string, signature: string) {
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not set')
  return enokiClient.executeSponsoredTransaction({ digest, signature })
}
