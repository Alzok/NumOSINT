import { SearchResults, PersonResult, EmailResult, SearchTask } from '@/types';

// This function is a temporary adapter to transform the old API response
// into the new data structure expected by the frontend.
// This should be removed once the backend API is updated.
export const transformLegacyResults = (legacyResults: any): SearchResults => {
  if (!legacyResults || !legacyResults.results || legacyResults.results.length === 0) {
    return { persons: [], stats: { total_persons: 0, total_emails: 0, total_accounts: 0, total_platforms: 0 } };
  }

  // Since the legacy API doesn't associate results with a person,
  // we'll create a single, generic person to hold all results.
  // We can try to guess the name from the first email, or use a generic name.
  const firstEmail = legacyResults.results[0].email;
  const nameFromEmail = firstEmail.split('@')[0].replace('.', ' ').replace('_', ' ');
  const [firstName, lastName] = nameFromEmail.split(' ');

  const person: PersonResult = {
    id: 'single-person-result',
    firstName: firstName || 'Résultats',
    lastName: lastName || 'Actuels',
    emails: legacyResults.results.map((emailResult: any): EmailResult => ({
      email: emailResult.email,
      accounts: emailResult.accounts.map((acc: any) => ({
        platform: acc.name || 'unknown',
        url: acc.url || '#',
        status: acc.exists ? 'active' : 'inactive',
        category: getCategoryFromPlatform(acc.name || 'unknown'),
        method: acc.method || 'unknown',
      })),
      total_accounts: emailResult.accounts.length,
    })),
  };

  const newStats = {
    total_persons: 1,
    total_emails: legacyResults.stats.total_emails || 0,
    total_accounts: legacyResults.stats.total_accounts || 0,
    total_platforms: legacyResults.stats.total_platforms || 0,
    search_date: legacyResults.stats.search_date,
  };

  return {
    persons: [person],
    stats: newStats,
  };
};


const getCategoryFromPlatform = (platform: string): string => {
  if (!platform || platform.trim() === '') {
    return 'Other';
  }
  const platformLower = platform.toLowerCase();
  
  const categories: Record<string, string> = {
    // Social
    'facebook': 'Social',
    'twitter': 'Social',
    'instagram': 'Social',
    'linkedin': 'Social',
    'snapchat': 'Social',
    'tiktok': 'Social',
    'discord': 'Social',
    'reddit': 'Social',
    'pinterest': 'Social',
    'tumblr': 'Social',
    'telegram': 'Social',
    'whatsapp': 'Social',
    'signal': 'Social',
    
    // E-commerce
    'amazon': 'E-commerce',
    'ebay': 'E-commerce',
    'etsy': 'E-commerce',
    'shopify': 'E-commerce',
    'aliexpress': 'E-commerce',
    'wish': 'E-commerce',
    'mercadolibre': 'E-commerce',
    'leboncoin': 'E-commerce',
    
    // Entertainment
    'netflix': 'Entertainment',
    'youtube': 'Entertainment',
    'spotify': 'Entertainment',
    'twitch': 'Entertainment',
    'vimeo': 'Entertainment',
    'dailymotion': 'Entertainment',
    'soundcloud': 'Entertainment',
    'bandcamp': 'Entertainment',
    'lastfm': 'Entertainment',
    'deezer': 'Entertainment',
    'apple': 'Entertainment',
    
    // Gaming
    'steam': 'Gaming',
    'epic': 'Gaming',
    'origin': 'Gaming',
    'uplay': 'Gaming',
    'battlenet': 'Gaming',
    'xbox': 'Gaming',
    'playstation': 'Gaming',
    'nintendo': 'Gaming',
    'roblox': 'Gaming',
    'minecraft': 'Gaming',
    'fortnite': 'Gaming',
    
    // Professional
    'github': 'Professional',
    'gitlab': 'Professional',
    'bitbucket': 'Professional',
    'stackoverflow': 'Professional',
    'behance': 'Professional',
    'dribbble': 'Professional',
    'deviantart': 'Professional',
    'medium': 'Professional',
    'wordpress': 'Professional',
    'blogger': 'Professional',
    
    // Tech
    'gmail': 'Tech',
    'yahoo': 'Tech',
    'outlook': 'Tech',
    'hotmail': 'Tech',
    'protonmail': 'Tech',
    'icloud': 'Tech',
    'dropbox': 'Tech',
    'googledrive': 'Tech',
    'onedrive': 'Tech',
    
    // Adult
    'pornhub': 'Adult',
    'xvideos': 'Adult',
    'xhamster': 'Adult',
    'redtube': 'Adult',
    'youporn': 'Adult',
    'onlyfans': 'Adult',
    'chaturbate': 'Adult',
    'cam4': 'Adult',
    
    // Travel & Services
    'uber': 'Services',
    'lyft': 'Services',
    'airbnb': 'Services',
    'booking': 'Services',
    'tripadvisor': 'Services',
    'expedia': 'Services',
    'hotels': 'Services',
    
    // Finance
    'paypal': 'Finance',
    'stripe': 'Finance',
    'venmo': 'Finance',
    'cashapp': 'Finance',
    'revolut': 'Finance',
    'coinbase': 'Finance',
    'binance': 'Finance',
  };

  return categories[platformLower] || 'Other';
};