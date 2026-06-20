'use server'

import { generate, revoke, list } from '@/services/api-key-service'

export const createKey = generate
export const revokeKey = revoke
export const getKeys = list
