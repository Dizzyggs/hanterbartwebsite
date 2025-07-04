import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Flex,
} from '@chakra-ui/react';
import type { AuditLog } from '../types/auditLogTypes';
import { 
  getActionColor, 
  getActionIcon, 
  renderDetails 
} from '../utils/auditLogUtils';

interface AuditLogModalsProps {
  selectedLog: AuditLog | null;
  logToDelete: AuditLog | null;
  isDetailsModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  cancelRef: React.RefObject<HTMLButtonElement>;
  onDetailsModalClose: () => void;
  onDeleteDialogClose: () => void;
  onConfirmDelete: () => void;
}

export const AuditLogModals: React.FC<AuditLogModalsProps> = ({
  selectedLog,
  logToDelete,
  isDetailsModalOpen,
  isDeleteDialogOpen,
  cancelRef,
  onDetailsModalClose,
  onDeleteDialogClose,
  onConfirmDelete,
}) => {
  return (
    <>
      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsModalOpen} 
        onClose={onDetailsModalClose} 
        size={{ base: 'full', md: 'lg' }} 
        isCentered
      >
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteDialogClose}
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
                onClick={onDeleteDialogClose} 
                variant="ghost" 
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                borderRadius="xl"
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={onConfirmDelete}
                ml={3}
                borderRadius="xl"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}; 