'use server'

import { db } from '@/lib/db'
import { gamedevs, publishers as publishersTable, games } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const ADMIN_ADDRESS = process.env.ADMIN_SUI_ADDRESS

export async function verifyPublisher(publisherId: number, callerAddress: string) {
  if (callerAddress !== ADMIN_ADDRESS) throw new Error('UNAUTHORIZED')

  const [updated] = await db.update(publishersTable)
    .set({ isVerified: true })
    .where(eq(publishersTable.id, publisherId))
    .returning()

  revalidatePath(`/dashboard/${publisherId}`)
  return { verified: true }
}

export async function pauseGame(gameId: number, callerAddress: string) {
  if (callerAddress !== ADMIN_ADDRESS) throw new Error('UNAUTHORIZED')

  const [updated] = await db.update(games)
    .set({ status: 'paused' })
    .where(eq(games.id, gameId))
    .returning()

  revalidatePath(`/dashboard/*/games/${gameId}`)
  return { success: true }
}

export async function resumeGame(gameId: number, callerAddress: string) {
  if (callerAddress !== ADMIN_ADDRESS) throw new Error('UNAUTHORIZED')

  const [updated] = await db.update(games)
    .set({ status: 'published' })
    .where(eq(games.id, gameId))
    .returning()

  revalidatePath(`/dashboard/*/games/${gameId}`)
  return { success: true }
}
