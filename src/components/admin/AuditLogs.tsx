import {
  Box,
  Container,
  Heading,
  Text,
  Badge,
  IconButton,
  useToast,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Select,
  Button,
  Avatar,
  Flex,
  Center,
  Skeleton,
  Stack,
  useMediaQuery,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { AuditLogEntry } from '../../utils/auditLogger';
import { DeleteIcon, SearchIcon, TimeIcon, ViewIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon, StarIcon, EditIcon, LockIcon, InfoIcon } from '@chakra-ui/icons';
import Breadcrumbs from '../Breadcrumbs';
import { motion, AnimatePresence } from 'framer-motion';
import { createStyledToast } from '../../utils/toast';

const MotionBox = motion(Box);

interface AuditLog extends Omit<AuditLogEntry, 'timestamp'> {
  id: string;
  timestamp: Date;
}

type FilterType = 'all' | 'create' | 'update' | 'delete';
type SortField = 'timestamp' | 'action' | 'adminUsername' | 'targetType';

const LOGS_PER_PAGE = 20;

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortAscending, setSortAscending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  
  const toast = useToast();
  const deleteDialog = useDisclosure();
  const detailsModal = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const logsQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(500)
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

  // Filter and sort logs
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.adminUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.action === filterType);
    }

    filtered = filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
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

      if (aValue < bValue) return sortAscending ? -1 : 1;
      if (aValue > bValue) return sortAscending ? 1 : -1;
      return 0;
    });

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, searchTerm, filterType, sortField, sortAscending]);

  const handleDeleteLog = async (logId: string) => {
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

  const handleSortChange = (newSortField: SortField) => {
    if (sortField === newSortField) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(newSortField);
      setSortAscending(newSortField === 'timestamp' ? false : true);
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

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <StarIcon />;
      case 'update':
        return <EditIcon />;
      case 'delete':
        return <DeleteIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType.toLowerCase()) {
      case 'user':
        return <LockIcon />;
      case 'event':
        return <CalendarIcon />;
      case 'character':
        return <StarIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderDetails = (details: string) => {
    if (!details) return null;
    
    const parts = details.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text as="span" fontWeight="bold" color="primary.300" key={index}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text as="span" key={index}>{part}</Text>;
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
  const endIndex = startIndex + LOGS_PER_PAGE;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const LogItem = ({ log, index }: { log: AuditLog; index: number }) => (
    <MotionBox
      key={log.id}
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
              onClick={() => {
                setSelectedLog(log);
                detailsModal.onOpen();
              }}
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
              onClick={() => {
                setLogToDelete(log);
                deleteDialog.onOpen();
              }}
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

  return (
    <Box minH="100vh" bg="background.primary">
      <Container maxW="7xl" px={{ base: 4, md: 8 }} py={8}>
        <Breadcrumbs />
        
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          mb={8}
        >
          <VStack spacing={6}>
            <VStack spacing={2} textAlign="center" mt={!isMobile ? 50 : 0}>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, primary.200, purple.200, primary.300)"
                bgClip="text"
                fontWeight="700"
              >
                Audit Logs
              </Heading>
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="md">
                Track all administrative actions and system changes
              </Text>
            </VStack>
            
            {/* Controls */}
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
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
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
                    value={sortField}
                    onChange={(e) => handleSortChange(e.target.value as SortField)}
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                    {filteredLogs.length} Log{filteredLogs.length !== 1 ? 's' : ''}
                  </Badge>
                  {totalPages > 1 && (
                    <Text color="rgba(255, 255, 255, 0.6)" fontSize="xs">
                      Page {currentPage} of {totalPages}
                    </Text>
                  )}
                </VStack>
              </Stack>
            </Box>
          </VStack>
        </MotionBox>

        {/* Logs List */}
        <Box
          bg="rgba(255, 255, 255, 0.02)"
          backdropFilter="blur(20px)"
          borderRadius="xl"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.05)"
          overflow="hidden"
        >
          {isLoading ? (
            <VStack spacing={0} p={4}>
              {[...Array(10)].map((_, i) => (
                <Box key={i} w="full" p={4} borderBottomWidth={i < 9 ? "1px" : "0"} borderColor="rgba(255, 255, 255, 0.05)">
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
          ) : filteredLogs.length === 0 ? (
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
                    <LogItem log={log} index={index} />
                  </Box>
                ))}
              </AnimatePresence>
            </VStack>
          )}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
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
                onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(page)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === totalPages}
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                _disabled={{ opacity: 0.4 }}
              />
            </HStack>
          </Box>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent 
            bg="rgba(255, 255, 255, 0.02)"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="2xl"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Audit Log
            </AlertDialogHeader>
            <AlertDialogBody color="text.secondary">
              Are you sure you want to delete this audit log entry? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={deleteDialog.onClose} 
                variant="ghost" 
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                borderRadius="xl"
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => {
                  if (logToDelete) {
                    handleDeleteLog(logToDelete.id);
                  }
                  deleteDialog.onClose();
                }} 
                ml={3}
                borderRadius="xl"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Details Modal */}
      <Modal isOpen={detailsModal.isOpen} onClose={detailsModal.onClose} size={{ base: 'full', md: 'lg' }} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent 
          bg="rgba(255, 255, 255, 0.02)"
          backdropFilter="blur(20px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderRadius="2xl"
          mx={{ base: 4, md: 0 }}
          my={{ base: 4, md: 0 }}
        >
          <ModalHeader color="white" fontWeight="700">
            Audit Log Details
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {selectedLog && (
              <VStack spacing={6} align="stretch">
                <Box
                  bg="rgba(255, 255, 255, 0.02)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.05)"
                  borderRadius="xl"
                  p={4}
                >
                  <HStack spacing={4} align="center" mb={3}>
                    <Box
                      p={3}
                      bg={`${getActionColor(selectedLog.action)}.500`}
                      borderRadius="lg"
                      color="white"
                    >
                      {getActionIcon(selectedLog.action)}
                    </Box>
                    <VStack align="flex-start" spacing={0}>
                      <Text color="white" fontWeight="600" fontSize="lg">
                        {selectedLog.action.toUpperCase()} Action
                      </Text>
                      <Text color="rgba(255, 255, 255, 0.6)" fontSize="sm">
                        {selectedLog.timestamp.toLocaleString()}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Box
                    bg="rgba(255, 255, 255, 0.02)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.05)"
                    borderRadius="xl"
                    p={4}
                    flex={1}
                  >
                    <Text color="white" fontWeight="600" mb={2}>Administrator</Text>
                    <Text color="rgba(255, 255, 255, 0.8)">{selectedLog.adminUsername}</Text>
                  </Box>

                  <Box
                    bg="rgba(255, 255, 255, 0.02)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.05)"
                    borderRadius="xl"
                    p={4}
                    flex={1}
                  >
                    <Text color="white" fontWeight="600" mb={2}>Target</Text>
                    <VStack align="flex-start" spacing={1}>
                      <Text color="rgba(255, 255, 255, 0.8)">{selectedLog.targetName}</Text>
                      <Badge colorScheme="gray" fontSize="xs">
                        {selectedLog.targetType}
                      </Badge>
                    </VStack>
                  </Box>
                </Flex>

                {selectedLog.details && (
                  <Box
                    bg="rgba(255, 255, 255, 0.02)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.05)"
                    borderRadius="xl"
                    p={4}
                  >
                    <Text color="white" fontWeight="600" mb={3}>Details</Text>
                    <Text color="rgba(255, 255, 255, 0.8)" lineHeight="1.6">
                      {renderDetails(selectedLog.details)}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AuditLogs; 