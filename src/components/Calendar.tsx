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
import { useTheme } from '../context/ThemeContext';
import { ThemeName } from '../theme';

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

// Theme-specific gradients and colors
const themeStyles: Record<ThemeName, {
  gradient: string;
  glow: string;
  accent: string;
}> = {
  default: {
    gradient: "linear(to-br, #0F172A, #1E293B)",
    glow: "rgba(31, 87, 255, 0.1)",
    accent: "#2196F3"
  },
  frost: {
    gradient: "linear(to-br, #1A1F2E, #1E2538)",
    glow: "rgba(76, 137, 255, 0.1)",
    accent: "#4C89FF"
  },
  ember: {
    gradient: "linear(to-br, #1F1A1A, #251E1E)",
    glow: "rgba(255, 126, 47, 0.1)",
    accent: "#FF7E2F"
  },
  neon: {
    gradient: "linear(to-br, #0A0F0A, #121712)",
    glow: "rgba(0, 224, 80, 0.1)",
    accent: "#00E050"
  }
};

interface CalendarEvent extends Event {
  start: Date;
  end: Date;
}

const Calendar = () => {
  const { user } = useUser();
  const { currentTheme } = useTheme();
  const theme = themeStyles[currentTheme];
  const { isOpen: isEventModalOpen, onOpen: onEventModalOpen, onClose: onEventModalClose } = useDisclosure();
  const { isOpen: isSignupModalOpen, onOpen: onSignupModalOpen, onClose: onSignupModalClose } = useDisclosure();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const calendarStyles = `
    .rbc-calendar {
      background: ${currentTheme === 'neon' ? 'rgba(10, 15, 10, 0.8)' : 
                  currentTheme === 'ember' ? 'rgba(31, 26, 26, 0.8)' :
                  currentTheme === 'frost' ? 'rgba(26, 31, 46, 0.8)' :
                  'rgba(26, 32, 44, 0.8)'};
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 0 32px ${theme.glow};
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    }

    .rbc-calendar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, 
        ${theme.accent}00 0%,
        ${theme.accent}CC 50%,
        ${theme.accent}00 100%
      );
      animation: scanline 4s linear infinite;
    }

    @keyframes scanline {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .rbc-header {
      padding: 1rem;
      background: ${currentTheme === 'neon' ? 'rgba(10, 15, 10, 0.9)' : 
                   currentTheme === 'ember' ? 'rgba(31, 26, 26, 0.9)' :
                   currentTheme === 'frost' ? 'rgba(26, 31, 46, 0.9)' :
                   'rgba(26, 32, 44, 0.9)'};
      color: ${theme.accent};
      font-weight: 600;
      border: none;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid ${theme.accent}33;
    }

    .rbc-month-view {
      border: none;
      background: transparent;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .rbc-day-bg {
      background: ${currentTheme === 'neon' ? 'rgba(10, 15, 10, 0.5)' : 
                   currentTheme === 'ember' ? 'rgba(31, 26, 26, 0.5)' :
                   currentTheme === 'frost' ? 'rgba(26, 31, 46, 0.5)' :
                   'rgba(26, 32, 44, 0.5)'};
      transition: all 0.3s ease;
      border: 1px solid ${theme.accent}1A;
    }

    .rbc-day-bg:hover {
      background: ${theme.accent}1A;
    }

    .rbc-off-range-bg {
      background: ${currentTheme === 'neon' ? 'rgba(10, 15, 10, 0.3)' : 
                   currentTheme === 'ember' ? 'rgba(31, 26, 26, 0.3)' :
                   currentTheme === 'frost' ? 'rgba(26, 31, 46, 0.3)' :
                   'rgba(26, 32, 44, 0.3)'};
    }

    .rbc-today {
      background: ${theme.accent}26 !important;
      position: relative;
    }

    .rbc-today::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, 
        ${theme.accent}00 0%,
        ${theme.accent} 50%,
        ${theme.accent}00 100%
      );
    }

    .rbc-event {
      background: linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC);
      border: none;
      border-radius: 0.5rem;
      padding: 0.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      font-size: 0.875rem;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .rbc-event:hover {
      transform: translateY(-2px) scale(1.02);
      background: linear-gradient(135deg, ${theme.accent}CC, ${theme.accent});
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        0 0 16px ${theme.accent}40;
    }

    .rbc-toolbar {
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: space-between;
      position: relative;
    }

    .rbc-toolbar button {
      color: #E2E8F0;
      background: ${theme.accent}1A;
      border: 1px solid ${theme.accent}33;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      transition: all 0.3s ease;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.875rem;
    }

    .rbc-toolbar button:hover {
      background: ${theme.accent}26;
      border-color: ${theme.accent}4D;
      transform: translateY(-1px);
    }

    .rbc-toolbar button.rbc-active {
      background: linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC);
      border-color: ${theme.accent}66;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .rbc-month-row {
      border-color: ${theme.accent}1A;
    }

    .rbc-date-cell {
      padding: 0.75rem;
      font-size: 0.875rem;
      color: #E2E8F0;
      font-weight: 500;
    }

    .rbc-date-cell.rbc-now {
      color: ${theme.accent};
      font-weight: 600;
    }

    .create-event-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 1;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      background: linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC);
      color: white;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .create-event-button:hover {
      transform: translateY(-2px);
      background: linear-gradient(135deg, ${theme.accent}CC, ${theme.accent});
      box-shadow: 
        0 6px 16px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        0 0 20px ${theme.accent}40;
    }

    .create-event-button svg {
      width: 1rem;
      height: 1rem;
    }

    @media (max-width: 768px) {
      .rbc-calendar {
        padding: 1rem;
        border-radius: 1rem;
      }

      .rbc-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .rbc-toolbar button {
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
      }

      .rbc-header {
        padding: 0.5rem;
        font-size: 0.75rem;
      }

      .rbc-date-cell {
        padding: 0.5rem;
        font-size: 0.75rem;
      }

      .create-event-button {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        top: auto;
      }
    }
  `;

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
      height={"100vh"}
      overflowY={"auto"}
      pb={"5rem"}
      bgGradient={theme.gradient}
      pt={8}
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.glow} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}
    >
      <Container maxW="7xl">
        <Breadcrumbs />
        <style>{calendarStyles}</style>
        <MotionFlex
          justify="space-between"
          align={{ base: "center", md: "center" }}
          mb={{ base: 6, md: 10 }}
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
            textTransform="uppercase"
            letterSpacing="wide"
            bgGradient={`linear(to-r, ${theme.accent}, ${theme.accent}CC)`}
            bgClip="text"
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