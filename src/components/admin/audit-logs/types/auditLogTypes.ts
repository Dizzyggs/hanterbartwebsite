import type { AuditLogEntry } from '../../../../utils/auditLogger';

export interface AuditLog extends Omit<AuditLogEntry, 'timestamp'> {
  id: string;
  timestamp: Date;
}

export type FilterType = 'all' | 'create' | 'update' | 'delete';
export type SortField = 'timestamp' | 'action' | 'adminUsername' | 'targetType';

export interface AuditLogFilters {
  searchTerm: string;
  filterType: FilterType;
  sortField: SortField;
  sortAscending: boolean;
}

export interface AuditLogPagination {
  currentPage: number;
  totalPages: number;
  logsPerPage: number;
  startIndex: number;
  endIndex: number;
}

export interface UseAuditLogsReturn {
  logs: AuditLog[];
  isLoading: boolean;
  deleteLog: (logId: string) => Promise<void>;
}

export interface UseAuditLogFiltersReturn {
  filters: AuditLogFilters;
  filteredLogs: AuditLog[];
  updateFilter: <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => void;
  handleSortChange: (newSortField: SortField) => void;
}

export interface UseAuditLogPaginationReturn {
  pagination: AuditLogPagination;
  currentLogs: AuditLog[];
  handlePageChange: (page: number) => void;
} 