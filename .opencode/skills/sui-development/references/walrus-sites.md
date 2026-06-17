# Walrus Sites — Decentralized Website Hosting

Walrus Sites lets you deploy a static website (HTML/CSS/JS) to Walrus, with an on-chain Sui object tracking the site's resources. A portal server resolves site subdomains and serves them over HTTP.

> Source constraint: Information sourced from [MystenLabs/walrus-sites](https://github.com/MystenLabs/walrus-sites) and [Walrus Sites docs](https://docs.wal.app/docs/sites).

## Key Concepts

- **Site object**: A Sui object of type `site::Site` holding metadata (name, description) and dynamic fields mapping resource paths to Walrus blob references. Owned by the publisher's address.
- **Resources**: Each file in the deployed directory becomes a Walrus resource. Small files may be batched into a single "quilt" blob.
- **Portal**: A server mapping `<base36-site-id>.localhost:3000` URLs to on-chain site objects. Reads dynamic fields, fetches blobs, returns HTTP responses.
- **`ws-resources.json`**: Config file controlling resource headers, routing, and site metadata. Auto-generated on first publish. Tracks site object ID for updates.
- **Blob expiration**: Walrus blobs have finite storage duration in epochs. Expired blobs return 404.

## Publishing a Site

### First Publish

```bash
# Build your frontend
npm run build

# Install site-builder (one time)
suiup install site-builder
suiup switch site-builder@testnet

# Publish to Walrus Sites
site-builder publish dist/ --epochs 30
```

For mainnet:

```bash
site-builder publish dist/ --epochs 100 --network mainnet
```

### Update an Existing Site

```bash
# Rebuild and update
npm run build
site-builder update dist/
```

The site-builder reads `ws-resources.json` to find the existing site object ID.

### Check Site Resources (Sitemap)

```bash
site-builder sitemap <SITE_OBJECT_ID>
```

Shows all resources, their paths, and blob expiration dates.

### Destroy a Site

```bash
site-builder destroy <SITE_OBJECT_ID>
```

## ws-resources.json

Auto-generated on first publish. Contains:

```json
{
    "site": {
        "name": "My dApp",
        "description": "A Sui dApp"
    },
    "routes": {
        "/*": "/index.html"
    },
    "resources": {
        "/index.html": { "content_type": "text/html" },
        "/assets/main.js": { "content_type": "application/javascript" }
    }
}
```

### SPA Routing

For React/Vue/Svelte SPAs with client-side routing, configure a catch-all route:

```json
{
    "routes": {
        "/*": "/index.html"
    }
}
```

Without this, direct navigation to `/my-route` returns 404.

### Resource Headers

```json
{
    "resources": {
        "/image.png": {
            "content_type": "image/png",
            "headers": { "Cache-Control": "max-age=3600" }
        }
    }
}
```

## Local Portal (Testnet)

`wal.app` is mainnet only. For testnet, self-host:

```bash
git clone https://github.com/MystenLabs/walrus-sites.git
cd walrus-sites/portal
bun install
```

### Configure Portal

Copy and edit the portal config:

```bash
cp portal-config.example.yaml portal-config.yaml
```

Do NOT change `original_package_id` — it must match the Walrus Sites framework package (`site::Site`), not your app's Move package.

### Start Portal

```bash
bun run start
```

### Access Testnet Site

```
http://<base36-site-object-id>.localhost:3000
```

### Port Conflicts

If port 3000 is in use (Vite, Next.js), kill the conflicting process first or configure a different port.

## Common Failures

1. **Blobs expire silently.** Sites published with too few `--epochs` (like 5) die within days. Always use `--epochs 30+` for testnet.
2. **Portal `original_package_id` mismatch.** If wrong, portal can't find the site object type. Use the default example value.
3. **Testnet sites can't use `wal.app`.** `wal.app` only serves mainnet. Self-host portal for testnet.
4. **SPA routing 404s.** Direct navigation returns 404 without fallback routing in `ws-resources.json`.
5. **Forgetting to build.** `site-builder publish dist/` publishes whatever's in dist/. Run `npm run build` first.
6. **Port 3000 taken.** Kill Vite/Next.js dev server before starting portal.

## Rules

1. Always use `--epochs 30+` for testnet deploys
2. Build frontend before publishing (`npm run build`)
3. Don't change portal's `original_package_id` unless Walrus Sites framework upgraded
4. `wal.app` is mainnet only — self-host portal for testnet
5. Check `ws-resources.json` after first publish — records site object ID
6. Keep `ws-resources.json` in version control
7. For SPA: configure fallback routing in `ws-resources.json`
