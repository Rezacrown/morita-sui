'use server'

import { db } from '@/lib/db'
import { gamedevs, publishers as publishersTable, games } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export async function getMyPublishers(suiAddress: string) {
  const gamedev = await db.query.gamedevs.findFirst({
    where: (g, { eq }) => eq(g.suiAddress, suiAddress),
  })
  if (!gamedev) return []
  return db.query.publishers.findMany({
    where: (p, { eq }) => eq(p.devId, gamedev.id),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}

export async function getPublisherDetail(publisherId: number) {
  const publisher = await db.query.publishers.findFirst({
    where: (p, { eq }) => eq(p.id, publisherId),
  })
  if (!publisher) return null
  const [result] = await db.select({ value: count() }).from(games)
    .where(eq(games.publisherId, publisherId))
  return { ...publisher, gameCount: result?.value || 0 }
}

export async function savePublisherOnChain(
  suiAddress: string,
  name: string,
  suiPublisherId: string,
  logoUrl?: string,
) {
  let gamedev = await db.query.gamedevs.findFirst({
    where: (g, { eq }) => eq(g.suiAddress, suiAddress),
  })
  if (!gamedev) {
    const [dev] = await db.insert(gamedevs).values({ suiAddress }).returning()
    gamedev = dev
  }
  const [pub] = await db.insert(publishersTable).values({
    suiPublisherId,
    devId: gamedev.id,
    name,
    logoUrl: logoUrl || null,
  }).returning()
  return pub
}
