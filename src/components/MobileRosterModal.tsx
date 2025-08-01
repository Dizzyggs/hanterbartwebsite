import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  VStack,
  Text,
  Box,
  Heading,
  HStack,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
  Button,
  Flex,
  Icon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure as useAlertDisclosure,
  Spinner,
  Center,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  Tab,
} from '@chakra-ui/react';
import { Event, RaidHelperSignup as RaidHelperSignupType, SignupPlayer } from '../types/firebase';
import { useState, useEffect, memo, useMemo, useRef } from 'react';
import { CheckIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { SiBlockbench } from "react-icons/si";
import { doc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { PlayerCard } from './PlayerCard';
import { CLASS_ICONS, CLASS_COLORS } from '../utils/classIcons';
import AbsencePlayer from './AbsencePlayer';
import { FaUsers, FaLayerGroup } from 'react-icons/fa';

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
  spec?: string;
  absenceReason?: string;
}

function isSignupPlayer(signup: any): signup is SignupPlayer {
  return signup !== null && 
    typeof signup === 'object' &&
    'userId' in signup &&
    'username' in signup &&
    'characterId' in signup &&
    'characterName' in signup &&
    'characterClass' in signup &&
    'characterRole' in signup;
}

interface RaidGroup {
  id: string;
  name: string;
  players: SignupPlayer[];
}

interface MobileRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  isAdmin: boolean;
}

interface FirebaseUser {
  id: string;
  discordId?: string;
  discordSignupNickname?: string;
  discordUsername?: string;
  username?: string;
  [key: string]: any;
}

// Mobile-optimized Raid Group Component
const MobileRaidGroup = memo(({ 
  group,
  isAdmin,
  event,
  raidGroups,
  assignedPlayers,
  assignPlayerToGroup,
  unassignPlayer,
  benchPlayer
}: {
  group: RaidGroup;
  isAdmin: boolean;
  event: Event;
  raidGroups: RaidGroup[];
  assignedPlayers: Set<string>;
  assignPlayerToGroup: (player: SignupPlayer, groupId: string) => void;
  unassignPlayer: (player: SignupPlayer) => void;
  benchPlayer: (player: SignupPlayer) => void;
}) => (
  <Box
    bg="background.secondary"
    p={3}
    borderRadius="lg"
    border="1px solid"
    borderColor="border.primary"
    mb={3}
  >
    <HStack justify="space-between" mb={2}>
      <Heading size="sm" color="text.primary">
        {group.name}
      </Heading>
      <HStack spacing={0}>
        <Text color={group.players.filter(p => !p.isPreview).length > 5 ? "orange.400" : "text.secondary"} fontSize="sm">
          {group.players.filter(p => !p.isPreview).length}
        </Text>
        <Text color="text.secondary" fontSize="sm">/5</Text>
      </HStack>
    </HStack>

    <Box
      bg="background.tertiary"
      p={2}
      borderRadius="md"
      minH="60px"
    >
      <VStack spacing={1} align="stretch">
        {group.players.map((player, index) => (
          <PlayerCard
            key={player.characterId}
            player={player}
            index={index}
            isMobile={true}
            isAdmin={isAdmin}
            event={event}
            raidGroups={raidGroups}
            assignedPlayers={assignedPlayers}
            assignPlayerToGroup={assignPlayerToGroup}
            unassignPlayer={unassignPlayer}
            benchPlayer={benchPlayer}
            isInRaidGroup={true}
            groupId={group.id}
            groupIndex={index}
          />
        ))}
      </VStack>
    </Box>
  </Box>
));

MobileRaidGroup.displayName = 'MobileRaidGroup';

const MobileRosterModal = ({ isOpen, onClose, event, isAdmin }: MobileRosterModalProps) => {
  const toast = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 = Raid Groups, 1 = Players
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Alert dialog for unsaved changes
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useAlertDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const ref = useRef<HTMLElement>(document.body)
  useEffect(() => {
    ref.current.style.overflow = 'hidden'
    ref.current.style.touchAction = 'none'
  }, [])

  // State for roster data
  const [unassignedPlayers, setUnassignedPlayers] = useState<SignupPlayer[]>([]);
  const [benchedPlayers, setBenchedPlayers] = useState<SignupPlayer[]>([]);
  const [assignedPlayers, setAssignedPlayers] = useState<Set<string>>(new Set());
  const [raidGroups, setRaidGroups] = useState<RaidGroup[]>([
    { id: '1', name: 'Group 1', players: [] },
    { id: '2', name: 'Group 2', players: [] },
    { id: '3', name: 'Group 3', players: [] },
    { id: '4', name: 'Group 4', players: [] },
    { id: '5', name: 'Group 5', players: [] },
    { id: '6', name: 'Group 6', players: [] },
    { id: '7', name: 'Group 7', players: [] },
    { id: '8', name: 'Group 8', players: [] },
    { id: '11', name: 'Group 1', players: [] },
    { id: '12', name: 'Group 2', players: [] },
    { id: '13', name: 'Group 3', players: [] },
    { id: '14', name: 'Group 4', players: [] },
    { id: '15', name: 'Group 5', players: [] },
    { id: '16', name: 'Group 6', players: [] },
    { id: '17', name: 'Group 7', players: [] },
    { id: '18', name: 'Group 8', players: [] }
  ]);

  // Filtering state
  const [selectedFilter, setSelectedFilter] = useState<{type: string | null, value: string | null}>({ type: null, value: null });
  const [filterRaidGroups, setFilterRaidGroups] = useState(false);
  const [userNicknames, setUserNicknames] = useState<{[userId: string]: string}>({});
  const [initialState, setInitialState] = useState<any>(null);

  // Match Discord signups with users
  const matchDiscordSignupsWithUsers = async (discordSignups: RaidHelperSignupType[]) => {
    if (!discordSignups.length) return [];

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData: FirebaseUser[] = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.discordId || userData.discordSignupNickname || userData.discordUsername) {
          usersData.push({
            id: doc.id,
            discordId: userData.discordId,
            discordSignupNickname: userData.discordSignupNickname,
            discordUsername: userData.discordUsername,
            username: userData.username || doc.id,
            ...userData
          });
        }
      });

      return discordSignups.map((signup): SignupPlayer => {
        const matchedUser = usersData.find(user => 
          user.discordId === signup.userId ||
          user.discordSignupNickname === signup.name ||
          user.discordUsername === signup.name ||
          user.username === signup.name
        );

        // For bench signups, derive the actual class from spec or use a mapping
        let actualClass = signup.className || '';
        let actualRole = signup.role || '';
        
        // If this is a bench signup, derive the actual class from the spec
        if (signup.className === "Bench" && signup.specName) {
          const spec = signup.specName.toLowerCase();
          
          // Map specs to classes
          if (spec.includes('discipline') || spec.includes('holy') || spec.includes('shadow')) {
            actualClass = 'Priest';
          } else if (spec.includes('frost') || spec.includes('fire') || spec.includes('arcane')) {
            actualClass = 'Mage';
          } else if (spec.includes('fury') || spec.includes('arms') || spec.includes('protection')) {
            actualClass = 'Warrior';
          } else if (spec.includes('affliction') || spec.includes('demonology') || spec.includes('destruction')) {
            actualClass = 'Warlock';
          } else if (spec.includes('beast') || spec.includes('marksmanship') || spec.includes('survival')) {
            actualClass = 'Hunter';
          } else if (spec.includes('retribution') || spec.includes('protection') || spec.includes('holy')) {
            actualClass = 'Paladin';
          } else if (spec.includes('balance') || spec.includes('feral') || spec.includes('restoration')) {
            actualClass = 'Druid';
          } else if (spec.includes('assassination') || spec.includes('combat') || spec.includes('subtlety')) {
            actualClass = 'Rogue';
          }
          
          // Also derive role from roleName if available
          if (signup.roleName) {
            const roleName = signup.roleName.toLowerCase();
            if (roleName.includes('tank')) {
              actualRole = 'Tank';
            } else if (roleName.includes('heal')) {
              actualRole = 'Healer';
            } else if (roleName.includes('dps') || roleName.includes('damage')) {
              actualRole = 'DPS';
            }
          }
        }

        return {
          userId: matchedUser?.username || signup.name,
          username: matchedUser?.username || signup.name,
          characterId: signup.id.toString(),
          characterName: signup.name,
          characterClass: signup.className === "Bench" ? actualClass : (signup.className || 'WARRIOR'),
          characterRole: signup.className === "Bench" ? actualRole : (signup.role || 'DPS'),
          discordNickname: signup.name,
          originalDiscordName: signup.name,
          isDiscordSignup: true,
          spec: signup.specName || '',
          absenceReason: signup.absenceReason,
          // Store the original className for bench identification
          ...(signup.className === "Bench" && { originalClassName: "Bench" }),
        };
      });
    } catch (error) {
      console.error('Error matching Discord signups with users:', error);
      return discordSignups.map((signup): SignupPlayer => ({
        userId: signup.name,
        username: signup.name,
        characterId: signup.id.toString(),
        characterName: signup.name,
        characterClass: signup.className === "Bench" ? 'WARRIOR' : (signup.className || 'WARRIOR'),
        characterRole: signup.role || 'DPS',
        discordNickname: signup.name,
        originalDiscordName: signup.name,
        isDiscordSignup: true,
        spec: signup.specName || '',
        absenceReason: signup.absenceReason,
        ...(signup.className === "Bench" && { originalClassName: "Bench" }),
      }));
    }
  };

  // Initialize roster data
  useEffect(() => {
    const initializeSignups = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        // Process manual signups
        const manualSignups = Object.entries(event.signups || {})
          .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] !== null)
          .map(([userId, signup]) => ({
            userId,
            username: signup.username || '',
            characterId: signup.characterId || userId,
            characterName: signup.characterName || signup.username || '',
            characterClass: signup.characterClass || 'WARRIOR',
            characterRole: signup.characterRole || 'DPS',
            absenceReason: signup.absenceReason,
            attendanceStatus: signup.attendanceStatus,
          } as SignupPlayer));

        // Process Discord signups
        const discordSignups = event.signupType === 'raidhelper' && event.raidHelperSignups?.signUps
          ? await matchDiscordSignupsWithUsers(
              event.raidHelperSignups.signUps.filter(signup => signup.status === "primary")
            )
          : [];

        // Combine all signups
        const allSignups = [...manualSignups, ...discordSignups];
        
        // Initialize empty groups
        const initialGroups: RaidGroup[] = raidGroups.map(group => ({ ...group, players: [] }));
        const assignedPlayerIds = new Set<string>();
        const movedToAbsence: SignupPlayer[] = [];
        const movedToTentative: SignupPlayer[] = [];

        // Load existing raid composition if available
        if (event.raidComposition) {
          // Load groups and validate each player's current status
          event.raidComposition.groups.forEach(group => {
            const groupIndex = initialGroups.findIndex(g => g.id === group.id);
            if (groupIndex !== -1) {
              const validatedPlayers: SignupPlayer[] = [];
              
              group.players.forEach(player => {
                // Find the current signup status for this player
                const currentSignup = allSignups.find(signup => 
                  signup.characterId === player.characterId || 
                  signup.userId === player.userId
                );
                
                if (currentSignup) {
                  // Check if player is currently absent
                  if (currentSignup.characterClass === "Absence" || 
                      currentSignup.absenceReason || 
                      currentSignup.attendanceStatus === 'absent') {
                    // Move to absence list
                    movedToAbsence.push({
                      ...currentSignup,
                      isPreview: false
                    });
                    assignedPlayerIds.add(currentSignup.characterId);
                  } 
                  // Check if player is currently tentative
                  else if (currentSignup.characterClass === "Tentative" || 
                           currentSignup.attendanceStatus === 'tentative') {
                    // Move to tentative list
                    movedToTentative.push({
                      ...currentSignup,
                      isPreview: false
                    });
                    assignedPlayerIds.add(currentSignup.characterId);
                  } 
                  // Player is still attending - keep in group
                  else {
                    validatedPlayers.push({
                      ...player,
                      isPreview: false
                    });
                    assignedPlayerIds.add(player.characterId);
                  }
                } else {
                  // Player no longer exists in signups - remove from group
                  // Don't add to any list, they'll go to unassigned if they re-signup
                }
              });
              
              initialGroups[groupIndex].players = validatedPlayers;
            }
          });

          // Load benched players and validate their status too
          if (event.raidComposition.benchedPlayers) {
            const validatedBenchedPlayers: SignupPlayer[] = [];
            
            event.raidComposition.benchedPlayers.forEach(player => {
              const currentSignup = allSignups.find(signup => 
                signup.characterId === player.characterId || 
                signup.userId === player.userId
              );
              
              if (currentSignup) {
                // Check if benched player is now absent or tentative
                if (currentSignup.characterClass === "Absence" || 
                    currentSignup.absenceReason || 
                    currentSignup.attendanceStatus === 'absent') {
                  movedToAbsence.push({
                    ...currentSignup,
                    isPreview: false
                  });
                } else if (currentSignup.characterClass === "Tentative" || 
                           currentSignup.attendanceStatus === 'tentative') {
                  movedToTentative.push({
                    ...currentSignup,
                    isPreview: false
                  });
                } else {
                  // Still available for bench
                  validatedBenchedPlayers.push({
                    ...player,
                    isPreview: false
                  });
                }
                assignedPlayerIds.add(currentSignup.characterId);
              }
            });
            
            setBenchedPlayers(validatedBenchedPlayers);
          }
        }

        // Set unassigned players (those not in groups, bench, absence, or tentative)
        const unassigned = allSignups.filter(signup => !assignedPlayerIds.has(signup.characterId));
        
        // Separate Discord bench signups from regular unassigned players
        const discordBenchSignups = unassigned.filter(signup => 
          signup.isDiscordSignup && (signup as any).originalClassName === "Bench"
        );
        
        // Separate absence and tentative players from unassigned (excluding Discord bench)
        const regularUnassigned = unassigned.filter(signup => 
          signup.characterClass !== "Absence" && 
          signup.characterClass !== "Tentative" &&
          !((signup as any).originalClassName === "Bench") && // Exclude Discord bench signups
          !signup.absenceReason &&
          signup.attendanceStatus !== 'absent' &&
          signup.attendanceStatus !== 'tentative'
        );
        
        // Add any remaining absence/tentative players from unassigned
        const additionalAbsence = unassigned.filter(signup => 
          signup.characterClass === "Absence" || 
          signup.absenceReason ||
          signup.attendanceStatus === 'absent'
        );
        
        const additionalTentative = unassigned.filter(signup => 
          signup.characterClass === "Tentative" ||
          signup.attendanceStatus === 'tentative'
        );

        // Combine moved players with unassigned players so they show up in the lists
        const allUnassignedIncludingMoved = [
          ...regularUnassigned,
          ...movedToAbsence,
          ...movedToTentative,
          ...additionalAbsence,
          ...additionalTentative
        ];

        // Add Discord bench signups to the bench list
        setBenchedPlayers(prev => [...prev, ...discordBenchSignups]);
        
        // Mark Discord bench signups as assigned
        discordBenchSignups.forEach(player => {
          assignedPlayerIds.add(player.characterId);
        });
        
        setRaidGroups(initialGroups);
        setUnassignedPlayers(allUnassignedIncludingMoved);
        setAssignedPlayers(assignedPlayerIds);

        // Show notification if players were moved
        if (movedToAbsence.length > 0 || movedToTentative.length > 0) {
          const messages = [];
          if (movedToAbsence.length > 0) {
            // messages.push(`${movedToAbsence.length} player(s) moved to absence list`);
          }
          if (movedToTentative.length > 0) {
            // messages.push(`${movedToTentative.length} player(s) moved to tentative list`);
          }
          
          // toast({
          //   title: 'Roster Updated',
          //   description: messages.join(', '),
          //   status: 'info',
          //   duration: 5000,
          //   isClosable: true,
          // });
        }

      } catch (error) {
        console.error('Error initializing signups:', error);
        toast({
          title: 'Error loading roster data',
          description: 'Please try refreshing the page',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeSignups();
  }, [isOpen, event]);

  // Helper functions
  const getRaidPlayerCount = (raidGroups: RaidGroup[], startGroup: number, endGroup: number) => {
    return raidGroups
      .slice(startGroup, endGroup)
      .reduce((total, group) => total + group.players.filter(p => !p.isPreview).length, 0);
  };

  // Player management functions
  const assignPlayerToGroup = (player: SignupPlayer, groupId: string) => {
    setRaidGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        // Add player to target group
        return { ...group, players: [...group.players, player] };
      } else {
        // Remove player from all other groups
        return { ...group, players: group.players.filter(p => p.characterId !== player.characterId) };
      }
    }));
    
    setUnassignedPlayers(prev => prev.filter(p => p.characterId !== player.characterId));
    setBenchedPlayers(prev => prev.filter(p => p.characterId !== player.characterId));
    setAssignedPlayers(prev => new Set([...prev, player.characterId]));
    setHasUnsavedChanges(true);
  };

  const unassignPlayer = (player: SignupPlayer) => {
    setRaidGroups(prev => prev.map(group => ({
      ...group,
      players: group.players.filter(p => p.characterId !== player.characterId)
    })));
    
    setBenchedPlayers(prev => prev.filter(p => p.characterId !== player.characterId));
    
    if (!unassignedPlayers.some(p => p.characterId === player.characterId)) {
      setUnassignedPlayers(prev => [...prev, player]);
    }
    
    setAssignedPlayers(prev => {
      const newSet = new Set(prev);
      newSet.delete(player.characterId);
      return newSet;
    });
    setHasUnsavedChanges(true);
  };

  const benchPlayer = (player: SignupPlayer) => {
    setRaidGroups(prev => prev.map(group => ({
      ...group,
      players: group.players.filter(p => p.characterId !== player.characterId)
    })));
    
    setUnassignedPlayers(prev => prev.filter(p => p.characterId !== player.characterId));
    
    if (!benchedPlayers.some(p => p.characterId === player.characterId)) {
      setBenchedPlayers(prev => [...prev, player]);
    }
    
    setAssignedPlayers(prev => new Set([...prev, player.characterId]));
    setHasUnsavedChanges(true);
  };

  // Save raid composition
  const handleSaveRaidComp = async () => {
    if (!isAdmin || !user) {
      toast({
        title: 'Unauthorized',
        description: 'Only administrators can save raid compositions.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Filter out empty groups and clean up the data
      const nonEmptyGroups = raidGroups
        .filter(group => group.players.length > 0)
        .map(group => ({
          id: group.id,
          name: group.name,
          players: group.players.filter(p => !p.isPreview).map(player => {
            // Base player object with required fields
            const cleanPlayer = {
              userId: player.userId || '',
              username: player.username || '',
              characterId: player.characterId || '',
              characterName: player.characterName || '',
              characterClass: player.characterClass || 'Unknown',
              characterRole: player.characterRole || 'DPS'
            };

            // Add Discord-specific fields only if they exist and we're in Discord mode
            if (event.signupType === 'raidhelper' && player.originalDiscordName) {
              return {
                ...cleanPlayer,
                originalDiscordName: player.originalDiscordName,
                ...(player.discordNickname && { discordNickname: player.discordNickname }),
                isDiscordSignup: true
              };
            }

            return cleanPlayer;
          })
        }));

      // Clean up benched players data
      const cleanBenchedPlayers = benchedPlayers.filter(p => !p.isPreview).map(player => ({
        userId: player.userId || '',
        username: player.username || '',
        characterId: player.characterId || '',
        characterName: player.characterName || '',
        characterClass: player.characterClass || 'Unknown',
        characterRole: player.characterRole || 'DPS'
      }));

      const raidComposition = {
        lastUpdated: new Date(),
        updatedBy: {
          userId: user.username || '',
          username: user.username || ''
        },
        groups: nonEmptyGroups,
        benchedPlayers: cleanBenchedPlayers
      };

      await updateDoc(doc(db, 'events', event.id), {
        raidComposition
      });
      
      setHasUnsavedChanges(false);
      toast({
        title: 'Raid composition saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving raid composition:', error);
      console.error('Error details:', {
        eventId: event.id,
        userId: user.username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: 'Error saving raid composition',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Modal close handlers
  const handleModalClose = () => {
    if (hasUnsavedChanges) {
      onAlertOpen();
    } else {
      onClose();
    }
  };

  const closeWithoutSaving = () => {
    setHasUnsavedChanges(false);
    onAlertClose();
    onClose();
  };

  const saveAndClose = async () => {
    await handleSaveRaidComp();
    onAlertClose();
    onClose();
  };

  // Get filtered players for absence/regular
  const { absencePlayers, tentativePlayers, regularUnassignedPlayers } = useMemo(() => {
    const allPlayers = [...unassignedPlayers, ...raidGroups.flatMap(group => group.players)];
    
    const absent = allPlayers.filter(p => {
      return p.characterClass === "Absence";
    });
    
    const tentative = allPlayers.filter(p => {
      return p.characterClass === "Tentative";
    });
    
    let regular = unassignedPlayers.filter(p => {
      return p.characterClass !== "Absence" && p.characterClass !== "Tentative";
    });

    // Apply filters if any
    if (selectedFilter.type === 'class' && selectedFilter.value) {
      regular = regular.filter(p => p.characterClass.toUpperCase() === selectedFilter.value);
    } else if (selectedFilter.type === 'role' && selectedFilter.value) {
      regular = regular.filter(p => p.characterRole === selectedFilter.value);
    }

    return { absencePlayers: absent, tentativePlayers: tentative, regularUnassignedPlayers: regular };
  }, [unassignedPlayers, raidGroups, selectedFilter]);

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleModalClose} 
        size="full"
        blockScrollOnMount={false}
        preserveScrollBarGap={false}
      >
        <ModalOverlay 
          bg="rgba(0, 0, 0, 0.3)"
          backdropFilter="blur(8px)" 
        />
        <ModalContent 
          bg="background.secondary"
          margin={0}
          height="100vh"
          maxHeight="100vh"
          display="flex"
          flexDirection="column"
          position="relative"
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onScroll={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {isLoading ? (
            <Center flex={1}>
              <VStack spacing={6}>
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.700"
                  color="blue.500"
                  size="xl"
                />
                <Text color="text.primary" fontSize="lg" fontWeight="medium">
                  Loading Roster...
                </Text>
              </VStack>
            </Center>
          ) : (
            <>
              {/* Fixed Header */}
              <Box
                bg="background.secondary"
                borderBottom="1px solid"
                borderColor="gray.700"
                position="sticky"
                top={0}
                zIndex={10}
                pt={4}
                pb={2}
                px={4}
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <Text color="text.primary" fontSize="lg" fontWeight="bold" noOfLines={1}>
                    {event.title}
                  </Text>
                  <ModalCloseButton position="static" color="text.primary" />
                </Flex>

                {/* Save Button for Admins */}
                {isAdmin && (
                  <Flex justify="center" mb={3}>
                    <Button
                      leftIcon={<CheckIcon />}
                      colorScheme="blue"
                      size="sm"
                      onClick={handleSaveRaidComp}
                      isLoading={isSaving}
                      loadingText="Saving..."
                      width="full"
                      maxW="300px"
                    >
                      Save Raid Composition
                    </Button>
                  </Flex>
                )}

                {/* Tab Navigation */}
                <Tabs 
                  index={activeTab} 
                  onChange={setActiveTab}
                  variant="enclosed"
                  colorScheme="blue"
                >
                  <TabList bg="gray.800" borderRadius="lg" p={1}>
                    <Tab 
                      flex={1} 
                      _selected={{ bg: 'blue.500', color: 'white' }}
                      color="gray.300"
                      fontWeight="medium"
                      fontSize="sm"
                    >
                      <Icon as={FaLayerGroup} mr={2} />
                      Raid Groups
                    </Tab>
                    <Tab 
                      flex={1}
                      _selected={{ bg: 'blue.500', color: 'white' }}
                      color="gray.300"
                      fontWeight="medium"
                      fontSize="sm"
                    >
                      <Icon as={FaUsers} mr={2} />
                      Players ({regularUnassignedPlayers.length})
                    </Tab>
                  </TabList>
                </Tabs>
              </Box>

              {/* Scrollable Content */}
              <Box
                height="calc(100vh - 200px)"
                overflowY="auto"
                overflowX="hidden"
                sx={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain',
                  '&::-webkit-scrollbar': { 
                    width: '6px' 
                  },
                  '&::-webkit-scrollbar-track': {
                    bg: 'gray.800'
                  },
                  '&::-webkit-scrollbar-thumb': { 
                    bg: 'gray.600', 
                    borderRadius: 'full' 
                  }
                }}
              >
                {/* Raid Groups Tab Content */}
                {activeTab === 0 && (
                  <Box p={4}>
                    <VStack spacing={6} align="stretch">
                      {/* Raid 1-8 */}
                      <Accordion allowToggle defaultIndex={[0]}>
                        <AccordionItem border="none">
                          <AccordionButton
                            bg="blue.600"
                            _hover={{ bg: 'blue.700' }}
                            borderRadius="lg"
                            p={4}
                          >
                            <Box flex="1" textAlign="left">
                              <Text color="white" fontWeight="bold" fontSize="md">
                                Raid 1-8 [{getRaidPlayerCount(raidGroups, 0, 8)}/40]
                              </Text>
                            </Box>
                            <AccordionIcon color="white" />
                          </AccordionButton>
                          <AccordionPanel p={0} pt={4}>
                            <VStack spacing={2} align="stretch">
                              {raidGroups.slice(0, 8).map((group) => (
                                <MobileRaidGroup
                                  key={group.id}
                                  group={group}
                                  isAdmin={isAdmin}
                                  event={event}
                                  raidGroups={raidGroups}
                                  assignedPlayers={assignedPlayers}
                                  assignPlayerToGroup={assignPlayerToGroup}
                                  unassignPlayer={unassignPlayer}
                                  benchPlayer={benchPlayer}
                                />
                              ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>

                      {/* Raid 11-18 */}
                      <Accordion allowToggle>
                        <AccordionItem border="none">
                          <AccordionButton
                            bg="purple.600"
                            _hover={{ bg: 'purple.700' }}
                            borderRadius="lg"
                            p={4}
                          >
                            <Box flex="1" textAlign="left">
                              <Text color="white" fontWeight="bold" fontSize="md">
                                Raid 11-18 [{getRaidPlayerCount(raidGroups, 8, 16)}/40]
                              </Text>
                            </Box>
                            <AccordionIcon color="white" />
                          </AccordionButton>
                          <AccordionPanel p={0} pt={4}>
                            <VStack spacing={2} align="stretch">
                              {raidGroups.slice(8, 16).map((group) => (
                                <MobileRaidGroup
                                  key={group.id}
                                  group={group}
                                  isAdmin={isAdmin}
                                  event={event}
                                  raidGroups={raidGroups}
                                  assignedPlayers={assignedPlayers}
                                  assignPlayerToGroup={assignPlayerToGroup}
                                  unassignPlayer={unassignPlayer}
                                  benchPlayer={benchPlayer}
                                />
                              ))}
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </VStack>
                  </Box>
                )}

                {/* Players Tab Content */}
                {activeTab === 1 && (
                  <Box p={4}>
                    <VStack spacing={6} align="stretch">
                      {/* Filter Menu */}
                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          colorScheme="blue"
                          size="sm"
                          width="full"
                        >
                          Filter Players {selectedFilter.value ? `(${selectedFilter.value})` : ''}
                        </MenuButton>
                        <MenuList bg="gray.800" borderColor="gray.700">
                          <MenuItem
                            onClick={() => setSelectedFilter({ type: null, value: null })}
                            bg="gray.800"
                            _hover={{ bg: 'gray.700' }}
                            color="white"
                          >
                            Show All
                          </MenuItem>
                          <MenuDivider />
                          {Object.keys(CLASS_COLORS)
                            .filter(className => className !== 'TANK')
                            .map(className => (
                            <MenuItem
                              key={className}
                              onClick={() => setSelectedFilter({ type: 'class', value: className })}
                              bg="gray.800"
                              _hover={{ bg: 'gray.700' }}
                            >
                              <HStack>
                                <Image
                                  src={CLASS_ICONS[className as keyof typeof CLASS_ICONS]}
                                  boxSize="20px"
                                  alt={className}
                                />
                                <Text color={CLASS_COLORS[className as keyof typeof CLASS_COLORS]}>
                                  {className}
                                </Text>
                              </HStack>
                            </MenuItem>
                          ))}
                          <MenuDivider />
                          {['Tank', 'Healer', 'DPS'].map(role => (
                            <MenuItem
                              key={role}
                              onClick={() => setSelectedFilter({ type: 'role', value: role })}
                              bg="gray.800"
                              _hover={{ bg: 'gray.700' }}
                              color="white"
                            >
                              {role}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>

                      {/* Unassigned Players */}
                      <Box
                        bg="background.tertiary"
                        p={4}
                        borderRadius="lg"
                        borderLeft="4px solid"
                        borderLeftColor="primary.400"
                      >
                        <Heading size="sm" color="text.primary" mb={3}>
                          Unassigned Players ({regularUnassignedPlayers.length})
                        </Heading>
                        <Box
                          bg="background.tertiary"
                          p={2}
                          borderRadius="md"
                          minH="60px"
                        >
                          <VStack spacing={1} align="stretch">
                            {regularUnassignedPlayers.map((player, index) => (
                              <PlayerCard
                                key={player.characterId}
                                player={player}
                                index={index}
                                isMobile={true}
                                isAdmin={isAdmin}
                                event={event}
                                raidGroups={raidGroups}
                                assignedPlayers={assignedPlayers}
                                assignPlayerToGroup={assignPlayerToGroup}
                                unassignPlayer={unassignPlayer}
                                benchPlayer={benchPlayer}
                                isInRaidGroup={false}
                              />
                            ))}
                          </VStack>
                        </Box>
                      </Box>

                      {/* Bench Section */}
                      <Box
                        bg="background.tertiary"
                        p={4}
                        borderRadius="lg"
                        borderLeft="4px solid"
                        borderLeftColor="red.400"
                      >
                        <Heading size="sm" color="text.primary" mb={3}>
                          <HStack>
                            <Icon as={SiBlockbench} />
                            <Text>Bench ({benchedPlayers.length})</Text>
                          </HStack>
                        </Heading>
                        <Box
                          bg="background.tertiary"
                          p={2}
                          borderRadius="md"
                          minH="50px"
                        >
                          <VStack spacing={1} align="stretch">
                            {benchedPlayers.map((player, index) => (
                              <PlayerCard
                                key={player.characterId}
                                player={player}
                                index={index}
                                isMobile={true}
                                isAdmin={isAdmin}
                                event={event}
                                raidGroups={raidGroups}
                                assignedPlayers={assignedPlayers}
                                assignPlayerToGroup={assignPlayerToGroup}
                                unassignPlayer={unassignPlayer}
                                benchPlayer={benchPlayer}
                                isInRaidGroup={false}
                              />
                            ))}
                          </VStack>
                        </Box>
                      </Box>

                      {/* Absence Players */}
                      {absencePlayers.length > 0 && (
                        <Accordion allowToggle>
                          <AccordionItem border="none">
                            <AccordionButton
                              bg="red.600"
                              _hover={{ bg: 'red.700' }}
                              borderRadius="lg"
                              p={4}
                            >
                              <Box flex="1" textAlign="left">
                                <Text color="white" fontWeight="bold" fontSize="sm">
                                  Absence ({absencePlayers.length})
                                </Text>
                              </Box>
                              <AccordionIcon color="white" />
                            </AccordionButton>
                            <AccordionPanel p={4} bg="background.tertiary" borderRadius="lg">
                              <VStack spacing={2} align="stretch">
                                {absencePlayers.map((player, index) => (
                                  <AbsencePlayer
                                    key={player.characterId}
                                    player={player}
                                    userNicknames={userNicknames}
                                  />
                                ))}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {/* Tentative Players */}
                      {tentativePlayers.length > 0 && (
                        <Accordion allowToggle>
                          <AccordionItem border="none">
                            <AccordionButton
                              bg="yellow.600"
                              _hover={{ bg: 'yellow.700' }}
                              borderRadius="lg"
                              p={4}
                            >
                              <Box flex="1" textAlign="left">
                                <Text color="white" fontWeight="bold" fontSize="sm">
                                  Tentative ({tentativePlayers.length})
                                </Text>
                              </Box>
                              <AccordionIcon color="white" />
                            </AccordionButton>
                            <AccordionPanel p={4} bg="background.tertiary" borderRadius="lg">
                              <VStack spacing={2} align="stretch">
                                {tentativePlayers.map((player, index) => (
                                  <AbsencePlayer
                                    key={player.characterId}
                                    player={player}
                                    userNicknames={userNicknames}
                                  />
                                ))}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </VStack>
                  </Box>
                )}
              </Box>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Unsaved Changes Alert Dialog */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
        isCentered
      >
        <AlertDialogOverlay 
          bg="rgba(0, 0, 0, 0.4)"
          backdropFilter="blur(10px)"
        >
          <AlertDialogContent 
            bg="gray.800" 
            color="white"
            borderRadius="xl"
            mx={4}
            maxW="400px"
          >
            <AlertDialogHeader fontSize="xl" fontWeight="bold">
              Unsaved Changes
            </AlertDialogHeader>
            <AlertDialogBody>
              You have unsaved changes in your raid roster. Would you like to save them?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={closeWithoutSaving}
                variant="ghost"
                color="red.400"
                _hover={{ bg: 'red.900', color: 'red.300' }}
              >
                Exit without saving
              </Button>
              <Button 
                onClick={saveAndClose}
                bg="blue.500"
                color="white"
                _hover={{ bg: 'blue.600' }}
                ml={3}
              >
                Save & Exit
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default MobileRosterModal; 