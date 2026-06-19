'use client'

import { useZkLogin } from '@mysten/enoki/react'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

export function AuthWatcher() {
  const zkLoginState = useZkLogin() as Record<string, unknown>
  const setAccount = useAuthStore((s) => s.setAccount)

  useEffect(() => {
    const address = zkLoginState?.address as string | undefined
    if (address) {
      setAccount({
        suiAddress: address,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      })
    } else {
      setAccount(null)
    }
  }, [zkLoginState, setAccount])

  return null
}
