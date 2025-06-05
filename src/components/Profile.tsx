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
  useToast,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Input,
  InputGroup,
  InputRightElement,
  FormControl,
  FormLabel,
  useMediaQuery,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { AddIcon, StarIcon, EditIcon, ExternalLinkIcon, DeleteIcon, ChevronRightIcon, EmailIcon, CalendarIcon, TimeIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
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
import { doc, updateDoc, getDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Character, Event } from '../types/firebase';
import CharacterCreationModal from './CharacterCreationModal';
import CharacterEditModal from './CharacterEditModal';
import { EventSignupModal } from './EventSignupModal';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDiscord } from 'react-icons/fa';
import { FaRegCircleCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { format, isAfter } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import { raidHelperService } from '../services/raidhelper';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionVStack = motion(VStack);
const MotionSimpleGrid = motion(SimpleGrid);
const MotionHeading = motion(Heading);

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
  const [originalNickname, setOriginalNickname] = useState('');
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
  const cardBg = 'gray.700';
  const discordIconColor = useColorModeValue('blue.500', 'blue.300');
  const isNeonTheme = false;
  const neonGreenColor = 'green.500';
  const textColor = isNeonTheme ? neonGreenColor : 'white';
  const [events, setEvents] = useState<Event[]>([]);
  const [signedUpEvents, setSignedUpEvents] = useState<Event[]>([]);
  const [notSignedUpEvents, setNotSignedUpEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  
  // Add EventSignupModal state
  const [selectedEventForSignup, setSelectedEventForSignup] = useState<Event | null>(null);
  const { isOpen: isEventSignupOpen, onOpen: onEventSignupOpen, onClose: onEventSignupClose } = useDisclosure();

  // Add memoization and caching for Discord signups
  const [discordSignupsCache, setDiscordSignupsCache] = useState<Record<string, { data: any[], timestamp: number }>>({});
  const CACHE_DURATION = 30000; // 30 seconds cache

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
          setOriginalNickname(userData.discordSignupNickname || '');
          
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
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file under 5MB',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file format',
        description: 'Please select an image file',
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
        title: 'Profile picture updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error in file upload process:', error);
      let errorMessage = 'Please try again later.';
      
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('storage/unauthorized')) {
          errorMessage = 'Permission denied. Please log in again.';
        } else if (error.message.includes('storage/quota-exceeded')) {
          errorMessage = 'Storage quota exceeded. Please contact support.';
        } else if (error.message.includes('cors')) {
          errorMessage = 'Cross-origin request blocked. Please try again.';
        }
      }
      
      toast({
        title: 'Error updating profile picture',
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
      'Warlock': 'purple',
      'Priest': 'gray',
      'Paladin': 'pink',
      'Rogue': 'yellow',
      'Warrior': 'red',
      'Mage': 'blue',
      'Druid': 'orange',
      'Hunter': 'green',
      'Shaman': 'cyan',
      'Death Knight': 'red',
      'Monk': 'teal',
      'Demon Hunter': 'purple',
    };
    return colors[characterClass] || 'gray';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'Tank': 'blue',
      'Healer': 'green',
      'DPS': 'red',
    };
    return colors[role] || 'gray';
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

  const formatLastActive = (date: Date | Timestamp | null | undefined, defaultText: string): string => {
    if (!date) {
      return defaultText;
    }
    // Check if it's a Firestore Timestamp and convert to Date
    const dateToFormat = date instanceof Timestamp ? date.toDate() : date;
    
    try {
      return format(dateToFormat, 'PPP p', { locale: sv });
    } catch (error) {
      console.error("Error formatting date:", error);
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
        title: 'Calendar Nickname Updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update user context
      updateUser({
        ...user,
        discordSignupNickname
      });
      
      // Update original nickname and exit edit mode
      setOriginalNickname(discordSignupNickname);
      setIsEditingNickname(false);
    } catch (error) {
      console.error('Error updating Discord signup nickname:', error);
      toast({
        title: 'Error',
        description: 'Failed to update calendar nickname. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  // Optimized batch fetching of Discord signups
  const fetchLiveDiscordSignupsBatch = async (raidHelperEvents: Event[]): Promise<Record<string, any[]>> => {
    const results: Record<string, any[]> = {};
    const now = Date.now();
    
    // Filter events that need fresh data
    const eventsToFetch = raidHelperEvents.filter(event => {
      if (!event.raidHelperId) return false;
      
      const cached = discordSignupsCache[event.raidHelperId];
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        results[event.raidHelperId] = cached.data;
        return false;
      }
      return true;
    });

    if (eventsToFetch.length === 0) {
      return results;
    }

    // Batch API calls with Promise.allSettled for better error handling
    const promises = eventsToFetch.map(async (event) => {
      if (!event.raidHelperId) return { eventId: event.raidHelperId, data: [] };
      
      try {
        const response = await raidHelperService.getEvent(event.raidHelperId);
        const signups = response?.signUps?.filter((signup: any) => signup.status === "primary") || [];
        return { eventId: event.raidHelperId, data: signups };
      } catch (error) {
        console.error(`Error fetching Discord signups for event ${event.raidHelperId}:`, error);
        return { eventId: event.raidHelperId, data: [] };
      }
    });

    const responses = await Promise.allSettled(promises);
    
    // Process results and update cache
    const newCacheEntries: Record<string, { data: any[], timestamp: number }> = {};
    
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value) {
        const { eventId, data } = response.value;
        if (eventId) {
          results[eventId] = data;
          newCacheEntries[eventId] = { data, timestamp: now };
        }
      }
    });

    // Update cache
    setDiscordSignupsCache(prev => ({ ...prev, ...newCacheEntries }));
    
    return results;
  };

  // Optimized function to check if user is signed up (with cached Discord data)
  const checkUserSignedUpOptimized = (event: Event, user: any, discordSignupsData?: any[]): boolean => {
    let isSignedUp = false;
    
    // Check regular website signups first (no API call needed)
    if (event.signups && !isSignedUp) {
      for (const signupKey in event.signups) {
        const signup = event.signups[signupKey];
        if (!signup) continue;
        
        // Check by user ID/username
        if (signup.userId === user.username || signup.username === user.username) {
          isSignedUp = true;
          break;
        }
        
        // Check by character ID
        if (user.characters && user.characters.some((char: any) => char.id === signup.characterId)) {
          isSignedUp = true;
          break;
        }
        
        // Check by character name (for Discord signups stored in regular signups)
        if (user.discordSignupNickname && signup.characterName === user.discordSignupNickname) {
          isSignedUp = true;
          break;
        }
      }
    }
    
    // Check live Discord signups for RaidHelper events (using cached data)
    if (!isSignedUp && event.signupType === 'raidhelper' && discordSignupsData) {
      for (const signup of discordSignupsData) {
        // Check by Discord ID
        if (user.discordId && signup.userId === user.discordId) {
          isSignedUp = true;
          break;
        }
        
        // Check by Discord username
        if (user.discordUsername && signup.name === user.discordUsername) {
          isSignedUp = true;
          break;
        }
        
        // Check by calendar nickname (discordSignupNickname)
        if (user.discordSignupNickname && signup.name === user.discordSignupNickname) {
          isSignedUp = true;
          break;
        }
        
        // Check by regular username as fallback
        if (signup.name === user.username) {
          isSignedUp = true;
          break;
        }
      }
    }
    
    return isSignedUp;
  };

  // Fetch all events and filter signups
  useEffect(() => {
    async function fetchEventsAndSignups() {
      if (!user) return;
      
      const startTime = performance.now();
      setIsLoadingEvents(true);
      try {
        console.log('📅 Starting event fetch for profile...');
        
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const fetchEventsTime = performance.now() - startTime;
        console.log(`📄 Firestore events fetched in ${fetchEventsTime.toFixed(2)}ms`);
        
        const allEvents: Event[] = [];
        const signedUp: { event: Event, endDate: Date }[] = [];
        const notSignedUp: Event[] = [];
        const now = new Date();
        
        // Convert to array for async processing
        const eventsArray: Event[] = [];
        eventsSnapshot.forEach(docSnap => {
          const event = docSnap.data() as Event;
          event.id = docSnap.id;
          eventsArray.push(event);
          allEvents.push(event);
        });
        
        // Get all RaidHelper events that need Discord signup checks
        const raidHelperEvents = eventsArray.filter(event => 
          event.signupType === 'raidhelper' && event.raidHelperId
        );
        
        console.log(`🎮 Found ${raidHelperEvents.length} RaidHelper events to check`);
        
        // Batch fetch Discord signups for all RaidHelper events
        const discordFetchStart = performance.now();
        const discordSignupsData = await fetchLiveDiscordSignupsBatch(raidHelperEvents);
        const discordFetchTime = performance.now() - discordFetchStart;
        console.log(`🔗 Discord signups fetched in ${discordFetchTime.toFixed(2)}ms`);
        
        // Process each event to check signup status
        for (const event of eventsArray) {
          let endDate: Date;
          if (event.end instanceof Timestamp) {
            endDate = event.end.toDate();
          } else if (typeof event.end === 'string') {
            endDate = new Date(event.end);
          } else if (event.date && event.time) {
            // If no end time, use date + time as the event time
            endDate = new Date(`${event.date}T${event.time}`);
          } else {
            // Fallback: use date only (end of day)
            endDate = new Date(event.date + 'T23:59:59');
          }
          
          // Check if user is signed up using our enhanced function
          const discordData = event.raidHelperId ? discordSignupsData[event.raidHelperId] : undefined;
          const isSignedUp = checkUserSignedUpOptimized(event, user, discordData);
          
          if (isSignedUp) {
            signedUp.push({ event, endDate });
          } else {
            // Only add to notSignedUp if the event is in the future
            if (isAfter(endDate, now)) {
              notSignedUp.push(event);
            }
          }
        }
        
        const upcomingSignedUp = signedUp.filter(({ endDate }) => isAfter(endDate, now)).map(({ event }) => event);
        setEvents(allEvents);
        setSignedUpEvents(upcomingSignedUp);
        setNotSignedUpEvents(notSignedUp);
        
        const totalTime = performance.now() - startTime;
        console.log(`✅ Total event processing completed in ${totalTime.toFixed(2)}ms`);
        console.log(`📊 Results: ${upcomingSignedUp.length} signed up, ${notSignedUp.length} not signed up`);
      } catch (error) {
        console.error('❌ Error fetching events and signups:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    }
    fetchEventsAndSignups();
  }, [user]);

  // Add event click handlers
  const handleEventClick = (event: Event) => {
    setSelectedEventForSignup(event);
    onEventSignupOpen();
  };

  const handleSignupChange = (updatedEvent: Event) => {
    // Refresh the events data after signup change
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    // Re-fetch to update signed up/not signed up lists
    async function refreshEvents() {
      if (!user) return;
      
      setIsLoadingEvents(true);
      try {
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const allEvents: Event[] = [];
        const signedUp: { event: Event, endDate: Date }[] = [];
        const notSignedUp: Event[] = [];
        const now = new Date();
        
        // Convert to array for async processing
        const eventsArray: Event[] = [];
        eventsSnapshot.forEach(docSnap => {
          const event = docSnap.data() as Event;
          event.id = docSnap.id;
          eventsArray.push(event);
          allEvents.push(event);
        });
        
        // Get all RaidHelper events that need Discord signup checks
        const raidHelperEvents = eventsArray.filter(event => 
          event.signupType === 'raidhelper' && event.raidHelperId
        );
        
        // Batch fetch Discord signups for all RaidHelper events
        const discordSignupsData = await fetchLiveDiscordSignupsBatch(raidHelperEvents);
        
        // Process each event to check signup status
        for (const event of eventsArray) {
          let endDate: Date;
          if (event.end instanceof Timestamp) {
            endDate = event.end.toDate();
          } else if (typeof event.end === 'string') {
            endDate = new Date(event.end);
          } else if (event.date && event.time) {
            // If no end time, use date + time as the event time
            endDate = new Date(`${event.date}T${event.time}`);
          } else {
            // Fallback: use date only (end of day)
            endDate = new Date(event.date + 'T23:59:59');
          }
          
          // Check if user is signed up using our enhanced function
          const discordData = event.raidHelperId ? discordSignupsData[event.raidHelperId] : undefined;
          const isSignedUp = checkUserSignedUpOptimized(event, user, discordData);
          
          if (isSignedUp) {
            signedUp.push({ event, endDate });
          } else {
            // Only add to notSignedUp if the event is in the future
            if (isAfter(endDate, now)) {
              notSignedUp.push(event);
            }
          }
        }
        
        const upcomingSignedUp = signedUp.filter(({ endDate }) => isAfter(endDate, now)).map(({ event }) => event);
        setEvents(allEvents);
        setSignedUpEvents(upcomingSignedUp);
        setNotSignedUpEvents(notSignedUp);
      } catch (error) {
        console.error('Error refreshing events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    }
    refreshEvents();
  };

  // Enhanced event card component
  const EventCard = ({ event, isSignedUp = false }: { event: Event; isSignedUp?: boolean }) => (
    <Box 
      bg="gray.750" 
      borderRadius="xl" 
      p={{ base: 3, md: 5 }}
      border="0.5px solid"
      borderColor={isSignedUp ? "green.500" : "yellow.500"}
      cursor={isSignedUp ? "default" : "pointer"}
      onClick={!isSignedUp ? () => handleEventClick(event) : undefined}
      _hover={!isSignedUp ? { 
        bg: 'gray.700', 
        borderColor: 'yellow.400',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
      } : {
        bg: 'gray.700',
        transform: 'translateY(-1px)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
      }}
      transition="all 0.3s ease"
      position="relative"
      overflow="hidden"
      minH={{ base: "100px", md: "120px" }}
    >
      {/* Status indicator */}
      <Box
        position="absolute"
        top={{ base: 2, md: 3 }}
        right={{ base: 2, md: 3 }}
        bg={isSignedUp ? "green.500" : "yellow.500"}
        color="white"
        px={2}
        py={1}
        borderRadius="md"
        fontSize={{ base: "2xs", md: "xs" }}
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="wide"
        zIndex={1}
        maxW={{ base: "80px", md: "120px" }}
        textAlign="center"
      >
        {isSignedUp ? "SIGNED UP" : "SIGN UP"}
      </Box>

      <VStack align="stretch" spacing={{ base: 2, md: 3 }} h="100%">
        {/* Event title */}
        <Box pr={{ base: 20, md: 28 }}>
          <Heading 
            size={{ base: "xs", md: "md" }}
            color={textColor} 
            fontFamily="Satoshi"
            fontWeight="600"
            fontSize={{ base: "sm", md: "md" }}
            letterSpacing="tight"
            lineHeight="1.3"
            wordBreak="break-word"
            noOfLines={2}
          >
            {event.title}
          </Heading>
        </Box>

        {/* Event details - Always visible */}
        <VStack align="stretch" spacing={{ base: 1, md: 2 }} flex="1">
          {/* Date and Time - More prominent */}
          <HStack spacing={{ base: 2, md: 4 }} flexWrap="wrap" mb={{ base: 1, md: 2 }}>
            <Flex align="center" gap={2} minW="fit-content">
              <Icon as={CalendarIcon} color={isSignedUp ? "green.400" : "yellow.400"} boxSize={{ base: 3, md: 4 }} />
              <Text color="gray.200" fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold">
                {formatDate(event.date, 'N/A')}
              </Text>
            </Flex>
            <Flex align="center" gap={2} minW="fit-content">
              <Icon as={TimeIcon} color={isSignedUp ? "green.400" : "yellow.400"} boxSize={{ base: 3, md: 4 }} />
              <Text color="gray.200" fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold">
                {event.time}
              </Text>
            </Flex>
          </HStack>

          {/* Event description if available */}
          {event.description && (
            <Text 
              color="gray.400" 
              fontSize={{ base: "xs", md: "sm" }}
              noOfLines={1}
              lineHeight="1.4"
            >
              {event.description}
            </Text>
          )}

          {/* Signup count if available */}
          {event.signups && (
            <Flex align="center" gap={2}>
              <Icon as={StarIcon} color="blue.400" boxSize={{ base: 2, md: 3 }} />
              <Text color="gray.400" fontSize={{ base: "2xs", md: "xs" }}>
                {Object.keys(event.signups).length} signed up
              </Text>
            </Flex>
          )}

          {/* Action indicator for non-signed up events */}
          {!isSignedUp && (
            <Flex align="center" justify="center" pt={1} mt="auto">
              <Text 
                color="yellow.400" 
                fontSize={{ base: "2xs", md: "xs" }}
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                textAlign="center"
              >
                ✨ Click to join this event
              </Text>
            </Flex>
          )}
        </VStack>
      </VStack>
    </Box>
  );

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: (i:number = 1) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.2, duration: 0.5, ease: 'easeOut' },
    }),
  };

  const characterCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i:number = 1) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
    }),
  };

  if (loading && !isInitialDataFetched) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <MotionBox
      key="profile-page"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      pt={isMobile ? 4 : 8}
      pb={8}
      px={isMobile ? 4 : 8}
    >
      <Container maxW="container.xl">
        <Box mb={isMobile ? 4 : 8}>
          <Breadcrumbs 
            items={[
              { label: 'Home', path: '/' },
              { label: 'Profile', path: '/profile' },
            ]}
          />
        </Box>
        {/* Unified Profile Card */}
        <Box 
          bg={cardBg} 
          borderRadius="2xl" 
          boxShadow="2xl" 
          p={{ base: 4, md: 12 }} 
          minH={{ base: "auto", md: "70vh" }}
          border="1px solid"
          borderColor="gray.600"
        >
          <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 6, md: 8, lg: 12 }} align="flex-start">
            {/* Characters Block */}
            <Box 
              w={{ base: '100%', lg: '340px' }} 
              flexShrink={0} 
              pr={{ base: 0, lg: 6 }} 
              borderRight={{ base: 'none', lg: '2px solid' }} 
              borderBottom={{ base: '2px solid', lg: 'none' }}
              borderColor={{ base: 'gray.600', lg: 'gray.600' }}
              pb={{ base: 6, lg: 0 }}
            >
              <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                <Button
                  colorScheme="blue"
                  leftIcon={<AddIcon />}
                  onClick={onOpen}
                  w="100%"
                  size={{ base: "md", md: "lg" }}
                  height={{ base: "44px", md: "50px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="semibold"
                  as={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  boxShadow="lg"
                  _hover={{ boxShadow: "xl" }}
                >
                  Add Character
                </Button>
                
                <Box>
                  <Heading 
                    size={{ base: "md", md: "lg" }}
                    fontFamily="ClashDisplay" 
                    color={textColor} 
                    mb={4} 
                    textAlign="left"
                    letterSpacing="tight"
                  >
                    My Characters
                  </Heading>
                  
                  <VStack spacing={3} align="stretch">
                    {characters.length > 0 ? (
                      characters.map((char, index) => (
                        <Box
                          key={char.id || index}
                          bg={char.isMain ? 'gray.750' : index % 2 === 0 ? 'gray.800' : 'gray.750'}
                          borderRadius="xl"
                          p={{ base: 3, md: 4 }}
                          boxShadow={char.isMain ? 
                            '0 0 0 2px rgba(255, 215, 0, 0.4), 0 4px 12px rgba(255, 215, 0, 0.15)' : 
                            '0 2px 8px rgba(0, 0, 0, 0.3)'
                          }
                          borderWidth="1px"
                          borderColor={char.isMain ? 'yellow.400' : 'gray.600'}
                          _hover={{ 
                            boxShadow: char.isMain ? 
                              '0 0 0 2px rgba(255, 215, 0, 0.5), 0 6px 16px rgba(255, 215, 0, 0.2)' : 
                              '0 4px 12px rgba(0, 0, 0, 0.4)', 
                            borderColor: char.isMain ? 'yellow.300' : 'blue.400', 
                            transform: 'translateY(-1px)',
                            bg: char.isMain ? 'gray.700' : 'gray.700'
                          }}
                          transition="all 0.2s ease"
                          cursor="pointer"
                        >
                          <Flex align="center" justify="space-between">
                            <Flex align="center" gap={{ base: 2, md: 3 }} flex="1">
                              <Image 
                                src={getClassIcon(char.class)} 
                                alt={char.class} 
                                boxSize={{ base: "28px", md: "32px" }}
                                borderRadius="md"
                              />
                              <Box flex="1">
                                <Flex align="center" gap={2} mb={1}>
                                  <Heading 
                                    size="sm" 
                                    fontFamily="ClashDisplay" 
                                    color={textColor}
                                    letterSpacing="tight"
                                    fontSize={{ base: "sm", md: "md" }}
                                  >
                                    {char.name}
                                  </Heading>
                                  {char.isMain && (
                                    <StarIcon color="yellow.400" boxSize={{ base: 2, md: 3 }} />
                                  )}
                                </Flex>
                                <Badge 
                                  colorScheme={getRoleColor(char.role)} 
                                  size="sm"
                                  borderRadius="md"
                                  fontSize={{ base: "xs", md: "sm" }}
                                >
                                  {char.role}
                                </Badge>
                              </Box>
                            </Flex>
                            <IconButton
                              aria-label="Edit Character"
                              icon={<EditIcon />}
                              size={{ base: "xs", md: "sm" }}
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => setEditingCharacter(char)}
                              _hover={{ bg: 'blue.600', color: 'white' }}
                              borderRadius="lg"
                            />
                          </Flex>
                        </Box>
                      ))
                    ) : (
                      <Box 
                        textAlign="center" 
                        py={{ base: 6, md: 8 }}
                        bg="gray.800" 
                        borderRadius="xl" 
                        border="2px dashed" 
                        borderColor="gray.600"
                      >
                        <Text color={textColor} fontSize={{ base: "sm", md: "md" }} opacity={0.7}>
                          No characters yet.
                        </Text>
                        <Text color={textColor} fontSize={{ base: "xs", md: "sm" }} opacity={0.5} mt={1}>
                          Click "Add Character" to get started
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </Box>

            {/* Profile Info Block */}
            <Box flex={1} pt={{ base: 0, lg: 0 }}>
              <VStack spacing={{ base: 6, md: 8 }} align="stretch">
                {/* Profile Info */}
                <Box 
                  bg="gray.800" 
                  p={{ base: 4, md: 6 }}
                  borderRadius="xl" 
                  border="1px solid" 
                  borderColor="gray.600"
                  boxShadow="lg"
                >
                  <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'center', sm: 'flex-start' }} gap={{ base: 4, md: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Avatar 
                        size={{ base: "xl", md: "2xl" }}
                        name={user?.username} 
                        src={avatarUrl} 
                        mb={3}
                        cursor="pointer"
                        onClick={handleAvatarClick}
                        _hover={{ 
                          transform: 'scale(1.05)',
                          boxShadow: 'lg'
                        }}
                        transition="all 0.2s ease"
                        title="Click to change avatar"
                      />
                      <Input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                      />
                      
                      {/* Discord Info - moved here */}
                      <Flex align="center" gap={3} mt={2}>
                        <Icon as={FaDiscord} color={discordIconColor} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                        <Text fontWeight="semibold" color={textColor} fontSize={{ base: "xs", md: "sm" }}>
                          Discord
                        </Text>
                        {isDiscordConnected ? (
                          <Badge colorScheme="green" px={2} py={1} borderRadius="md" fontSize="xs">
                            CONNECTED
                          </Badge>
                        ) : (
                          <Button 
                            colorScheme="blue" 
                            size="xs" 
                            onClick={handleConnectDiscord} 
                            leftIcon={<FaDiscord />}
                            borderRadius="md"
                            _hover={{ transform: 'translateY(-1px)' }}
                            fontSize="xs"
                          >
                            Connect
                          </Button>
                        )}
                      </Flex>
                    </Box>
                    
                    <Box flex={1} w="100%">
                      <Heading 
                        size={{ base: "lg", md: "xl" }}
                        fontFamily="ClashDisplay" 
                        color={textColor} 
                        mb={4} 
                        textAlign={{ base: 'center', sm: 'left' }}
                        letterSpacing="tight"
                      >
                        {user?.username}
                      </Heading>
                      
                      <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                        {/* Raider Status - more compact */}
                        <Flex align="center" gap={3} flexWrap="wrap">
                          <Icon 
                            as={StarIcon} 
                            color={user?.confirmedRaider ? 'green.400' : 'orange.400'} 
                            w={{ base: 4, md: 5 }} 
                            h={{ base: 4, md: 5 }}
                          />
                          <Text fontWeight="semibold" color={textColor} fontSize={{ base: "sm", md: "md" }}>
                            Raider Status
                          </Text>
                          {user?.confirmedRaider ? (
                            <Badge colorScheme="green" fontSize={{ base: "xs", md: "sm" }} px={3} py={1} borderRadius="lg">
                              CONFIRMED
                            </Badge>
                          ) : (
                            <Badge colorScheme="orange" fontSize={{ base: "xs", md: "sm" }} px={3} py={1} borderRadius="lg">
                              PENDING
                            </Badge>
                          )}
                        </Flex>

                        {user?.email && (
                          <Flex align="center" gap={3} flexWrap="wrap">
                            <EmailIcon color="gray.400" w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} />
                            <Text color={textColor} fontSize={{ base: "sm", md: "md" }} wordBreak="break-word">
                              {user?.email}
                            </Text>
                          </Flex>
                        )}
                        
                        {/* Calendar Nickname */}
                        <FormControl>
                          <FormLabel color={textColor} fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} mb={2}>
                            <Flex align="center" gap={2}>
                              <CalendarIcon w={4} h={4} />
                              Calendar Nickname
                            </Flex>
                          </FormLabel>
                          <InputGroup>
                            <Input
                              value={discordSignupNickname}
                              onChange={e => setDiscordSignupNickname(e.target.value)}
                              size={{ base: "sm", md: "md" }}
                              color={textColor}
                              bg="gray.700"
                              borderColor="gray.500"
                              _placeholder={{ color: 'gray.400' }}
                              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #3182ce' }}
                              _disabled={{ 
                                bg: 'gray.750',
                                borderColor: 'gray.600',
                                color: 'gray.300',
                                cursor: 'not-allowed'
                              }}
                              borderRadius="lg"
                              h={{ base: "40px", md: "44px" }}
                              fontSize={{ base: "sm", md: "md" }}
                              disabled={!isEditingNickname}
                              placeholder={isEditingNickname ? "Enter your calendar nickname" : ""}
                              pr={isEditingNickname ? "90px" : "50px"}
                            />
                            <InputRightElement h={{ base: "40px", md: "44px" }} w={isEditingNickname ? "85px" : "45px"}>
                              {!isEditingNickname ? (
                                <IconButton
                                  aria-label="Edit nickname"
                                  icon={<EditIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => {
                                    setIsEditingNickname(true);
                                    setOriginalNickname(discordSignupNickname);
                                  }}
                                  _hover={{ bg: 'blue.600', color: 'white' }}
                                  borderRadius="md"
                                />
                              ) : (
                                <HStack spacing={1} w="100%" justify="flex-end" pr={1}>
                                  <IconButton
                                    aria-label="Save nickname"
                                    icon={<CheckIcon />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="green"
                                    onClick={handleUpdateDiscordNickname}
                                    isLoading={isUpdatingNickname}
                                    _hover={{ bg: 'green.600', color: 'white' }}
                                    borderRadius="md"
                                  />
                                  <IconButton
                                    aria-label="Cancel edit"
                                    icon={<CloseIcon />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => {
                                      setIsEditingNickname(false);
                                      setDiscordSignupNickname(originalNickname);
                                    }}
                                    _hover={{ bg: 'red.600', color: 'white' }}
                                    borderRadius="md"
                                  />
                                </HStack>
                              )}
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>
                      </VStack>
                    </Box>
                  </Flex>
                </Box>

                {/* Events You're Signed Up For */}
                {user?.confirmedRaider && (
                  <Box 
                    bg="gray.800" 
                    p={{ base: 4, md: 6 }}
                    borderRadius="xl" 
                    border="1px solid" 
                    borderColor="gray.600"
                    boxShadow="lg"
                  >
                    <Accordion allowMultiple>
                      <AccordionItem border="none">
                        <AccordionButton
                          p={0}
                          _hover={{ bg: 'transparent' }}
                          _focus={{ boxShadow: 'none' }}
                        >
                          <Box flex="1" textAlign="left">
                            <Heading size={{ base: "sm", md: "md" }} color={textColor} letterSpacing="tight" fontFamily="Satoshi" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                              <Flex align="center" gap={3}>
                                <FaRegCircleCheck color='#24c223' />
                                <Text>Events You're Signed Up For ({isLoadingEvents ? '...' : signedUpEvents.length})</Text>
                                {!isLoadingEvents && <AccordionIcon />}
                                {isLoadingEvents && <Spinner size="sm" color="blue.400" />}
                              </Flex>
                            </Heading>
                          </Box>
                        </AccordionButton>
                        <AccordionPanel p={0} pt={4}>
                          {isLoadingEvents ? (
                            <Flex justify="center" align="center" h="100px">
                              <VStack spacing={3}>
                                <Spinner size="lg" color="blue.400" />
                                <Text color="gray.400" fontSize="sm">Loading events...</Text>
                              </VStack>
                            </Flex>
                          ) : signedUpEvents.length > 0 ? (
                            <VStack
                              align="stretch"
                              spacing={3}
                              maxH={{ base: "250px", md: "300px" }}
                              overflowY="auto"
                              sx={{
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { 
                                  display: 'none'
                                }
                              }}
                            >
                              {signedUpEvents.slice(0, 4).map((event, idx) => (
                                <EventCard key={event.id} event={event} isSignedUp />
                              ))}
                            </VStack>
                          ) : (
                            <Flex justify="center" align="center" h="100px">
                              <Text color="gray.400" fontSize="sm">No events signed up for</Text>
                            </Flex>
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </Box>
                )}

                {/* Events You Haven't Signed Up For */}
                {user?.confirmedRaider && (
                  <Box 
                    bg="gray.800" 
                    p={{ base: 4, md: 6 }}
                    borderRadius="xl" 
                    border="1px solid" 
                    borderColor="gray.600"
                    boxShadow="lg"
                  >
                    <Accordion allowMultiple>
                      <AccordionItem border="none">
                        <AccordionButton
                          p={0}
                          _hover={{ bg: 'transparent' }}
                          _focus={{ boxShadow: 'none' }}
                        >
                          <Box flex="1" textAlign="left">
                            <Heading size={{ base: "sm", md: "md" }} color={textColor} letterSpacing="tight" fontFamily="Satoshi" fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                              <Flex align="center" gap={3}>
                                <RxCross2 color="red" />
                                <Text>Events You Haven't Signed Up For ({isLoadingEvents ? '...' : notSignedUpEvents.length})</Text>
                                {!isLoadingEvents && <AccordionIcon />}
                                {isLoadingEvents && <Spinner size="sm" color="blue.400" />}
                              </Flex>
                            </Heading>
                          </Box>
                        </AccordionButton>
                        <AccordionPanel p={0} pt={4}>
                          {isLoadingEvents ? (
                            <Flex justify="center" align="center" h="100px">
                              <VStack spacing={3}>
                                <Spinner size="lg" color="blue.400" />
                                <Text color="gray.400" fontSize="sm">Loading events...</Text>
                              </VStack>
                            </Flex>
                          ) : notSignedUpEvents.length > 0 ? (
                            <VStack
                              align="stretch"
                              spacing={3}
                              maxH={{ base: "250px", md: "300px" }}
                              overflowY="auto"
                              sx={{
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { 
                                  display: 'none'
                                }
                              }}
                            >
                              {notSignedUpEvents.slice(0, 4).map((event, idx) => (
                                <EventCard key={event.id} event={event} />
                              ))}
                            </VStack>
                          ) : (
                            <Flex justify="center" align="center" h="100px">
                              <Text color="gray.400" fontSize="sm">No upcoming events available</Text>
                            </Flex>
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </Box>
                )}
              </VStack>
            </Box>
          </Flex>
        </Box>
        {/* Modals and Dialogs */}
        <CharacterCreationModal isOpen={isOpen} onClose={onClose} onCharacterCreated={memoizedFetchCharacters} />
        {editingCharacter && (
          <CharacterEditModal
            isOpen={!!editingCharacter}
            onClose={() => setEditingCharacter(null)}
            character={editingCharacter}
            onCharacterUpdated={memoizedFetchCharacters}
          />
        )}
        {selectedEventForSignup && (
          <EventSignupModal
            isOpen={isEventSignupOpen}
            onClose={() => {
              onEventSignupClose();
              setSelectedEventForSignup(null);
            }}
            event={selectedEventForSignup}
            onSignupChange={handleSignupChange}
          />
        )}
        {characterToDelete && (
          <AlertDialog
            isOpen={deleteAlertDialog.isOpen}
            leastDestructiveRef={cancelRef}
            onClose={deleteAlertDialog.onClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent bg={cardBg}>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete Character
                </AlertDialogHeader>
                <AlertDialogBody>
                  Are you sure you want to delete {characterToDelete.name}?
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={deleteAlertDialog.onClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="red" onClick={handleDeleteCharacter} ml={3}>
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        )}
      </Container>
    </MotionBox>
  );
};

export default Profile; 