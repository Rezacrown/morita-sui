'use server'

import { saveDraft, deleteDraft, listItems, getItem, getClaimInfo } from '@/services/item-service'

export const save = saveDraft
export const del = deleteDraft
export const list = listItems
export const detail = getItem
export const claimInfo = getClaimInfo
