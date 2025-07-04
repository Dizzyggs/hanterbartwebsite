import { useState, useEffect, useMemo } from 'react';
import type { 
  AuditLog, 
  AuditLogFilters, 
  FilterType, 
  SortField, 
  UseAuditLogFiltersReturn 
} from '../types/auditLogTypes';

export const useAuditLogFilters = (logs: AuditLog[]): UseAuditLogFiltersReturn => {
  const [filters, setFilters] = useState<AuditLogFilters>({
    searchTerm: '',
    filterType: 'all',
    sortField: 'timestamp',
    sortAscending: false,
  });

  const updateFilter = <K extends keyof AuditLogFilters>(
    key: K, 
    value: AuditLogFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (newSortField: SortField) => {
    if (filters.sortField === newSortField) {
      updateFilter('sortAscending', !filters.sortAscending);
    } else {
      updateFilter('sortField', newSortField);
      updateFilter('sortAscending', newSortField === 'timestamp' ? false : true);
    }
  };

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.adminUsername.toLowerCase().includes(searchLower) ||
        log.targetName.toLowerCase().includes(searchLower) ||
        log.targetType.toLowerCase().includes(searchLower) ||
        (log.details && log.details.toLowerCase().includes(searchLower))
      );
    }

    // Apply action filter
    if (filters.filterType !== 'all') {
      filtered = filtered.filter(log => log.action === filters.filterType);
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortField) {
        case 'timestamp':
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'adminUsername':
          aValue = a.adminUsername.toLowerCase();
          bValue = b.adminUsername.toLowerCase();
          break;
        case 'targetType':
          aValue = a.targetType;
          bValue = b.targetType;
          break;
        default:
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
      }

      if (aValue < bValue) return filters.sortAscending ? -1 : 1;
      if (aValue > bValue) return filters.sortAscending ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [logs, filters]);

  return {
    filters,
    filteredLogs,
    updateFilter,
    handleSortChange,
  };
}; 