import { db } from '@/lib/db'
import { gamedevs, publishers as pubs, games, itemTemplates } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export async function getOrCreateDev(suiAddress: string) {
  let dev = await db.query.gamedevs.findFirst({
    where: (g, { eq }) => eq(g.suiAddress, suiAddress),
  })
  if (!dev) {
    [dev] = await db.insert(gamedevs).values({ suiAddress }).returning()
  }
  return dev
}

export async function getMyPublishers(devId: number) {
  return db.query.publishers.findMany({
    where: (p, { eq }) => eq(p.devId, devId),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}

export async function getPublisherDetail(pubId: number) {
  const pub = await db.query.publishers.findFirst({ where: (p, { eq }) => eq(p.id, pubId) })
  if (!pub) return null
  const [result] = await db.select({ value: count() }).from(games)
    .where(eq(games.publisherId, pubId))
  return { ...pub, gameCount: result?.value || 0 }
}

export async function createPublisherRecord(devId: number, suiPublisherId: string, name: string, logoUrl?: string) {
  const [pub] = await db.insert(pubs).values({ suiPublisherId, devId, name, logoUrl: logoUrl || null }).returning()
  return pub
}
