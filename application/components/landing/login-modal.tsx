'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, ShieldCheck, LogIn, User, Check } from 'lucide-react'
import { useEnokiFlow } from '@mysten/enoki/react'
import { useAuthStore } from '@/stores/auth-store'
import { useZkLogin } from '@mysten/enoki/react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
}

export default function LoginModal({ isOpen, onClose, redirectTo }: LoginModalProps) {
  const router = useRouter()
  const flow = useEnokiFlow()
  const zkLoginState = useZkLogin() as Record<string, unknown>
  const setWorkspace = useAuthStore((s) => s.setWorkspace)

  const [step, setStep] = useState<'oauth' | 'connecting' | 'workspace'>('oauth')
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState('')

  const handleGoogleOAuth = useCallback(async () => {
    setIsLoading(true)
    setStep('connecting')
    setError('')

    try {
      const oauthUrl = await flow.createAuthorizationURL({
        provider: 'google',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirectUrl: typeof window !== 'undefined'
          ? window.location.origin + '/auth/callback'
          : '',
        network: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet',
      }) as unknown as string
      window.location.href = oauthUrl
    } catch (err) {
      setError('Failed to start login. Check Enoki config.')
      setIsLoading(false)
      setStep('oauth')
    }
  }, [flow])

  React.useEffect(() => {
    if (step === 'connecting' && zkLoginState?.address) {
      setIsLoading(false)
      setStep('workspace')
    }
  }, [zkLoginState, step])

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault()
    if (workspaceName.trim()) setWorkspace(workspaceName.trim())
    onClose()
    router.push(redirectTo || '/inventory')
  }

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

        {step === 'oauth' && (
          <>
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
          </>
        )}

        {step === 'connecting' && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 border-4 border-blueberry border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display font-black text-sm uppercase text-border-dark">Signing in with Google</p>
            <p className="text-[10px] font-mono text-border-dark/50 mt-1">via Enoki zkLogin...</p>
          </div>
        )}

        {step === 'workspace' && (
          <form onSubmit={handleFinish} className="space-y-4">
            <div className="flex items-center gap-2 bg-blueberry-cream border-2 border-blueberry-light text-xs font-mono p-3 rounded-xl text-border-dark">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span>Connected as <strong className="font-bold">{(zkLoginState?.address as string)?.slice(0, 10)}...</strong></span>
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-border-dark/70 uppercase mb-1.5">Workspace Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-border-dark/40"><User className="w-4 h-4" /></div>
                <input type="text" placeholder="e.g. My Game Studio" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-border-dark rounded-xl text-sm font-mono text-border-dark placeholder-border-dark/40 focus:outline-none focus:ring-2 focus:ring-blueberry" />
              </div>
            </div>
            <button type="submit" className="w-full py-3.5 bg-blueberry text-white border-2 border-border-dark text-sm font-display font-extrabold rounded-xl shadow-[4px_4px_0px_0px_var(--color-blueberry-light)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:bg-blueberry-dark transition-all cursor-pointer">
              Enter Dashboard
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-[10px] font-mono text-border-dark/50">Powered by Sui Network. No extension required.</div>
      </div>
    </div>
  )
}
