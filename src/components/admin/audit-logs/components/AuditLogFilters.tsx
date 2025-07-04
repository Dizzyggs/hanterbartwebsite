import React from 'react';
import {
  Box,
  Stack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import type { 
  AuditLogFilters as FiltersType, 
  FilterType, 
  SortField 
} from '../types/auditLogTypes';

interface AuditLogFiltersProps {
  filters: FiltersType;
  filteredCount: number;
  totalPages: number;
  currentPage: number;
  onUpdateFilter: <K extends keyof FiltersType>(key: K, value: FiltersType[K]) => void;
  onSortChange: (sortField: SortField) => void;
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filters,
  filteredCount,
  totalPages,
  currentPage,
  onUpdateFilter,
  onSortChange,
}) => {
  return (
    <Box
      w="full"
      bg="rgba(255, 255, 255, 0.02)"
      backdropFilter="blur(20px)"
      borderRadius="xl"
      p={4}
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      <Stack 
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        align="center"
        justify="space-between"
      >
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} flex={1} w={{ base: 'full', md: 'auto' }}>
          <Select
            value={filters.filterType}
            onChange={(e) => onUpdateFilter('filterType', e.target.value as FilterType)}
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            color="white"
            borderRadius="lg"
            _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
            _focus={{ borderColor: 'primary.400' }}
            maxW={{ base: 'full', sm: '150px' }}
            size="sm"
            sx={{
              '> option': {
                bg: 'gray.800',
                color: 'white',
              }
            }}
          >
            <option value="all" style={{ backgroundColor: '#1a202c', color: 'white' }}>All Actions</option>
            <option value="create" style={{ backgroundColor: '#1a202c', color: 'white' }}>Create</option>
            <option value="update" style={{ backgroundColor: '#1a202c', color: 'white' }}>Update</option>
            <option value="delete" style={{ backgroundColor: '#1a202c', color: 'white' }}>Delete</option>
          </Select>
          
          <Select
            value={filters.sortField}
            onChange={(e) => onSortChange(e.target.value as SortField)}
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            color="white"
            borderRadius="lg"
            _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
            _focus={{ borderColor: 'primary.400' }}
            maxW={{ base: 'full', sm: '150px' }}
            size="sm"
            sx={{
              '> option': {
                bg: 'gray.800',
                color: 'white',
              }
            }}
          >
            <option value="timestamp" style={{ backgroundColor: '#1a202c', color: 'white' }}>Time</option>
            <option value="action" style={{ backgroundColor: '#1a202c', color: 'white' }}>Action</option>
            <option value="adminUsername" style={{ backgroundColor: '#1a202c', color: 'white' }}>Admin</option>
            <option value="targetType" style={{ backgroundColor: '#1a202c', color: 'white' }}>Type</option>
          </Select>
          
          <InputGroup maxW={{ base: 'full', sm: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="rgba(255, 255, 255, 0.5)" />
            </InputLeftElement>
            <Input
              placeholder="Search logs..."
              value={filters.searchTerm}
              onChange={(e) => onUpdateFilter('searchTerm', e.target.value)}
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="white"
              borderRadius="lg"
              _placeholder={{ color: 'rgba(255, 255, 255, 0.5)' }}
              _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
              _focus={{ borderColor: 'primary.400' }}
              size="sm"
            />
          </InputGroup>
        </Stack>
        
        <VStack spacing={1} align={{ base: 'center', md: 'flex-end' }}>
          <Badge
            colorScheme="primary"
            px={3}
            py={1}
            borderRadius="md"
            fontSize="sm"
            fontWeight="600"
          >
            {filteredCount} Log{filteredCount !== 1 ? 's' : ''}
          </Badge>
          {totalPages > 1 && (
            <Text color="rgba(255, 255, 255, 0.6)" fontSize="xs">
              Page {currentPage} of {totalPages}
            </Text>
          )}
        </VStack>
      </Stack>
    </Box>
  );
}; 