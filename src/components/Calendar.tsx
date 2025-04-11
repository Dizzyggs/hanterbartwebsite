import { Box, Container, Heading, Button, HStack, Text, useDisclosure, Flex } from '@chakra-ui/react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { EventCreationModal } from './EventCreationModal';
import { EventSignupModal } from './EventSignupModal';
import { useUser } from '../context/UserContext';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useEffect, useState } from 'react';
import type { Event } from '../types/firebase';
import { AddIcon } from '@chakra-ui/icons';
import Breadcrumbs from './Breadcrumbs';

const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionFlex = motion(Flex);

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Custom styling for the calendar
const calendarStyles = `
  .rbc-calendar {
    background: var(--chakra-colors-background-secondary);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    position: relative;
  }
  .rbc-header {
    padding: 0.5rem;
    background: var(--chakra-colors-background-tertiary);
    color: var(--chakra-colors-text-primary);
    font-weight: 600;
    border: none;
    font-size: 0.75rem;
  }
  @media (min-width: 768px) {
    .rbc-header {
      padding: 1rem;
      font-size: 0.875rem;
    }
  }
  .rbc-month-view {
    border: none;
    background: var(--chakra-colors-background-tertiary);
    border-radius: 0.5rem;
  }
  .rbc-day-bg {
    background: var(--chakra-colors-background-secondary);
    transition: all 0.2s;
  }
  .rbc-day-bg:hover {
    background: var(--chakra-colors-background-tertiary);
  }
  .rbc-off-range-bg {
    background: var(--chakra-colors-background-primary);
  }
  .rbc-today {
    background: var(--chakra-colors-primary-700) !important;
  }
  .rbc-event {
    background: var(--chakra-colors-primary-500);
    border: none;
    border-radius: 0.375rem;
    padding: 0.25rem;
    transition: all 0.2s;
    font-size: 0.75rem;
  }
  @media (min-width: 768px) {
    .rbc-event {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
  }
  .rbc-event:hover {
    background: var(--chakra-colors-primary-600);
    transform: translateY(-1px);
  }
  .rbc-toolbar button {
    color: var(--chakra-colors-text-primary);
    background: var(--chakra-colors-background-tertiary);
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    transition: all 0.2s;
    font-size: 0.75rem;
  }
  @media (min-width: 768px) {
    .rbc-toolbar button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
  }
  .rbc-toolbar button:hover {
    background: var(--chakra-colors-background-hover);
  }
  .rbc-toolbar button.rbc-active {
    background: var(--chakra-colors-primary-500);
  }
  .rbc-toolbar {
    margin-bottom: 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    position: relative;
  }
  @media (min-width: 768px) {
    .rbc-toolbar {
      margin-bottom: 2rem;
      flex-direction: row;
      align-items: center;
      gap: 0;
    }
  }
  .rbc-month-row {
    border-color: var(--chakra-colors-border-primary);
  }
  .rbc-day-bg + .rbc-day-bg {
    border-color: var(--chakra-colors-border-primary);
  }
  .rbc-month-header {
    margin-bottom: 0.5rem;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .rbc-date-cell {
    padding: 0.25rem;
    font-size: 0.75rem;
    color: var(--chakra-colors-text-primary);
  }
  @media (min-width: 768px) {
    .rbc-date-cell {
      padding: 0.5rem;
      font-size: 0.875rem;
    }
  }
  .create-event-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 1;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: var(--chakra-colors-primary-500);
    color: white;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .create-event-button:hover {
    background: var(--chakra-colors-primary-600);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  }
  .create-event-button svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

interface CalendarEvent extends Event {
  start: Date;
  end: Date;
}

const Calendar = () => {
  const { user } = useUser();
  const { isOpen: isEventModalOpen, onOpen: onEventModalOpen, onClose: onEventModalClose } = useDisclosure();
  const { isOpen: isSignupModalOpen, onOpen: onSignupModalOpen, onClose: onSignupModalClose } = useDisclosure();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        const eventData = doc.data() as Event;
        let startDate: Date;
        let endDate: Date;

        // Handle Firestore Timestamp or string date
        if (eventData.start instanceof Timestamp) {
          startDate = eventData.start.toDate();
          endDate = eventData.end instanceof Timestamp 
            ? eventData.end.toDate() 
            : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
        } else {
          startDate = new Date(`${eventData.date}T${eventData.time}`);
          endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
        }

        eventsList.push({
          ...eventData,
          id: doc.id,
          start: startDate,
          end: endDate,
        });
      });
      setEvents(eventsList);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectEvent = (calendarEvent: CalendarEvent) => {
    setSelectedEvent(calendarEvent);
    onSignupModalOpen();
  };

  return (
    <Box 
      minH="calc(100vh - 4rem)"
      bgGradient="linear(to-br, background.primary, background.secondary)"
      py={8}
      pt="80px"
    >
      <Container maxW="7xl">
        <Breadcrumbs />
        <style>{calendarStyles}</style>
        <MotionFlex
          justify="space-between"
          align={{ base: "center", md: "center" }}
          mb={{ base: 4, md: 8 }}
          direction={{ base: "column", md: "row" }}
          gap={{ base: 4, md: 0 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MotionHeading
            color="white"
            fontSize={{ base: "2xl", md: "4xl" }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Guild Events Kalender
          </MotionHeading>
        </MotionFlex>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Box position="relative">
            {user?.role === 'admin' && (
              <Button
                leftIcon={<AddIcon />}
                position="absolute"
                top="1.5rem"
                right="1.5rem"
                zIndex={2}
                size="sm"
                colorScheme="primary"
                onClick={onEventModalOpen}
                fontSize="sm"
                px={4}
                py={2}
                h="auto"
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg',
                }}
                transition="all 0.2s"
              >
                Skapa Event
              </Button>
            )}
            <BigCalendar<CalendarEvent>
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100vh - 12rem)' }}
              onSelectEvent={handleSelectEvent}
              views={['month']}
              defaultView={Views.MONTH}
            />
          </Box>
        </MotionBox>

        <EventCreationModal
          isOpen={isEventModalOpen}
          onClose={onEventModalClose}
          onEventCreated={() => {
            onEventModalClose();
          }}
        />

        {selectedEvent && (
          <EventSignupModal
            isOpen={isSignupModalOpen}
            onClose={onSignupModalClose}
            event={selectedEvent}
            onSignupChange={() => {
              // Handle signup change if needed
            }}
          />
        )}
      </Container>
    </Box>
  );
};

export default Calendar; 