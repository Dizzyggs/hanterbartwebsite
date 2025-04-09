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
} from '@chakra-ui/react';
import { useState } from 'react';
import { CheckIcon } from '@chakra-ui/icons';
import { collection, addDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import type { Event } from '../types/firebase';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: Event) => void;
}

const steps = [
  {
    title: 'Titel',
    description: '',
  },
  {
    title: 'Datum',
    description: '',
  },
  {
    title: 'Välj tid',
    description: '',
  },
  {
    title: 'Beskrivning',
    description: '',
  },
];

const getDayInSwedish = (date: string) => {
  const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  const dayIndex = new Date(date).getDay();
  return days[dayIndex];
};

export const EventCreationModal = ({ isOpen, onClose, onEventCreated }: EventCreationModalProps) => {
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWeeklyRecurring, setIsWeeklyRecurring] = useState(false);
  
  const { user } = useUser();
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  const createEvent = async (startDate: Date) => {
    const eventId = doc(collection(db, 'events')).id;
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

    const newEvent: Event = {
      id: eventId,
      title: eventTitle,
      description: eventDescription,
      date: startDate.toISOString().split('T')[0],
      time: eventTime,
      start: Timestamp.fromDate(startDate),
      end: Timestamp.fromDate(endDate),
      type: 'raid',
      difficulty: 'normal',
      maxPlayers: 40,
      signups: {},
      createdBy: user!.username,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'events'), newEvent);
    return { ...newEvent, id: docRef.id };
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    let isValid = false;
    switch (activeStep) {
      case 0:
        isValid = eventTitle.trim() !== '';
        break;
      case 1:
        isValid = eventDate !== '';
        break;
      case 2:
        isValid = eventTime !== '';
        break;
      case 3:
        isValid = eventDescription.trim() !== '';
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

    if (activeStep === steps.length - 1) {
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
          // Create events for the remainder of the year
          const currentYear = initialDate.getFullYear();
          const endOfYear = new Date(currentYear, 11, 31); // December 31st
          const events = [];
          let currentDate = new Date(initialDate);

          while (currentDate <= endOfYear) {
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
    // Can always go back
    if (targetStep < activeStep) return true;

    // Check all previous steps are valid before allowing forward navigation
    for (let step = 0; step < targetStep; step++) {
      switch (step) {
        case 0:
          if (eventTitle.trim() === '') return false;
          break;
        case 1:
          if (eventDate === '') return false;
          break;
        case 2:
          if (eventTime === '') return false;
          break;
        case 3:
          if (eventDescription.trim() === '') return false;
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
          <FormControl isRequired>
            <FormLabel color="text.primary" fontSize="lg" mb={4}>
              Eventtitel
            </FormLabel>
            <Input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Ange eventtitel"
              size="lg"
              bg="background.tertiary"
              border="1px solid"
              borderColor="border.primary"
              color="text.primary"
              _placeholder={{ color: 'text.secondary' }}
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
          <VStack spacing={4} align="stretch" w={"100%"}>
            <FormControl isRequired>
              <FormLabel color="text.primary" fontSize="lg" mb={4}>
                Eventdatum
              </FormLabel>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
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
            </FormControl>
            <Box>
              <Tooltip
                label={eventDate 
                  ? `Samma event kommer skapas varje ${getDayInSwedish(eventDate)} för resten av året`
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
                openDelay={200}
                closeDelay={0}
                closeOnClick={true}
                isDisabled={false}
                offset={[0, 10]}
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
            </Box>
          </VStack>
        );
      case 2:
        return (
          <FormControl isRequired>
            <FormLabel color="text.primary" fontSize="lg" mb={4}>
              Eventtid (CEST)
            </FormLabel>
            <Input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              size="lg"
              bg="background.tertiary"
              border="1px solid"
              borderColor="border.primary"
              color="text.primary"
              _hover={{ borderColor: 'primary.500' }}
              _focus={{ 
                borderColor: 'primary.500',
                boxShadow: '0 0 0 1px #63B3ED'
              }}
            />
          </FormControl>
        );
      case 3:
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
              _placeholder={{ color: 'text.secondary' }}
              _hover={{ borderColor: 'primary.500' }}
              _focus={{ 
                borderColor: 'primary.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)'
              }}
              minH="200px"
            />
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
            >
              {steps.map((step, index) => (
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

                  {index < steps.length - 1 && (
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
            {activeStep === steps.length - 1 ? 'Create Event' : 'Next'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 