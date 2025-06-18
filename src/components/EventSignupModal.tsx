import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  Text,
  useToast,
  Box,
  Heading,
  List,
  ListItem,
  HStack,
  Avatar,
  ModalCloseButton,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  ButtonGroup,
  Badge,
  Spinner,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Divider,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Event, Character } from '../types/firebase';
import { ChevronDownIcon, DeleteIcon, ViewIcon, TimeIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { logAdminAction } from '../utils/auditLogger';
import RosterModal from './RosterModal';
import { raidHelperService } from '../services/raidhelper';
import { FaDiscord } from 'react-icons/fa';

// Import class icons
import { warriorIcon, mageIcon, priestIcon, warlockIcon, hunterIcon, paladinIcon, druidIcon, rogueIcon } from '../assets/classes';

const CLASS_ICONS = {
  Warrior: warriorIcon,
  Mage: mageIcon,
  Priest: priestIcon,
  Warlock: warlockIcon,
  Hunter: hunterIcon,
  Paladin: paladinIcon,
  Druid: druidIcon,
  Rogue: rogueIcon,
};

export interface EventSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onSignupChange: (event: Event) => void;
}

const CharacterOption = ({ character }: { character: Character }) => {
  const classIcon = CLASS_ICONS[character.class as keyof typeof CLASS_ICONS];
  return (
    <HStack spacing={2} align="center">
      <Box 
        width="20px" 
        height="20px" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <Image 
          src={classIcon} 
          alt={character.class} 
          width="100%" 
          height="100%" 
          objectFit="contain" 
        />
      </Box>
      <Text color="white" fontWeight="medium">{character.name}</Text>
      <Text color="gray.500" fontSize="sm">({character.role})</Text>
    </HStack>
  );
};

interface RaidHelperSignup {
  id: string | number;
  name: string;
  status: string;
  class?: string;
  role?: string;
  classEmoteId?: string;
  className?: string;
  entryTime?: number;
  userId?: string;
  position?: number;
}

interface RaidHelperResponse {
  signUps: RaidHelperSignup[];
  // Add other fields as needed
}

export const EventSignupModal = ({ isOpen, onClose, event, onSignupChange }: EventSignupModalProps) => {
  const { user } = useUser();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [raidHelperSignups, setRaidHelperSignups] = useState<RaidHelperResponse | null>(null);
  const [isLoadingSignups, setIsLoadingSignups] = useState(false);
  const [userNicknames, setUserNicknames] = useState<Record<string, string>>({});
  const { isOpen: isRosterModalOpen, onOpen: onRosterModalOpen, onClose: onRosterModalClose } = useDisclosure();
  const { isOpen: isDeleteAlertOpen, onOpen: onDeleteAlertOpen, onClose: onDeleteAlertClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [selectedAbsenceCharacter, setSelectedAbsenceCharacter] = useState<Character | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState<'attending' | 'absent' | 'tentative'>('attending');
  
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  useEffect(() => {
    if (isOpen && user?.characters) {
      // Find the main character
      const mainCharacter = user.characters.find(char => char.isMain);
      if (mainCharacter) {
        setSelectedCharacter(mainCharacter);
      } else {
        setSelectedCharacter(null);
      }
    } else {
      setSelectedCharacter(null);
    }
  }, [isOpen, user?.characters]);

  // Check if user is already signed up
  const userSignup = user ? event.signups?.[user.username] : undefined;

  // Initialize attendance status and absence reason based on current signup
  useEffect(() => {
    if (userSignup) {
      if (userSignup.absenceReason) {
        setSelectedAttendanceStatus('absent');
        setAbsenceReason(userSignup.absenceReason);
      } else if (userSignup.attendanceStatus) {
        setSelectedAttendanceStatus(userSignup.attendanceStatus);
      } else {
        setSelectedAttendanceStatus('attending');
      }
    } else {
      setSelectedAttendanceStatus('attending');
      setAbsenceReason('');
    }
  }, [userSignup]);

  // Add new function to fetch Discord signup nicknames
  const fetchDiscordNicknames = async (signups: RaidHelperSignup[]) => {
    try {
      const userDocs = await Promise.all(
        signups.map(signup => getDoc(doc(db, 'users', signup.name)))
      );
      
      const nicknames: Record<string, string> = {};
      userDocs.forEach((userDoc, index) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.discordSignupNickname) {
            nicknames[signups[index].name] = userData.discordSignupNickname;
          }
        }
      });
      
      setUserNicknames(nicknames);
    } catch (error) {
      console.error('Error fetching Discord nicknames:', error);
    }
  };

  // Fetch RaidHelper signups when modal opens
  useEffect(() => {
    const fetchRaidHelperSignups = async () => {
      if (!event.raidHelperId || event.signupType !== 'raidhelper') return;
      
      setIsLoadingSignups(true);
      try {
        const response = await raidHelperService.getEvent(event.raidHelperId);
        
        if (!response) {
          throw new Error('No response from RaidHelper API');
        }

        setRaidHelperSignups(response);
        
        // Fetch Discord nicknames for all signups
        if (response.signUps && response.signUps.length > 0) {
          await fetchDiscordNicknames(response.signUps);
        }
      } catch (error) {
        console.error('Failed to fetch RaidHelper signups:', error);
      } finally {
        setIsLoadingSignups(false);
      }
    };

    if ((isOpen || isRosterModalOpen) && event.raidHelperId) {
      fetchRaidHelperSignups();
    }
  }, [isOpen, isRosterModalOpen, event.raidHelperId, event.signupType]);

  // Add this effect to handle the 2-second loading state
  useEffect(() => {
    if (isOpen) {
      setIsInitialLoading(true);
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSignup = async () => {
    if (!user || !selectedCharacter) return;

    setIsSubmitting(true);
    try {
      const character = user.characters?.find(char => char.id === selectedCharacter.id);
      if (!character) {
        throw new Error('Character not found');
      }

      // Update event document with new signup
      await updateDoc(doc(db, 'events', event.id), {
        [`signups.${user.username}`]: {
          userId: user.username,
          username: user.username,
          characterId: character.id,
          characterName: character.name,
          characterClass: character.class,
          characterRole: character.role,
          attendanceStatus: 'attending'
        }
      });

      toast({
        title: 'Signed Up Successfully',
        description: `You have signed up for ${event.title} with ${character.name}`,
        status: 'success',
      });

      onClose();
      onSignupChange(event);
    } catch (error) {
      console.error('Error signing up for event:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign up for event. Please try again.',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSignup = async () => {
    if (!user || !userSignup) return;

    setIsSubmitting(true);
    try {
      // Remove the user's signup from the event
      await updateDoc(doc(db, 'events', event.id), {
        [`signups.${user.username}`]: null
      });

      toast({
        title: 'Signup Cancelled',
        description: `You have cancelled your signup for ${event.title}`,
        status: 'info',
      });

      onClose();
      onSignupChange(event);
    } catch (error) {
      console.error('Error cancelling signup:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel signup. Please try again.',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert signups object to arrays grouped by role
  const groupedSignups = Object.values(event.signups || {}).reduce((acc, signup) => {
    // Skip null values
    if (!signup) return acc;
    
    if (signup.characterRole === 'Tank') acc.Tank.push(signup);
    else if (signup.characterRole === 'Healer') acc.Healer.push(signup);
    else if (signup.characterRole === 'DPS') acc.DPS.push(signup);
    return acc;
  }, { Tank: [], Healer: [], DPS: [] } as Record<string, typeof event.signups[string][]>);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Tank':
        return 'blue.400';
      case 'Healer':
        return 'green.400';
      case 'DPS':
        return 'red.400';
      default:
        return 'gray.400';
    }
  };

  interface SignupListProps {
    role: string;
    signups: Array<{
      userId: string;
      characterName: string;
      characterClass: string;
    } | null>;
  }

  const SignupList = ({ role, signups }: SignupListProps) => {
    const validSignups = signups.filter((signup): signup is NonNullable<typeof signups[0]> => signup !== null);
    
    return (
      <Box>
        <Heading size="sm" color="#E2E8F0" mb={3}>
          {role} ({validSignups.length})
        </Heading>
        <List spacing={2} mb={4}>
          {validSignups.map((signup) => (
            <ListItem 
              key={signup.userId}
              p={2}
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor={getRoleColor(role)}
            >
              <HStack>
                <Avatar size="sm" name={signup.characterName} />
                <Box>
                  <Text color="#E2E8F0">{signup.characterName}</Text>
                  <Text color="#A0AEC0" fontSize="sm">
                    {signup.characterClass}
                  </Text>
                </Box>
              </HStack>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const SignupStats = () => {
    const totalSignups = Object.keys(event.signups || {}).length;
    
    // Parse RaidHelper signups - note the capital U in signUps
    const discordSignups = (raidHelperSignups?.signUps || []) as RaidHelperSignup[];
    const raidHelperTotal = discordSignups.filter(signup => 
      signup.status === "primary"
    ).length;
    
    return (
      <Box 
        bg="background.tertiary"
        p={4} 
        borderRadius="lg" 
        mb={4}
        borderLeft="4px solid"
        borderLeftColor="blue.400"
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <Heading size="sm" color="#E2E8F0" mb={3}>
              Calendar Signups
            </Heading>
            <HStack spacing={6} wrap="wrap">
              <Box>
                <Text color="#A0AEC0" fontSize="sm">Total</Text>
                <Text color="#E2E8F0" fontSize="xl" fontWeight="bold">
                  {totalSignups}
                </Text>
              </Box>
              <Box>
                <Text color="blue.400" fontSize="sm">Tanks</Text>
                <Text color="#E2E8F0" fontSize="xl" fontWeight="bold">
                  {groupedSignups.Tank.length}
                </Text>
              </Box>
              <Box>
                <Text color="green.400" fontSize="sm">Healers</Text>
                <Text color="#E2E8F0" fontSize="xl" fontWeight="bold">
                  {groupedSignups.Healer.length}
                </Text>
              </Box>
              <Box>
                <Text color="red.400" fontSize="sm">DPS</Text>
                <Text color="#E2E8F0" fontSize="xl" fontWeight="bold">
                  {groupedSignups.DPS.length}
                </Text>
              </Box>
            </HStack>
          </Box>

          {event.signupType === 'raidhelper' && (
            <Box>
              <Heading size="sm" color="#E2E8F0" mb={3}>
                <HStack spacing={2}>
                  <Icon as={FaDiscord} />
                  <Text>Discord Bot Signups</Text>
                </HStack>
                {isLoadingSignups && <Spinner size="sm" ml={2} />}
              </Heading>
              {raidHelperSignups ? (
                <VStack align="stretch" spacing={2}>
                  <HStack spacing={6} wrap="wrap">
                    <Box>
                      <Text color="#A0AEC0" fontSize="sm">Total</Text>
                      <Text color="#E2E8F0" fontSize="xl" fontWeight="bold">
                        {raidHelperTotal}
                      </Text>
                    </Box>
                  </HStack>
                  <Text color="text.secondary" fontSize="sm">
                    To sign up or view detailed Discord signups, use the RaidHelper bot in Discord.
                  </Text>
                  {discordSignups.length > 0 && (
                    <Box mt={2}>
                      <Text color="text.secondary" fontSize="sm" mb={2}>Current signups:</Text>
                      <VStack align="stretch" spacing={1}>
                        {discordSignups
                          .filter(signup => signup.status === "primary")
                          .map((signup: RaidHelperSignup) => (
                            <HStack key={signup.name} spacing={2}>
                              <Text color="green.400" fontSize="sm">✓</Text>
                              <Text color="text.primary" fontSize="sm">
                                {signup.name}
                              </Text>
                              {signup.status === "primary" && (
                                <Badge colorScheme="green" fontSize="xs">Primary</Badge>
                              )}
                            </HStack>
                          ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              ) : (
                <Text color="text.secondary" fontSize="sm">
                  {isLoadingSignups ? 'Loading Discord signups...' : 'Failed to load Discord signups'}
                </Text>
              )}
            </Box>
          )}
        </VStack>
      </Box>
    );
  };

  const handleDeleteEvent = async () => {
    if (user?.role !== 'admin') return;

    setIsDeleting(true);
    try {
      // If it's a RaidHelper event, delete it from RaidHelper first
      if (event.signupType === 'raidhelper' && event.raidHelperId) {
        try {
          await raidHelperService.deleteEvent(event.raidHelperId);
        } catch (error) {
          console.error('Failed to delete RaidHelper event:', error);
          toast({
            title: 'Warning',
            description: 'Failed to delete Discord bot event. The calendar event will still be deleted.',
            status: 'warning',
          });
        }
      }

      // Delete from Firebase
      await deleteDoc(doc(db, 'events', event.id));
      
      // Log the admin action
      await logAdminAction(
        user.username,
        user.username,
        'delete',
        'event',
        event.id,
        event.title,
        `Event scheduled for ${new Date(`${event.date}T${event.time}`).toLocaleString()}`
      );
      
      toast({
        title: 'Event Deleted',
        description: 'The event has been successfully deleted',
        status: 'success',
      });

      onClose();
      onSignupChange(event);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        status: 'error',
      });
    } finally {
      setIsDeleting(false);
      onDeleteAlertClose();
    }
  };

  const handleAbsenceSubmit = async () => {
    if (!user || !selectedAbsenceCharacter) return;

    setIsSubmitting(true);
    try {
      // Update event document with absence signup
      await updateDoc(doc(db, 'events', event.id), {
        [`signups.${user.username}`]: {
          userId: user.username,
          username: user.username,
          characterId: selectedAbsenceCharacter.id,
          characterName: selectedAbsenceCharacter.name,
          characterClass: 'Absence',
          characterRole: 'Absence',
          absenceReason: absenceReason.trim(),
          originalClass: selectedAbsenceCharacter.class,
          attendanceStatus: 'absent'
        }
      });

      toast({
        title: 'Absence Registered',
        description: `Your absence has been registered for ${event.title}`,
        status: 'info',
      });

      setIsAbsenceModalOpen(false);
      onClose();
      onSignupChange(event);
    } catch (error) {
      console.error('Error registering absence:', error);
      toast({
        title: 'Error',
        description: 'Failed to register absence. Please try again.',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttendanceStatusChange = async () => {
    if (!user || !userSignup) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {
        [`signups.${user.username}.attendanceStatus`]: selectedAttendanceStatus,
      };

      // If changing to absent, require reason and store original class
      if (selectedAttendanceStatus === 'absent') {
        if (!absenceReason.trim()) {
          toast({
            title: 'Error',
            description: 'Please provide a reason for your absence',
            status: 'error',
          });
          setIsSubmitting(false);
          return;
        }
        updateData[`signups.${user.username}.absenceReason`] = absenceReason.trim();
        
        // Store original class if not already stored
        if (!userSignup.originalClass && userSignup.characterClass !== 'Absence') {
          updateData[`signups.${user.username}.originalClass`] = userSignup.characterClass;
        }
        
        updateData[`signups.${user.username}.characterClass`] = 'Absence';
        updateData[`signups.${user.username}.characterRole`] = 'Absence';
      } else if (selectedAttendanceStatus === 'tentative') {
        // Remove absence reason if switching from absent
        updateData[`signups.${user.username}.absenceReason`] = null;
        
        // Store original class if not already stored
        if (!userSignup.originalClass && userSignup.characterClass !== 'Tentative' && userSignup.characterClass !== 'Absence') {
          updateData[`signups.${user.username}.originalClass`] = userSignup.characterClass;
        }
        
        updateData[`signups.${user.username}.characterClass`] = 'Tentative';
        updateData[`signups.${user.username}.characterRole`] = 'Tentative';
      } else {
        // Attending status - remove absence reason
        updateData[`signups.${user.username}.absenceReason`] = null;
        
        // Restore original class and role if available
        if (userSignup.originalClass) {
          updateData[`signups.${user.username}.characterClass`] = userSignup.originalClass;
        } else {
          // Fallback: try to find the character and use its class
          const character = user.characters?.find(char => char.id === userSignup.characterId);
          if (character) {
            updateData[`signups.${user.username}.characterClass`] = character.class;
          }
        }
        
        const character = user.characters?.find(char => char.id === userSignup.characterId);
        if (character) {
          updateData[`signups.${user.username}.characterRole`] = character.role;
        }
      }

      await updateDoc(doc(db, 'events', event.id), updateData);

      const statusText = selectedAttendanceStatus === 'attending' ? 'attending' : 
                        selectedAttendanceStatus === 'absent' ? 'absent' : 'tentative';

      toast({
        title: 'Attendance Updated',
        description: `Your attendance status has been changed to ${statusText}`,
        status: 'success',
      });

      onClose();
      onSignupChange(event);
    } catch (error) {
      console.error('Error updating attendance status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance status. Please try again.',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="background.primary"
          maxW="600px"
          borderRadius="xl"
          boxShadow="xl"
        >
          <ModalHeader
            bg="background.secondary"
            borderTopRadius="xl"
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
          >
            <HStack justify="space-between" width="100%">
              <Heading size="md" color="text.primary">{event.title}</Heading>
              <HStack>
                {user?.role === 'admin' && (
                  <IconButton
                    aria-label="Delete event"
                    icon={<DeleteIcon />}
                    onClick={onDeleteAlertOpen}
                    variant="ghost"
                    color="red.400"
                    _hover={{ bg: "background.hover" }}
                    size="sm"
                  />
                )}
                <ModalCloseButton position="static" color="text.primary" />
              </HStack>
            </HStack>
            
            <VStack align="start" spacing={1} width="100%">
              <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                Datum & Tid
              </Text>
              <HStack spacing={2}>
                <Text color="text.primary" fontSize="md">
                  {event.date}
                </Text>
                <Text color="text.primary" fontSize="md">
                  {event.time}
                </Text>
              </HStack>
            </VStack>

            {event.description && (
              <VStack align="start" spacing={1} width="100%">
                <Text color="text.secondary" fontSize="sm" fontWeight="medium">
                  Beskrivning
                </Text>
                <Text color="text.primary" fontSize="sm">
                  {event.description}
                </Text>
              </VStack>
            )}
          </ModalHeader>

          <ModalBody p={4}>
            <VStack spacing={4} align="stretch" width="100%">
              {isInitialLoading ? (
                <Box
                  bg="background.tertiary"
                  p={6}
                  borderRadius="lg"
                  borderLeft="4px solid"
                  borderColor="blue.400"
                >
                  <HStack spacing={4}>
                    <Spinner size="sm" color="blue.400" />
                    <Text color="text.secondary">
                      Loading event details...
                    </Text>
                  </HStack>
                </Box>
              ) : (
                <>
                  {/* Current Signup Status */}
                  {(userSignup || raidHelperSignups?.signUps?.some(signup => 
                    signup.userId === user?.discordId && 
                    (signup.status === "primary" || signup.status === "absence" || signup.className === "Absence")
                  )) && (
                    <Box
                      bg="background.tertiary"
                      p={4}
                      borderRadius="lg"
                      borderLeft="4px solid"
                      borderLeftColor={raidHelperSignups?.signUps?.some(signup => 
                        signup.userId === user?.discordId
                      ) ? "#5865F2" : "blue.400"}
                    >
                      <VStack spacing={2} align="stretch">
                        {/* Discord Signup Status */}
                        {raidHelperSignups?.signUps?.some(signup => 
                          signup.userId === user?.discordId && 
                          (signup.status === "primary" || signup.status === "absence" || signup.className === "Absence")
                        ) && (
                          <>
                            <Text color="text.primary" fontSize="sm">
                              {raidHelperSignups.signUps.find(signup => 
                                signup.userId === user?.discordId
                              )?.className === "Absence" 
                                ? (
                                  <>
                                    You are currently signed as{" "}
                                    <Text as="span" color="red.400" fontWeight="bold">
                                      ABSENT
                                    </Text>
                                    {" "}through Discord as{" "}
                                  </>
                                )
                                : "You are currently signed up through Discord as "}
                              <Text as="span" color="#5865F2" fontWeight="bold">
                                {user?.discordSignupNickname}
                              </Text>
                            </Text>
                            <Text color="text.secondary" fontSize="sm">
                              Please use Discord to modify your attendance
                            </Text>
                          </>
                        )}

                        {/* Website Signup Status */}
                        {userSignup && (
                          <>
                            <Text color="text.primary" fontSize="sm">
                              {userSignup.absenceReason || userSignup.attendanceStatus === 'absent' ? (
                                <>
                                  You are currently marked as{" "}
                                  <Text as="span" color="red.400" fontWeight="bold">
                                    ABSENT
                                  </Text>
                                  {" "}through website
                                </>
                              ) : userSignup.attendanceStatus === 'tentative' ? (
                                <>
                                  You are currently marked as{" "}
                                  <Text as="span" color="yellow.400" fontWeight="bold">
                                    TENTATIVE
                                  </Text>
                                  {" "}with {userSignup.characterName}
                                </>
                              ) : (
                                <>
                                  You are currently{" "}
                                  <Text as="span" color="green.400" fontWeight="bold">
                                    ATTENDING
                                  </Text>
                                  {" "}with {userSignup.characterName}
                                </>
                              )}
                            </Text>
                            <Text color="text.secondary" fontSize="sm">
                              Use the options below to modify your attendance
                            </Text>
                          </>
                        )}
                      </VStack>
                    </Box>
                  )}

                  {/* Only show signup options if not signed through Discord */}
                  {!raidHelperSignups?.signUps?.some(signup => 
                    signup.userId === user?.discordId && 
                    (signup.status === "primary" || signup.status === "absence" || signup.className === "Absence")
                  ) && (
                    <>
                      {/* Change Attendance Status Section - only show if user has signed up through website */}
                      {userSignup && (
                        <Box
                          bg="background.tertiary"
                          p={4}
                          borderRadius="lg"
                          borderLeft="4px solid"
                          borderLeftColor="orange.400"
                        >
                          <VStack spacing={3} align="stretch">
                            <Text color="text.primary" fontSize="sm" fontWeight="semibold">
                              Change attendance status
                            </Text>
                            <Menu>
                              <MenuButton
                                as={Button}
                                rightIcon={<ChevronDownIcon />}
                                w="full"
                                bg="background.secondary"
                                color="text.primary"
                                borderColor="border.primary"
                                size="md"
                                fontSize="sm"
                                _hover={{ 
                                  bg: "background.tertiary",
                                  borderColor: "border.hover"
                                }}
                                _active={{
                                  bg: "background.tertiary"
                                }}
                                textAlign="left"
                                justifyContent="space-between"
                              >
                                <HStack spacing={2}>
                                  {selectedAttendanceStatus === 'attending' && (
                                    <>
                                      <Icon as={CheckIcon} color="green.400" />
                                      <Text>I'm attending</Text>
                                    </>
                                  )}
                                  {selectedAttendanceStatus === 'absent' && (
                                    <>
                                      <Icon as={CloseIcon} color="red.400" />
                                      <Text>Absence{userSignup?.absenceReason ? ' (Current)' : ''}</Text>
                                    </>
                                  )}
                                  {selectedAttendanceStatus === 'tentative' && (
                                    <>
                                      <Icon as={TimeIcon} color="yellow.400" />
                                      <Text>Tentative</Text>
                                    </>
                                  )}
                                </HStack>
                              </MenuButton>
                              <MenuList
                                bg="background.secondary"
                                borderColor="border.primary"
                                py={2}
                              >
                                <MenuItem
                                  onClick={() => setSelectedAttendanceStatus('attending')}
                                  bg="transparent"
                                  _hover={{ bg: "background.tertiary" }}
                                  _focus={{ bg: "background.tertiary" }}
                                >
                                  <HStack spacing={2}>
                                    <Icon as={CheckIcon} color="green.400" />
                                    <Text color="text.primary">I'm attending</Text>
                                  </HStack>
                                </MenuItem>
                                <MenuItem
                                  onClick={() => setSelectedAttendanceStatus('absent')}
                                  bg="transparent"
                                  _hover={{ bg: "background.tertiary" }}
                                  _focus={{ bg: "background.tertiary" }}
                                >
                                  <HStack spacing={2}>
                                    <Icon as={CloseIcon} color="red.400" />
                                    <Text color="text.primary">
                                      Absence{userSignup?.absenceReason ? ' (Current)' : ''}
                                    </Text>
                                  </HStack>
                                </MenuItem>
                                <MenuItem
                                  onClick={() => setSelectedAttendanceStatus('tentative')}
                                  bg="transparent"
                                  _hover={{ bg: "background.tertiary" }}
                                  _focus={{ bg: "background.tertiary" }}
                                >
                                  <HStack spacing={2}>
                                    <Icon as={TimeIcon} color="yellow.400" />
                                    <Text color="text.primary">Tentative</Text>
                                  </HStack>
                                </MenuItem>
                              </MenuList>
                            </Menu>
                            
                            {/* Show reason input if absent is selected */}
                            {selectedAttendanceStatus === 'absent' && (
                              <FormControl>
                                <FormLabel color="text.secondary" fontSize="sm">Reason for absence</FormLabel>
                                <Input
                                  value={absenceReason}
                                  onChange={(e) => setAbsenceReason(e.target.value)}
                                  placeholder="Enter your reason here..."
                                  bg="background.secondary"
                                  color="text.primary"
                                  borderColor="border.primary"
                                  _hover={{ borderColor: "border.hover" }}
                                  _focus={{ borderColor: "orange.400" }}
                                />
                              </FormControl>
                            )}
                            
                            <Button
                              onClick={handleAttendanceStatusChange}
                              colorScheme="orange"
                              isLoading={isSubmitting}
                              loadingText="Updating..."
                              isDisabled={selectedAttendanceStatus === 'absent' && !absenceReason.trim()}
                            >
                              Update Attendance
                            </Button>
                          </VStack>
                        </Box>
                      )}

                      {/* Absence Section - only show if user hasn't signed up yet */}
                      {!userSignup && (
                        <Box
                          bg="background.tertiary"
                          p={4}
                          borderRadius="lg"
                          borderLeft="4px solid"
                          borderLeftColor="red.400"
                        >
                          <VStack spacing={2} align="stretch">
                            <Text color="text.primary" fontSize="sm" fontWeight="semibold">
                              Can't make it to the event?
                            </Text>
                            <Button
                              onClick={() => setIsAbsenceModalOpen(true)}
                              width="100%"
                              colorScheme="red"
                              variant="outline"
                              size="md"
                              leftIcon={<TimeIcon />}
                            >
                              Sign as absence
                            </Button>
                          </VStack>
                        </Box>
                      )}

                      {/* Only show character signup section if not already signed up through website */}
                      {!userSignup && (
                        <>
                          <Divider borderColor="border.primary" />

                          {/* Character Signup Section */}
                          <Box
                            bg="background.tertiary"
                            p={4}
                            borderRadius="lg"
                            borderLeft="4px solid"
                            borderLeftColor="blue.400"
                          >
                            <VStack spacing={2} align="stretch">
                              <Text color="text.primary" fontSize="sm" fontWeight="semibold">
                                Sign up with character
                              </Text>
                              <Box>
                                <Text color="blue.200" fontSize="sm" mb={2}>
                                  You can sign up with one of your characters below
                                </Text>
                                <Menu>
                                  <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    w="full"
                                    bg="background.secondary"
                                    color="text.primary"
                                    borderColor="border.primary"
                                    size="md"
                                    fontSize="sm"
                                    _hover={{ 
                                      bg: "background.tertiary",
                                      borderColor: "border.hover"
                                    }}
                                    _active={{
                                      bg: "background.tertiary"
                                    }}
                                  >
                                    {selectedCharacter ? (
                                      <CharacterOption character={selectedCharacter} />
                                    ) : (
                                      "Select character"
                                    )}
                                  </MenuButton>
                                  <MenuList
                                    bg="background.secondary"
                                    borderColor="border.primary"
                                    py={2}
                                  >
                                    {user?.characters?.map((char) => (
                                      <MenuItem
                                        key={char.id}
                                        onClick={() => setSelectedCharacter(char)}
                                        bg="transparent"
                                        _hover={{ bg: "background.tertiary" }}
                                        _focus={{ bg: "background.tertiary" }}
                                      >
                                        <CharacterOption character={char} />
                                      </MenuItem>
                                    ))}
                                  </MenuList>
                                </Menu>
                              </Box>
                            </VStack>
                          </Box>
                        </>
                      )}
                    </>
                  )}

                  {/* Action Buttons */}
                  <HStack justify="flex-end" spacing={3} mt={2}>
                    <Button
                      leftIcon={<ViewIcon />}
                      onClick={onRosterModalOpen}
                      variant="ghost"
                      color="text.primary"
                      _hover={{ bg: "background.hover" }}
                      size="sm"
                    >
                      View raidroster
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="ghost"
                      color="text.primary"
                      _hover={{ bg: "background.hover" }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                    {!raidHelperSignups?.signUps?.some(signup => 
                      signup.userId === user?.discordId && 
                      (signup.status === "primary" || signup.status === "absence" || signup.className === "Absence")
                    ) && userSignup === undefined && (
                      <Button
                        onClick={handleSignup}
                        colorScheme="blue"
                        isLoading={isSubmitting}
                        loadingText="Signing up..."
                        isDisabled={!selectedCharacter}
                        size="sm"
                      >
                        Sign up
                      </Button>
                    )}
                  </HStack>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(10px)" />
        <AlertDialogContent bg="#1A202C" boxShadow="dark-lg">
          <AlertDialogHeader color="white" fontSize="lg">
            Delete Event
          </AlertDialogHeader>

          <AlertDialogBody color="gray.300">
            Are you sure you want to delete this event? This action cannot be undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onDeleteAlertClose}
              variant="ghost"
              color="white"
              _hover={{ bg: '#2D3748' }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteEvent}
              ml={3}
              isLoading={isDeleting}
              loadingText="Deleting..."
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={onRosterModalClose}
        event={{
          ...event,
          raidHelperSignups: raidHelperSignups || undefined
        }}
        isAdmin={user?.role === 'admin'}
      />

      {/* Add Absence Modal */}
      <Modal isOpen={isAbsenceModalOpen} onClose={() => setIsAbsenceModalOpen(false)} isCentered size="md">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="background.secondary" boxShadow="dark-lg">
          <ModalHeader color="text.primary" borderBottom="1px solid" borderColor="border.primary">
            Register Absence
          </ModalHeader>
          <ModalCloseButton color="text.primary" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="blue.300">Sign absence with character</FormLabel>
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    w="full"
                    bg="whiteAlpha.50"
                    color="white"
                    borderColor="whiteAlpha.200"
                    _hover={{ 
                      bg: "whiteAlpha.100",
                      borderColor: "whiteAlpha.300"
                    }}
                    _active={{
                      bg: "whiteAlpha.200"
                    }}
                    _focus={{
                      borderColor: "blue.300",
                      boxShadow: "0 0 0 1px var(--chakra-colors-blue-300)"
                    }}
                  >
                    {selectedAbsenceCharacter ? (
                      <CharacterOption character={selectedAbsenceCharacter} />
                    ) : (
                      "Select character"
                    )}
                  </MenuButton>
                  <MenuList
                    bg="background.secondary"
                    borderColor="whiteAlpha.200"
                    boxShadow="dark-lg"
                    py={2}
                  >
                    {user?.characters?.map((char) => (
                      <MenuItem
                        key={char.id}
                        onClick={() => setSelectedAbsenceCharacter(char)}
                        bg="transparent"
                        _hover={{ bg: "whiteAlpha.200" }}
                        _focus={{ bg: "whiteAlpha.200" }}
                      >
                        <CharacterOption character={char} />
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </FormControl>
              <FormControl>
                <FormLabel color="blue.300">Reason</FormLabel>
                <Input
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Enter your reason here..."
                  bg="whiteAlpha.50"
                  color="white"
                  borderColor="whiteAlpha.200"
                  _hover={{ borderColor: "whiteAlpha.300" }}
                  _focus={{ borderColor: "blue.300" }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup spacing={3}>
              <Button
                variant="ghost"
                onClick={() => setIsAbsenceModalOpen(false)}
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="yellow"
                onClick={handleAbsenceSubmit}
                isLoading={isSubmitting}
                isDisabled={!absenceReason.trim() || !selectedAbsenceCharacter}
              >
                Register Absence
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}; 