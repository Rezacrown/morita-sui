'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { fromBase64, toBase64 } from '@mysten/sui/utils'
import { getZkLoginInfo, getZkp } from '@/actions/zkp'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthCallback() {
  const router = useRouter()
  const setAccount = useAuthStore((s) => s.setAccount)
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = async () => {
      try {
        const hash = window.location.hash.slice(1)
        const params = new URLSearchParams(hash)
        const jwt = params.get('id_token')
        if (!jwt) throw new Error('Missing ID token')

        const secretKey = sessionStorage.getItem('morita_ephemeral_key')
        const randomness = sessionStorage.getItem('morita_randomness')
        const maxEpoch = sessionStorage.getItem('morita_max_epoch')
        if (!secretKey || !randomness || !maxEpoch) throw new Error('Session expired. Please try again.')

        const ephemeralKeypair = Ed25519Keypair.fromSecretKey(fromBase64(secretKey))

        const { address } = await getZkLoginInfo(jwt)

        const proof = await getZkp({
          jwt,
          ephemeralPublicKey: toBase64(ephemeralKeypair.getPublicKey().toRawBytes()),
          randomness,
          maxEpoch: parseInt(maxEpoch),
        })

        sessionStorage.setItem('morita_jwt', jwt)
        sessionStorage.setItem('morita_address', address)
        sessionStorage.setItem('morita_proof', JSON.stringify(proof))
        sessionStorage.setItem('morita_max_epoch', maxEpoch)

        setAccount({ suiAddress: address, displayName: '' })

        const redirect = sessionStorage.getItem('morita_redirect') || '/inventory'
        sessionStorage.removeItem('morita_redirect')
        router.push(redirect)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Authentication failed')
      }
    }
    handle()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <div className="bg-white border-3 border-border-dark rounded-2xl p-8 text-center max-w-md">
          <p className="font-display font-black text-lg text-red-600 mb-2">Login Failed</p>
          <p className="font-mono text-sm text-border-dark/60">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blueberry border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-display font-black text-sm uppercase text-border-dark">Completing sign in...</p>
      </div>
    </div>
  )
}
