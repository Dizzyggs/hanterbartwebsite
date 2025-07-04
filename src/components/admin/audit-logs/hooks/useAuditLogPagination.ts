import { useState, useMemo, useEffect } from 'react';
import type { AuditLog, UseAuditLogPaginationReturn } from '../types/auditLogTypes';

const LOGS_PER_PAGE = 20;

export const useAuditLogPagination = (filteredLogs: AuditLog[]): UseAuditLogPaginationReturn => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when filtered logs change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredLogs]);

  const pagination = useMemo(() => {
    const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const endIndex = startIndex + LOGS_PER_PAGE;

    return {
      currentPage,
      totalPages,
      logsPerPage: LOGS_PER_PAGE,
      startIndex,
      endIndex,
    };
  }, [filteredLogs.length, currentPage]);

  const currentLogs = useMemo(() => {
    return filteredLogs.slice(pagination.startIndex, pagination.endIndex);
  }, [filteredLogs, pagination.startIndex, pagination.endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    pagination,
    currentLogs,
    handlePageChange,
  };
}; 