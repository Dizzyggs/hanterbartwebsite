import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLogEntry {
  timestamp: any; // Firebase Timestamp
  adminId: string;
  adminUsername: string;
  action: AuditAction;
  targetType: 'event' | 'character' | 'user' | 'role';
  targetId: string;
  targetName: string;
  details?: string;
}

export const logAdminAction = async (
  adminId: string,
  adminUsername: string,
  action: AuditAction,
  targetType: AuditLogEntry['targetType'],
  targetId: string,
  targetName: string,
  details?: string
) => {
  try {
    const logEntry: Omit<AuditLogEntry, 'timestamp'> = {
      adminId,
      adminUsername,
      action,
      targetType,
      targetId,
      targetName,
      details,
    };

    await addDoc(collection(db, 'audit_logs'), {
      ...logEntry,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // We don't throw here to prevent the main action from failing if logging fails
  }
}; 