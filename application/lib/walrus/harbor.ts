const HARBOR_URL = process.env.WALRUS_HARBOR_URL || ''

export async function uploadBlob(data: Uint8Array): Promise<string> {
  if (!HARBOR_URL) throw new Error('WALRUS_HARBOR_URL not configured')
  const res = await fetch(`${HARBOR_URL}/v1/blobs`, {
    method: 'PUT',
    body: Buffer.from(data),
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  if (!res.ok) throw new Error(`Walrus upload failed: ${res.status}`)
  const { blobId } = await res.json()
  return blobId
}

export async function readBlob(blobId: string): Promise<Uint8Array> {
  if (!HARBOR_URL) throw new Error('WALRUS_HARBOR_URL not configured')
  const res = await fetch(`${HARBOR_URL}/v1/blobs/${blobId}`)
  if (!res.ok) throw new Error(`Walrus read failed: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}
