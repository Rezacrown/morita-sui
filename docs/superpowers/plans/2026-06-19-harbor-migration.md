# Migration Plan: Raw Walrus → Walrus Harbor API

> **Goal:** Ganti `lib/walrus/harbor.ts` dari raw Walrus HTTP (PUT /v1/blobs) ke Harbor REST API (bucket-based upload/download).
> **Impact:** 5 files perlu perubahan, smart contract 0 impact.

---

## Kenapa Harbor?

Harbor adalah REST API official dari Mysten yang duduk di atas Walrus:

| Sebelum (raw Walrus) | Sesudah (Harbor) |
|---------------------|------------------|
| `PUT /v1/blobs` langsung | `POST /api/v1/buckets/{id}/files` (multipart) |
| No auth | `Authorization: Bearer hbr_...` |
| 2.200 request per upload via SDK | 1 request REST per upload |
| No bucket/isolation | Bucket system + nama file |
| Gas harus bayar sendiri | **Gas disponsori Enoki** (gratis) |
| Enkripsi: none | Opsional Seal (private bucket) |

---

## File Terdampak

### 1. `lib/walrus/harbor.ts` — 🔴 Rewrite total

**Before:**
```typescript
const HARBOR_URL = process.env.WALRUS_HARBOR_URL || ''
export async function uploadBlob(data: Uint8Array): Promise<string> {
  const res = await fetch(`${HARBOR_URL}/v1/blobs`, {
    method: 'PUT', body: Buffer.from(data),
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  const { blobId } = await res.json()
  return blobId
}
export async function readBlob(blobId: string): Promise<Uint8Array> { ... }
```

**After:**
```typescript
export async function uploadFile(
  fileName: string,
  data: Uint8Array,
  contentType: string = 'application/octet-stream',
): Promise<{ fileId: string; bucketId: string }> {
  const form = new FormData()
  form.append('file', new Blob([data], { type: contentType }), fileName)
  const res = await fetch(`${BASE}/buckets/${BUCKET_ID}/files`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: form,
  })
  const { data: { id: fileId } } = await res.json()
  return { fileId, bucketId: BUCKET_ID }
}

export function getFileUrl(bucketId: string, fileId: string): string {
  return `${BASE}/buckets/${bucketId}/files/${fileId}/download`
}
```

2 fungsi: `uploadFile` (upload image ke Harbor bucket) + `getFileUrl` (construct download URL untuk display).

---

### 2. `.env.local` — 🟡 Ganti + tambah 2 var

```
- WALRUS_HARBOR_URL=https://aggregator.walrus-testnet.walrus.space
+ WALRUS_HARBOR_URL=https://api.testnet.harbor.walrus.xyz
+ WALRUS_HARBOR_API_KEY=hbr_...
+ WALRUS_HARBOR_BUCKET_ID=...           # 1 bucket untuk semua item Morita
```

Pakai **public bucket** (bukan private) buat MVP — no Seal encrypt/decrypt overhead.

---

### 3. `lib/db/schema.ts` — 🟡 item_templates perlu 1 kolom baru

**Sekarang:** `imageBlobId` dan `metadataBlobId` isinya Walrus blob_id.

Secara logika `imageBlobId` sekarang perlu nyimpen **file ID dari Harbor**, bukan blob_id Walrus. Tapi kita **tidak rename kolom** — isi aja dengan format composite:
```
harbor:{fileId}
```

Atau alternatif yang lebih bersih: nambah kolom `harbor_file_id` dan `harbor_bucket_id` di `item_templates`, sementara `image_blob_id` tetap sebagai string generic yang diteruskan ke on-chain.

**Keputusan: Kolom `image_blob_id` tetap dipakai.** Isinya adalah `fileId` dari Harbor. On-chain gak peduli format. Tabel tidak perlu diubah.

**Zero migration needed.** √

---

### 4. `components/` — 🟡 Helper `getFileUrl` + update 2 komponen

Sekarang di `item-card.tsx:17` dan `item-detail.tsx:15`:
```tsx
<img src={item.imageUrl} ... />
```

Nanti image URL dibangun dari Harbor download endpoint. Dua perubahan:
- Bikin helper `getFileUrl(fileId)` di `lib/walrus/harbor.ts`
- Ganti sumber data: dari `item.imageUrl` (string URL penuh) jadi `item.imageBlobId + helper`. Atau bikin fungsi mapping di mock data & data fetching layer.

**Cara paling bersih:** bikin 1 fungsi `getItemImageUrl(itemBlobId, defaultUrl?)` di utils. Semua komponen panggil fungsi itu.

---

### 5. `lib/mock-data.ts` — 🟢 Mock data

Nilai `imageUrl: null` di semua mock item diganti jadi harbor-style URL:
```
https://api.testnet.harbor.walrus.xyz/api/v1/buckets/{BUCKET_ID}/files/{fileId}/download
```

Atau cukup isi `blobId` dengan mock file_id dan generate URL via helper.

---

## Yang TIDAK Berubah

| Component | Alasan |
|-----------|--------|
| `actions/*.ts` | Server actions Cuma baca `blobId` → lempar ke PTB. Harbor di-call di publish flow, bukan di action logic |
| `ptb-builder.ts` | `blobId` tetap string ke on-chain. Move gak peduli format |
| `lib/db/schema.ts` | Kolom tetap `image_blob_id`, isi sekarang harbor file_id |
| `Smart contracts` | `blob_id: String` — zero impact (lihat sub-bab di bawah) |
| `app/api/[[...route]]/route.ts` | Hono API gak nyentuh Walrus/Harbor |

---

## Impact on Smart Contract — ✅ Nihil

```
module morita::item;

public struct GameItem has key, store {
    id: UID,
    game_id: ID,
    item_id: u64,
    item_type: String,
    rarity: String,
    blob_id: String,       // ← MASIH string, gak peduli format
    supply: Option<u64>,
}
```

Move hanya lihat `blob_id` sebagai `String`. Mau isinya:
- `"bafkreiabc123"` (Walrus CID)
- `"harbor:file_xyz"` (Harbor file ID)
- `"https://example.com/img.png"` (URL biasa)

**Compiler dan runtime Move tidak peduli.** Fungsi `mint()`:
```move
public fun mint(..., blob_id: String, ...): GameItem {
    let item = GameItem { blob_id, ... };  // ← disimpan apa adanya
    ...
}
```

**Tidak perlu re-deploy kontrak.** Tidak perlu ubah source code.

---

## Urutan Eksekusi (4 langkah, ~20 menit)

| Step | File | Tindakan |
|------|------|----------|
| 1 | `.env.local` | Ganti `WALRUS_HARBOR_URL`, tambah `_API_KEY` + `_BUCKET_ID` |
| 2 | `lib/walrus/harbor.ts` | Rubah dari raw Walrus ke Harbor REST API (uploadFile, getFileUrl) |
| 3 | `lib/utils.ts` | Tambah `getItemImageUrl(blobId)` helper |
| 4 | `lib/mock-data.ts` | Update mock items supaya punya imageUrl real |

> Step 2-4 bisa di-batch dalam 1 commit.
