import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const HARBOR_BASE = 'https://api.testnet.harbor.walrus.xyz'
const HARBOR_BUCKET = process.env.NEXT_PUBLIC_HARBOR_BUCKET_ID || ''

export function getItemImageUrl(blobId: string | null): string | null {
  if (!blobId || !HARBOR_BUCKET) return null
  return `${HARBOR_BASE}/api/v1/buckets/${HARBOR_BUCKET}/files/${blobId}/download`
}
