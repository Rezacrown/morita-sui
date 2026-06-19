import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { db } from '@/lib/db'
import { games, itemTemplates, claimCodes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

const app = new Hono()

async function validateApiKey(gameId: number, bearer: string) {
  const hash = crypto.createHash('sha256').update(bearer).digest('hex')
  const key = await db.query.apiKeys.findFirst({
    where: (k, { eq, and: _and }) => _and(
      eq(k.gameId, gameId),
      eq(k.keyHash, hash),
      eq(k.isActive, true),
    ),
  })
  if (key) {
    const { apiKeys } = await import('@/lib/db/schema')
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id))
  }
  return !!key
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

app.post('/api/v1/game/:gameId/item/mint', async (c) => {
  const gameId = Number(c.req.param('gameId'))
  const auth = c.req.header('Authorization') || ''
  const bearer = auth.replace('Bearer ', '')

  const valid = await validateApiKey(gameId, bearer)
  if (!valid) return c.json({ error: 'UNAUTHORIZED' }, 401)

  const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) })
  if (!game || game.status !== 'published') return c.json({ error: 'GAME_INACTIVE' }, 403)

  const body = await c.req.json<{ item_template_id: number; recipient_identifier?: string }>()
  const template = await db.query.itemTemplates.findFirst({
    where: (t, { eq }) => eq(t.id, body.item_template_id),
  })
  if (!template || template.status !== 'published') return c.json({ error: 'TEMPLATE_NOT_FOUND' }, 404)

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.insert(claimCodes).values({
    code,
    gameId,
    itemTemplateId: template.id,
    recipientIdentifier: body.recipient_identifier || null,
    expiresAt,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return c.json({
    success: true,
    claim_url: `${baseUrl}/claim?code=${code}`,
    expires_at: expiresAt.toISOString(),
  })
})

app.post('/api/v1/game/:gameId/item/burn', async (c) => {
  const gameId = Number(c.req.param('gameId'))
  const auth = c.req.header('Authorization') || ''
  const bearer = auth.replace('Bearer ', '')

  const valid = await validateApiKey(gameId, bearer)
  if (!valid) return c.json({ error: 'UNAUTHORIZED' }, 401)

  const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) })
  if (!game || game.status !== 'published') return c.json({ error: 'GAME_INACTIVE' }, 403)

  return c.json({ success: true, tx_digest: '' })
})

app.get('/api/v1/game/:gameId/inventory/:address', async (c) => {
  const gameId = Number(c.req.param('gameId'))
  const auth = c.req.header('Authorization') || ''
  const bearer = auth.replace('Bearer ', '')

  const valid = await validateApiKey(gameId, bearer)
  if (!valid) return c.json({ error: 'UNAUTHORIZED' }, 401)

  return c.json({ items: [], total: 0 })
})

app.get('/api/v1/game/:gameId/item/:itemId', async (c) => {
  const gameId = Number(c.req.param('gameId'))
  const auth = c.req.header('Authorization') || ''
  const bearer = auth.replace('Bearer ', '')

  const valid = await validateApiKey(gameId, bearer)
  if (!valid) return c.json({ error: 'UNAUTHORIZED' }, 401)

  return c.json({ item: null })
})

export const GET = handle(app)
export const POST = handle(app)
