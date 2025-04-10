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
  Select,
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
  Alert,
  AlertIcon,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  ButtonGroup,
  Spacer,
  Badge,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Spinner,
  FormControl,
  FormLabel,
  Icon,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Event, Character } from '../types/firebase';
import { ChevronDownIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
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

  // Log event data when roster modal opens
  useEffect(() => {
    if (isRosterModalOpen) {
      console.log('Opening roster modal with event:', event);
      console.log('Event signups:', event.signups);
      console.log('Valid signups:', Object.values(event.signups || {}).filter(signup => signup !== null));
    }
  }, [isRosterModalOpen, event]);

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
        console.log('RaidHelper event details:', response);
        console.log('RaidHelper signups:', response?.signUps);
        
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
        toast({
          title: 'Error',
          description: 'Failed to fetch Discord bot signups',
          status: 'error',
        });
      } finally {
        setIsLoadingSignups(false);
      }
    };

    if ((isOpen || isRosterModalOpen) && event.raidHelperId) {
      fetchRaidHelperSignups();
    }
  }, [isOpen, isRosterModalOpen, event.raidHelperId, event.signupType]);

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
        }
      });

      toast({
        title: 'Success!',
        description: `Du är anmäld till ${event.title} med ${character.name}`,
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
        description: `Du har avslutat din anmälan till ${event.title}`,
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="background.secondary" boxShadow="dark-lg">
          <ModalCloseButton color="text.primary" />
          {user?.role === 'admin' && (
            <IconButton
              aria-label="Delete event"
              icon={<DeleteIcon />}
              onClick={onDeleteAlertOpen}
              colorScheme="red"
              variant="ghost"
              position="absolute"
              right="50px"
              top="4px"
              zIndex="1"
            />
          )}
          <ModalHeader 
            color="text.primary" 
            borderBottom="1px solid" 
            borderColor="border.primary"
            fontSize="2xl"
          >
            {event.title}
          </ModalHeader>
          <ModalBody>
            {/* Event Details */}
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2} color="blue.300">Datum & Tid</Text>
                <Text color="white">{new Date(`${event.date}T${event.time}`).toLocaleString()}</Text>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2} color="blue.300">Beskrivning</Text>
                <Text color="gray.100">{event.description}</Text>
              </Box>

              {/* Only show Calendar Signups for manual signup events */}
              {event.signupType === 'manual' && (
                <Box>
                  <Text fontWeight="bold" mb={2} color="blue.300">Calendar Signups</Text>
                  <HStack spacing={4}>
                    <VStack align="start">
                      <Text color="gray.300">Total</Text>
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {Object.keys(event.signups || {}).length}
                      </Text>
                    </VStack>
                    <VStack align="start">
                      <Text color="blue.200">Tanks</Text>
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {groupedSignups.Tank.length}
                      </Text>
                    </VStack>
                    <VStack align="start">
                      <Text color="green.200">Healers</Text>
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {groupedSignups.Healer.length}
                      </Text>
                    </VStack>
                    <VStack align="start">
                      <Text color="red.200">DPS</Text>
                      <Text color="white" fontSize="lg" fontWeight="bold">
                        {groupedSignups.DPS.length}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Discord Bot Signups section - always show for RaidHelper events */}
              {event.signupType === 'raidhelper' && (
                <Box>
                  <Text fontWeight="bold" mb={2} color="blue.300">
                    <HStack spacing={2}>
                      <Icon as={FaDiscord} />
                      <Text>Discord Bot Signups</Text>
                    </HStack>
                  </Text>
                  <HStack spacing={3} mb={2}>
                    <Text color="gray.300">Total:</Text>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                      {raidHelperSignups?.signUps?.length || 0}
                    </Text>
                  </HStack>
                  <Text mb={4} fontSize="sm" color="gray.400">
                    To sign up or view detailed Discord signups, use the RaidHelper bot in Discord.
                  </Text>

                </Box>
              )}

              {/* Only show manual signup form for manual signup events */}
              {event.signupType === 'manual' && (
                <>
                  {!userSignup && (
                    <Box>
                      <Alert status="warning" mb={4}>
                        <AlertIcon />
                        OBS! Du har inte signat till detta event ännu.
                      </Alert>
                      <FormControl>
                        <FormLabel color="blue.300">Sign up with character</FormLabel>
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
                            {selectedCharacter ? (
                              <CharacterOption character={selectedCharacter} />
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
                                onClick={() => setSelectedCharacter(char)}
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
                    </Box>
                  )}
                </>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <ButtonGroup spacing={3}>
              <Button
                leftIcon={<ViewIcon />}
                colorScheme="blue"
                variant="outline"
                onClick={onRosterModalOpen}
                color="white"
                _hover={{
                  bg: "whiteAlpha.200"
                }}
              >
                View raidroster
              </Button>
              {event.signupType === 'manual' && !userSignup && (
                <Button
                  colorScheme="blue"
                  onClick={handleSignup}
                  isLoading={isSubmitting}
                >
                  Anmäl
                </Button>
              )}
            </ButtonGroup>
          </ModalFooter>
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
    </>
  );
}; 