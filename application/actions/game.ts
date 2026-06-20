'use server'

import { createGame as svcCreate, updateGame as svcUpdate, deleteGame as svcDelete, listGames, getGame, finalizePublish } from '@/services/game-service'

export const create = svcCreate
export const update = svcUpdate
export const del = svcDelete
export const list = listGames
export const detail = getGame
export const publish = finalizePublish
