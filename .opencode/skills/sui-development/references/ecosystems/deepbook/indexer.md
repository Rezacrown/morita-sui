# DeepBookV3 Indexer

The DeepBookV3 Indexer provides streamlined, real-time access to order book and trading data via REST API.

## Public Endpoints

- **Mainnet:** `https://deepbook-indexer.mainnet.mystenlabs.com/`
- **Testnet:** `https://deepbook-indexer.testnet.mystenlabs.com/`

## Asset Conversion Scalars

Volumes are in smallest units. Divide by `10^SCALAR` for standard units.

| Asset | Scalar | Asset | Scalar |
|-------|--------|-------|--------|
| SUI | 9 | DEEP | 6 |
| Native USDC | 6 | WUSDC | 6 |
| WUSDT | 6 | BETH | 8 |
| NS | 6 | TYPUS | 9 |
| AUSD | 6 | DRF | 6 |
| SEND | 6 | xBTC | 8 |
| WAL | 9 | IKA | 9 |
| ALKIMI | 9 | LZWBTC | 8 |
| SUIUSDE | 6 | USDSUI | 6 |

## API Endpoints

### GET /get_pools
Returns all pools with metadata (pool_id, pool_name, base/quote asset details, min_size, lot_size, tick_size).

### GET /historical_volume/:pool_names
Volume for specific pools in time range. Query: `?start_time=<unix_seconds>&end_time=<unix_seconds>&volume_in_base=<bool>`
Default: last 24h in quote asset.

### GET /all_historical_volume
Volume for all pools. Same query params as above.

### GET /historical_volume_by_balance_manager_id/:pool_names/:balance_manager_id
Per-user volume: returns `[maker_volume, taker_volume]` per pool.

### GET /historical_volume_by_balance_manager_id_with_interval
Same but with time intervals. Query: `?interval=<seconds>`. Returns time-bucketed data.

### GET /summary
All trading pairs with: last_price, lowest_price_24h, highest_bid, base_volume, price_change_percent_24h, quote_volume, lowest_ask, highest_price_24h.

### GET /ticker
Volumes (scaled), last_price, and isFrozen (0=active, 1=inactive) per trading pair.

### GET /trades/:pool_name
Recent trades. Query: `?limit=<int>&start_time=&end_time=&maker_balance_manager_id=&taker_balance_manager_id=`
Fields: event_digest, trade_id, maker/taker order IDs, price, base_volume, quote_volume, timestamp (ms), type (buy/sell), taker_is_bid, fees, fee currency.

### GET /order_updates/:pool_name
Placed/canceled orders. Query: `?limit=&start_time=&end_time=&status=<Placed|Canceled>&balance_manager_id=`
Fields: order_id, balance_manager_id, timestamp, original/filled/remaining quantities, price, status, type.

### GET /orderbook/:pool_name
Bids and asks sorted best to worst. Query: `?level=<1|2>&depth=<int>`
- level=1: best bid/ask only. level=2 (default): ordered by price
- depth=0: full book. depth=N: N/2 bids + N/2 asks

### GET /assets
All traded coins metadata: unified_cryptoasset_id, name, contractAddress, can_deposit, can_withdraw.

### GET /orders/:pool_name/:balance_manager_id
Orders for specific balance manager. Query: `?limit=&status=<Placed,Canceled,Filled>`
Includes: order_id, type, current_status, price, placed_at, last_updated_at, quantities.

### GET /trade_count
Total trades across all pools. Query: `?start_time=&end_time=`

### GET /ohclv/:pool_name
OHLCV candlestick data. Query: `?interval=<1m|5m|15m|30m|1h|4h|1d|1w>&start_time=&end_time=&limit=`
Returns: `{ candles: [[timestamp, open, high, low, close, volume], ...] }`

### GET /get_net_deposits/:asset_ids/:timestamp
Net deposits (deposits - withdrawals) up to given timestamp.

### GET /deep_supply
Total DEEP token supply.

### GET /deposited_assets/:balance_manager_ids
List of assets deposited per balance manager.

### GET /status
Indexer health. Query: `?max_checkpoint_lag=<int>&max_time_lag_seconds=<int>`
Returns: status (OK/UNHEALTHY), per-pipeline checkpoint lag and time lag.

### GET /get_points
Trading points accumulated. Query: `?addresses=<addr1>,<addr2>,...`

### GET /margin_supply
Total supply balance per margin pool asset.

### GET /pool_created
Pool creation events with full metadata.

### GET /book_params_updated
Book parameter update events. Query: `?pool_id=<id>`

### GET /portfolio/:wallet_address
Comprehensive portfolio: margin_positions (with USD values and risk ratios), collateral_balances, lp_positions, summary (total_equity_usd, total_debt_usd, net_value_usd).

### GET /referral_fee_events
Referral fee tracking events. Query: `?pool_id=&referral_id=`
