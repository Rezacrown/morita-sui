import { describe, it, expect } from 'bun:test'

describe('enoki-client', () => {
  it('exports executeAsAdmin as function', async () => {
    const mod = await import('@/lib/sui/enoki-client')
    expect(typeof mod.executeAsAdmin).toBe('function')
  })
  it('exports sponsorForUser as function', async () => {
    const mod = await import('@/lib/sui/enoki-client')
    expect(typeof mod.sponsorForUser).toBe('function')
  })
  it('exports executeUserSigned as function', async () => {
    const mod = await import('@/lib/sui/enoki-client')
    expect(typeof mod.executeUserSigned).toBe('function')
  })
})

describe('ptb', () => {
  const ptb = require('@/lib/sui/ptb')

  it('mint returns a Transaction', () => {
    const tx = ptb.mint('0x1', '0x2', 1, 'weapon', 'legendary', 'blob_abc', null, '0x3')
    expect(tx).toBeDefined()
    expect(typeof tx.build).toBe('function')
  })

  it('createPublisher returns a Transaction', () => {
    const tx = ptb.createPublisher('Test Studio')
    expect(tx).toBeDefined()
    expect(typeof tx.build).toBe('function')
  })

  it('publish returns a Transaction', () => {
    const tx = ptb.publish('0x1', 'Test Game', '0x2')
    expect(tx).toBeDefined()
  })

  it('listForSale returns a Transaction', () => {
    const tx = ptb.listForSale('0x1', '0x2', '0x3', 1000, null)
    expect(tx).toBeDefined()
  })

  it('buyItem returns a Transaction', () => {
    const tx = ptb.buyItem('0x1', '0x2', '0x3', 1000)
    expect(tx).toBeDefined()
  })

  it('lockForAny returns a Transaction', () => {
    const tx = ptb.lockForAny('0x1', { rarityAccept: 'legendary' })
    expect(tx).toBeDefined()
  })

  it('lockForTarget returns a Transaction', () => {
    const tx = ptb.lockForTarget('0x1', { rarityAccept: 'legendary' }, '0x2')
    expect(tx).toBeDefined()
  })

  it('fulfill returns a Transaction', () => {
    const tx = ptb.fulfill('0x1', '0x2')
    expect(tx).toBeDefined()
  })

  it('fulfillWithValue returns a Transaction', () => {
    const tx = ptb.fulfillWithValue('0x1', '0x2', 500)
    expect(tx).toBeDefined()
  })

  it('cancel returns a Transaction', () => {
    const tx = ptb.cancel('0x1')
    expect(tx).toBeDefined()
  })

  it('burn is exported as function', async () => {
    const ptb2 = require('@/lib/sui/ptb')
    expect(typeof ptb2.burn).toBe('function')
  })
})

describe('marketplace service', () => {
  it('exports getListings and getListingDetail', async () => {
    const svc = await import('@/services/marketplace-service')
    expect(typeof svc.getListings).toBe('function')
    expect(typeof svc.getListingDetail).toBe('function')
    expect(typeof svc.createEscrowRecord).toBe('function')
    expect(typeof svc.markFulfilled).toBe('function')
    expect(typeof svc.markCancelled).toBe('function')
  })
})
