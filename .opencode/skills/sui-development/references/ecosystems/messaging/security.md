# Messaging SDK Security

## Threat Model

- **Unauthorized reading:** Only MessagingReader members can decrypt
- **Tampering:** AES-GCM authenticated encryption detects modifications
- **Impersonation:** Per-message signatures bind ciphertext to wallet key

## Trust Boundaries

| Component | Trust Level | Explanation |
|-----------|-------------|-------------|
| Sui blockchain | Trustless | State, permissions, encryption history independently verifiable |
| Seal key servers | Trust-minimized | Threshold crypto. Policy enforced onchain. Colluding majority could reconstruct DEK |
| Relayer | Trusted (operational) | Can observe metadata, influence ordering. Cannot read content or forge signatures |

## Security Guarantees

- **E2E encryption:** AES-256-GCM client-side. Relayer stores only ciphertext
- **Ciphertext integrity:** AES-GCM 16-byte auth tag
- **Sender verification:** Per-message signature over `groupId:encryptedText:nonce:keyVersion`
- **Permission-gated decryption:** Only MessagingReader holders can decrypt DEK via Seal
- **AAD binding:** `[groupId][keyVersion][senderAddress]` prevents cross-group replay

## Forward Secrecy

New members CAN read history by design. No per-message key ratcheting. Key rotation protects against removed members only.

## Post-Compromise Security

Manual via admin-triggered key rotation. **Always use `removeMembersAndRotateKey()`** — never standalone `removeMember()`.

`leave()` does NOT auto-rotate. Admin must monitor events and rotate.

## Relayer Limitations

Cannot read content or forge signatures. Can observe metadata (who, when, which group), influence ordering, attribute wrong sender (detectable via signature verification).

## Nonce Collision Risk

AES-GCM 96-bit nonces. Limit 2^32 messages per key (NIST). Rotate keys periodically for high-volume groups.

## Recommendations

1. Always use `removeMembersAndRotateKey()`
2. Periodic key rotation for long-lived groups
3. Monitor MemberRemoved events + auto-rotate
4. Check `senderVerified` on received messages
5. Custom Seal policies for high-security use cases
6. Deploy relayer within Nautilus for verifiable execution

## Architecture Comparison

| Property | Alpha (onchain) | Current (hybrid) |
|----------|----------------|------------------|
| Storage | Sui objects | Relayer + Walrus |
| Ordering | Sui consensus | Relayer |
| Gas/message | Sui tx | None (HTTP) |
| Encryption | Seal-protected DEK | Same |
| Sender auth | Tx signature | Per-message signature |

## Sources

- https://docs.sui.io/sui-stack/messaging/security
