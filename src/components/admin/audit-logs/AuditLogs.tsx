import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { AuditLog } from './types/auditLogTypes';
import { useAuditLogs } from './hooks/useAuditLogs';
import { useAuditLogFilters } from './hooks/useAuditLogFilters';
import { useAuditLogPagination } from './hooks/useAuditLogPagination';
import { AuditLogFilters } from './components/AuditLogFilters';
import { AuditLogList } from './components/AuditLogList';
import { AuditLogPagination } from './components/AuditLogPagination';
import { AuditLogModals } from './components/AuditLogModals';

const MotionBox = motion(Box);

export const AuditLogs: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const { 
    isOpen: isDetailsModalOpen, 
    onOpen: onDetailsModalOpen, 
    onClose: onDetailsModalClose 
  } = useDisclosure();

  const { 
    isOpen: isDeleteDialogOpen, 
    onOpen: onDeleteDialogOpen, 
    onClose: onDeleteDialogClose 
  } = useDisclosure();

  // Custom hooks
  const { logs, isLoading, deleteLog } = useAuditLogs();
  const { filters, filteredLogs, updateFilter, handleSortChange } = useAuditLogFilters(logs);
  const { pagination, currentLogs, handlePageChange } = useAuditLogPagination(filteredLogs);

  // Event handlers
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    onDetailsModalOpen();
  };

  const handleDeleteClick = (log: AuditLog) => {
    setLogToDelete(log);
    onDeleteDialogOpen();
  };

  const handleConfirmDelete = async () => {
    if (logToDelete) {
      await deleteLog(logToDelete.id);
      setLogToDelete(null);
      onDeleteDialogClose();
    }
  };

  return (
    <Container maxW="8xl" py={8}>
      <VStack spacing={8} align="stretch">
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heading 
            size="xl" 
            color="white" 
            textAlign="center"
            fontWeight="700"
            mb={2}
          >
            Audit Logs
          </Heading>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AuditLogFilters
            filters={filters}
            filteredCount={filteredLogs.length}
            totalPages={pagination.totalPages}
            currentPage={pagination.currentPage}
            onUpdateFilter={updateFilter}
            onSortChange={handleSortChange}
          />
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AuditLogList
            isLoading={isLoading}
            currentLogs={currentLogs}
            filteredCount={filteredLogs.length}
            onViewDetails={handleViewDetails}
            onDelete={handleDeleteClick}
          />
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AuditLogPagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </MotionBox>
      </VStack>

      <AuditLogModals
        selectedLog={selectedLog}
        logToDelete={logToDelete}
        isDetailsModalOpen={isDetailsModalOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        cancelRef={cancelRef}
        onDetailsModalClose={onDetailsModalClose}
        onDeleteDialogClose={onDeleteDialogClose}
        onConfirmDelete={handleConfirmDelete}
      />
    </Container>
  );
}; 