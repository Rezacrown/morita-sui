import { db } from '@/lib/db'
import { userKiosks, kioskListings } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function getOrCreateKioskRecord(suiAddress: string, kioskId: string, kioskOwnerCapId: string) {
  const existing = await db.query.userKiosks.findFirst({ where: (k, { eq }) => eq(k.suiAddress, suiAddress) })
  if (existing) return existing
  const [row] = await db.insert(userKiosks).values({ suiAddress, kioskId, kioskOwnerCapId }).returning()
  return row
}

export async function getKioskByAddress(suiAddress: string) {
  return db.query.userKiosks.findFirst({ where: (k, { eq }) => eq(k.suiAddress, suiAddress) })
}

export async function createListingRecord(data: {
  itemObjectId: string
  sellerAddress: string
  kioskId: string
  price: string
  itemName: string
  itemType: string
  rarity: string
  gameName: string
}) {
  const [row] = await db.insert(kioskListings).values(data).returning()
  return row
}

export async function deactivateListing(itemObjectId: string) {
  const [row] = await db.update(kioskListings)
    .set({ isActive: false })
    .where(eq(kioskListings.itemObjectId, itemObjectId))
    .returning()
  return row
}

export async function getActiveListings() {
  return db.query.kioskListings.findMany({
    where: (l, { eq }) => eq(l.isActive, true),
    orderBy: (l, { desc }) => [desc(l.createdAt)],
  })
}
