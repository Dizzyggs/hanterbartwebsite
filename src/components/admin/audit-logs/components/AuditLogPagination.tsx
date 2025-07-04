import React from 'react';
import {
  Box,
  HStack,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import type { AuditLogPagination as PaginationType } from '../types/auditLogTypes';

interface AuditLogPaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export const AuditLogPagination: React.FC<AuditLogPaginationProps> = ({
  pagination,
  onPageChange,
}) => {
  const { currentPage, totalPages } = pagination;

  if (totalPages <= 1) return null;

  return (
    <Box
      mt={6}
      bg="rgba(255, 255, 255, 0.02)"
      backdropFilter="blur(20px)"
      borderRadius="xl"
      p={4}
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      <HStack spacing={2} justify="center" flexWrap="wrap">
        <IconButton
          aria-label="Previous page"
          icon={<ChevronLeftIcon />}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1}
          borderColor="rgba(255, 255, 255, 0.1)"
          color="white"
          _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
          _disabled={{ opacity: 0.4 }}
        />
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            size="sm"
            variant={currentPage === page ? "solid" : "outline"}
            colorScheme={currentPage === page ? "primary" : undefined}
            onClick={() => onPageChange(page)}
            borderColor="rgba(255, 255, 255, 0.1)"
            color="white"
            _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
            minW="8"
            display={{ base: Math.abs(page - currentPage) <= 2 ? 'flex' : 'none', md: 'flex' }}
          >
            {page}
          </Button>
        ))}
        
        <IconButton
          aria-label="Next page"
          icon={<ChevronRightIcon />}
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          borderColor="rgba(255, 255, 255, 0.1)"
          color="white"
          _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
          _disabled={{ opacity: 0.4 }}
        />
      </HStack>
    </Box>
  );
}; 