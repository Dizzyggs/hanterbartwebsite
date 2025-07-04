import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@chakra-ui/react';
import { db } from '../../../../firebase';
import { createStyledToast } from '../../../../utils/toast';
import type { AuditLog, UseAuditLogsReturn } from '../types/auditLogTypes';

const LOGS_LIMIT = 100; // Reduced from 500 for better performance

export const useAuditLogs = (): UseAuditLogsReturn => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const logsQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(LOGS_LIMIT)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const newLogs: AuditLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newLogs.push({
          id: doc.id,
          adminId: data.adminId,
          adminUsername: data.adminUsername,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          targetName: data.targetName,
          details: data.details,
          timestamp: data.timestamp.toDate(),
        });
      });
      setLogs(newLogs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteLog = async (logId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'audit_logs', logId));
      
      toast(createStyledToast({
        title: 'Log Deleted',
        description: 'The audit log entry has been deleted successfully',
        status: 'success'
      }));
    } catch (error) {
      console.error('Error deleting log:', error);
      toast(createStyledToast({
        title: 'Error',
        description: 'Failed to delete audit log entry',
        status: 'error'
      }));
    }
  };

  return {
    logs,
    isLoading,
    deleteLog,
  };
}; 