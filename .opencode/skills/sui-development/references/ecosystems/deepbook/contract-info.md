# DeepBookV3 Contract Information

## Current Version

| Parameter | Value |
|-----------|-------|
| Version | 6 (Jan 7, 2026) |
| Package ID | `0x337f4f4f6567fcd778d5454f27c16c70e2f274cc6377ea6249ddf491482ef497` |
| Registry ID | `0xaf16199a2dff736e9f07a845f23c5da6df6f756eddb631aed9d24a93efc4549d` |

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| v6 | Jan 7, 2026 | Final preparation for margin launch |
| v5 | Dec 18, 2025 | Referral system improvements |
| v4 | Dec 9, 2025 | Referral system, penalty taker fees |
| v3 | Jun 11, 2025 | Bug fix: create balance manager |
| v2 | Apr 16, 2025 | Input token fees, permissionless pools, gas improvements |
| v1 | Oct 10, 2024 | Original deployment |

Upgradeable contracts: only DEEPBOOK_PACKAGE_ID needs updating after upgrades. Previous versions remain compatible unless noted.

## Supported Coins

| Asset | Type | Decimals |
|-------|------|----------|
| DEEP | `0xdeeb7a...::deep::DEEP` | 6 |
| SUI | `0x2::sui::SUI` | 9 |
| Native USDC | `0xdba346...::usdc::USDC` | 6 |
| BETH | `0xd0e89b...::eth::ETH` | 8 |
| WUSDC | `0x5d4b30...::coin::COIN` | 6 |
| WUSDT | `0xc06000...::coin::COIN` | 6 |
| NS | `0x514549...::ns::NS` | 6 |
| TYPUS | `0xf82dc0...::typus::TYPUS` | 9 |
| AUSD | `0x2053d0...::ausd::AUSD` | 6 |
| DRF | `0x294de7...::drf::DRF` | 6 |
| SEND | `0xb45fcf...::send::SEND` | 6 |
| xBTC | `0x876a4b...::xbtc::XBTC` | 8 |
| IKA | `0x7262fb...::ika::IKA` | 9 |
| ALKIMI | `0x1a8f4b...::alkimi::ALKIMI` | 9 |
| LZWBTC | `0x0041f9...::wbtc::WBTC` | 8 |
| SUIUSDE | `0x41d587...::sui_usde::SUI_USDE` | 6 |
| USDSUI | `0x44f838...::usdsui::USDSUI` | 6 |
| WAL | `0x356a26...::wal::WAL` | 9 |

## Key Pools

| Pool | Taker Fee | Maker Fee |
|------|-----------|-----------|
| DEEP/SUI | 0 bps | 0 bps |
| DEEP/USDC | 0 bps | 0 bps |
| SUI/USDC | 1 bps | 0 bps |
| BETH/USDC | 10 bps | 5 bps |
| WUSDC/USDC | 0 bps | 0 bps |
| WUSDT/USDC | 1 bps | 0.5 bps |
| AUSD/USDC | 1 bps | 0.5 bps |
| WAL/USDC | 10 bps | 5 bps |

Fees are subject to change based on governance proposals. See Staking & Governance for details.
