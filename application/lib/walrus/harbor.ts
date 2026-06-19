const BASE = process.env.WALRUS_HARBOR_URL || 'https://api.testnet.harbor.walrus.xyz'
const API_KEY = process.env.WALRUS_HARBOR_API_KEY || ''
const BUCKET_ID = process.env.WALRUS_HARBOR_BUCKET_ID || ''

export async function uploadFile(
  fileName: string,
  data: Blob,
): Promise<{ fileId: string; bucketId: string }> {
  if (!API_KEY) throw new Error('WALRUS_HARBOR_API_KEY not configured')
  if (!BUCKET_ID) throw new Error('WALRUS_HARBOR_BUCKET_ID not configured')

  const form = new FormData()
  form.append('file', data, fileName)

  const res = await fetch(`${BASE}/api/v1/buckets/${BUCKET_ID}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Harbor upload failed (${res.status}): ${err}`)
  }
  const json = await res.json()
  return { fileId: json.data?.id || json.id, bucketId: BUCKET_ID }
}

export function getFileUrl(bucketId: string, fileId: string): string {
  return `${BASE}/api/v1/buckets/${bucketId}/files/${fileId}/download`
}

export function getItemImageUrl(blobId: string | null): string | null {
  if (!blobId || !BUCKET_ID) return null
  return `${BASE}/api/v1/buckets/${BUCKET_ID}/files/${blobId}/download`
}
