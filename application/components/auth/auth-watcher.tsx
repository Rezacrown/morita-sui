'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

export function AuthWatcher() {
  const setAccount = useAuthStore((s) => s.setAccount)

  useEffect(() => {
    const address = sessionStorage.getItem('morita_address')
    if (address) {
      setAccount({
        suiAddress: address,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      })
    }
  }, [setAccount])

  return null
}
