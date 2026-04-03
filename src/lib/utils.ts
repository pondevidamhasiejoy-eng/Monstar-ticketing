import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateBookingRef(): string {
  const prefix = 'MS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'scanned': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'boarding': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getSeatClassColor(cls: string): string {
  switch (cls.toLowerCase()) {
    case 'first class': return 'text-gold-500';
    case 'business': return 'text-ocean-dark';
    case 'economy': return 'text-navy-600';
    default: return 'text-navy-600';
  }
}
