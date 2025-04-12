import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { AuditLogEntry } from '../../utils/auditLogger';
import { DeleteIcon } from '@chakra-ui/icons';
import Breadcrumbs from '../Breadcrumbs';

interface AuditLog extends Omit<AuditLogEntry, 'timestamp'> {
  id: string;
  timestamp: Date;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const toast = useToast();

  useEffect(() => {
    const logsQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
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
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteDoc(doc(db, 'audit_logs', logId));
      
      toast({
        title: 'Log Deleted',
        description: 'The log entry has been deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete log entry',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'green';
      case 'update':
        return 'blue';
      case 'delete':
        return 'red';
      default:
        return 'gray';
    }
  };

  const renderDetails = (details: string) => {
    // Split by markdown bold markers
    const parts = details.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the ** markers and render as bold
        return (
          <Text as="span" fontWeight="bold" key={index}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text as="span" key={index}>{part}</Text>;
    });
  };

  return (
    <Box minH="calc(100vh - 4rem)" bg="background.primary" py={8} pt="80px">
      <Container maxW="7xl">
        <Breadcrumbs />
        <Heading
          color="text.primary"
          fontSize="2xl"
          mb={8}
          bgGradient="linear(to-r, primary.400, primary.600)"
          bgClip="text"
        >
          Audit Logs
        </Heading>

        <Box
          bg="background.secondary"
          borderRadius="lg"
          p={6}
          boxShadow="xl"
          borderColor="border.primary"
          borderWidth="1px"
        >
          <Box 
            maxH="50rem" 
            overflowY="auto"
            margin="-6px"
            padding="6px"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
                background: 'var(--chakra-colors-background-tertiary)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-border-secondary)',
                borderRadius: '24px',
              },
              'scrollbarWidth': 'thin',
              'scrollbarColor': 'var(--chakra-colors-border-secondary) var(--chakra-colors-background-tertiary)',
            }}
          >
            <Table variant="simple">
              <Thead position="sticky" top={0} bg="background.secondary" zIndex={1}>
                <Tr>
                  <Th color="text.secondary">Time</Th>
                  <Th color="text.secondary">Action</Th>
                  <Th color="text.secondary">User</Th>
                  <Th color="text.secondary">Description</Th>
                  <Th color="text.secondary" width="1"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((log) => (
                  <Tr key={log.id}>
                    <Td color="text.primary">
                      {log.timestamp.toLocaleString()}
                    </Td>
                    <Td>
                      <Badge colorScheme={getActionColor(log.action)}>
                        {log.action.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td color="text.primary">
                      {log.adminUsername}
                    </Td>
                    <Td color="text.primary">
                      {log.details ? renderDetails(log.details) : '-'}
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Delete log"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLog(log.id)}
                      />
                    </Td>
                  </Tr>
                ))}
                {logs.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign="center" color="text.secondary">
                      No logs found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AuditLogs; 