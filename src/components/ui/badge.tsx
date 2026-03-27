import { cn } from '@/lib/utils';
export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger'; className?: string }) {
  const v = { default: 'bg-navy-100 text-navy-700', success: 'bg-emerald-100 text-emerald-700', warning: 'bg-amber-100 text-amber-700', danger: 'bg-red-100 text-red-700' };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', v[variant], className)}>{children}</span>;
}
