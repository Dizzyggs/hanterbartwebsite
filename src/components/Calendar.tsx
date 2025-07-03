import { 
  Box, 
  Container, 
  Heading, 
  Button, 
  HStack, 
  Text, 
  useDisclosure, 
  Flex, 
  VStack,
  SimpleGrid,
  Badge,
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useToast,
  Avatar,
  AvatarGroup,
  Fade,
  ScaleFade
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventCreationModal } from './EventCreationModal';
import { EventSignupModal } from './EventSignupModal';
import { useUser } from '../context/UserContext';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useEffect, useState } from 'react';
import type { Event } from '../types/firebase';
import { 
  AddIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  TimeIcon,
  StarIcon,
  ViewIcon
} from '@chakra-ui/icons';
import Breadcrumbs from './Breadcrumbs';
import { useTheme } from '../context/ThemeContext';
import { ThemeName } from '../theme';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  parseISO,
  getDay
} from 'date-fns';

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionFlex = motion(Flex);

interface CalendarEvent extends Event {
  start: Date;
  end: Date;
}

const Calendar = () => {
  const { user } = useUser();
  const { currentTheme } = useTheme();
  const { isOpen: isEventModalOpen, onOpen: onEventModalOpen, onClose: onEventModalClose } = useDisclosure();
  const { isOpen: isSignupModalOpen, onOpen: onSignupModalOpen, onClose: onSignupModalClose } = useDisclosure();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const toast = useToast();

  // Fetch events from Firestore
  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Use 'start' and 'end' fields, not 'startTime' and 'endTime'
        let startDate: Date;
        let endDate: Date;
        
        if (data.start instanceof Timestamp) {
          startDate = data.start.toDate();
        } else if (typeof data.start === 'string') {
          startDate = parseISO(data.start);
        } else if (data.date && data.time) {
          // Fallback: construct from date and time
          startDate = new Date(`${data.date}T${data.time}`);
        } else {
          console.warn('Could not parse start date for event:', data);
          return null;
        }
        
        if (data.end instanceof Timestamp) {
          endDate = data.end.toDate();
        } else if (typeof data.end === 'string') {
          endDate = parseISO(data.end);
        } else {
          // Fallback: add 3 hours to start time
          endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
        }
        
        const event = {
          id: doc.id,
          ...data,
          start: startDate,
          end: endDate,
        } as CalendarEvent;
      
        return event;
      }).filter(event => event !== null);
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let currentDay = startDate;

    while (currentDay <= endDate) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    onSignupModalOpen();
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Week days
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Container maxW="container.xl" py={8}>
      <Breadcrumbs />
      
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
          <MotionBox
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Heading 
              size="2xl" 
              color="text.primary"
              bgGradient={`linear(to-r, primary.400, primary.600)`}
              bgClip="text"
              letterSpacing="tight"
            >
              Calendar
            </Heading>
            <Text color="text.secondary" fontSize="lg" mt={1}>
              {format(currentDate, 'MMMM yyyy')}
            </Text>
          </MotionBox>

          <HStack spacing={4}>
            <HStack spacing={2}>
              <IconButton
                aria-label="Previous month"
                icon={<ChevronLeftIcon />}
                onClick={goToPreviousMonth}
                variant="ghost"
                size="sm"
                color="text.secondary"
                _hover={{ color: 'primary.400', bg: 'background.tertiary' }}
              />
              <Button
                onClick={goToToday}
                size="sm"
                variant="ghost"
                color="text.secondary"
                _hover={{ color: 'primary.400', bg: 'background.tertiary' }}
              >
                Today
              </Button>
              <IconButton
                aria-label="Next month"
                icon={<ChevronRightIcon />}
                onClick={goToNextMonth}
                variant="ghost"
                size="sm"
                color="text.secondary"
                _hover={{ color: 'primary.400', bg: 'background.tertiary' }}
              />
            </HStack>

            {user?.role === 'admin' && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="primary"
                onClick={onEventModalOpen}
                size="sm"
                bg="primary.500"
                _hover={{ bg: 'primary.600' }}
              >
                Create Event
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Calendar Grid */}
        <MotionCard
          bg="background.secondary"
          borderColor="border.primary"
          borderWidth={1}
          borderRadius="xl"
          overflow="hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CardBody p={0}>
            {/* Week day headers */}
            <SimpleGrid columns={7} bg="background.tertiary" borderBottom="1px" borderColor="border.primary">
              {weekDays.map(day => (
                <Box
                  key={day}
                  p={4}
                  textAlign="center"
                  borderRight="1px"
                  borderColor="border.primary"
                  _last={{ borderRight: 'none' }}
                >
                  <Text 
                    color="text.secondary" 
                    fontSize="sm" 
                    fontWeight="semibold"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {day}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            {/* Calendar days */}
            <SimpleGrid columns={7} minH="400px">
              <AnimatePresence mode="wait">
                {generateCalendarDays().map((day, index) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);

                  return (
                    <MotionBox
                      key={day.toString()}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.01 }}
                      borderRight="1px"
                      borderBottom="1px"
                      borderColor="border.primary"
                      _last={{ borderRight: 'none' }}
                      minH="120px"
                      position="relative"
                      bg={isDayToday ? 'whiteAlpha.50' : 'transparent'}
                      borderLeftWidth={isDayToday ? '3px' : '0px'}
                      borderLeftColor={isDayToday ? 'primary.400' : 'transparent'}
                      _hover={{
                        bg: isDayToday ? 'whiteAlpha.100' : 'background.tertiary',
                        cursor: 'pointer'
                      }}
                    >
                      <VStack spacing={2} p={2} h="full" align="stretch">
                        {/* Date number */}
                        <Flex justify="space-between" align="center">
                          <Text
                            fontSize="sm"
                            fontWeight={isDayToday ? 'bold' : 'medium'}
                            color={
                              isDayToday 
                                ? 'white' 
                                : isCurrentMonth 
                                  ? 'text.primary' 
                                  : 'text.secondary'
                            }
                            opacity={isCurrentMonth ? 1 : 0.4}
                          >
                            {format(day, 'd')}
                          </Text>
                          
                          {dayEvents.length > 0 && (
                            <Badge
                              size="sm"
                              colorScheme={isDayToday ? 'whiteAlpha' : 'primary'}
                              variant={isDayToday ? 'solid' : 'subtle'}
                              fontSize="xs"
                            >
                              {dayEvents.length}
                            </Badge>
                          )}
                        </Flex>

                        {/* Events */}
                        <VStack spacing={1} flex={1} align="stretch" maxH="80px" overflowY="auto">
                          {dayEvents.map((event, eventIndex) => (
                            <ScaleFade
                              key={event.id}
                              in={true}
                              initialScale={0.9}
                            >
                              <Box
                                bg="primary.500"
                                borderRadius="md"
                                p={2}
                                cursor="pointer"
                                onClick={() => handleEventClick(event)}
                                _hover={{
                                  bg: 'primary.600',
                                  transform: 'translateY(-1px)',
                                  boxShadow: 'lg'
                                }}
                                transition="all 0.2s"
                                position="relative"
                                overflow="hidden"
                                minH="fit-content"
                                flexShrink={0}
                              >
                                <Text
                                  fontSize="xs"
                                  fontWeight="medium"
                                  color="white"
                                  isTruncated
                                  lineHeight="1.2"
                                >
                                  {event.title}
                                </Text>
                                <Text
                                  fontSize="xs"
                                  color="whiteAlpha.800"
                                  isTruncated
                                >
                                  {format(event.start, 'HH:mm')}
                                </Text>
                              </Box>
                            </ScaleFade>
                          ))}
                        </VStack>
                      </VStack>
                    </MotionBox>
                  );
                })}
              </AnimatePresence>
            </SimpleGrid>
          </CardBody>
        </MotionCard>
      </MotionBox>

      {/* Modals */}
      <EventCreationModal 
        isOpen={isEventModalOpen} 
        onClose={onEventModalClose}
        onEventCreated={() => {
          onEventModalClose();
        }}
      />
      
      {selectedEvent && (
        <EventSignupModal 
          event={selectedEvent} 
          isOpen={isSignupModalOpen} 
          onClose={onSignupModalClose}
          onSignupChange={() => {
            // Handle signup change if needed
          }}
        />
      )}
    </Container>
  );
};

export default Calendar; 