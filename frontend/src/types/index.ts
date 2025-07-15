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

export interface NotificationAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  isRead?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export type InputField = { id: number; value: string };

export type InvestigationFormState = {
    names: InputField[];
    emails: InputField[];
    usernames: InputField[];
    phones: InputField[];
    ips: InputField[];
    domains: InputField[];
    urls: InputField[];
    maxGeneration: number;
    minConfidence: number;
};

export interface AppState {
  activeSearches: SearchTask[];
  searchResults: SearchResults | null;
  allResults: SearchResults | null;
  searchLogs: string[];
  toastNotifications: ToastNotification[];
  appNotifications: AppNotification[];
  isLoading: boolean;
  darkMode: boolean;
  personFilter: string | null;
  emailFilter: string | null;
  categoryFilter: string | null;
  platformFilter: string | null;
  searchProgress: number;
  investigationForm: InvestigationFormState;
}

export interface InvestigationInput {
  names?: string[];
  emails?: string[];
  usernames?: string[];
  phones?: string[];
  ips?: string[];
  domains?: string[];
  urls?: string[];
  maxGeneration?: number;
  minConfidence?: number;
}

export interface Investigation {
  id: string;
  status: 'INITIALIZING' | 'ENRICHING' | 'SCANNING' | 'CONSOLIDATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  currentPhase: 'ENRICHMENT' | 'SCANNING' | 'CONSOLIDATION' | 'FINISHED';
  currentStep?: string;
  inputData?: InvestigationInput;
  finalReport?: any;
  createdAt: string;
  updatedAt: string;
  caseId?: string | null;
  results?: Result[];
  indicators?: Indicator[];
  error?: string;
}

export interface Case {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    investigations: Investigation[];
}

export interface Indicator {
  id: string;
  investigationId: string;
  type: 'NAME' | 'EMAIL' | 'USERNAME' | 'PHONE' | 'IP' | 'DOMAIN' | 'URL';
  value: string;
  source?: string;
  confidence: number;
  verified: boolean;
  createdAt: string;
}

export interface Result {
  id: string;
  investigationId: string;
  indicatorId?: string;
  toolSource: string;
  data: any;
  score: number;
  createdAt: string;
  investigation?: {
    id: string;
    inputData: any;
  };
  indicator?: Indicator;
}

export interface InvestigationLog {
  id: string;
  investigationId: string;
  step: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  timestamp: string;
  metadata?: {
    progress?: number;
    tool?: string;
    duration?: number;
    count?: number;
  };
}

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  documentation?: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  configurableOptions: string[];
  documentation: string;
}

export interface ToolStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
  stats: {
    totalResults: number;
    recentResults: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface GlobalStats {
  totalInvestigations: number;
  totalResults: number;
  resultsByTool: { toolSource: string; count: number }[];
  indicatorsByType: { type: string; count: number }[];
}

export interface InvestigationsOverTimeData {
  date: string;
  count: number;
}

export interface User {
  id: string;
  email: string;
  // Ajoutez d'autres champs si nécessaire
}