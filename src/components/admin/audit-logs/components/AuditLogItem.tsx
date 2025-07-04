import React from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, DeleteIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import type { AuditLog } from '../types/auditLogTypes';
import { 
  getActionColor, 
  getActionIcon, 
  getTargetTypeIcon, 
  formatTimestamp, 
  renderDetails 
} from '../utils/auditLogUtils';

const MotionBox = motion(Box);

interface AuditLogItemProps {
  log: AuditLog;
  index: number;
  onViewDetails: (log: AuditLog) => void;
  onDelete: (log: AuditLog) => void;
}

export const AuditLogItem: React.FC<AuditLogItemProps> = ({
  log,
  index,
  onViewDetails,
  onDelete,
}) => {
  return (
    <MotionBox
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      bg="rgba(255, 255, 255, 0.02)"
      backdropFilter="blur(20px)"
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      p={4}
      _hover={{
        borderColor: 'rgba(255, 255, 255, 0.1)',
        bg: 'rgba(255, 255, 255, 0.03)',
        transform: 'translateX(4px)',
      }}
      sx={{
        transition: 'all 0.2s ease',
      }}
    >
      <Flex align="center" justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4}>
        {/* Left Section - Action & Admin */}
        <HStack spacing={4} flex={1} w="full">
          <Box
            p={2}
            bg={`${getActionColor(log.action)}.500`}
            borderRadius="lg"
            color="white"
            minW="40px"
            h="40px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {getActionIcon(log.action)}
          </Box>
          
          <VStack align="flex-start" spacing={1} flex={1} minW={0}>
            <HStack spacing={2} flexWrap="wrap">
              <Badge
                colorScheme={getActionColor(log.action)}
                px={3}
                py={1}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.5px"
                bg={`${getActionColor(log.action)}.500`}
                color="white"
                boxShadow="0 2px 4px rgba(0,0,0,0.1)"
              >
                {log.action}
              </Badge>
            </HStack>
            <Text color="rgba(255, 255, 255, 0.9)" fontSize="sm" fontWeight="500">
              {log.adminUsername}
            </Text>
          </VStack>
        </HStack>

        {/* Middle Section - Target & Details */}
        <VStack align={{ base: 'flex-start', md: 'center' }} spacing={2} flex={2} w="full">
          <HStack spacing={2} align="center" w="full">
            <Box color="rgba(255, 255, 255, 0.6)" fontSize="sm">
              {getTargetTypeIcon(log.targetType)}
            </Box>
            <Text color="white" fontWeight="600" fontSize="sm" noOfLines={1}>
              {log.targetName}
            </Text>
          </HStack>
          
          {log.details && (
            <Box w="full">
              <Text
                color="rgba(255, 255, 255, 0.7)"
                fontSize="sm"
                lineHeight="1.4"
                noOfLines={2}
              >
                {renderDetails(log.details)}
              </Text>
            </Box>
          )}
        </VStack>

        {/* Right Section - Time & Actions */}
        <HStack spacing={3} justify={{ base: 'space-between', md: 'flex-end' }} w={{ base: 'full', md: 'auto' }}>
          <Text
            color="rgba(255, 255, 255, 0.5)"
            fontSize="xs"
            fontWeight="500"
            minW="fit-content"
            textAlign="right"
          >
            {formatTimestamp(log.timestamp)}
          </Text>
          
          <HStack spacing={2}>
            <IconButton
              aria-label="View details"
              icon={<ViewIcon />}
              size="sm"
              variant="ghost"
              onClick={() => onViewDetails(log)}
              color="rgba(255, 255, 255, 0.6)"
              _hover={{ 
                bg: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }}
              borderRadius="lg"
            />
            
            <IconButton
              aria-label="Delete log"
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              onClick={() => onDelete(log)}
              color="rgba(255, 255, 255, 0.6)"
              _hover={{ 
                bg: 'rgba(239, 68, 68, 0.1)',
                color: 'red.400'
              }}
              borderRadius="lg"
            />
          </HStack>
        </HStack>
      </Flex>
    </MotionBox>
  );
}; 