import { z } from "zod";

export const itemDraftSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  itemType: z.string().min(1, "Type is required").max(50),
  rarity: z.string().min(1, "Rarity is required").max(50),
  description: z.string().max(500).optional(),
  supply: z.number().int().min(1).default(1),
  isNft: z.boolean().default(true),
  attributes: z.record(z.string(), z.string()).optional(),
});

export type ItemDraftInput = z.infer<typeof itemDraftSchema>;

export const gameDraftSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  genre: z.string().max(100).optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type GameDraftInput = z.infer<typeof gameDraftSchema>;

export const publisherSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type PublisherInput = z.infer<typeof publisherSchema>;

export const listingSchema = z.object({
  price: z.number().positive("Price must be positive"),
  royaltyBps: z.number().int().min(0).max(10000).optional(),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const escrowConditionsSchema = z.object({
  itemTypeAccept: z.string().optional(),
  rarityAccept: z.string().optional(),
  gameIdAccept: z.number().optional(),
});

export type EscrowConditionsInput = z.infer<typeof escrowConditionsSchema>;
