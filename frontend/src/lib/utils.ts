import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) {
        return "à l'instant";
    } else if (minutes < 60) {
        return `il y a ${minutes} minute(s)`;
    } else if (hours < 24) {
        return `il y a ${hours} heure(s)`;
    } else {
        return `il y a ${days} jour(s)`;
    }
}

export const CATEGORY_COLORS: Record<string, { base: string, class: string }> = {
  'Social':       { base: 'hsl(221.2 83.2% 53.3%)', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  'E-commerce':   { base: 'hsl(142.1 76.2% 36.3%)', class: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  'Entertainment':{ base: 'hsl(262.1 83.3% 57.8%)', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
  'Professional': { base: 'hsl(243.8 94.5% 56.9%)', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' },
  'Gaming':       { base: 'hsl(0 72.2% 50.6%)',    class: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  'Adult':        { base: 'hsl(333.3 83.5% 53.7%)', class: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300' },
  'Tech':         { base: 'hsl(188.8 83.5% 45.9%)', class: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300' },
  'Finance':      { base: 'hsl(47.9 95.8% 53.1%)', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  'Services':     { base: 'hsl(24.6 95% 53.1%)',   class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
  'Other':        { base: 'hsl(215.4 16.3% 46.9%)',class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

export const getCategoryColorClass = (category: string): string => {
    const foundCategory = Object.keys(CATEGORY_COLORS).find(key => key.toLowerCase() === category.toLowerCase());
    return (foundCategory && CATEGORY_COLORS[foundCategory]?.class) || CATEGORY_COLORS['Other'].class;
};

export const mapStatusToPhase = (status: string) => {
  switch (status) {
    case 'INITIALIZING':
      return 'INITIALIZING';
    case 'ENRICHING':
      return 'ENRICHMENT';
    case 'SCANNING':
      return 'SCANNING';
    case 'CONSOLIDATING':
      return 'CONSOLIDATION';
    case 'COMPLETED':
    case 'FAILED':
    case 'CANCELLED':
      return 'COMPLETED';
    default:
      return 'INITIALIZING'; // Fallback for initial states
  }
};
