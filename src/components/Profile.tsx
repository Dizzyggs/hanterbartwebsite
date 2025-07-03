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
      bg={isSignedUp 
        ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 128, 61, 0.05) 100%)"
        : "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)"
      }
      
      borderRadius="xl" 
      p={{ base: 3, md: 4 }}
      border="1px solid"
      borderColor={isSignedUp ? "green.400" : "yellow.400"}
      cursor={isSignedUp ? "default" : "pointer"}
      onClick={!isSignedUp ? () => handleEventClick(event) : undefined}
      _hover={!isSignedUp ? { 
        bg: "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)",
        borderColor: 'yellow.300',
        transform: 'translateY(-3px)',
        boxShadow: '0 12px 30px rgba(251, 191, 36, 0.2)',
        "& .event-title": {
          color: "yellow.200"
        },
        "& .status-badge": {
          transform: "scale(1.05)"
        }
      } : {
        bg: "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(21, 128, 61, 0.08) 100%)",
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(34, 197, 94, 0.15)'
      }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      position="relative"
      overflow="hidden"
      minH={{ base: "90px", md: "180px" }}
      display="flex"
      flexDirection="column"
    >
      {/* Subtle background pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.03}
        bgImage="radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)"
        bgSize="20px 20px"
        color={isSignedUp ? "green.400" : "yellow.400"}
        zIndex={0}
      />

      {/* Enhanced status indicator */}
      {isSignedUp && 
              <Box
              className="status-badge"
              position="absolute"
              top={{ base: 2, md: 3 }}
              right={{ base: 2, md: 3 }}
              bg={isSignedUp 
                ? "rgba(34, 197, 94, 0.1)"
                : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
              }
              color={isSignedUp ? "green.300" : "white"}
              px={{ base: 2, md: 3 }}
              py={{ base: 1, md: 1.5 }}
              borderRadius="full"
              fontSize={{ base: "2xs", md: "xs" }}
              fontWeight={isSignedUp ? "600" : "bold"}
              textTransform={isSignedUp ? "none" : "uppercase"}
              letterSpacing={isSignedUp ? "normal" : "wider"}
              zIndex={2}
              boxShadow={isSignedUp 
                ? "none"
                : "0 4px 12px rgba(251, 191, 36, 0.4)"
              }
              border={isSignedUp ? "1px solid" : "none"}
              borderColor={isSignedUp ? "green.400" : "transparent"}
              transition="all 0.3s ease"
              fontFamily={isSignedUp ? "Satoshi" : "inherit"}
            >
              {isSignedUp ? "🎯 Signed up" : ""}
            </Box>
      }

      {/* Header Section: Title + Date/Time */}
      <Box position="relative" zIndex={1} mb={{ base: 2, md: 3 }}>
        <Box pr={{ base: 20, md: 24 }} mb={{ base: 2, md: 3 }}>
          <Heading 
            className="event-title"
            size={{ base: "sm", md: "sm" }}
            color={isSignedUp ? "green.100" : "yellow.100"}
            fontFamily="Satoshi"
            fontWeight="700"
            fontSize={{ base: "sm", md: "md" }}
            letterSpacing="tight"
            lineHeight="1.2"
            wordBreak="break-word"
            noOfLines={1}
            transition="color 0.3s ease"
          >
            {event.title}
          </Heading>
        </Box>

        {/* Date and Time with enhanced styling */}
        <HStack spacing={{ base: 3, md: 4 }} flexWrap="wrap">
          <Flex align="center" gap={1.5} minW="fit-content">
            <Box
              p={1}
              borderRadius="md"
              bg={isSignedUp ? "green.500" : "yellow.500"}
              color="white"
            >
              <Icon as={CalendarIcon} boxSize={{ base: 2.5, md: 3 }} />
            </Box>
            <Text 
              color="gray.100" 
              fontSize={{ base: "xs", md: "sm" }} 
              fontWeight="600"
              fontFamily="Satoshi"
            >
              {formatDate(event.date, 'N/A')}
            </Text>
          </Flex>
          <Flex align="center" gap={1.5} minW="fit-content">
            <Box
              p={1}
              borderRadius="md"
              bg={isSignedUp ? "green.500" : "yellow.500"}
              color="white"
            >
              <Icon as={TimeIcon} boxSize={{ base: 2.5, md: 3 }} />
            </Box>
            <Text 
              color="gray.100" 
              fontSize={{ base: "xs", md: "sm" }} 
              fontWeight="600"
              fontFamily="Satoshi"
            >
              {event.time}
            </Text>
          </Flex>
        </HStack>
      </Box>

      {/* Main Content Area: Description */}
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        position="relative" 
        zIndex={1}
        py={{ base: 2, md: 3 }}
      >
        {event.description && (
          <Box
            bg="rgba(0, 0, 0, 0.3)"
            px={{ base: 3, md: 4 }}
            py={{ base: 2.5, md: 3.5 }}
            borderRadius="lg"
            borderLeft="3px solid"
            borderLeftColor={isSignedUp ? "green.400" : "yellow.400"}
            textAlign="center"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
          >
            <Text 
              color="gray.200" 
              fontSize={{ base: "xs", md: "sm" }}
              fontStyle="italic"
              lineHeight="1.4"
              noOfLines={{ base: 2, md: 3 }}
              fontFamily="Satoshi"
              fontWeight="400"
              whiteSpace="pre-line"
            >
              "{event.description}"
            </Text>
          </Box>
        )}
      </Box>

      {/* Footer Section: Action Button */}
      {!isSignedUp && (
        <Box position="relative" zIndex={1} pt={{ base: 2, md: 3 }}>
          <Flex align="center" justify="center">
            <Box
              bg="rgba(251, 191, 36, 0.15)"
              px={{ base: 3, md: 4 }}
              py={{ base: 1.5, md: 2 }}
              borderRadius="full"
              border="1px solid"
              borderColor="yellow.400"
              boxShadow="0 2px 8px rgba(251, 191, 36, 0.2)"
            >
              <Text 
                color="yellow.200" 
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="600"
                textAlign="center"
                fontFamily="Satoshi"
              >
                ⚡ Click to signup
              </Text>
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
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
      minH="100vh"
      bg="background.primary"
      mt={!isMobile ? 20 : 0}
    >
      <Container maxW="container.xl" py={8}>
        <Breadcrumbs />
        
        {/* Hero Section - Modern Glass Card */}
        <MotionBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          mb={8}
        >
          <Box
            bg="rgba(255, 255, 255, 0.02)"
            backdropFilter="blur(20px)"
            borderRadius="3xl"
            p={8}
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            position="relative"
            overflow="hidden"
          >
            {/* Modern Background Pattern */}
            <Box
              position="absolute"
              top="-50%"
              left="-50%"
              w="200%"
              h="200%"
              bgGradient="conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.1), transparent)"
              animation="spin 20s linear infinite"
              zIndex={0}
            />
            
            <Flex 
              direction={{ base: 'column', lg: 'row' }} 
              align="center" 
              gap={8}
              position="relative"
              zIndex={1}
            >
              {/* Modern Avatar Section */}
              <Box textAlign="center" position="relative">
                <Box
                  position="relative"
                  display="inline-block"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    right: '-4px',
                    bottom: '-4px',
                    borderRadius: 'full',
                    bgGradient: 'linear(45deg, primary.400, purple.400, primary.600)',
                    zIndex: -1,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                >
                  <Avatar 
                    size="2xl"
                    name={user?.username} 
                    src={avatarUrl} 
                    cursor="pointer"
                    onClick={handleAvatarClick}
                    border="4px solid"
                    borderColor="background.primary"
                    boxShadow="0 10px 25px rgba(0,0,0,0.3)"
                    _hover={{ 
                      transform: 'scale(1.05)',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
                    }}
                    transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  />
                </Box>
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                <Text 
                  color="text.secondary" 
                  fontSize="sm" 
                  mt={4}
                  fontWeight="500"
                  opacity={0.8}
                >
                  Click to change avatar
                </Text>
              </Box>
              
              {/* Profile Info - Modern Layout */}
              <Box flex={1} textAlign={{ base: 'center', lg: 'left' }}>
                <Heading 
                  size="2xl" 
                  color="white"
                  bgGradient="linear(to-r, primary.200, purple.200, primary.400)"
                  bgClip="text"
                  letterSpacing="tight"
                  mb={6}
                  fontWeight="800"
                  fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
                >
                  {user?.username}
                </Heading>
                
                {/* Status Cards */}
                <HStack spacing={4} justify={{ base: 'center', lg: 'flex-start' }} mb={8} flexWrap="wrap">
                  <Box
                    bg="rgba(34, 197, 94, 0.1)"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="rgba(34, 197, 94, 0.2)"
                    borderRadius="2xl"
                    px={6}
                    py={3}
                    boxShadow="0 8px 25px rgba(34, 197, 94, 0.1)"
                  >
                    <HStack spacing={3}>
                      <Icon 
                        as={StarIcon} 
                        color={user?.confirmedRaider ? 'green.300' : 'orange.300'} 
                        boxSize={5}
                      />
                      <Text 
                        color={user?.confirmedRaider ? 'green.200' : 'orange.200'}
                        fontSize="sm"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="wide"
                      >
                        {user?.confirmedRaider ? 'Confirmed Raider' : 'Pending Raider'}
                      </Text>
                    </HStack>
                  </Box>
                  
                  <Box
                    bg={isDiscordConnected ? "rgba(88, 101, 242, 0.1)" : "rgba(99, 102, 241, 0.1)"}
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor={isDiscordConnected ? "rgba(88, 101, 242, 0.2)" : "rgba(99, 102, 241, 0.2)"}
                    borderRadius="2xl"
                    px={6}
                    py={3}
                    boxShadow="0 8px 25px rgba(88, 101, 242, 0.1)"
                  >
                    <HStack spacing={3}>
                      <Icon as={FaDiscord} color="blue.300" boxSize={5} />
                      {isDiscordConnected ? (
                        <Text color="blue.200" fontSize="sm" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                          Discord Connected
                        </Text>
                      ) : (
                        <Button 
                          colorScheme="blue" 
                          size="sm" 
                          onClick={handleConnectDiscord}
                          leftIcon={<FaDiscord />}
                          borderRadius="xl"
                          bg="blue.500"
                          _hover={{ bg: 'blue.600' }}
                          fontWeight="600"
                        >
                          Connect Discord
                        </Button>
                      )}
                    </HStack>
                  </Box>
                </HStack>
                
                {/* Calendar Nickname - Modern Input */}
                <FormControl maxW="500px">
                  <FormLabel color="text.secondary" fontSize="sm" mb={3} fontWeight="600">
                    Calendar Nickname
                  </FormLabel>
                  <InputGroup>
                    <Input
                      value={discordSignupNickname}
                      onChange={e => setDiscordSignupNickname(e.target.value)}
                      placeholder="Enter your calendar nickname"
                      bg="rgba(255, 255, 255, 0.02)"
                      backdropFilter="blur(10px)"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      _focus={{ 
                        borderColor: 'primary.400',
                        boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.4)'
                      }}
                      _hover={{
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      }}
                      _disabled={{ 
                        opacity: 0.6,
                        cursor: 'not-allowed'
                      }}
                      borderRadius="xl"
                      disabled={!isEditingNickname}
                      pr={isEditingNickname ? "90px" : "50px"}
                      fontSize="sm"
                      fontWeight="500"
                    />
                    <InputRightElement w={isEditingNickname ? "85px" : "45px"}>
                      {!isEditingNickname ? (
                        <IconButton
                          aria-label="Edit nickname"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingNickname(true);
                            setOriginalNickname(discordSignupNickname);
                          }}
                          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                          borderRadius="lg"
                        />
                      ) : (
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Save nickname"
                            icon={<CheckIcon />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={handleUpdateDiscordNickname}
                            isLoading={isUpdatingNickname}
                            _hover={{ bg: 'rgba(34, 197, 94, 0.1)' }}
                            borderRadius="lg"
                          />
                          <IconButton
                            aria-label="Cancel edit"
                            icon={<CloseIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => {
                              setIsEditingNickname(false);
                              setDiscordSignupNickname(originalNickname);
                            }}
                            _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
                            borderRadius="lg"
                          />
                        </HStack>
                      )}
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </Box>
            </Flex>
          </Box>
        </MotionBox>

        {/* Main Content - Modern Grid */}
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={8}>
          {/* Characters Section - Modern Glass Card */}
          <MotionBox
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Box
              bg="rgba(255, 255, 255, 0.02)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              p={6}
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              h="fit-content"
            >
              <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg" color="white" fontWeight="700">
                  My Characters
                </Heading>
                <Button
                  colorScheme="primary"
                  leftIcon={<AddIcon />}
                  onClick={onOpen}
                  size="md"
                  borderRadius="xl"
                  bg="primary.500"
                  _hover={{ 
                    bg: 'primary.600', 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  fontWeight="600"
                  px={6}
                >
                  Add Character
                </Button>
              </Flex>
              
              <VStack spacing={4} align="stretch">
                {characters.length > 0 ? (
                  characters.map((char, index) => (
                    <MotionBox
                      key={char.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      bg={char.isMain 
                        ? "rgba(99, 102, 241, 0.1)" 
                        : "rgba(255, 255, 255, 0.02)"
                      }
                      backdropFilter="blur(10px)"
                      borderRadius="2xl"
                      p={5}
                      border="1px solid"
                      borderColor={char.isMain 
                        ? "rgba(99, 102, 241, 0.2)" 
                        : "rgba(255, 255, 255, 0.05)"
                      }
                      boxShadow={char.isMain 
                        ? "0 10px 25px rgba(99, 102, 241, 0.1)" 
                        : "0 5px 15px rgba(0, 0, 0, 0.1)"
                      }
                      _hover={{ 
                        transform: 'translateY(-3px)',
                        boxShadow: char.isMain 
                          ? "0 15px 35px rgba(99, 102, 241, 0.15)" 
                          : "0 10px 25px rgba(0, 0, 0, 0.15)"
                      }}
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      cursor="pointer"
                      position="relative"
                      overflow="hidden"
                    >
                      <Flex align="center" justify="space-between" position="relative">
                        <Flex align="center" gap={4}>
                          <Box
                            position="relative"
                            _before={char.isMain ? {
                              content: '""',
                              position: 'absolute',
                              top: '-2px',
                              left: '-2px',
                              right: '-2px',
                              bottom: '-2px',
                              borderRadius: 'lg',
                              bgGradient: 'linear(45deg, primary.400, purple.400)',
                              zIndex: -1,
                              animation: 'pulse 2s ease-in-out infinite'
                            } : {}}
                          >
                            <Image 
                              src={getClassIcon(char.class)} 
                              alt={char.class} 
                              boxSize="45px"
                              borderRadius="lg"
                              border="2px solid"
                              borderColor={char.isMain ? "primary.400" : "rgba(255, 255, 255, 0.1)"}
                              boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                            />
                          </Box>
                          <Box>
                            <Flex align="center" gap={2} mb={2}>
                              <Heading 
                                size="md" 
                                color="white"
                                fontWeight="700"
                              >
                                {char.name}
                              </Heading>
                              {char.isMain && (
                                <Box
                                  bg="linear-gradient(45deg, #fbbf24, #f59e0b)"
                                  borderRadius="full"
                                  p={1}
                                  animation="pulse 2s ease-in-out infinite"
                                >
                                  <StarIcon color="white" boxSize={3} />
                                </Box>
                              )}
                            </Flex>
                            <Badge 
                              colorScheme={getRoleColor(char.role)} 
                              size="sm"
                              borderRadius="lg"
                              px={3}
                              py={1}
                              fontSize="xs"
                              fontWeight="600"
                              textTransform="uppercase"
                              letterSpacing="wide"
                            >
                              {char.role}
                            </Badge>
                          </Box>
                        </Flex>
                        <IconButton
                          aria-label="Edit Character"
                          icon={<EditIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCharacter(char)}
                          _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                          borderRadius="lg"
                        />
                      </Flex>
                    </MotionBox>
                  ))
                ) : (
                  <Box 
                    textAlign="center" 
                    py={16}
                    bg="rgba(255, 255, 255, 0.02)" 
                    borderRadius="2xl" 
                    border="2px dashed" 
                    borderColor="rgba(255, 255, 255, 0.1)"
                    backdropFilter="blur(5px)"
                  >
                    <Text color="text.secondary" fontSize="lg" mb={2} fontWeight="500">
                      No characters yet
                    </Text>
                    <Text color="text.secondary" fontSize="sm" opacity={0.7}>
                      Click "Add Character" to get started
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </MotionBox>

          {/* Events Section - Modern Accordions */}
          <MotionBox
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <VStack spacing={6} align="stretch">
              {/* Events Accordion Container */}
              {user?.confirmedRaider && (
                <Box
                  bg="rgba(255, 255, 255, 0.02)"
                  backdropFilter="blur(20px)"
                  borderRadius="3xl"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                  overflow="hidden"
                >
                  <Accordion allowToggle>
                    {/* Signed Up Events */}
                    <AccordionItem border="none">
                      <h2>
                        <AccordionButton
                          _hover={{ bg: 'rgba(34, 197, 94, 0.05)' }}
                          py={6}
                          px={6}
                          transition="all 0.3s ease"
                        >
                          <Box flex="1" textAlign="left">
                            <HStack spacing={3}>
                              <Box
                                bg="rgba(34, 197, 94, 0.1)"
                                p={2}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="rgba(34, 197, 94, 0.2)"
                              >
                                <Icon as={CheckIcon} color="green.300" boxSize={4} />
                              </Box>
                              <Box>
                                <Heading size="md" color="white" fontWeight="700">
                                  Events You're Signed Up For
                                </Heading>
                                <Text color="text.secondary" fontSize="sm" mt={1}>
                                  {isLoadingEvents ? 'Loading...' : `${signedUpEvents.length} events`}
                                </Text>
                              </Box>
                            </HStack>
                          </Box>
                          <AccordionIcon color="white" />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} px={6}>
                        {isLoadingEvents ? (
                          <Flex justify="center" align="center" h="100px">
                            <VStack spacing={3}>
                              <Spinner color="primary.400" size="lg" />
                              <Text color="text.secondary" fontSize="sm">Loading events...</Text>
                            </VStack>
                          </Flex>
                        ) : signedUpEvents.length > 0 ? (
                          <VStack spacing={4} align="stretch">
                            {signedUpEvents.map((event, idx) => (
                              <EventCard key={event.id} event={event} isSignedUp />
                            ))}
                          </VStack>
                        ) : (
                          <Box textAlign="center" py={8}>
                            <Text color="text.secondary" fontSize="sm">
                              No events signed up for yet
                            </Text>
                          </Box>
                        )}
                      </AccordionPanel>
                    </AccordionItem>

                    {/* Not Signed Up Events */}
                    <AccordionItem border="none">
                      <h2>
                        <AccordionButton
                          _hover={{ bg: 'rgba(251, 191, 36, 0.05)' }}
                          py={6}
                          px={6}
                          transition="all 0.3s ease"
                        >
                          <Box flex="1" textAlign="left">
                            <HStack spacing={3}>
                              <Box
                                bg="rgba(251, 191, 36, 0.1)"
                                p={2}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="rgba(251, 191, 36, 0.2)"
                              >
                                <Icon as={TimeIcon} color="yellow.300" boxSize={4} />
                              </Box>
                              <Box>
                                <Heading size="md" color="white" fontWeight="700">
                                  Available Events
                                </Heading>
                                <Text color="text.secondary" fontSize="sm" mt={1}>
                                  {isLoadingEvents ? 'Loading...' : `${notSignedUpEvents.length} available`}
                                </Text>
                              </Box>
                            </HStack>
                          </Box>
                          <AccordionIcon color="white" />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={6} px={6}>
                        {isLoadingEvents ? (
                          <Flex justify="center" align="center" h="100px">
                            <VStack spacing={3}>
                              <Spinner color="primary.400" size="lg" />
                              <Text color="text.secondary" fontSize="sm">Loading events...</Text>
                            </VStack>
                          </Flex>
                        ) : notSignedUpEvents.length > 0 ? (
                          <VStack spacing={4} align="stretch">
                            {notSignedUpEvents.map((event, idx) => (
                              <EventCard key={event.id} event={event} />
                            ))}
                          </VStack>
                        ) : (
                          <Box textAlign="center" py={8}>
                            <Text color="text.secondary" fontSize="sm">
                              No upcoming events available
                            </Text>
                          </Box>
                        )}
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              )}
            </VStack>
          </MotionBox>
        </SimpleGrid>
      </Container>

      {/* Modals */}
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
            <AlertDialogContent 
              bg="rgba(255, 255, 255, 0.02)"
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderRadius="2xl"
            >
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
                Delete Character
              </AlertDialogHeader>
              <AlertDialogBody color="text.secondary">
                Are you sure you want to delete {characterToDelete.name}?
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button 
                  ref={cancelRef} 
                  onClick={deleteAlertDialog.onClose}
                  variant="ghost"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                  borderRadius="xl"
                >
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDeleteCharacter} 
                  ml={3}
                  borderRadius="xl"
                  _hover={{ bg: 'red.600' }}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </MotionBox>
  );
};

export default Profile; 