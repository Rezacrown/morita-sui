# Enoki Developer Portal FAQ

## General

**What is Enoki?** Mysten Labs' SaaS for Sui blockchain integration — zkLogin wallets + sponsored transactions via API.

**How to sign up?** Go to https://portal.enoki.mystenlabs.com and create an account.

**Pricing?** Monthly fiat subscription. View current plans in the Portal. Not payable in SUI.

**Team management?** Add members through the Enoki Portal dashboard.

**Where to get help?** Sui Discord or Enoki documentation.

## zkLogin

**Available credential providers?** Google, Apple, Twitch, Facebook, Kakao, Slack, Microsoft. More may be added.

**Can we add private SSO/OAuth?** Contact Mysten Labs for enterprise SSO integration options.

**Same wallet across devices?** Same OAuth provider + same salt = same Sui address. Enoki manages salt consistently via their salt server.

**Can users edit/download the salt?** No — Enoki manages salt. Salt disconnects OAuth identity from onchain address for privacy. Losing salt = losing access, so Enoki handles it.

**How to secure client IDs?** OAuth client IDs are public by design. Security comes from ZK proof + salt derivation, not the client ID.

## Sponsored Transactions

**What are sponsored transactions?** You pay gas fees for your users' transactions. Users don't need SUI tokens.

**Do sponsored transaction credits expire?** Check your plan terms in the Enoki Portal.

**What is a provisioning fee?** A small fee to prevent spam and abuse. See pricing for current rates.

## Technical

**Are there rate limits?** Yes. Public keys have lower limits than private keys. Check your plan.

**Supported in Node.js?** Yes. Private keys work in backend (Node.js). Public keys are for frontend. SDK works in both environments.

**Backend vs frontend setup?** Use backend with private key for sponsored transactions (keeps keys secure). Use frontend with public key only for zkLogin wallet registration.

**Allowed addresses/move call targets?** Configure in Enoki Portal or pass per-request. These restrict what sponsored transactions can do — adds security by limiting attack surface.

## Sources

- https://docs.enoki.mystenlabs.com/faq
