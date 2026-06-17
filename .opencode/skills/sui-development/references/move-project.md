# Move Project Setup, Build, Test & Publish

## Creating a Move Project

### Canonical Full-Stack Starter

For an end-to-end Sui developer environment with Move and frontend:

```bash
git clone https://github.com/MystenLabs/sui-stack-hello-world.git
cd sui-stack-hello-world
```

Layout: `move/hello-world/` (Move package) + `ui/` (frontend). Publish the hello-world package, not a counter. Do NOT run `sui move new` for this workflow.

### New Standalone Project

```bash
sui move new my_project
cd my_project
```

Creates: `sources/`, `tests/`, `Move.toml`.

### Multi-Package Workspace

```
my_project/
├── packages/
│   ├── core/
│   │   ├── sources/
│   │   ├── tests/
│   │   └── Move.toml
│   └── examples/
│       ├── sources/
│       ├── tests/
│       └── Move.toml
└── ui/
```

Do NOT nest packages. Use `local` path for sibling dependencies:

```toml
# packages/examples/Move.toml
[dependencies]
core = { local = "../core" }
```

## Move.toml

### Current Format (Sui CLI v1.63+)

```toml
[package]
name = "my_project"
edition = "2024"

[environments]
testnet = "4c78adac"
mainnet = "35834a8a"

[dependencies]
# MVR dependency
suins = { r.mvr = "@suins/core" }
```

Do NOT add `Sui = { git = "..." }` — 2024 edition resolves the Sui framework automatically. Do NOT add `[addresses]` section — replaced by `[environments]`.

### MVR Dependencies

Install MVR: `suiup install mvr`

```bash
mvr add @org/package --network testnet
```

Or directly in Move.toml: `{ r.mvr = "@suins/core" }`. Prefer MVR over git URLs.

### Published.toml & Move.lock

- **`Published.toml`**: Tracks published package addresses per environment. Created/updated automatically after `sui client publish`. Commit to version control.
- **`Move.lock`**: Auto-generated lock file. Pins dependencies to specific revisions. Do NOT edit manually. Commit to version control.

## Building

```bash
sui move build
```

For multi-environment packages:

```bash
sui move build --build-env testnet
sui move build --build-env mainnet
```

## Testing

```bash
sui move test
```

### Coverage

```bash
sui move test --coverage
sui move coverage source --module <name>
```

### Move Analyzer

Install via `suiup install move-analyzer`, then install the **Move Analyzer** VS Code extension. Provides completion, go-to-definition, diagnostics, hover docs.

### Debugging

- **Move Trace Debugger**: Step-through execution with variable inspection
- **`sui replay`**: Re-execute any past onchain transaction locally
- **`std::debug::print`**: Print values during test execution

## Publishing

### Pre-Publish Checklist

1. `sui client active-env` — verify target network
2. `sui client balance` — ensure sufficient SUI for gas
3. `sui move build` — clean compilation

### Publish

```bash
sui client publish
```

This returns:
- **Package ID** (use for all future interactions)
- **UpgradeCap** object (controls upgrades)
- Object IDs from `init` functions

### Test Publish (Ephemeral)

```bash
sui client test-publish
```

Tests publish + init without persisting state. Good for CI, gas estimation, init validation.

### "Your package is already published" Error

`Published.toml` already has an entry for this environment. To publish to a different network, switch environments. To update, use `sui client upgrade`.

### Finding Your UpgradeCap

1. **Published.toml**: Contains `upgrade-capability` per environment
2. **Query owned objects**: `sui client objects --type 0x2::package::UpgradeCap`
3. **Publish output**: Original publish output lists the UpradeCap ID
4. **Explorer**: SuiVision or Suiscan, filter owned objects by type

## Upgrading

```bash
sui client upgrade --upgrade-capability <CAP_ID>
```

### Upgrade Policies

| Policy | What You Can Change |
|--------|-------------------|
| **Compatible** (default) | Add functions/modules, update implementations. No removing functions or changing struct layouts |
| **Additive** | Add new modules only. Existing frozen |
| **Dependency-only** | Only update dependency versions |
| **Immutable** | Nothing. Permanent freeze |

**Restrict in the same PTB as publish**: Call `sui::package::only_additive_upgrades`, `only_dep_upgrades`, or `make_immutable` on the UpgradeCap in the publish PTB.

### Compatible Upgrade Rules

**Allowed**: Add functions, add modules, change function bodies, add structs, change private/friend signatures.

**Rejected**: Remove/rename modules or public functions, change public function signatures, remove/reorder/change struct fields, change struct abilities, remove structs.

### Type Anchoring After Upgrades

Struct types are permanently anchored to the **original** package ID. After upgrade:
- **Query objects by type**: Use ORIGINAL package ID
- **Call functions**: Use UPGRADED (latest) package ID

```ts
// Query → original ID: '0x1234...::module::MyObject'
// Call  → upgraded ID: '0x5678...::module::my_function'
```

### Multisig Publishing

```bash
# Generate unsigned transaction bytes
sui client publish --serialize-output

# Signers sign bytes individually, then combine and execute
```

## Mainnet Launch Checklist

1. **Tests**: `sui move test` — all green
2. **Dependencies**: `edition = "2024"`, no legacy format, MVR deps resolve
3. **Upgrade policy**: Decided and restriction call in publish PTB
4. **Gas estimate**: `sui client publish --dry-run` for cost estimation
5. **Signer custody**: Single signer, multisig, or immutable. UpgradeCap plan documented
6. **Final verification**: `active-env` = mainnet, balance sufficient, build clean, tested on Testnet first

## Production Monitoring

Monitor after publishing:
- Failed transactions involving your package (gRPC event streaming)
- Gas spend
- Event emission (core business telemetry)
- Object creation/deletion rates
- Admin/cap usage
- Shared object contention

## Rollback & Incident Response

**Sui packages cannot be rolled back.** Recovery means:
1. Assess scope
2. Publish fix upgrade immediately
3. Update frontends to new package ID
4. Communicate to users

If UpgradeCap compromised: restrict or publish new package + migrate users.

### Common Issues

| Error | Fix |
|-------|-----|
| "Dependency 'Sui' is a legacy system name" | Remove `Sui = { git = "..." }` from dependencies |
| "Packages with old dependencies" | Update CLI: `suiup update sui@testnet` + `suiup switch` |
| "Cannot upgrade without published id" | Need `published-at` in `Published.toml` |
| "Could not determine dependencies" | Add `[environments]` section or use `--build-env` |
| Edition mismatch | Set `edition = "2024"` |

## Rules

- Use `public(package)` visibility for non-library functions
- Structs cannot be deleted, modified, or have abilities changed through upgrades
- Objects cannot exceed 250 KB
- `edition = "2024"` — no curly-brace module syntax
- Always `--gas-budget` for CLI transactions
