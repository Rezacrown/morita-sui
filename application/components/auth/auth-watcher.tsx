'use client'

import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

export function AuthWatcher() {
  const account = useCurrentAccount()
  const setAccount = useAuthStore((s) => s.setAccount)

  useEffect(() => {
    if (account) {
      setAccount({
        suiAddress: account.address,
        displayName: account.label || account.address.slice(0, 8),
      })
    } else {
      setAccount(null)
    }
  }, [account, setAccount])

  return null
}
