import React from 'react';
import {
  Box,
  VStack,
  Center,
  Text,
  Flex,
  HStack,
  Skeleton,
} from '@chakra-ui/react';
import { TimeIcon } from '@chakra-ui/icons';
import { AnimatePresence } from 'framer-motion';
import type { AuditLog } from '../types/auditLogTypes';
import { AuditLogItem } from './AuditLogItem';

interface AuditLogListProps {
  isLoading: boolean;
  currentLogs: AuditLog[];
  filteredCount: number;
  onViewDetails: (log: AuditLog) => void;
  onDelete: (log: AuditLog) => void;
}

const LoadingSkeleton: React.FC = () => (
  <VStack spacing={0} p={4}>
    {[...Array(10)].map((_, i) => (
      <Box 
        key={i} 
        w="full" 
        p={4} 
        borderBottomWidth={i < 9 ? "1px" : "0"} 
        borderColor="rgba(255, 255, 255, 0.05)"
      >
        <Flex align="center" justify="space-between">
          <HStack spacing={4} flex={1}>
            <Skeleton height="40px" width="40px" borderRadius="lg" />
            <VStack align="flex-start" spacing={1}>
              <Skeleton height="16px" width="120px" />
              <Skeleton height="12px" width="80px" />
            </VStack>
          </HStack>
          <VStack spacing={2} flex={2}>
            <Skeleton height="14px" width="200px" />
            <Skeleton height="12px" width="300px" />
          </VStack>
          <HStack spacing={2}>
            <Skeleton height="12px" width="60px" />
            <Skeleton height="32px" width="32px" borderRadius="lg" />
            <Skeleton height="32px" width="32px" borderRadius="lg" />
          </HStack>
        </Flex>
      </Box>
    ))}
  </VStack>
);

const EmptyState: React.FC = () => (
  <Center py={16}>
    <VStack spacing={4}>
      <Box
        w="80px"
        h="80px"
        bg="rgba(255, 255, 255, 0.02)"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <TimeIcon boxSize={8} color="rgba(255, 255, 255, 0.3)" />
      </Box>
      <VStack spacing={1}>
        <Text color="rgba(255, 255, 255, 0.8)" fontSize="lg" fontWeight="600">
          No audit logs found
        </Text>
        <Text color="rgba(255, 255, 255, 0.5)" fontSize="sm">
          Try adjusting your search or filter criteria
        </Text>
      </VStack>
    </VStack>
  </Center>
);

export const AuditLogList: React.FC<AuditLogListProps> = ({
  isLoading,
  currentLogs,
  filteredCount,
  onViewDetails,
  onDelete,
}) => {
  return (
    <Box
      bg="rgba(255, 255, 255, 0.02)"
      backdropFilter="blur(20px)"
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      overflow="hidden"
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredCount === 0 ? (
        <EmptyState />
      ) : (
        <VStack spacing={0} p={4}>
          <AnimatePresence>
            {currentLogs.map((log, index) => (
              <Box
                key={log.id}
                w="full"
                borderBottomWidth={index < currentLogs.length - 1 ? "1px" : "0"}
                borderColor="rgba(255, 255, 255, 0.05)"
                pb={index < currentLogs.length - 1 ? 4 : 0}
                mb={index < currentLogs.length - 1 ? 4 : 0}
              >
                <AuditLogItem
                  log={log}
                  index={index}
                  onViewDetails={onViewDetails}
                  onDelete={onDelete}
                />
              </Box>
            ))}
          </AnimatePresence>
        </VStack>
      )}
    </Box>
  );
}; 