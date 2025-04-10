import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Box,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepTitle,
  StepDescription,
  StepNumber,
  useSteps,
  Icon,
  VStack,
  StepSeparator,
  useToast,
  Checkbox,
  HStack,
  Tooltip,
  Select,
  RadioGroup,
  Radio,
  Text,
  Flex,
  useDisclosure,
  useTheme,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { CheckIcon } from '@chakra-ui/icons';
import { collection, addDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import type { Event } from '../types/firebase';
import { raidHelperService } from '../services/raidhelper';
import { getDayInSwedish } from '../tools/tools';
import { eventCreationSteps } from '../tools/tools';
import { FaDiscord, FaCalendarAlt, FaPlus, FaTrash, FaEdit, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import SignupTypeStep from './CreateEventStepper/SignupTypeStep';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: Event) => void;
}

// const steps = [
//   {
//     title: 'Typ',
//     description: 'Välj hur spelare ska anmäla sig',
//   },
//   {
//     title: 'Titel',
//     description: '',
//   },
//   {
//     title: 'Beskrivning',
//     description: '',
//   },
//   {
//     title: 'Datum & Tid',
//     description: '',
//   },
// ];


export const EventCreationModal = ({ isOpen, onClose, onEventCreated }: EventCreationModalProps) => {
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: eventCreationSteps.length,
  });

  const [signupType, setSignupType] = useState<'manual' | 'raidhelper'>('raidhelper');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWeeklyRecurring, setIsWeeklyRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(1);
  
  const { user } = useUser();
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  const createEvent = async (startDate: Date) => {
    try {
      const eventId = doc(collection(db, 'events')).id;
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration

      // Base event data for Firestore
      const baseEventData = {
        id: eventId,
        title: eventTitle,
        description: eventDescription,
        date: startDate.toISOString().split('T')[0],
        time: eventTime,
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
        type: 'raid' as const,
        difficulty: 'normal' as const,
        maxPlayers: 40,
        signupType,
        signups: {},
        createdBy: user!.username,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      let finalEventData;

      if (signupType === 'raidhelper') {
        try {
          // Format data for RaidHelper
          const raidHelperData = {
            title: eventTitle,
            description: eventDescription,
            date: startDate.toISOString().split('T')[0],
            time: eventTime,
            leaderId: "184485021719986176",  // Your Discord ID
            templateId: "wowclassic",
            size: 25,
            roles: {
              tank: 2,
              healer: 5,
              dps: 18
            }
          };

          console.log('Creating RaidHelper event with data:', raidHelperData);
          
          // Create RaidHelper event
          const raidHelperResponse = await raidHelperService.createEvent(raidHelperData);
          console.log('RaidHelper API response:', raidHelperResponse);
          
          if (!raidHelperResponse) {
            throw new Error('No response from RaidHelper API');
          }

          // The response contains { event: { ... }, status: 'Event created!' }
          const raidHelperEvent = raidHelperResponse.event;
          
          if (!raidHelperEvent || (!raidHelperEvent.eventId && !raidHelperEvent.id)) {
            console.error('Invalid RaidHelper response:', raidHelperResponse);
            throw new Error('Invalid response from RaidHelper API: No event ID received');
          }

          // Combine with RaidHelper data
          finalEventData = {
            ...baseEventData,
            raidHelperId: raidHelperEvent.eventId || raidHelperEvent.id
          };
        } catch (error) {
          console.error('Error creating RaidHelper event:', error);
          throw error;
        }
      } else {
        // Manual signup - no RaidHelper ID needed
        finalEventData = {
          ...baseEventData,
          raidHelperId: null // Explicitly set to null for manual events
        };
      }

      // Create the Firestore event
      console.log('Creating Firestore event with data:', finalEventData);
      const docRef = await addDoc(collection(db, 'events'), finalEventData);
      return { ...finalEventData, id: docRef.id };
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    let isValid = false;
    switch (activeStep) {
      case 0:
        isValid = signupType === 'manual' || signupType === 'raidhelper';
        break;
      case 1:
        isValid = eventTitle.trim() !== '';
        break;
      case 2:
        isValid = eventDescription.trim() !== '';
        break;
      case 3:
        isValid = eventDate !== '' && eventTime !== '';
        break;
      default:
        isValid = false;
    }

    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all required fields before proceeding',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (activeStep === eventCreationSteps.length - 1) {
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create events',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const initialDate = new Date(`${eventDate}T${eventTime}`);
        
        if (isWeeklyRecurring) {
          // Create events for the specified number of weeks
          const events = [];
          let currentDate = new Date(initialDate);

          for (let i = 0; i < recurringWeeks; i++) {
            const event = await createEvent(currentDate);
            events.push(event);
            // Add 7 days for next week
            currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          }

          // Notify about all created events
          toast({
            title: 'Success',
            description: `Created ${events.length} recurring events successfully`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });

          // Pass the first event to the callback
          onEventCreated(events[0]);
        } else {
          // Create single event
          const event = await createEvent(initialDate);
          onEventCreated(event);
          
          toast({
            title: 'Success',
            description: 'Event created successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }

        // Reset form and close modal
        setEventTitle('');
        setEventDate('');
        setEventTime('');
        setEventDescription('');
        setIsWeeklyRecurring(false);
        onClose();
      } catch (error) {
        console.error('Error creating event:', error);
        toast({
          title: 'Error',
          description: 'Failed to create event. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep < activeStep) return true;

    for (let step = 0; step < targetStep; step++) {
      switch (step) {
        case 0:
          if (!(signupType === 'manual' || signupType === 'raidhelper')) return false;
          break;
        case 1:
          if (eventTitle.trim() === '') return false;
          break;
        case 2:
          if (eventDescription.trim() === '') return false;
          break;
        case 3:
          if (eventDate === '' || eventTime === '') return false;
          break;
      }
    }
    return true;
  };

  const handleStepClick = (index: number) => {
    if (canNavigateToStep(index)) {
      setActiveStep(index);
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please complete the current step before proceeding',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel color="text.primary" fontSize="lg" mb={4}>
                Anmälningstyp
              </FormLabel>
              <SignupTypeStep 
                signupType={signupType} 
                setSignupType={(value) => setSignupType(value as 'manual' | 'raidhelper')} 
              />
            </FormControl>
          </VStack>
        );
      case 1:
        return (
          <FormControl isRequired>
            <FormLabel color="text.primary" fontSize="lg" mb={4}>Titel</FormLabel>
            <Input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Ange titel"
              size="lg"
              bg="background.tertiary"
              border="1px solid"
              borderColor="border.primary"
              color="text.primary"
              _placeholder={{ color: 'whiteAlpha.400' }}
              _hover={{ borderColor: 'primary.500' }}
              _focus={{ 
                borderColor: 'primary.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
              }}
            />
          </FormControl>
        );
      case 2:
        return (
          <FormControl isRequired>
            <FormLabel color="text.primary" fontSize="lg" mb={4}>
              Eventbeskrivning
            </FormLabel>
            <Textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Ange eventbeskrivning"
              size="lg"
              bg="background.tertiary"
              border="1px solid"
              borderColor="border.primary"
              color="text.primary"
              _placeholder={{ color: 'whiteAlpha.400' }}
              _hover={{ borderColor: 'primary.500' }}
              _focus={{ 
                borderColor: 'primary.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
              }}
              minH="200px"
            />
          </FormControl>
        );
      case 3:
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel color="text.primary" fontSize="lg" mb={4}>
                Datum & Tid
              </FormLabel>
              <VStack spacing={4}>
                <Input
                  type="datetime-local"
                  value={`${eventDate}T${eventTime}`}
                  onChange={(e) => {
                    const [date, time] = e.target.value.split('T');
                    setEventDate(date);
                    setEventTime(time);
                  }}
                  size="lg"
                  bg="background.tertiary"
                  border="1px solid"
                  borderColor="border.primary"
                  color="text.primary"
                  _hover={{ borderColor: 'primary.500' }}
                  _focus={{ 
                    borderColor: 'primary.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                  }}
                />
                <Box w="100%">
                  <VStack align="start" spacing={3}>
                    <Tooltip
                      label={eventDate 
                        ? `Samma event kommer skapas varje ${getDayInSwedish(eventDate)} för valt antal veckor`
                        : 'Välj ett datum först'}
                      hasArrow
                      placement="bottom-start"
                      bg="background.tertiary"
                      color="text.primary"
                      px={4}
                      py={2}
                      borderRadius="md"
                      boxShadow="lg"
                      border="1px solid"
                      borderColor="border.primary"
                    >
                      <HStack
                        as="label"
                        cursor="pointer"
                        spacing={3}
                        _hover={{ color: 'primary.400' }}
                        transition="color 0.2s"
                        pl={1}
                      >
                        <Checkbox
                          isChecked={isWeeklyRecurring}
                          onChange={(e) => setIsWeeklyRecurring(e.target.checked)}
                          colorScheme="primary"
                          size="lg"
                          color="text.primary"
                        >
                          Veckovis återkommande
                        </Checkbox>
                      </HStack>
                    </Tooltip>
                    
                    {isWeeklyRecurring && (
                      <HStack spacing={3} pl={10}>
                        <FormControl w="150px">
                          <FormLabel color="text.primary" fontSize="sm">
                            Antal veckor
                          </FormLabel>
                          <Input
                            type="number"
                            min={1}
                            max={52}
                            value={recurringWeeks}
                            onChange={(e) => setRecurringWeeks(Math.min(52, Math.max(1, parseInt(e.target.value) || 1)))}
                            size="sm"
                            bg="background.tertiary"
                            border="1px solid"
                            borderColor="border.primary"
                            color="text.primary"
                            _hover={{ borderColor: 'primary.500' }}
                            _focus={{ 
                              borderColor: 'primary.500',
                              boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                            }}
                          />
                        </FormControl>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </FormControl>
          </VStack>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent 
        bg="background.secondary"
        boxShadow="dark-lg"
        borderRadius="xl"
        border="1px solid"
        borderColor="border.primary"
      >
        <ModalHeader 
          color="text.primary"
          borderBottom="1px solid"
          borderColor="border.primary"
          fontSize="xl"
          py={4}
        >
          Create New Event
        </ModalHeader>
        <ModalBody py={6}>
          <Box mb={8} overflowX="auto" px={2}>
            <Stepper 
              index={activeStep} 
              colorScheme="primary"
              size="sm"
              gap={0}
              w="100%"
              overflowX={"hidden"}
            >
              {eventCreationSteps.map((step, index) => (
                <Step 
                  key={index} 
                  cursor={canNavigateToStep(index) ? "pointer" : "not-allowed"}
                  onClick={() => handleStepClick(index)}
                  opacity={canNavigateToStep(index) ? 1 : 0.6}
                  transition="all 0.2s"
                  _hover={{
                    opacity: canNavigateToStep(index) ? 0.8 : 0.6
                  }}
                  display="flex"
                  alignItems="center"
                  flex={1}
                >
                  <HStack spacing={2} flex="0 0 auto">
                    <StepIndicator
                      bg={activeStep > index ? 'primary.500' : activeStep === index ? 'transparent' : 'background.tertiary'}
                      border={activeStep === index ? '2px solid' : 'none'}
                      borderColor={activeStep === index ? 'primary.500' : 'transparent'}
                      boxShadow={activeStep === index ? 
                        'inset 0 0 10px var(--chakra-colors-primary-500), 0 0 15px var(--chakra-colors-primary-500)' : 
                        'none'}
                      transition="all 0.2s"
                    >
                      <StepStatus
                        complete={<Icon as={CheckIcon} color="white" />}
                        incomplete={<StepNumber color={activeStep === index ? "primary.400" : "text.secondary"} 
                          sx={activeStep === index ? {
                            textShadow: '0 0 10px var(--chakra-colors-primary-400)',
                            filter: 'brightness(1.2)',
                          } : {}}
                        />}
                        active={<StepNumber color="primary.400" 
                          sx={{
                            textShadow: '0 0 10px var(--chakra-colors-primary-400)',
                            filter: 'brightness(1.2)',
                          }}
                        />}
                      />
                    </StepIndicator>

                    <Box>
                      <StepTitle
                        color={activeStep === index ? "primary.400" : "text.primary"}
                        fontSize="sm"
                        fontWeight="semibold"
                        transition="all 0.2s"
                        sx={activeStep === index ? {
                          textShadow: '0 0 10px var(--chakra-colors-primary-400)',
                          filter: 'brightness(1.2)',
                        } : {}}
                      >
                        {step.title}
                      </StepTitle>
                      <StepDescription
                        color="text.secondary"
                        fontSize="xs"
                      >
                        {step.description}
                      </StepDescription>
                    </Box>
                  </HStack>

                  {index < eventCreationSteps.length - 1 && (
                    <StepSeparator 
                      flex={1}
                      bg={activeStep > index ? 'primary.500' : 'border.primary'} 
                      height="1px"
                      mx={2}
                    />
                  )}
                </Step>
              ))}
            </Stepper>
          </Box>

          <VStack spacing={4} px={2}>
            {renderStepContent()}
          </VStack>
        </ModalBody>

        <ModalFooter 
          borderTop="1px solid" 
          borderColor="border.primary"
          py={4}
        >
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            color="text.primary"
            _hover={{ bg: 'background.hover' }}
          >
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleNext}
            isDisabled={!canNavigateToStep(activeStep)}
            isLoading={isSubmitting}
          >
            {activeStep === eventCreationSteps.length - 1 ? 'Create Event' : 'Next'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 