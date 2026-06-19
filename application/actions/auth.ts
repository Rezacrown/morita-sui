'use server'

import { db } from '@/lib/db'
import { gamedevs, publishers as publishersTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getCurrentSession(suiAddress: string) {
  if (!suiAddress) return { suiAddress: null, publishers: [], gamedevId: null }

  let gamedev = await db.query.gamedevs.findFirst({
    where: (g, { eq }) => eq(g.suiAddress, suiAddress),
  })

  if (!gamedev) {
    const [newDev] = await db.insert(gamedevs).values({ suiAddress }).returning()
    gamedev = newDev
  }

  const publishers = await db.query.publishers.findMany({
    where: (p, { eq }) => eq(p.devId, gamedev.id),
    columns: { id: true, suiPublisherId: true, name: true, isVerified: true },
  })

  return { suiAddress, publishers, gamedevId: gamedev.id }
}
