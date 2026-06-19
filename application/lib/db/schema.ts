import {
  pgTable, serial, integer, varchar, text, boolean, timestamp, jsonb, uniqueIndex, index
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── gamedevs ──
export const gamedevs = pgTable('gamedevs', {
  id: serial('id').primaryKey(),
  suiAddress: varchar('sui_address', { length: 200 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  suiAddressIdx: uniqueIndex('gamedevs_sui_address_idx').on(t.suiAddress),
}))

export const gamedevsRelations = relations(gamedevs, ({ many }) => ({
  publishers: many(publishers),
}))

// ── publishers ──
export const publishers = pgTable('publishers', {
  id: serial('id').primaryKey(),
  suiPublisherId: varchar('sui_publisher_id', { length: 200 }).unique().notNull(),
  devId: integer('dev_id').notNull().references(() => gamedevs.id),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  suiPublisherIdIdx: uniqueIndex('publishers_sui_publisher_id_idx').on(t.suiPublisherId),
  devIdIdx: index('publishers_dev_id_idx').on(t.devId),
}))

export const publishersRelations = relations(publishers, ({ one, many }) => ({
  gamedev: one(gamedevs, { fields: [publishers.devId], references: [gamedevs.id] }),
  games: many(games),
}))

// ── games ──
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  suiGameId: varchar('sui_game_id', { length: 200 }).unique(),
  publisherId: integer('publisher_id').notNull().references(() => publishers.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  genre: varchar('genre', { length: 100 }),
  websiteUrl: varchar('website_url', { length: 500 }),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  gameCapabilityId: varchar('game_capability_id', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  suiGameIdIdx: uniqueIndex('games_sui_game_id_idx').on(t.suiGameId),
  publisherIdIdx: index('games_publisher_id_idx').on(t.publisherId),
  statusIdx: index('games_status_idx').on(t.status),
}))

export const gamesRelations = relations(games, ({ one, many }) => ({
  publisher: one(publishers, { fields: [games.publisherId], references: [publishers.id] }),
  itemTemplates: many(itemTemplates),
  apiKeys: many(apiKeys),
  claimCodes: many(claimCodes),
}))

// ── user_kiosks ──
export const userKiosks = pgTable('user_kiosks', {
  id: serial('id').primaryKey(),
  suiAddress: varchar('sui_address', { length: 200 }).unique().notNull(),
  kioskId: varchar('kiosk_id', { length: 200 }).unique().notNull(),
  kioskOwnerCapId: varchar('kiosk_owner_cap_id', { length: 200 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  suiAddressIdx: uniqueIndex('user_kiosks_sui_address_idx').on(t.suiAddress),
  kioskIdIdx: uniqueIndex('user_kiosks_kiosk_id_idx').on(t.kioskId),
}))

// ── api_keys ──
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id),
  keyHash: varchar('key_hash', { length: 255 }).unique().notNull(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  keyHashIdx: uniqueIndex('api_keys_key_hash_idx').on(t.keyHash),
  gameIdIdx: index('api_keys_game_id_idx').on(t.gameId),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  game: one(games, { fields: [apiKeys.gameId], references: [games.id] }),
}))

// ── item_templates ──
export const itemTemplates = pgTable('item_templates', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id),
  suiItemId: varchar('sui_item_id', { length: 200 }),
  name: varchar('name', { length: 255 }).notNull(),
  itemType: varchar('item_type', { length: 100 }).notNull(),
  rarity: varchar('rarity', { length: 100 }).notNull(),
  description: text('description'),
  imageBlobId: varchar('image_blob_id', { length: 200 }),
  metadataBlobId: varchar('metadata_blob_id', { length: 200 }),
  supply: integer('supply').default(1).notNull(),
  isNft: boolean('is_nft').default(true).notNull(),
  attributes: jsonb('attributes').$type<Record<string, string>>(),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  gameIdIdx: index('item_templates_game_id_idx').on(t.gameId),
  statusIdx: index('item_templates_status_idx').on(t.status),
}))

export const itemTemplatesRelations = relations(itemTemplates, ({ one, many }) => ({
  game: one(games, { fields: [itemTemplates.gameId], references: [games.id] }),
  claimCodes: many(claimCodes),
}))

// ── claim_codes ──
export const claimCodes = pgTable('claim_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  gameId: integer('game_id').notNull().references(() => games.id),
  itemTemplateId: integer('item_template_id').notNull().references(() => itemTemplates.id),
  recipientIdentifier: varchar('recipient_identifier', { length: 255 }),
  expiresAt: timestamp('expires_at').notNull(),
  claimedAt: timestamp('claimed_at'),
  claimedBy: varchar('claimed_by', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  codeIdx: uniqueIndex('claim_codes_code_idx').on(t.code),
  expiresAtIdx: index('claim_codes_expires_at_idx').on(t.expiresAt),
}))

export const claimCodesRelations = relations(claimCodes, ({ one }) => ({
  game: one(games, { fields: [claimCodes.gameId], references: [games.id] }),
  itemTemplate: one(itemTemplates, { fields: [claimCodes.itemTemplateId], references: [itemTemplates.id] }),
}))

// ── escrow_index ──
export const escrowIndex = pgTable('escrow_index', {
  id: serial('id').primaryKey(),
  escrowId: varchar('escrow_id', { length: 200 }).unique().notNull(),
  initiatorAddress: varchar('initiator_address', { length: 200 }).notNull(),
  offerGameId: integer('offer_game_id').references(() => games.id),
  offerItemBlobId: varchar('offer_item_blob_id', { length: 200 }),
  conditionsJson: jsonb('conditions_json').notNull().$type<{
    item_id_target?: number | null
    game_id_accept?: string | null
    item_type_accept?: string | null
    rarity_accept?: string | null
  }>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  fulfilledAt: timestamp('fulfilled_at'),
  cancelledAt: timestamp('cancelled_at'),
}, (t) => ({
  escrowIdIdx: uniqueIndex('escrow_index_escrow_id_idx').on(t.escrowId),
  isActiveIdx: index('escrow_index_is_active_idx').on(t.isActive),
}))

export const escrowIndexRelations = relations(escrowIndex, ({ one }) => ({
  game: one(games, { fields: [escrowIndex.offerGameId], references: [games.id] }),
}))

// ── item_cache ──
export const itemCache = pgTable('item_cache', {
  id: serial('id').primaryKey(),
  blobId: varchar('blob_id', { length: 200 }).unique().notNull(),
  gameId: integer('game_id').notNull().references(() => games.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  imageBlobId: varchar('image_blob_id', { length: 200 }).notNull(),
  tags: jsonb('tags').$type<string[]>(),
  attributes: jsonb('attributes').$type<Record<string, string>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  blobIdIdx: uniqueIndex('item_cache_blob_id_idx').on(t.blobId),
  gameIdIdx: index('item_cache_game_id_idx').on(t.gameId),
}))

export const itemCacheRelations = relations(itemCache, ({ one }) => ({
  game: one(games, { fields: [itemCache.gameId], references: [games.id] }),
}))

// ── tx_events ──
export const txEvents = pgTable('tx_events', {
  id: serial('id').primaryKey(),
  txHash: varchar('tx_hash', { length: 200 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  gameId: integer('game_id').references(() => games.id),
  fromAddress: varchar('from_address', { length: 200 }),
  toAddress: varchar('to_address', { length: 200 }),
  itemBlobId: varchar('item_blob_id', { length: 200 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  eventTypeIdx: index('tx_events_event_type_idx').on(t.eventType),
  gameIdIdx: index('tx_events_game_id_idx').on(t.gameId),
  fromAddressIdx: index('tx_events_from_address_idx').on(t.fromAddress),
  toAddressIdx: index('tx_events_to_address_idx').on(t.toAddress),
  createdAtIdx: index('tx_events_created_at_idx').on(t.createdAt),
}))

export const txEventsRelations = relations(txEvents, ({ one }) => ({
  game: one(games, { fields: [txEvents.gameId], references: [games.id] }),
}))
