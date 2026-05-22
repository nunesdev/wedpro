'use client';

import { ToastProvider } from '@/components/ToastProvider';
import type { ReactNode } from 'react';

export function ToastRoot({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
