export interface SearchRequest {
  first_name: string;
  last_name: string;
  domain_filter?: string;
}

export interface SearchTask {
  task_id: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  first_name: string;
  last_name: string;
  domain_filter?: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  error?: string;
  results_file?: string;
  total_emails?: string;
  total_accounts?: string;
}

export interface Account {
  platform: string;
  url: string;
  status: 'active' | 'inactive' | 'unknown';
  additional_info?: string;
  category?: string;
  method?: string;
}

export interface EmailResult {
  email: string;
  accounts: Account[];
  total_accounts: number;
}

export interface PersonResult {
  id: string;
  firstName: string;
  lastName: string;
  emails: EmailResult[];
}

export interface SearchResults {
  persons: PersonResult[];
  stats: {
    total_persons: number;
    total_emails: number;
    total_accounts: number;
    total_platforms: number;
    search_date?: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface AppState {
  activeSearches: SearchTask[];
  searchResults: SearchResults | null;
  allResults: SearchResults | null;
  searchLogs: string[];
  notifications: NotificationState[];
  isLoading: boolean;
  darkMode: boolean;
  personFilter: string | null;
  emailFilter: string | null;
  categoryFilter: string | null;
  platformFilter: string | null;
  searchProgress: number;
}