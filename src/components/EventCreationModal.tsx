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
  Text,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { CheckIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { collection, addDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import type { Event } from '../types/firebase';
import { raidHelperService } from '../services/raidhelper';
import { getDayInEnglish, getDefaultSettings } from '../tools/tools';
import { eventCreationSteps } from '../tools/tools';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: Event) => void;
}

export const EventCreationModal = ({ isOpen, onClose, onEventCreated }: EventCreationModalProps) => {
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: eventCreationSteps.length,
  });

  const [signupType, setSignupType] = useState<'raidhelper'>('raidhelper');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWeeklyRecurring, setIsWeeklyRecurring] = useState(false);
  const [defaultOccuring, setDefaultOccuring] = useState(1);
  const [recurringWeeks, setRecurringWeeks] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState<'main-raids' | 'events'>('main-raids');
  
  const { user } = useUser();
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  // Load default settings when modal opens
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const settings = await getDefaultSettings();
        if (settings?.defaultRaidTime) {
          setEventTime(settings.defaultRaidTime);
          // Set the date to today with the default time
          const today = new Date();
          const [hours, minutes] = settings.defaultRaidTime.split(':');
          today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          setEventDate(today.toISOString().split('T')[0]);
        }
        if (settings?.defaultReoccurrence) {
          const weeks = parseInt(settings.defaultReoccurrence);
          setDefaultOccuring(weeks);
          setRecurringWeeks(weeks);
        }
      } catch (error) {
        console.error('Error loading default settings:', error);
      }
    };

    if (isOpen) {
      loadDefaults();
    }
  }, [isOpen]);

  const createEvent = async (startDate: Date) => {
    try {
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration

      // Base event data for Firestore - Remove the internal id property
      const baseEventData = {
        title: eventTitle,
        description: eventDescription || '',
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
        updatedAt: Timestamp.now(),
        discordChannel: selectedChannel,
        raidComposition: {
          lastUpdated: new Date(),
          updatedBy: {
            userId: user!.id,
            username: user!.username
          },
          groups: [],
          benchedPlayers: []
        }
      };

      let finalEventData;

      if (signupType === 'raidhelper') {
        try {
          // Format data for RaidHelper
          const raidHelperData = {
            title: eventTitle,
            description: eventDescription || '',
            date: startDate.toISOString().split('T')[0],
            time: eventTime,
            leaderId: "184485021719986176",  // Your Discord ID
            templateId: "wowclassic",
            size: 25,
            roles: {
              tank: 2,
              healer: 5,
              dps: 18
            },
            discordChannel: selectedChannel
          };

          // Create RaidHelper event
          const raidHelperResponse = await raidHelperService.createEvent(raidHelperData);
          
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

      // console.log('Final event data being sent to Firestore:', JSON.stringify(finalEventData, null, 2));

      // Create the Firestore event
      const docRef = await addDoc(collection(db, 'events'), finalEventData);
      return { ...finalEventData, id: docRef.id };
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!eventTitle.trim()) {
          toast({
            title: 'Title is required',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return false;
        }
        return true;
      case 1:
        if (!eventDescription.trim()) {
          toast({
            title: 'Description is required',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return false;
        }
        return true;
      case 2:
        if (!eventDate) {
          toast({
            title: 'Please select a date',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return false;
        }
        if (!eventTime) {
          toast({
            title: 'Please select a time',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return false;
        }
        return true;
      case 3:
        if (!selectedChannel) {
          toast({
            title: 'Please select a Discord channel',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
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

    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const initialDate = new Date(`${eventDate}T${eventTime}`);
      const eventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: initialDate,
        signupType: 'raidhelper',
        createdBy: user.id,
        createdAt: serverTimestamp(),
      };

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
  };

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep < activeStep) return true;

    for (let step = 0; step < targetStep; step++) {
      switch (step) {
        case 0:
          if (eventTitle.trim() === '') return false;
          break;
        case 1:
          if (eventDescription.trim() === '') return false;
          break;
        case 2:
          if (eventDate === '' || eventTime === '') return false;
          break;
        case 3:
          if (!selectedChannel) return false;
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

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(activeStep + 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <FormControl isRequired>
            <FormLabel color="text.primary" fontSize="lg" mb={4}>Title</FormLabel>
            <Input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Type a event title"
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
      case 1:
        return (
          <FormControl isRequired>
            <FormLabel color="text.primary" fontSize="lg" mb={4}>
              Event description
            </FormLabel>
            <Textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Type a event description"
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
      case 2:
        return (
          <VStack spacing={6} align="stretch" width={"100%"}>
            <FormControl isRequired>
              <FormLabel color="text.primary" fontSize="lg" mb={4}>
                Date & Time
              </FormLabel>
              <VStack spacing={6}>
                <Box
                  bg="background.tertiary"
                  p={4}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="border.primary"
                  _hover={{ borderColor: 'primary.500', boxShadow: '0 0 10px var(--chakra-colors-primary-500)' }}
                  transition="all 0.2s"
                  width={"100%"}
                >
                  <Input
                    type="datetime-local"
                    value={`${eventDate}T${eventTime}`}
                    onChange={(e) => {
                      const [date, time] = e.target.value.split('T');
                      setEventDate(date);
                      setEventTime(time);
                    }}
                    size="lg"
                    bg="background.secondary"
                    border="1px solid"
                    borderColor="border.primary"
                    color="text.primary"
                    _hover={{ borderColor: 'primary.500' }}
                    _focus={{ 
                      borderColor: 'primary.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
                    }}
                  />
                </Box>

                <Box
                  w="100%"
                  bg="background.tertiary"
                  p={4}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="border.primary"
                  _hover={{ borderColor: 'primary.500', boxShadow: '0 0 10px var(--chakra-colors-primary-500)' }}
                  transition="all 0.2s"
                >
                  <VStack align="start" spacing={4}>
                    <Tooltip
                      label={eventDate 
                        ? `The same event will be created every ${getDayInEnglish(eventDate)} for the selected number of weeks`
                        : 'Select a date first'}
                      hasArrow
                      placement="bottom-start"
                      bg="background.secondary"
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
                      >
                        <Checkbox
                          isChecked={isWeeklyRecurring}
                          onChange={(e) => setIsWeeklyRecurring(e.target.checked)}
                          colorScheme="primary"
                          size="lg"
                          color="text.primary"
                        >
                          Weekly recurring
                        </Checkbox>
                      </HStack>
                    </Tooltip>
                    
                    {isWeeklyRecurring && (
                      <Box w="100%" pl={0}>
                        <FormControl w="200px">
                          <FormLabel color="text.primary" fontSize="sm" mb={2}>
                            Number of weeks
                          </FormLabel>
                          <HStack
                            bg="background.secondary"
                            p={1}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="border.primary"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                          >
                            <Button
                              size="sm"
                              onClick={() => setRecurringWeeks(prev => Math.max(1, prev - 1))}
                              bg="background.tertiary"
                              border="1px solid"
                              borderColor="border.primary"
                              color="text.primary"
                              _hover={{ bg: 'background.hover', borderColor: 'primary.500' }}
                              px={2}
                            >
                              -
                            </Button>
                            <Input
                              value={recurringWeeks}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                if (value === '') {
                                  setRecurringWeeks(1);
                                  return;
                                }
                                const numValue = parseInt(value);
                                const finalValue = Math.min(52, numValue);
                                setRecurringWeeks(finalValue);
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value);
                                if (value < 1) {
                                  setRecurringWeeks(1);
                                }
                              }}
                              size="sm"
                              bg="transparent"
                              border="none"
                              color="text.primary"
                              textAlign="center"
                              _hover={{ borderColor: 'primary.500' }}
                              _focus={{ 
                                border: 'none',
                                boxShadow: 'none'
                              }}
                              width="60px"
                              p={0}
                            />
                            <Button
                              size="sm"
                              onClick={() => setRecurringWeeks(prev => Math.min(52, prev + 1))}
                              bg="background.tertiary"
                              border="1px solid"
                              borderColor="border.primary"
                              color="text.primary"
                              _hover={{ bg: 'background.hover', borderColor: 'primary.500' }}
                              px={2}
                            >
                              +
                            </Button>
                          </HStack>
                        </FormControl>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </FormControl>
          </VStack>
        );
      case 3:
        return (
          <FormControl isRequired>
            <FormLabel color="text.primary" fontSize="lg" mb={4}>
              Discord Channel
            </FormLabel>
            <Text color="text.secondary" fontSize="md" mb={4}>
              Select which Discord channel the signup should be posted in
            </Text>
            <Select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as 'main-raids' | 'events')}
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
              icon={<ChevronDownIcon />}
              iconColor="text.primary"
              sx={{
                '> option': {
                  bg: 'background.secondary',
                  color: 'text.primary',
                },
                '&:hover > option:hover': {
                  bg: 'background.hover',
                  cursor: 'pointer'
                }
              }}
            >
              <option value="main-raids">#main-raids</option>
              <option value="events">#events</option>
            </Select>
          </FormControl>
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
            onClick={activeStep === eventCreationSteps.length - 1 ? handleSubmit : handleNext}
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