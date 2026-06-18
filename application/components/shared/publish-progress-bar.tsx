'use client';

import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep { label: string; status: 'pending' | 'active' | 'done' | 'error'; }
interface PublishProgressBarProps { steps: ProgressStep[]; className?: string; }

export default function PublishProgressBar({ steps, className }: PublishProgressBarProps) {
  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={idx} className="flex items-stretch">
            <div className="flex flex-col items-center mr-4">
              <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors', step.status === 'done' && 'bg-green-100 border-green-400 text-green-600', step.status === 'active' && 'bg-blueberry-cream border-blueberry text-blueberry', step.status === 'error' && 'bg-red-100 border-red-400 text-red-500', step.status === 'pending' && 'bg-white border-[#1E2044]/20 text-[#1E2044]/30')}>
                {step.status === 'done' && <Check className="w-4 h-4" />}
                {step.status === 'active' && <Loader2 className="w-4 h-4 animate-spin" />}
                {step.status === 'error' && <X className="w-4 h-4" />}
                {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-[#1E2044]/20" />}
              </div>
              {!isLast && <div className={cn('w-0.5 flex-1 min-h-[20px]', step.status === 'done' ? 'bg-green-400' : 'bg-[#1E2044]/10')} />}
            </div>
            <div className="pb-6"><span className={cn('font-mono text-xs font-bold uppercase tracking-wider', step.status === 'active' && 'text-blueberry', step.status === 'done' && 'text-green-700', step.status === 'error' && 'text-red-500', step.status === 'pending' && 'text-[#1E2044]/40')}>{step.label}</span></div>
          </div>
        );
      })}
    </div>
  );
}
