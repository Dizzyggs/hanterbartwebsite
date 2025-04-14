import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  useDisclosure,
  Avatar,
  Flex,
  Badge,
  HStack,
  Icon,
  Image,
  useColorModeValue,
  Tooltip,
  AvatarBadge,
  useToast,
  IconButton,
  Link,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Input,
  FormControl,
  FormLabel,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useMediaQuery,
} from '@chakra-ui/react';
import { AddIcon, StarIcon, EditIcon, ExternalLinkIcon, DeleteIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/avatar.jpg';
import warriorIcon from '../assets/classes/warrior.png';
import paladinIcon from '../assets/classes/paladin.png';
import hunterIcon from '../assets/classes/hunter.png';
import rogueIcon from '../assets/classes/rogue.png';
import priestIcon from '../assets/classes/priest.png';
import mageIcon from '../assets/classes/mage.png';
import warlockIcon from '../assets/classes/warlock.png';
import druidIcon from '../assets/classes/druid.png';
import logsIcon from '../assets/logsicon.png';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Character, Event } from '../types/firebase';
import CharacterCreationModal from './CharacterCreationModal';
import CharacterEditModal from './CharacterEditModal';
import { motion } from 'framer-motion';
import { FaDiscord, FaBattleNet, FaCalendarAlt, FaClock, FaQuestionCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

// Discord and Battle.net icons as SVG components
const DiscordIcon = (props: any) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
    />
  </Icon>
);

const BattleNetIcon = (props: any) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm5.316 16.424c-.074.123-.148.247-.222.37c-.148.222-.296.444-.444.666c-.37.518-.813.962-1.258 1.406c-.074.074-.148.148-.222.222c-.444.37-.887.74-1.406 1.036c-.148.074-.296.148-.444.222c-.518.296-1.036.518-1.628.666c-.148.074-.37.074-.518.148c-.592.148-1.184.222-1.776.222s-1.184-.074-1.776-.222c-.148-.074-.37-.074-.518-.148c-.518-.148-1.036-.37-1.628-.666c-.148-.074-.296-.148-.444-.222c-.518-.296-.962-.592-1.406-1.036c-.074-.074-.148-.148-.222c-.222c-.37-.887-.74-1.258-1.406-1.406c-.148-.222-.296-.444-.444-.666c-.074-.148-.148-.247-.222-.37c-.296-.518-.518-1.036-.74-1.554c0-.148-.074-.296-.148-.444c-.148-.592-.222-1.184-.222-1.776s.074-1.184.222-1.776c.074-.148.074-.296.148-.444c.148-.518.444-1.036.74-1.554c.074-.123.148-.247.222-.37c.148-.222.296-.444.444-.666c.37-.518.813-.962 1.258-1.406c.074-.074.148-.148.222-.222c.444-.37.887-.74 1.406-1.036c.148-.074.296-.148.444-.222c.518-.296 1.036-.518 1.628-.666c.148-.074.37-.074.518-.148c.592-.148 1.184-.222 1.776-.222s1.184.074 1.776.222c.148.074.37.074.518.148c.518.148 1.036.37 1.628.666c.148.074.296.148.444.222c.518.296.962.592 1.406 1.036c.074.074.148.148.222.222c.444.37.887.887 1.258 1.406c.148.222.296.444.444.666c.074.148.148.247.222.37c.296.518.518 1.036.74 1.554c0 .148.074.296.148.444c.148.592.222 1.184.222 1.776s-.074 1.184-.222 1.776c-.074.148-.074.296-.148.444c-.222.592-.444 1.11-.74 1.628z"
    />
  </Icon>
);

const Profile = () => {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [isDiscordConnected, setIsDiscordConnected] = useState(false);
  const [discordSignupNickname, setDiscordSignupNickname] = useState('');
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isInitialDataFetched, setIsInitialDataFetched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const bgGradient = "linear(to-br, background.primary, background.secondary)";
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const deleteAlertDialog = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  const fetchCharacters = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.username));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newCharacters = userData.characters || [];
        setCharacters(newCharacters);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilePicture = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.username));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.avatarUrl) {
          setAvatarUrl(userData.avatarUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const checkDiscordConnection = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.username));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isConnected = !!userData.discordId;
        setIsDiscordConnected(isConnected);
      }
    } catch (error) {
      console.error('Error checking Discord connection:', error);
    }
  };

  // Add memoized callback functions
  const memoizedFetchCharacters = useCallback(fetchCharacters, [user]);
  const memoizedFetchProfilePicture = useCallback(fetchProfilePicture, [user]);
  const memoizedCheckDiscordConnection = useCallback(checkDiscordConnection, [user]);

  const handleConnectDiscord = () => {
    window.location.href = `${window.location.origin}/.netlify/functions/discord-auth`;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isInitialDataFetched) {
      return;
    }

    // Handle Discord connection callback
    const params = new URLSearchParams(window.location.search);
    const discordId = params.get('discord_id');
    const discordUsername = params.get('discord_username');
    const error = params.get('error');

    if (error === 'discord_auth_failed') {
      toast({
        title: 'Discord Connection Failed',
        description: 'Could not connect to Discord. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      window.history.replaceState({}, '', '/profile');
    } else if (discordId && discordUsername) {
      handleDiscordCallback(discordId, discordUsername);
      window.history.replaceState({}, '', '/profile');
      return;
    }

    // Initial data fetching
    const fetchInitialData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.username));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Update all states at once
          setCharacters(userData.characters || []);
          setAvatarUrl(userData.avatarUrl || defaultAvatar);
          setIsDiscordConnected(!!userData.discordId);
          setDiscordSignupNickname(userData.discordSignupNickname || '');
          
          // Update user context if needed
          if (JSON.stringify(userData.characters) !== JSON.stringify(user.characters)) {
            updateUser({
              ...user,
              characters: userData.characters || [],
              avatarUrl: userData.avatarUrl,
              discordId: userData.discordId,
              discordUsername: userData.discordUsername,
              discordSignupNickname: userData.discordSignupNickname,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsInitialDataFetched(true);
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
  }, [user, navigate, updateUser, toast, isInitialDataFetched]); // Added isInitialDataFetched to dependencies

  const handleDiscordCallback = async (discordId: string, discordUsername: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.username);
      await updateDoc(userRef, {
        discordId,
        discordUsername,
      });

      setIsDiscordConnected(true);
      toast({
        title: 'Discord Connected!',
        description: `Successfully connected to Discord account: ${discordUsername}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Update user context
      updateUser({
        ...user,
        discordId,
        discordUsername,
      });

      // Fetch updated data
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCharacters(userData.characters || []);
        setAvatarUrl(userData.avatarUrl || defaultAvatar);
      }
    } catch (error) {
      console.error('Error saving Discord connection:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to save Discord connection. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAvatarClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      console.log('No file selected or user not logged in');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Filen är för stor',
        description: 'Vänligen välj en fil under 5MB',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ogiltigt filformat',
        description: 'Vänligen välj en bildfil',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    try {
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'username': user.username
        }
      };
      
      const storageRef = ref(storage, `avatars/${user.username}`);
      const uploadResult = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      const userRef = doc(db, 'users', user.username);
      await updateDoc(userRef, {
        avatarUrl: downloadURL
      });
      
      // Update the local state
      setAvatarUrl(downloadURL);
      
      toast({
        title: 'Profilbild uppdaterad',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error i filuppladdningsprocessen:', error);
      let errorMessage = 'Vänligen försök igen senare.';
      
      if (error instanceof Error) {
        console.error('Feldetaljer:', error.message);
        if (error.message.includes('storage/unauthorized')) {
          errorMessage = 'Tillåtelse nekad. Vänligen logga in igen.';
        } else if (error.message.includes('storage/quota-exceeded')) {
          errorMessage = 'Lagring kvot överskriden. Vänligen kontakta support.';
        } else if (error.message.includes('cors')) {
          errorMessage = 'Cross-origin begäran blockerad. Vänligen försök igen.';
        }
      }
      
      toast({
        title: 'Fel vid uppdatering av profilbild',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getClassColor = (characterClass: string): string => {
    const colors: { [key: string]: string } = {
      'Warlock': 'purple.400',
      'Priest': 'white',
      'Paladin': 'pink.300',
      'Rogue': 'yellow.400',
      'Warrior': 'brown.400',
      'Mage': 'blue.400',
      'Druid': 'orange.400',
      'Hunter': 'green.400',
      'Shaman': 'blue.300',
      'Death Knight': 'red.400',
      'Monk': 'green.300',
      'Demon Hunter': 'purple.300',
    };
    return colors[characterClass] || 'gray.400';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'Tank': 'blue.400',
      'Healer': 'green.400',
      'DPS': 'red.400',
    };
    return colors[role] || 'gray.400';
  };

  const getClassIcon = (className: string): string => {
    const classIcons: { [key: string]: string } = {
      Warrior: warriorIcon,
      Paladin: paladinIcon,
      Hunter: hunterIcon,
      Rogue: rogueIcon,
      Priest: priestIcon,
      Mage: mageIcon,
      Warlock: warlockIcon,
      Druid: druidIcon,
    };
    return classIcons[className] || warriorIcon;
  };

  const formatDate = (date: any, defaultText: string): string => {
    try {
      if (!date) return defaultText;
      // Handle Firestore Timestamp
      if (date.toDate) {
        return format(date.toDate(), 'yyyy-MM-dd', { locale: sv });
      }
      // Handle Date object or string
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'yyyy-MM-dd', { locale: sv });
    } catch (error) {
      console.error('Error formatting date:', error);
      return defaultText;
    }
  };

  const formatLastActive = (date: Date | null | undefined, defaultText: string): string => {
    try {
      if (!date) return defaultText;
      return format(date, 'dd MMM yyyy', { locale: sv });
    } catch (error) {
      return defaultText;
    }
  };

  const handleDeleteCharacter = async () => {
    if (!user || !characterToDelete) return;

    try {
      const userRef = doc(db, 'users', user.username);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const updatedCharacters = characters.filter(char => char.id !== characterToDelete.id);

      // Get all events to check for signups
      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);

      // Update each event that has this character in signups or raid composition
      const eventUpdates = eventsSnapshot.docs.map(async (eventDoc) => {
        const eventData = eventDoc.data() as Event;
        let needsUpdate = false;
        let updatedData: Partial<Event> = {};

        // Check and update signups
        if (eventData.signups) {
          const signupEntries = Object.entries(eventData.signups);
          const hasCharacterSignup = signupEntries.some(([_, signup]) => 
            signup && signup.characterId === characterToDelete.id
          );
          
          if (hasCharacterSignup) {
            needsUpdate = true;
            updatedData.signups = Object.fromEntries(
              signupEntries.filter(([_, signup]) => 
                signup && signup.characterId !== characterToDelete.id
              )
            );
          }
        }

        // Check and update raid composition
        if (eventData.raidComposition?.groups) {
          const updatedGroups = eventData.raidComposition.groups.map(group => ({
            ...group,
            players: group.players.filter(player => player.characterId !== characterToDelete.id)
          }));

          if (JSON.stringify(updatedGroups) !== JSON.stringify(eventData.raidComposition.groups)) {
            needsUpdate = true;
            updatedData.raidComposition = {
              ...eventData.raidComposition,
              groups: updatedGroups
            };
          }
        }

        // Only update if changes are needed
        if (needsUpdate) {
          return updateDoc(doc(db, 'events', eventDoc.id), updatedData);
        }
      });

      // Wait for all event updates to complete
      await Promise.all([
        updateDoc(userRef, { characters: updatedCharacters }),
        ...eventUpdates.filter(Boolean)
      ]);

      // Update local state
      setCharacters(updatedCharacters);
      
      // Update user context
      if (user) {
        updateUser({
          ...user,
          characters: updatedCharacters
        });
      }

      toast({
        title: 'Character deleted',
        description: `${characterToDelete.name} has been deleted!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setCharacterToDelete(null);
      deleteAlertDialog.onClose();
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete character. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateDiscordNickname = async () => {
    if (!user) return;
    
    setIsUpdatingNickname(true);
    try {
      const userRef = doc(db, 'users', user.username);
      await updateDoc(userRef, {
        discordSignupNickname: discordSignupNickname
      });

      toast({
        title: 'Discord Signup Nickname Updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update user context
      updateUser({
        ...user,
        discordSignupNickname
      });
      
      // Exit edit mode after successful update
      setIsEditingNickname(false);
    } catch (error) {
      console.error('Error updating Discord signup nickname:', error);
      toast({
        title: 'Error',
        description: 'Failed to update Discord signup nickname. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box 
      minH="calc(100vh - 4rem)" 
      bgGradient={bgGradient} 
      py={8}
      pt="80px"
    >
      <Container maxW="7xl" px={{ base: 4, md: 8 }}>
        <Breadcrumbs />
        <Box
          bg="background.secondary"
          borderRadius="2xl"
          p={{ base: 4, md: 8 }}
          boxShadow="dark-lg"
          border="1px solid"
          borderColor="border.primary"
        >
          <VStack spacing={8} align="stretch">
            {/* Enhanced User Profile Section */}
            <MotionFlex
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              gap={{ base: 4, md: 6 }}
              direction={{ base: "column", md: "row" }}
              align="center"
              bg="background.tertiary"
              p={{ base: 4, md: 6 }}
              borderRadius="xl"
              border="1px solid"
              borderColor="border.primary"
            >
              {/* Avatar Section */}
              <Box position="relative">
                <Avatar
                  size={{ base: "xl", md: "2xl" }}
                  src={avatarUrl}
                  name={user.username}
                  cursor="pointer"
                  onClick={handleAvatarClick}
                  border="4px solid"
                  borderColor="border.primary"
                  bg="background.tertiary"
                  _hover={{
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isUploading && (
                    <AvatarBadge boxSize="1.25em" bg="green.500">
                      <Spinner size="xs" color="white" />
                    </AvatarBadge>
                  )}
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
              </Box>

              {/* Enhanced User Info Section */}
              <VStack align={{ base: "center", md: "start" }} spacing={4} flex={1}>
                <VStack align={{ base: "center", md: "start" }} spacing={1}>
                  <HStack spacing={3} flexWrap="wrap" justify={{ base: "center", md: "start" }}>
                    <Heading size={{ base: "md", md: "lg" }} color="text.primary">
                      {user.username}
                    </Heading>
                    {user.role === 'admin' && (
                      <Badge
                        colorScheme="primary"
                        variant="solid"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        bgGradient="linear(to-r, primary.400, secondary.500)"
                        boxShadow="0 0 15px var(--chakra-colors-primary-400)"
                        _hover={{
                          transform: 'translateY(-1px)',
                          boxShadow: '0 0 20px var(--chakra-colors-primary-500)'
                        }}
                        transition="all 0.2s"
                      >
                        Admin
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap" justify={{ base: "center", md: "start" }}>
                    <HStack spacing={1}>
                      <Icon as={FaCalendarAlt} color="text.secondary" boxSize={3} />
                      <Text color="text.secondary" fontSize="sm">
                        Joined {formatDate(user.createdAt, 'Unknown')}
                      </Text>
                    </HStack>
                    <Text color="text.secondary" fontSize="sm">
                      •
                    </Text>
                    <HStack spacing={1}>
                      <Icon as={FaClock} color="text.secondary" boxSize={3} />
                      <Text color="text.secondary" fontSize="sm">
                        Last active {formatLastActive(user.lastLogin, 'Unknown')}
                      </Text>
                    </HStack>
                  </HStack>
                </VStack>

                <HStack spacing={6} justify={{ base: "center", md: "start" }}>
                  <Tooltip label={isDiscordConnected ? `Discord Connected (${user.discordUsername})` : "Connect Discord"} hasArrow>
                    <Box 
                      as="span" 
                      cursor="pointer" 
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.1)' }}
                      position="relative"
                      onClick={!isDiscordConnected ? handleConnectDiscord : undefined}
                    >
                      <Icon 
                        as={FaDiscord} 
                        w={6} 
                        h={6} 
                        color={isDiscordConnected ? "primary.400" : "gray.400"} 
                      />
                      {isDiscordConnected && (
                        <Box
                          position="absolute"
                          bottom="-2px"
                          right="-2px"
                          w="10px"
                          h="10px"
                          bg="green.400"
                          borderRadius="full"
                          border="2px solid"
                          borderColor="background.tertiary"
                        />
                      )}
                    </Box>
                  </Tooltip>
                </HStack>

                {/* Discord Signup Nickname Section */}
                {isDiscordConnected && (
                  <FormControl width="100%">
                    <HStack spacing={2} mb={2}>
                      <FormLabel color="blue.300" fontSize={{ base: "sm", md: "md" }}>Discord Signup Nickname</FormLabel>
                      <Tooltip 
                        label="This is what you will show up as in the calendar when you sign on discord. It makes it easier for admins to identify you."
                        hasArrow
                        placement="top"
                      >
                        <Box as="span" cursor="help">
                          <Icon as={FaQuestionCircle} color="blue.300" />
                        </Box>
                      </Tooltip>
                    </HStack>
                    <HStack width="100%">
                      <Input
                        value={discordSignupNickname}
                        onChange={(e) => setDiscordSignupNickname(e.target.value)}
                        placeholder="Enter your Discord signup nickname"
                        bg="whiteAlpha.50"
                        color="white"
                        borderColor="whiteAlpha.200"
                        _hover={{ borderColor: isEditingNickname ? "whiteAlpha.300" : "whiteAlpha.200" }}
                        _focus={{
                          borderColor: "blue.300",
                          boxShadow: "0 0 0 1px var(--chakra-colors-blue-300)"
                        }}
                        isDisabled={!isEditingNickname && discordSignupNickname !== ''}
                        size={{ base: "sm", md: "md" }}
                      />
                      <Button
                        colorScheme="blue"
                        onClick={isEditingNickname ? handleUpdateDiscordNickname : () => setIsEditingNickname(true)}
                        isLoading={isUpdatingNickname}
                        size={{ base: "sm", md: "md" }}
                      >
                        {discordSignupNickname && !isEditingNickname ? 'Edit' : 'Save'}
                      </Button>
                    </HStack>
                  </FormControl>
                )}
              </VStack>
            </MotionFlex>

            {/* Characters Section */}
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading size="lg" color="text.primary">
                  Characters
                </Heading>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={onOpen}
                  size={{ base: "sm", md: "md" }}
                >
                  Add Character
                </Button>
              </HStack>

              {loading ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="blue.400" />
                </Flex>
              ) : characters.length === 0 ? (
                <Box
                  bg="background.tertiary"
                  p={6}
                  borderRadius="xl"
                  textAlign="center"
                  border="1px solid"
                  borderColor="border.primary"
                >
                  <Text color="text.secondary">
                    No characters added yet. Click the button above to add your first character!
                  </Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {characters.map((character: Character, index: number) => (
                    <MotionBox
                      key={character.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Box
                        bg="background.tertiary"
                        borderRadius="xl"
                        overflow="hidden"
                        position="relative"
                        transition="all 0.3s"
                        _hover={{
                          transform: 'translateY(-4px)',
                          boxShadow: `0 0 20px ${getClassColor(character.class)}33`,
                        }}
                        border="1px solid"
                        borderColor={`${getClassColor(character.class)}33`}
                      >
                        {/* Character card background with enhanced glow */}
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          h="100%"
                          bgGradient={`linear(to-br, ${getClassColor(character.class)}33, background.tertiary)`}
                          opacity={0.8}
                          zIndex={0}
                          filter="blur(20px)"
                        />

                        {/* Action buttons positioned at top right */}
                        <HStack 
                          position="absolute" 
                          top={2} 
                          right={2} 
                          spacing={1} 
                          zIndex={2}
                          bg="background.tertiary"
                          p={1}
                          borderRadius="md"
                          // boxShadow="md"
                        >
                          <IconButton
                            icon={<EditIcon />}
                            aria-label="Edit character"
                            size="sm"
                            variant="ghost"
                            colorScheme="primary"
                            onClick={() => setEditingCharacter(character)}
                            _hover={{
                              bg: 'whiteAlpha.200',
                              transform: 'scale(1.1)',
                            }}
                          />
                          <IconButton
                            aria-label="Delete character"
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => {
                              setCharacterToDelete(character);
                              deleteAlertDialog.onOpen();
                            }}
                            _hover={{
                              bg: 'whiteAlpha.200',
                              transform: 'scale(1.1)',
                            }}
                          />
                        </HStack>

                        <Flex p={{ base: 4, md: 6 }} position="relative" zIndex={1} direction="column">
                          <Flex direction="row" align="center">
                            <Box 
                              position="relative" 
                              minW={{ base: "40px", sm: "60px" }}
                              h={{ base: "40px", sm: "60px" }}
                              mr={{ base: 3, sm: 4 }}
                              bg="background.secondary"
                              borderRadius="lg"
                              p={1}
                              boxShadow={`0 0 10px ${getClassColor(character.class)}33`}
                              _after={{
                                content: '""',
                                position: 'absolute',
                                top: '-2px',
                                left: '-2px',
                                right: '-2px',
                                bottom: '-2px',
                                borderRadius: 'lg',
                                border: '2px solid',
                                borderColor: `${getClassColor(character.class)}33`,
                                opacity: 0.5,
                              }}
                            >
                              <Tooltip 
                                label={`${character.race} ${character.class}`} 
                                hasArrow
                                placement="top"
                              >
                                <Image
                                  src={getClassIcon(character.class)}
                                  alt={character.class}
                                  w="100%"
                                  h="100%"
                                  objectFit="cover"
                                  borderRadius="lg"
                                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"
                                />
                              </Tooltip>
                            </Box>

                            <Box flex={1}>
                              <VStack align="start" spacing={1}>
                                <Heading 
                                  size={{ base: "sm", sm: "md" }}
                                  color="text.primary"
                                  display="flex"
                                  alignItems="center"
                                  gap={2}
                                  fontWeight="bold"
                                >
                                  {character.name}
                                  {character.isMain && (
                                    <Badge 
                                      colorScheme="yellow"
                                      variant="solid"
                                      fontSize="xs"
                                      px={2}
                                      borderRadius="full"
                                      textTransform="uppercase"
                                      letterSpacing="wider"
                                      boxShadow="0 0 10px rgba(236, 201, 75, 0.4)"
                                    >
                                      MAIN
                                    </Badge>
                                  )}
                                </Heading>
                                <Text 
                                  color={getClassColor(character.class)}
                                  fontWeight="bold"
                                  fontSize="sm"
                                  textShadow={`0 0 8px ${getClassColor(character.class)}66`}
                                >
                                  {character.race} {character.class}
                                </Text>
                              </VStack>
                              <Flex 
                                justify="space-between" 
                                align="center" 
                                mt={{ base: 2, sm: 2 }}
                                direction="row"
                              >
                                <HStack spacing={2}>
                                  <Tooltip label="Character Level" hasArrow>
                                    <Text 
                                      color="white" 
                                      fontSize="xs"
                                      fontWeight="bold"
                                    >
                                      Level {character.level}
                                    </Text>
                                  </Tooltip>
                                  <Tooltip label={`Role: ${character.role}`} hasArrow>
                                    <Badge
                                      colorScheme={
                                        character.role === 'Tank' ? 'red' :
                                        character.role === 'Healer' ? 'green' : 'blue'
                                      }
                                      px={2}
                                      py={1}
                                      borderRadius="full"
                                      fontSize="xs"
                                      textTransform="uppercase"
                                      letterSpacing="wider"
                                      boxShadow={
                                        character.role === 'Tank' ? '0 0 10px rgba(229, 62, 62, 0.4)' :
                                        character.role === 'Healer' ? '0 0 10px rgba(72, 187, 120, 0.4)' :
                                        '0 0 10px rgba(66, 153, 225, 0.4)'
                                      }
                                    >
                                      {character.role}
                                    </Badge>
                                  </Tooltip>
                                </HStack>
                                <Tooltip label="View Warcraft Logs" hasArrow>
                                  <Link 
                                    href={`https://fresh.warcraftlogs.com/character/eu/spineshatter/${character.name}`} 
                                    isExternal
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Image
                                      src={logsIcon}
                                      alt="Warcraft Logs"
                                      boxSize="20px"
                                      objectFit="contain"
                                      _hover={{ transform: 'scale(1.1)' }}
                                      transition="transform 0.2s"
                                    />
                                  </Link>
                                </Tooltip>
                              </Flex>
                            </Box>
                          </Flex>
                        </Flex>
                      </Box>
                    </MotionBox>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </VStack>
        </Box>
      </Container>

      {/* Existing modals */}
      <CharacterCreationModal 
        isOpen={isOpen} 
        onClose={onClose}
        onCharacterCreated={fetchCharacters}
      />

      {editingCharacter && (
        <CharacterEditModal
          isOpen={!!editingCharacter}
          onClose={() => setEditingCharacter(null)}
          character={editingCharacter}
          onCharacterUpdated={fetchCharacters}
        />
      )}

      <AlertDialog
        isOpen={deleteAlertDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteAlertDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(10px)">
          <AlertDialogContent bg="#1A202C" boxShadow="dark-lg">
            <AlertDialogHeader color="white" fontSize="lg">
              Delete Character
            </AlertDialogHeader>

            <AlertDialogBody color="gray.300">
              Are you sure you want to delete {characterToDelete?.name}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={deleteAlertDialog.onClose}
                variant="ghost"
                color="white"
                _hover={{ bg: '#2D3748' }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteCharacter}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Profile; 