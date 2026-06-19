'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEnokiFlow } from '@mysten/enoki/react'

export default function AuthCallback() {
  const router = useRouter()
  const flow = useEnokiFlow()
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = async () => {
      try {
        await flow.handleAuthCallback()
        router.push('/inventory')
      } catch {
        setError('Authentication failed. Please try again.')
      }
    }
    handle()
  }, [flow, router])

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
