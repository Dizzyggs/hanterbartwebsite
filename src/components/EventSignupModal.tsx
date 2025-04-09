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
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Event, Character } from '../types/firebase';
import { ChevronDownIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { logAdminAction } from '../utils/auditLogger';
import RosterModal from './RosterModal';

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
      <Text fontWeight="medium">{character.name}</Text>
      <Text color="gray.500" fontSize="sm">({character.role})</Text>
    </HStack>
  );
};

export const EventSignupModal = ({ isOpen, onClose, event, onSignupChange }: EventSignupModalProps) => {
  const { user } = useUser();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const SignupList = ({ role, signups }: { role: string; signups: typeof event.signups[string][] }) => (
    <Box>
      <HStack mb={2} align="center">
        <Heading size="sm" color={getRoleColor(role)}>
          {role}s
        </Heading>
        <Text color="#A0AEC0" fontSize="sm">({signups.length})</Text>
      </HStack>
      <List spacing={2} mb={4}>
        {signups.map((signup) => (
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

  const SignupStats = () => {
    const totalSignups = Object.keys(event.signups || {}).length;
    
    return (
      <Box 
        // bg="#2D3748" 
        bg="background.tertiary"
        p={4} 
        borderRadius="lg" 
        mb={4}
        borderLeft="4px solid"
        borderLeftColor="blue.400"
      >
        <Heading size="sm" color="#E2E8F0" mb={3}>
          Raid Signups
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
    );
  };

  const handleDeleteEvent = async () => {
    if (user?.role !== 'admin') return;

    setIsDeleting(true);
    try {
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
            <VStack spacing={6} align="stretch" py={4}>
              <Box bg="background.tertiary" p={4} borderRadius="lg">
                <Text color="text.secondary" fontSize="sm" mb={2}>Datum & Tid</Text>
                <Text color="text.primary" fontSize="lg" fontWeight="medium">
                  {new Date(`${event.date}T${event.time}`).toLocaleString()}
                </Text>
              </Box>

              <Box bg="background.tertiary" p={4} borderRadius="lg">
                <Text color="text.secondary" fontSize="sm" mb={2}>Beskrivning</Text>
                <Text color="text.primary">{event.description}</Text>
              </Box>

              <Box>
                <SignupStats />
                {Object.keys(event.signups || {}).length === 0 && (
                  <Text color="text.secondary" fontSize="md" textAlign="center" mt={4}>
                    No signups yet
                  </Text>
                )}
              </Box>

              <Box borderBottom="1px solid" borderColor="border.primary" my={2} />

              <Alert 
                status={userSignup ? "success" : "warning"} 
                variant="subtle" 
                borderRadius="md"
                bg={userSignup ? "green.800" : "rgba(236, 116, 0, 0.15)"}
                backdropFilter="blur(8px)"
                border="1px solid"
                borderColor={userSignup ? "green.600" : "rgba(236, 116, 0, 0.3)"}
                boxShadow="0 4px 6px rgba(236, 116, 0, 0.1)"
                p={4}
                style={{
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                <AlertIcon boxSize="20px" />
                <Box flex="1">
                  <Text color={userSignup ? "white" : "orange.100"} fontWeight="medium">
                    {userSignup ? (
                      `Du är signad till detta event med ${userSignup.characterName} (${userSignup.characterClass} - ${userSignup.characterRole})`
                    ) : (
                      'OBS! Du har inte signat till detta event ännu.'
                    )}
                  </Text>
                </Box>
              </Alert>

              {!userSignup && user && (!user.characters || user.characters.length === 0) && (
                <Box
                  p={4}
                  borderRadius="lg"
                  bg="rgba(236, 116, 0, 0.15)"
                  backdropFilter="blur(8px)"
                  border="1px solid"
                  borderColor="rgba(236, 116, 0, 0.3)"
                  boxShadow="0 4px 6px rgba(236, 116, 0, 0.1)"
                  style={{
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  }}
                >
                  <Text color="orange.100" fontSize="md">
                    Du behöver skapa en karaktär först för att kunna signa till raids.
                    Besök din profil för att skapa en!
                  </Text>
                </Box>
              )}

              {!userSignup && user && user.characters && user.characters.length > 0 && (
                <Box bg="#2D3748" p={4} borderRadius="lg">
                  <Text color="#A0AEC0" fontSize="sm" mb={3}>Sign up with character</Text>
                  <Menu>
                    <MenuButton
                      as={Button}
                      rightIcon={<ChevronDownIcon />}
                      w="full"
                      bg="#1A202C"
                      color={selectedCharacter ? "#E2E8F0" : "#A0AEC0"}
                      borderColor="#4A5568"
                      _hover={{ bg: "#2D3748", borderColor: "#63B3ED" }}
                      _active={{ bg: "#2D3748" }}
                      _focus={{ borderColor: "#63B3ED", boxShadow: "0 0 0 1px #63B3ED" }}
                    >
                      {selectedCharacter ? (
                        <CharacterOption character={selectedCharacter} />
                      ) : (
                        "Select character"
                      )}
                    </MenuButton>
                    <MenuList
                      bg="#2D3748"
                      borderColor="#4A5568"
                      boxShadow="dark-lg"
                      py={2}
                    >
                      {user.characters.map((char) => (
                        <MenuItem
                          key={char.id}
                          onClick={() => setSelectedCharacter(char)}
                          bg="#2D3748"
                          color="white"
                          _hover={{ bg: "#1A202C" }}
                          _focus={{ bg: "#1A202C" }}
                        >
                          <CharacterOption character={char} />
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor="border.primary">
            <ButtonGroup>
            
                <Button
                  leftIcon={<ViewIcon />}
                  onClick={onRosterModalOpen}
                  colorScheme="blue"
                  variant="outline"
                  mr={3}
                >
                  View raidroster
                </Button>
              
              {userSignup ? (
                <Button
                  colorScheme="red"
                  onClick={handleCancelSignup}
                  isLoading={isSubmitting}
                  mr={3}
                >
                  Signa av
                </Button>
              ) : user && user.characters && user.characters.length > 0 && (
                <Button
                  colorScheme="primary"
                  onClick={handleSignup}
                  isLoading={isSubmitting}
                  isDisabled={!selectedCharacter}
                  mr={3}
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
        event={event}
        isAdmin={user?.role === 'admin'}
      />
    </>
  );
}; 