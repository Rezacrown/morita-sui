'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, ShieldCheck, LogIn } from 'lucide-react'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { toBase64 } from '@mysten/sui/utils'
import { getNonce } from '@/actions/zkp'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
}

export default function LoginModal({ isOpen, onClose, redirectTo }: LoginModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleOAuth = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const keypair = Ed25519Keypair.generate()
      const publicKey = keypair.getPublicKey()
      const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'

      const { nonce, randomness, maxEpoch } = await getNonce(
        toBase64(publicKey.toRawBytes()),
        network,
      )

      const secretKey = keypair.getSecretKey()

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('morita_redirect', redirectTo || window.location.pathname)
        sessionStorage.setItem('morita_ephemeral_key', secretKey)
        sessionStorage.setItem('morita_randomness', randomness)
        sessionStorage.setItem('morita_max_epoch', String(maxEpoch))
      }

      const params = new URLSearchParams({
        nonce,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback',
        response_type: 'id_token',
        scope: 'openid',
      })

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    } catch (err) {
      setError('Failed to start login. Check Enoki config.')
      setIsLoading(false)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#161614]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-brand-bg border-3 border-border-dark rounded-2xl shadow-[8px_8px_0px_0px_var(--color-border-dark)] p-6 z-10 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-blueberry" />
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blueberry-cream border-2 border-border-dark flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blueberry-dark" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase text-border-dark tracking-tight">Connect to Morita</h3>
              <p className="text-[10px] font-mono text-border-dark/50 leading-none">zkLogin via Enoki</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 border-2 border-border-dark rounded-lg bg-white hover:bg-border-dark/5 transition-all text-border-dark cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="bg-blueberry-light/10 border-2 border-blueberry-light text-xs font-mono p-3 rounded-xl mb-6 text-border-dark/80 leading-relaxed">
          Zero gas, zero passphrases. Sign in with your Google account to generate a Sui wallet instantly.
        </div>
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-xs font-mono p-3 rounded-xl mb-4 text-red-600">
            {error}
          </div>
        )}
        <button
          onClick={handleGoogleOAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-border-dark rounded-xl font-display font-black text-sm uppercase tracking-tight hover:bg-blueberry-cream transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-blueberry border-t-transparent rounded-full animate-spin" /><span>Redirecting...</span></>
          ) : (
            <><LogIn className="w-5 h-5 text-blueberry" /><span>Continue with Google</span></>
          )}
        </button>

        <div className="mt-4 text-center text-[10px] font-mono text-border-dark/50">Powered by Sui Network. No extension required.</div>
      </div>
    </div>
  )
}
