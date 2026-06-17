# Enoki — Gasless Web3 Onboarding

Enoki is Mysten Labs' SaaS solution for Sui blockchain integration. Named after a type of Japanese mushroom, Enoki acts as the root system enabling builders to exploit blockchain superpowers with Web2 convenience.

## Non-Custodial Account Management

Users create Sui addresses from Web2 logins (Google, Apple, Twitch, Facebook, etc.). Enoki uses zkLogin to generate self-custodial Sui addresses via OAuth2 OpenID Connect. The user's onchain address is linked to an active JWT from their web credential. Enoki generates a salt and address, using zkLogin proofs for transaction signing.

Through the **Enoki Developer Portal** (https://portal.enoki.mystenlabs.com), you control and configure the login providers your users authenticate with.

## Sponsored Transactions

Enoki lets builders fully sponsor all end-user transactions. The Developer Portal provides tools to set up and manage sponsored transactions. Pay for gas on behalf of users — they don't need SUI tokens or blockchain knowledge. You control revenue collection, users focus on your app's benefits.

## Documentation

- **TypeScript SDK** — Create transactions directly from frontend
- **HTTP API** — Call Enoki from backend services

## Sources

- https://docs.enoki.mystenlabs.com/
- https://portal.enoki.mystenlabs.com
