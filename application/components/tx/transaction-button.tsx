'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTransaction, type TxState } from './use-transaction'
import TxStatusToast from '@/components/shared/tx-status-toast'
import { Transaction } from '@mysten/sui/transactions'

interface TransactionButtonProps {
  buildTx: () => Transaction
  targets: string[]
  label: string
  loadingLabel?: string
  disabled?: boolean
  className?: string
  onConfirmed?: (digest: string) => void
}

export default function TransactionButton({
  buildTx,
  targets,
  label,
  loadingLabel,
  disabled,
  className,
  onConfirmed,
}: TransactionButtonProps) {
  const { state, digest, error, execute, reset } = useTransaction()

  const handleClick = async () => {
    const result = await execute(buildTx, targets)
    if (result.state === 'confirmed' && result.digest && onConfirmed) {
      onConfirmed(result.digest)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || state === 'submitting'}
        className={cn(
          'px-6 py-3 bg-blueberry text-white border-3 border-border-dark font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
          className
        )}
      >
        {state === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === 'submitting' ? (loadingLabel ?? 'Submitting...') : label}
      </button>
      <TxStatusToast state={state} digest={digest} message={error} onDismiss={reset} />
    </>
  )
}
