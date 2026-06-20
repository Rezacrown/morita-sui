import { db } from "@/lib/db";
import { games, apiKeys, itemTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function genKey() {
  const raw = `morita_sk_${crypto.randomBytes(32).toString("hex")}`;
  return {
    raw,
    prefix: raw.slice(0, 16) + "...",
    hash: crypto.createHash("sha256").update(raw).digest("hex"),
  };
}

export async function createGame(
  pubId: number,
  data: {
    name: string;
    description?: string;
    genre?: string;
    websiteUrl?: string;
  },
) {
  const [g] = await db
    .insert(games)
    .values({
      publisherId: pubId,
      ...data,
      description: data.description || null,
      genre: data.genre || null,
      websiteUrl: data.websiteUrl || null,
    })
    .returning();
  revalidatePath(`/dashboard/${pubId}/games`);
  return g;
}

export async function updateGame(
  gameId: number,
  data: Record<string, string | undefined>,
) {
  const g = await db.query.games.findFirst({
    where: (g, { eq }) => eq(g.id, gameId),
  });
  if (!g || g.status !== "draft") throw new Error("Not found or published");
  const [updated] = await db
    .update(games)
    .set(data)
    .where(eq(games.id, gameId))
    .returning();
  return updated;
}

export async function deleteGame(gameId: number) {
  const g = await db.query.games.findFirst({
    where: (g, { eq }) => eq(g.id, gameId),
  });
  if (!g || g.status !== "draft") throw new Error("Not found or published");
  await db.delete(games).where(eq(games.id, gameId));
}

export async function listGames(pubId: number) {
  return db.query.games.findMany({
    where: (g, { eq }) => eq(g.publisherId, pubId),
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  });
}

export async function getGame(gameId: number) {
  const g = await db.query.games.findFirst({
    where: (g, { eq }) => eq(g.id, gameId),
  });
  if (!g) return null;
  const items = await db.query.itemTemplates.findMany({
    where: (t, { eq }) => eq(t.gameId, gameId),
  });
  return {
    ...g,
    totalItems: items.length,
    publishedItems: items.filter((i) => i.status === "published").length,
  };
}

export async function finalizePublish(
  gameId: number,
  suiGameId: string,
  capId: string,
) {
  const g = await db.query.games.findFirst({
    where: (g, { eq }) => eq(g.id, gameId),
  });
  if (!g || g.status !== "draft") throw new Error("Not found or published");
  const [updated] = await db
    .update(games)
    .set({ suiGameId, gameCapabilityId: capId, status: "published" })
    .where(eq(games.id, gameId))
    .returning();
  await db
    .update(itemTemplates)
    .set({ status: "published" })
    .where(eq(itemTemplates.gameId, gameId));
  const { raw, prefix, hash } = genKey();
  await db.insert(apiKeys).values({ gameId, keyHash: hash, keyPrefix: prefix });
  return { game: updated, apiKey: raw };
}
