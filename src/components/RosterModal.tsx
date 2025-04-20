import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  VStack,
  Text,
  Box,
  Heading,
  Avatar,
  HStack,
  Badge,
  Divider,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  useDisclosure,
  MenuGroup,
  MenuDivider,
  useToast,
  Button,
  Flex,
  Icon,
  ButtonGroup,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure as useAlertDisclosure,
  useMediaQuery,
  Spinner,
  Center,
  Tooltip,
} from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
import { Event, RaidHelperSignup as RaidHelperSignupType, SignupPlayer } from '../types/firebase';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { useState, useEffect, memo, ReactElement, useMemo, useRef } from 'react';
import { CheckIcon, TimeIcon, InfoIcon, DownloadIcon } from '@chakra-ui/icons';
import { doc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { PlayerCard } from './PlayerCard';
import { CLASS_ICONS, CLASS_COLORS, ClassIconType } from '../utils/classIcons';
import AbsencePlayer from './AbsencePlayer';
import { getMRTExport } from '../hooks/rosterHelpers';

// Suppress defaultProps warning from react-beautiful-dnd
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('defaultProps will be removed')) {
    return;
  }
  originalError.call(console, ...args);
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
  spec?: string;
  absenceReason?: string;
}

// Update the type guard to not require originalDiscordName for manual signups
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

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  isAdmin: boolean;
}

// Update the FirebaseUser interface at the top of the file
interface FirebaseUser {
  id: string;
  discordId?: string;
  discordSignupNickname?: string;
  username?: string;
  [key: string]: any;
}

// Create a memoized droppable wrapper with explicit props and default parameters
const StableDroppable = memo(({ 
  id, 
  children,
  type = 'DEFAULT',
  direction = 'vertical',
  mode = 'standard',
  isDropDisabled = false,
}: { 
  id: string;
  children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => ReactElement;
  type?: string;
  direction?: 'vertical' | 'horizontal';
  mode?: 'standard' | 'virtual';
  isDropDisabled?: boolean;
}) => (
  <Droppable 
    droppableId={id}
    type={type}
    direction={direction}
    mode={mode}
    isDropDisabled={isDropDisabled}
  >
    {children}
  </Droppable>
));

StableDroppable.displayName = 'StableDroppable';


interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  isAdmin: boolean;
}

// Add this before the RosterModal component
interface RaidGroupProps {
  group: RaidGroup;
  isMobile: boolean;
  isAdmin: boolean;
  event: Event;
  raidGroups: RaidGroup[];
  assignedPlayers: Set<string>;
  assignPlayerToGroup: (player: SignupPlayer, groupId: string) => void;
  unassignPlayer: (player: SignupPlayer) => void;
}

const MemoizedRaidGroup = memo(({ 
  group,
  isMobile,
  isAdmin,
  event,
  raidGroups,
  assignedPlayers,
  assignPlayerToGroup,
  unassignPlayer
}: RaidGroupProps) => (
  <Box
    bg="background.secondary"
    p={4}
    borderRadius="md"
    border="1px solid"
    borderColor="border.primary"
    minH="330px"
    height="330px"
  >
    <VStack align="stretch" spacing={3} height="100%">
      <HStack justify="space-between">
        <Heading size="sm" color="text.primary">
          {group.name}
        </Heading>
        <HStack spacing={0}>
          <Text color={group.players.length > 5 ? "orange.400" : "text.secondary"} fontSize="sm">
            {group.players.length}
          </Text>
          <Text color="text.secondary" fontSize="sm">/5</Text>
        </HStack>
      </HStack>
      <Droppable droppableId={group.id} type="player">
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            bg="background.tertiary"
            p={3}
            borderRadius="md"
            height="calc(100% - 40px)"
            overflowY="auto"
            onWheel={(e) => e.stopPropagation()}
            sx={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
                background: 'background.tertiary',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'border.secondary',
                borderRadius: '24px',
              },
            }}
          >
            <VStack spacing={1.5} align="stretch">
              {group.players.map((player, index) => (
                <PlayerCard
                  key={player.characterId}
                  player={player}
                  index={index}
                  isMobile={isMobile}
                  isAdmin={isAdmin}
                  event={event}
                  raidGroups={raidGroups}
                  assignedPlayers={assignedPlayers}
                  assignPlayerToGroup={assignPlayerToGroup}
                  unassignPlayer={unassignPlayer}
                />
              ))}
              {provided.placeholder}
            </VStack>
          </Box>
        )}
      </Droppable>
    </VStack>
  </Box>
), (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.group.id === nextProps.group.id &&
    prevProps.group.players.length === nextProps.group.players.length &&
    prevProps.group.players.every((player, index) => 
      player.characterId === nextProps.group.players[index]?.characterId
    ) &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isAdmin === nextProps.isAdmin
  );
});

MemoizedRaidGroup.displayName = 'MemoizedRaidGroup';

const RosterModal = ({ isOpen, onClose, event, isAdmin }: RosterModalProps) => {
  // Add mobile detection
  const isTesting = false;
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  // Update the useEffect to handle loading state
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Combine manual and Discord signups
  const manualSignups = Object.entries(event.signups || {})
    .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] !== null)
    .map(([userId, signup]): SignupPlayer => {
      return {
        userId,
        username: signup.username || '',
        characterId: signup.characterId || userId,
        characterName: signup.characterName || signup.username || '',
        characterClass: signup.characterClass || 'WARRIOR',
        characterRole: signup.characterRole || 'DPS',
        absenceReason: signup.absenceReason
      };
    });

  const discordSignups = (event.raidHelperSignups?.signUps || [])
    .filter(signup => signup.status === "primary")
    .map((signup): SignupPlayer => ({
      userId: signup.name,
      username: signup.name,
      characterId: signup.id.toString(),
      characterName: signup.name,
      characterClass: signup.className || 'WARRIOR',
      characterRole: signup.role || 'DPS',
      discordNickname: signup.name,
      originalDiscordName: signup.name,
      isDiscordSignup: true,
      spec: signup.specName || '',
      absenceReason: signup.absenceReason
    }));

  // Combine both types of signups, but filter out absences from regular signups
  const allSignups = [...manualSignups, ...discordSignups];

  // Group all signups by role
  const tanks = allSignups.filter(signup => signup?.characterRole === 'Tank');
  const healers = allSignups.filter(signup => signup?.characterRole === 'Healer');
  const dps = allSignups.filter(signup => signup?.characterRole === 'DPS');

  // Create unassigned players array from all signups
  const [unassignedPlayers, setUnassignedPlayers] = useState<SignupPlayer[]>([]);

  // Track which players are assigned to groups
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

  const [selectedRole, setSelectedRole] = useState<'Tank' | 'Healer' | 'DPS' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState<'1-8' | '11-18' | null>(null);
  const [userNicknames, setUserNicknames] = useState<Record<string, string>>({});
  const { user } = useUser();

  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  // Add isOpen to the component's state tracking
  const [hasInitialized, setHasInitialized] = useState(false);

  const {
    isOpen: isClassViewOpen,
    onOpen: onClassViewOpen,
    onClose: onClassViewClose
  } = useDisclosure();

  // Add state for tracking changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialState, setInitialState] = useState<{
    groups: RaidGroup[];
    unassigned: SignupPlayer[];
  } | null>(null);
  
  // Add alert dialog state
  const {
    isOpen: isAlertOpen,
    onOpen: onAlertOpen,
    onClose: onAlertClose
  } = useAlertDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Function to create a clean copy of state
  const createCleanState = () => ({
    groups: raidGroups.map(group => ({
      ...group,
      players: group.players.map(player => ({
        userId: player.userId,
        username: player.username,
        characterId: player.characterId,
        characterName: player.characterName,
        characterClass: player.characterClass,
        characterRole: player.characterRole,
        discordNickname: player.discordNickname,
        originalDiscordName: player.originalDiscordName,
        spec: player.spec
      }))
    })),
    unassigned: unassignedPlayers.map(player => ({
      userId: player.userId,
      username: player.username,
      characterId: player.characterId,
      characterName: player.characterName,
      characterClass: player.characterClass,
      characterRole: player.characterRole,
      discordNickname: player.discordNickname,
      originalDiscordName: player.originalDiscordName,
      spec: player.spec
    }))
  });

  // Set initial state when modal opens
  useEffect(() => {
    if (isOpen && !initialState) {
      // Only set initial state if we have actual data
      if (raidGroups.length > 0 || unassignedPlayers.length > 0) {
        const cleanState = {
          groups: raidGroups.map(group => ({
            ...group,
            players: group.players.map(player => ({ ...player }))
          })),
          unassigned: unassignedPlayers.map(player => ({ ...player }))
        };
        setInitialState(cleanState);
        setHasUnsavedChanges(false);
      }
    }
  }, [isOpen, raidGroups, unassignedPlayers]);

  // Function to compare players
  const arePlayersEqual = (p1: SignupPlayer, p2: SignupPlayer) => 
    p1.characterId === p2.characterId &&
    p1.userId === p2.userId &&
    p1.characterName === p2.characterName &&
    p1.characterClass === p2.characterClass &&
    p1.characterRole === p2.characterRole;

  // Function to compare groups
  const areGroupsEqual = (g1: RaidGroup, g2: RaidGroup) => {
    if (g1.players.length !== g2.players.length) return false;
    return g1.players.every((player, index) => arePlayersEqual(player, g2.players[index]));
  };

  // Update change detection
  useEffect(() => {
    if (!isAdmin || !initialState) return;

    // Create a deep copy of current state
    const currentState = {
      groups: raidGroups.map(group => ({
        ...group,
        players: group.players.map(player => ({ ...player }))
      })),
      unassigned: unassignedPlayers.map(player => ({ ...player }))
    };

    // Compare groups that have players
    const currentActiveGroups = currentState.groups.filter(g => g.players.length > 0);
    const initialActiveGroups = initialState.groups.filter(g => g.players.length > 0);

    // Check if the number of active groups has changed
    if (currentActiveGroups.length !== initialActiveGroups.length) {
      setHasUnsavedChanges(true);
      return;
    }

    // Check if any group's players have changed
    const hasGroupChanges = currentActiveGroups.some((group, index) => {
      const initialGroup = initialActiveGroups[index];
      if (!initialGroup) return true;
      
      if (group.players.length !== initialGroup.players.length) return true;
      
      return !group.players.every((player, playerIndex) => {
        const initialPlayer = initialGroup.players[playerIndex];
        if (!initialPlayer) return false;
        return arePlayersEqual(player, initialPlayer);
      });
    });

    // Check if unassigned players have changed
    const hasUnassignedChanges = 
      currentState.unassigned.length !== initialState.unassigned.length ||
      !currentState.unassigned.every(player => 
        initialState.unassigned.some(p => arePlayersEqual(player, p))
      );

    // Only set hasUnsavedChanges if we actually have changes
    const hasChanges = hasGroupChanges || hasUnassignedChanges;
    if (hasChanges !== hasUnsavedChanges) {
      setHasUnsavedChanges(hasChanges);
    }
  }, [raidGroups, unassignedPlayers, initialState, isAdmin, hasUnsavedChanges]);

  // Update handleSaveRaidComp
  const handleSaveRaidComp = async () => {
    if (!isAdmin || !user) return;
    
    setIsSaving(true);
    try {

      // Filter out empty groups and clean up the data
      const nonEmptyGroups = raidGroups
        .filter(group => group.players.length > 0)
        .map(group => ({
          id: group.id,
          name: group.name,
          players: group.players.map(player => {
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
            if (event.signupType === 'raidhelper') {
              return {
                ...cleanPlayer,
                originalDiscordName: player.originalDiscordName || player.username || '',
                discordNickname: player.discordNickname || undefined,
                isDiscordSignup: true
              };
            }

            return cleanPlayer;
          })
        }));

      const raidComposition = {
        lastUpdated: new Date(),
        updatedBy: {
          userId: user.username || '',
          username: user.username || ''
        },
        groups: nonEmptyGroups
      };


      await updateDoc(doc(db, 'events', event.id), {
        raidComposition
      });

      // After successful save, update the initial state
      setInitialState(createCleanState());
      setHasUnsavedChanges(false);

      toast({
        title: "Raid composition saved",
        description: "The raid composition has been updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } catch (error) {
      console.error('Error saving raid composition:', error);
      console.error('Error details:', {
        eventId: event.id,
        userId: user.username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Error saving raid composition",
        description: error instanceof Error ? error.message : "There was an error saving the raid composition. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle modal close
  const handleModalClose = () => {
    if (isAdmin && hasUnsavedChanges) {
      onAlertOpen();
    } else {
      // Reset state when closing
      setInitialState(null);
      setHasUnsavedChanges(false);
      onClose();
    }
  };

  // Function to close without saving
  const closeWithoutSaving = () => {
    onAlertClose();
    onClose();
  };

  // Function to save and close
  const saveAndClose = async () => {
    await handleSaveRaidComp();
    onAlertClose();
    onClose();
  };

  // Find user's character group
  const getUserCharacterGroup = (user: any, event: Event, raidGroups: RaidGroup[]) => {
    if (!user || !event.signups) return null;
    
    const userSignup = Object.values(event.signups).find(signup => signup?.userId === user.username);
    if (!userSignup) return null;

    const assignedGroup = raidGroups.find(group => 
      group.players.some(player => player.characterId === userSignup.characterId)
    );
    
    return {
      character: userSignup,
      group: assignedGroup || null
    };
  };

  const getGroupName = (groupNumber: number) => {
    if (groupNumber >= 1 && groupNumber <= 8) return 'Raid 1-8';
    if (groupNumber >= 11 && groupNumber <= 18) return 'Raid 11-18';
    return '';
  };

  const getRaidPlayerCount = (raidGroups: RaidGroup[], startGroup: number, endGroup: number) => {
    return raidGroups
      .slice(startGroup, endGroup)
      .reduce((total, group) => total + group.players.length, 0);
  };

  // Update the useEffect to only run on initial open
  useEffect(() => {
    const initializeSignups = async () => {
      if (!isOpen || !event || hasInitialized) return;

      // Process manual signups first
      const manualSignups = Object.entries(event.signups || {})
        .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => entry[1] !== null)
        .map(([userId, signup]) => ({
          userId,
          username: signup.username || '',
          characterId: signup.characterId || userId,
          characterName: signup.characterName || signup.username || '',
          characterClass: signup.characterClass || 'WARRIOR',
          characterRole: signup.characterRole || 'DPS'
        }));

      // Process Discord signups
      const discordSignups = event.signupType === 'raidhelper' && event.raidHelperSignups?.signUps
        ? await matchDiscordSignupsWithUsers(
            event.raidHelperSignups.signUps.filter(signup => signup.status === "primary")
          )
        : [];

      // Combine all signups
      const allSignups = [...manualSignups, ...discordSignups];
      
      // Initialize empty groups
      const initialGroups = raidGroups.map(group => ({ ...group, players: [] }));
      const assignedPlayerIds = new Set<string>();
      
    if (event.raidComposition) {
      const savedGroups = event.raidComposition.groups;

      // Update groups with saved players
      const updatedGroups = initialGroups.map(group => {
        const savedGroup = savedGroups.find(g => g.id === group.id);
          if (!savedGroup) return group;

          const validPlayers = savedGroup.players
            .map(savedPlayer => {
              const matchingSignup = allSignups.find(signup => 
                signup.userId === savedPlayer.userId || 
                signup.characterId === savedPlayer.characterId
              );
              if (matchingSignup) {
                assignedPlayerIds.add(matchingSignup.characterId);
                return matchingSignup;
              }
              return null;
            })
            .filter((player): player is SignupPlayer => player !== null);

          return { ...group, players: validPlayers };
        });

        // Set unassigned players (those not in any group)
        const unassigned = allSignups.filter(player => 
          !assignedPlayerIds.has(player.characterId)
        );

        setRaidGroups(updatedGroups);
      setUnassignedPlayers(unassigned);
        setAssignedPlayers(assignedPlayerIds);
    } else {
        // No saved composition, initialize with all players unassigned
      setRaidGroups(initialGroups);
        setUnassignedPlayers(allSignups);
        setAssignedPlayers(new Set());
      }

      setHasInitialized(true);
    };

    initializeSignups();
  }, [isOpen, event?.id, event?.signupType, event?.raidHelperSignups, event?.signups, event?.raidComposition]);

  // Reset initialization state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setHasInitialized(false);
      setRaidGroups(prev => prev.map(group => ({ ...group, players: [] })));
      setUnassignedPlayers([]);
      setAssignedPlayers(new Set());
      setInitialState(null);
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

  // Update the useEffect to fetch Calendar nicknames when component mounts
  useEffect(() => {
    const fetchNicknames = async () => {
      if (event.signupType === 'raidhelper') {
        const allPlayers = [
          ...unassignedPlayers,
          ...raidGroups.flatMap(group => group.players)
        ];
        await fetchDiscordNicknames(allPlayers);
      }
    };
    
    fetchNicknames();
  }, [event.signupType, unassignedPlayers, raidGroups]);

  const handleDragEnd = (result: DropResult) => {
    // If not admin, ignore drag
    if (!isAdmin) return;

    const { source, destination, draggableId } = result;
    
    // Drop outside any droppable or same position
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }

    // Find the actual player being moved using the draggableId
    const playerBeingMoved = unassignedPlayers.find(p => p.characterId === draggableId) ||
      raidGroups.flatMap(g => g.players).find(p => p.characterId === draggableId);

    if (!playerBeingMoved) return;

    // Find the source and destination lists
    let sourceList: SignupPlayer[] = [];
    let destList: SignupPlayer[] = [];

    // Get source list
    if (source.droppableId === 'unassigned') {
      sourceList = [...unassignedPlayers];
    } else {
      const sourceGroup = raidGroups.find(g => g.id === source.droppableId);
      if (!sourceGroup) return;
      sourceList = [...sourceGroup.players];
    }

    // Get destination list
    if (destination.droppableId === 'unassigned') {
      destList = [...unassignedPlayers];
    } else {
      const destGroup = raidGroups.find(g => g.id === destination.droppableId);
      if (!destGroup) return;
      if (destGroup.players.length >= 5 && source.droppableId !== destination.droppableId && !isAdmin) {
        toast({
          title: "Group is full",
          description: "A group can't have more than 5 players",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top"
        });
        return;
      }
      destList = [...destGroup.players];
    }

    // Remove player from source list
    sourceList = sourceList.filter(p => p.characterId !== playerBeingMoved.characterId);

    // If moving within the same list, just reorder
    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, playerBeingMoved);
      
      if (source.droppableId === 'unassigned') {
        setUnassignedPlayers(sourceList);
      } else {
        setRaidGroups(prev => prev.map(group => 
          group.id === source.droppableId ? { ...group, players: sourceList } : group
        ));
      }
      return;
    }

    // Moving between different lists
    destList.splice(destination.index, 0, playerBeingMoved);

    // Update the appropriate lists
    if (source.droppableId === 'unassigned') {
      setUnassignedPlayers(sourceList);
    } else {
      setRaidGroups(prev => prev.map(group => 
        group.id === source.droppableId ? { ...group, players: sourceList } : group
      ));
    }

    if (destination.droppableId === 'unassigned') {
      setUnassignedPlayers(destList);
    } else {
      setRaidGroups(prev => prev.map(group =>
        group.id === destination.droppableId ? { ...group, players: destList } : group
      ));
    }

    // Update assigned players set
    if (destination.droppableId === 'unassigned') {
      setAssignedPlayers(prev => {
        const next = new Set(prev);
        next.delete(playerBeingMoved.characterId);
        return next;
      });
    } else if (source.droppableId === 'unassigned') {
      setAssignedPlayers(prev => new Set([...prev, playerBeingMoved.characterId]));
    }
  };

  const assignPlayerToGroup = (player: SignupPlayer, groupId: string) => {
    const targetGroup = raidGroups.find(g => g.id === groupId);
    if (!targetGroup || targetGroup.players.length >= 5) return;

    // First, remove from unassigned if present
    setUnassignedPlayers(prev => 
      prev.filter(p => p.characterId !== player.characterId)
    );

    // Then, update all groups (remove from current group if assigned and add to target group)
    setRaidGroups(prevGroups => prevGroups.map(group => {
      // Remove from any existing group
      if (group.players.some(p => p.characterId === player.characterId)) {
        return {
          ...group,
          players: group.players.filter(p => p.characterId !== player.characterId)
        };
      }
      // Add to target group
      if (group.id === groupId) {
        return {
          ...group,
          players: [...group.players, player]
        };
      }
      return group;
    }));

    // Update assigned players set
    setAssignedPlayers(prev => new Set([...prev, player.characterId]));
  };

  const unassignPlayer = (player: SignupPlayer) => {
    // First check if player is already in unassigned to prevent duplicates
    if (unassignedPlayers.some(p => p.characterId === player.characterId)) {
      return;
    }

    // Remove from all groups
    setRaidGroups(prevGroups => prevGroups.map(group => ({
      ...group,
      players: group.players.filter(p => p.characterId !== player.characterId)
    })));

    // Remove from assigned players set
    setAssignedPlayers(prev => {
      const next = new Set(prev);
      next.delete(player.characterId);
      return next;
    });

    // Add to unassigned
      setUnassignedPlayers(prev => [...prev, player]);
  };

  const SubMenu = ({ label = '', children }: { label: string; children: React.ReactNode }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <Box
        position="relative"
        role="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        bg="background.tertiary"
      >
        <MenuItem
          _hover={{ bg: 'background.secondary' }}
          _focus={{ bg: 'background.secondary' }}
          color="text.primary"
          bg="background.tertiary"
        >
          {label} <Text as="span" float="right" ml={2}>▶</Text>
        </MenuItem>
        {isHovered && (
          <Box
            position="absolute"
            left="100%"
            top="0"
            bg="background.tertiary"
            borderColor="border.primary"
            borderWidth="1px"
            borderRadius="md"
            width="200px"
            zIndex={2001}
            boxShadow="dark-lg"
            py={1}
          >
            {children}
          </Box>
        )}
      </Box>
    );
  };

  // Replace the View Classes button with Filter List menu
  const [selectedFilter, setSelectedFilter] = useState<{
    type: 'class' | 'name' | 'role' | null;
    value: string | null;
  }>({ type: null, value: null });

  // Update the regularUnassignedPlayers filtering
  const { absencePlayers, regularUnassignedPlayers } = useMemo(() => {
    const allPlayers = [...unassignedPlayers, ...raidGroups.flatMap(group => group.players)];
    
    const absent = allPlayers.filter(p => {
      if (!p.isDiscordSignup) {
        return p.characterClass === "Absence";
      }
      return p.characterClass?.toUpperCase() === "ABSENCE";
    });
    
    let regular = unassignedPlayers.filter(p => {
      if (!p.isDiscordSignup) {
        return p.characterClass !== "Absence";
      }
      return p.characterClass?.toUpperCase() !== "ABSENCE";
    });

    // Duplicate players 5 times if in testing mode
    if (isTesting) {
      const originalPlayers = [...regular];
      regular = [];
      for (let i = 0; i < 26; i++) {
        regular.push(...originalPlayers.map(player => ({
          ...player,
          characterId: `${player.characterId}-${i}`,
          userId: `${player.userId}-${i}`,
        })));
      }
    }

    // Apply filters
    if (selectedFilter.type === 'class' && selectedFilter.value) {
      if(selectedFilter.value === "FURY") {
        regular = regular.filter(p => {
          // For Discord signups, check spec directly
          if (p.isDiscordSignup) {
            return p.spec?.toUpperCase() === "FURY";
          }
          // For website signups, check if they're a Warrior with DPS role
          return p.characterClass === "Warrior" && p.characterRole === "DPS";
        });
      } else {
        regular = regular.filter(p => p.characterClass.toUpperCase() === selectedFilter.value);
      }
    } else if (selectedFilter.type === 'name') {
      regular = [...regular].sort((a, b) => {
        const nameA = (a.discordNickname || a.characterName).toLowerCase();
        const nameB = (b.discordNickname || b.characterName).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (selectedFilter.type === 'role' && selectedFilter.value) {
      regular = regular.filter(p => {
        if (selectedFilter.value === 'Tank') {
          const isTank = 
            p.characterRole?.toLowerCase() === 'tank' || 
            p.characterClass?.toLowerCase() === 'tank';
          const isFeralDruid = 
            p.characterClass?.toLowerCase() === 'druid' && 
            p.spec?.toLowerCase() === 'feral';
          
          return isTank || isFeralDruid;
        } else if (selectedFilter.value === 'Healer') {
          return (p.characterRole?.toLowerCase() === selectedFilter.value?.toLowerCase() || p.characterClass == "Priest" || p.characterClass == "Paladin" || p.characterClass == "Druid")
        } else if (selectedFilter.value === 'DPS') {
          const DPS_SPECS = ['frost', 'arcane', 'fury', 'fire', 'arms', 'beastmastery', 'survival', "assassination", 'combat', 'subtlety', 'affliction', 'demonology', 'destruction', 'shadow']
          return (DPS_SPECS.includes(p.spec?.toLowerCase() || '') || p?.characterRole?.toLowerCase() == "dps")
        }
        return p.characterRole === selectedFilter.value;
      });
    }

    // Sort regular unassigned players
    const sortedRegular = [...regular].sort((a, b) => {
      if (selectedFilter.type === 'name') {
        return 0; // Skip role sorting if we're sorting by name
      }
      
    if (selectedRole) {
      if (a.characterRole === selectedRole && b.characterRole !== selectedRole) return -1;
      if (a.characterRole !== selectedRole && b.characterRole === selectedRole) return 1;
    }
      const roleOrder: Record<'Tank' | 'Healer' | 'DPS', number> = { Tank: 0, Healer: 1, DPS: 2 };
      if (a.characterRole !== b.characterRole) {
      return roleOrder[a.characterRole as keyof typeof roleOrder] - roleOrder[b.characterRole as keyof typeof roleOrder];
    }
    return a.characterName.localeCompare(b.characterName);
  });

    return {
      absencePlayers: absent,
      regularUnassignedPlayers: sortedRegular
    };
  }, [unassignedPlayers, selectedRole, raidGroups, selectedFilter, isTesting]);

  const userCharacterInfo = getUserCharacterGroup(user, event, raidGroups);


  const fetchDiscordNicknames = async (signups: SignupPlayer[]) => {
    try {
      const userDocs = await Promise.all(
        signups.map(signup => getDoc(doc(db, 'users', signup.userId)))
      );
      
      const nicknames: Record<string, string> = {};
      userDocs.forEach((userDoc, index) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.discordSignupNickname) {
            nicknames[signups[index].userId] = userData.discordSignupNickname;
          }
        }
      });
      
      setUserNicknames(nicknames);
    } catch (error) {
      console.error('Error fetching Discord nicknames:', error);
    }
  };

  const matchDiscordSignupsWithUsers = async (discordSignups: RaidHelperSignupType[]) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const firebaseUsers = new Map<string, FirebaseUser>();
      const discordIdToUser = new Map<string, FirebaseUser>();
      
      // Create maps for both username and Discord ID lookups
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        firebaseUsers.set(doc.id, { id: doc.id, ...data });
        if (data.discordId) {
          discordIdToUser.set(data.discordId, { id: doc.id, ...data });
        }
      });

      const validSignups = discordSignups
        .filter((signup: RaidHelperSignupType) => signup.status === "primary")
        .map((signup: RaidHelperSignupType): SignupPlayer => {
          // Try to find the user by Discord ID first
          const matchingUser = signup.userId ? discordIdToUser.get(signup.userId) : undefined;

          const player: SignupPlayer = {
            userId: matchingUser?.id || signup.userId || signup.name,
            username: matchingUser?.username || signup.name,
            characterId: signup.id.toString(),
            characterName: matchingUser?.discordSignupNickname || signup.name,
            characterClass: signup.className || '',
            characterRole: signup.role || '',
            originalDiscordName: signup.name,
            discordNickname: matchingUser?.discordSignupNickname || undefined,
            spec: signup.specName || '',
            isDiscordSignup: true
          };
          return player;
        });

      return validSignups;
    } catch (error) {
      console.error('Error matching Discord signups with users:', error);
      return [];
    }
  };

  const handleUnsign = async () => {
    if (!user || !event.id) return;

    try {
      // Create a new signups object without the user's signup
      const updatedSignups = { ...event.signups };
      delete updatedSignups[user.username];

      // Update the event document
      await updateDoc(doc(db, 'events', event.id), {
        signups: updatedSignups
      });

      toast({
        title: "Successfully unsigned",
        description: "You have been removed from this event",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });

      onClose();
    } catch (error) {
      console.error('Error unsigning from event:', error);
      toast({
        title: "Error unsigning",
        description: "There was an error removing you from this event",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    }
  };

  // Add check for if user has signed up through website
  const hasWebsiteSignup = useMemo(() => {
    if (!user || !event.signups) return false;
    return !!event.signups[user.username];
  }, [user, event.signups]);

  return (
    <>
      <Global
        styles={css`
          ${isOpen ? `
            html, body, #root {
              overflow: visible !important;
            }
          ` : ''}
        `}
      />
      <Modal 
        isOpen={isOpen} 
        onClose={handleModalClose} 
        size={isMobile ? "full" : "full"} 
        blockScrollOnMount={false}
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
          overflow="hidden"
        >
          {isLoading ? (
            <Center 
              height="100vh"
              position="relative"
              zIndex="1"
            >
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
          <ModalCloseButton color="text.primary" size="lg" top={4} right={4} />
              <ModalHeader color="text.primary" fontSize={isMobile ? "xl" : "2xl"} pt={8} px={8}>
                <Flex justify="space-between" alignItems="center" flexDir={isMobile ? "column" : "row"} gap={4}>
              <Text>Slutgiltig Roster - {event.title}</Text>
                  {isAdmin && unassignedPlayers.length + raidGroups.reduce((total, group) => total + group.players.length, 0) > 0 && (
                    <HStack spacing={2} mr={isMobile ? 0 : "3rem"}>
                      <Menu>
                        <MenuButton
                          as={Button}
                          leftIcon={<DownloadIcon />}
                          rightIcon={<Icon as={InfoIcon} />}
                          bg="blue.500"
                          color="white"
                          _hover={{ bg: 'blue.600' }}
                          _active={{ bg: 'blue.700' }}
                          size="sm"
                          px={4}
                          py={1}
                          fontWeight="semibold"
                          borderRadius="md"
                          transition="all 0.2s"
                        >
                          Export Roster
                        </MenuButton>
                        <MenuList 
                          bg="gray.800" 
                          borderColor="gray.700"
                          boxShadow="lg"
                          p={1}
                          minW="180px"
                        >
                          <MenuItem
                            onClick={() => {
                              const content = getMRTExport(raidGroups, 'Raid 1-8');
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `raid-1-8-${event.title}.txt`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              
                              toast({
                                title: "Raid 1-8 roster downloaded",
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                                position: "top"
                              });
                            }}
                            bg="transparent"
                            _hover={{ bg: 'gray.700' }}
                            _focus={{ bg: 'gray.700' }}
                            color="white"
                            borderRadius="md"
                            mb={1}
                            p={2}
                            fontSize="sm"
                            fontWeight="medium"
                          >
                            Export Raid 1-8
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              const content = getMRTExport(raidGroups, 'Raid 11-18');
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `raid-11-18-${event.title}.txt`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              
                              toast({
                                title: "Raid 11-18 roster downloaded",
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                                position: "top"
                              });
                            }}
                            bg="transparent"
                            _hover={{ bg: 'gray.700' }}
                            _focus={{ bg: 'gray.700' }}
                            color="white"
                            borderRadius="md"
                            mb={1}
                            p={2}
                            fontSize="sm"
                            fontWeight="medium"
                          >
                            Export Raid 11-18
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              const content = getMRTExport(raidGroups);
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `full-roster-${event.title}.txt`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              
                              toast({
                                title: "Full roster downloaded",
                                status: "success",
                                duration: 3000,
                                isClosable: true,
                                position: "top"
                              });
                            }}
                            bg="transparent"
                            _hover={{ bg: 'gray.700' }}
                            _focus={{ bg: 'gray.700' }}
                            color="white"
                            borderRadius="md"
                            p={2}
                            fontSize="sm"
                            fontWeight="medium"
                          >
                            Export Full Roster
                          </MenuItem>
                        </MenuList>
                      </Menu>
                <Button
                  leftIcon={<CheckIcon />}
                  colorScheme="primary"
                  variant="solid"
                        size="sm"
                        px={4}
                        py={1}
                  onClick={handleSaveRaidComp}
                  isLoading={isSaving}
                  loadingText="Sparar..."
                >
                  Spara Raid Comp
                </Button>
                    </HStack>
              )}
            </Flex>

                {event.description && (
                  <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    p={4}
                    mt={4}
                    maxW="800px"
                  borderLeft="4px solid"
                  borderLeftColor="primary.400"
                    _dark={{
                      bg: "rgba(255, 255, 255, 0.06)",
                    }}
                >
                    <HStack spacing={3}>
                      <Text
                      color="primary.400"
                        fontSize="sm"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        minW="fit-content"
                      >
                        Event Description:
                    </Text>
                      <Text
                        color="text.primary"
                        fontSize="sm"
                        _dark={{
                          color: "whiteAlpha.900"
                        }}
                      >
                        {event.description}
                      </Text>
                    </HStack>
                  </Box>
                )}

                {userCharacterInfo && (
                  <VStack align="start" spacing={2} mt={4}>
                    <Text
                      color="primary.400"
                      fontSize="sm"
                      fontWeight="semibold"
                      textTransform="uppercase"
                      minW="fit-content"
                    >
                      User Character Info:
                    </Text>
                    <Text
                      color="text.primary"
                      fontSize="sm"
                      _dark={{
                        color: "whiteAlpha.900"
                      }}
                    >
                      {userCharacterInfo.group ? 'You are assigned to ' + userCharacterInfo.group.name : 'You are not assigned to any group'}
                    </Text>
              </VStack>
            )}
          </ModalHeader>
              <ModalBody 
                p={isMobile ? 4 : 8} 
                overflowY="auto" 
                height="calc(100vh - 250px)"
                onWheel={(e) => e.stopPropagation()}
              >
            <DragDropContext onDragEnd={handleDragEnd}>
                  <VStack 
                    align="stretch" 
                    spacing={8} 
                    height="100%"
                    flexDir={isMobile ? "column" : "row"}
                  >
                    <Box flex={isMobile ? "none" : "1"} width={isMobile ? "100%" : "auto"}>
                  <VStack align="stretch" spacing={4}>
                        <Menu>
                          <MenuButton
                            as={Button}
                            rightIcon={<Icon as={InfoIcon} />}
                            colorScheme="blue"
                            size="sm"
                            width="fit-content"
                            mt={"6rem"}
                          >
                            Filter List {selectedFilter.value ? `(${selectedFilter.value})` : ''}
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
                              .filter(className => className !== 'TANK') // Filter out TANK from class options
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
                                    boxSize="24px"
                                    alt={className}
                                  />
                                  <Text color={CLASS_COLORS[className as keyof typeof CLASS_COLORS]}>
                                    {className}
                                  </Text>
                                </HStack>
                              </MenuItem>
                            ))}
                            <MenuDivider />
                            <MenuItem
                              onClick={() => setSelectedFilter({ type: 'name', value: null })}
                              bg="gray.800"
                              _hover={{ bg: 'gray.700' }}
                              color="white"
                            >
                              Sort Alphabetically
                            </MenuItem>
                            <MenuDivider />
                            <Text px={3} py={2} color="gray.400" fontSize="sm">
                              Role filtering
                            </Text>
                            <MenuItem
                              onClick={() => setSelectedFilter({ type: 'role', value: 'Tank' })}
                              bg="gray.800"
                              _hover={{ bg: 'gray.700' }}
                              color="white"
                            >
                              Tank
                            </MenuItem>
                            <MenuItem
                              onClick={() => setSelectedFilter({ type: 'role', value: 'Healer' })}
                              bg="gray.800"
                              _hover={{ bg: 'gray.700' }}
                              color="white"
                            >
                              Healer
                            </MenuItem>
                            <MenuItem
                              onClick={() => setSelectedFilter({ type: 'role', value: 'DPS' })}
                              bg="gray.800"
                              _hover={{ bg: 'gray.700' }}
                              color="white"
                            >
                              DPS
                            </MenuItem>
                          </MenuList>
                        </Menu>
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
                          <Droppable droppableId="unassigned" type="player">
                            {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            bg="background.tertiary"
                            p={4}
                            borderRadius="md"
                            minH="100px"
                            maxH="calc(100vh - 400px)"
                            overflowY="auto"
                            onWheel={(e) => e.stopPropagation()}
                            sx={{
                              '&::-webkit-scrollbar': {
                                width: '4px',
                              },
                              '&::-webkit-scrollbar-track': {
                                width: '6px',
                                background: 'background.tertiary',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                background: 'border.secondary',
                                borderRadius: '24px',
                              },
                            }}
                          >
                            <SimpleGrid columns={2} spacing={2}>
                              {regularUnassignedPlayers.map((player, index) => (
                                <PlayerCard
                                  key={player.characterId}
                                  player={player}
                                  index={index}
                                  isMobile={isMobile}
                                  isAdmin={isAdmin}
                                  event={event}
                                  raidGroups={raidGroups}
                                  assignedPlayers={assignedPlayers}
                                  assignPlayerToGroup={assignPlayerToGroup}
                                  unassignPlayer={unassignPlayer}
                                />
                              ))}
                            {provided.placeholder}
                            </SimpleGrid>
                          </Box>
                        )}
                          </Droppable>
                    </Box>

                        {absencePlayers.length > 0 && (
                          <Box
                            bg="background.tertiary"
                            p={4}
                            borderRadius="lg"
                            borderLeft="4px solid"
                            borderLeftColor="red.400"
                            mt={4}
                          >
                            <Heading size="sm" color="text.primary" mb={3}>
                              Absence ({absencePlayers.length})
                            </Heading>
                            <VStack align="stretch" spacing={2}>
                              {absencePlayers.map((player) => (
                                <AbsencePlayer
                                  key={player.characterId}
                                  player={player}
                                  userNicknames={userNicknames}
                                />
                              ))}
                            </VStack>
                          </Box>
                        )}
                  </VStack>
                </Box>

                    <Box flex={isMobile ? "none" : "3"} width={isMobile ? "100%" : "auto"}>
                  <VStack align="stretch" spacing={4}>
                        <ButtonGroup 
                          isAttached 
                          variant="outline" 
                          alignSelf="flex-end"
                          flexWrap={isMobile ? "wrap" : "nowrap"}
                        >
                      <Button
                        onClick={() => setSelectedRaid(null)}
                        colorScheme={selectedRaid === null ? "primary" : "gray"}
                        size="sm"
                        color="text.primary"
                      >
                        Visa alla
                      </Button>
                      <Button
                        onClick={() => setSelectedRaid('1-8')}
                        colorScheme={selectedRaid === '1-8' ? "primary" : "gray"}
                        size="sm"
                        color="text.primary"
                      >
                        Raid 1-8
                      </Button>
                      <Button
                        onClick={() => setSelectedRaid('11-18')}
                        colorScheme={selectedRaid === '11-18' ? "primary" : "gray"}
                        size="sm"
                        color="text.primary"
                      >
                        Raid 11-18
                      </Button>
                    </ButtonGroup>

                    {(!selectedRaid || selectedRaid === '1-8') && (
                      <>
                        <Heading size="sm" color="text.primary" mb={4}>
                              Raid 1-8 [{getRaidPlayerCount(raidGroups, 0, 8)}/40]
                        </Heading>
                            <SimpleGrid columns={isMobile ? 1 : 4} spacing={4}>
                          {raidGroups.slice(0, 8).map((group) => (
                            <MemoizedRaidGroup key={group.id} group={group} isMobile={isMobile} isAdmin={isAdmin} event={event} raidGroups={raidGroups} assignedPlayers={assignedPlayers} assignPlayerToGroup={assignPlayerToGroup} unassignPlayer={unassignPlayer} />
                          ))}
                        </SimpleGrid>
                      </>
                    )}

                    {(!selectedRaid || selectedRaid === '11-18') && (
                      <>
                        <Heading size="sm" color="text.primary" mb={4}>
                              Raid 11-18 [{getRaidPlayerCount(raidGroups, 8, 16)}/40]
                        </Heading>
                            <SimpleGrid columns={isMobile ? 1 : 4} spacing={4}>
                          {raidGroups.slice(8, 16).map((group) => (
                            <MemoizedRaidGroup key={group.id} group={group} isMobile={isMobile} isAdmin={isAdmin} event={event} raidGroups={raidGroups} assignedPlayers={assignedPlayers} assignPlayerToGroup={assignPlayerToGroup} unassignPlayer={unassignPlayer} />
                          ))}
                        </SimpleGrid>
                      </>
                    )}
                  </VStack>
                </Box>
                  </VStack>
            </DragDropContext>
          </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Alert Dialog */}
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
            boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            mx={4}
            maxW="400px"
          >
            <AlertDialogHeader 
              fontSize="xl" 
              fontWeight="bold"
              pt={6}
              pb={4}
              px={6}
              borderBottom="1px solid"
              borderColor="gray.700"
            >
              Unsaved Changes
            </AlertDialogHeader>

            <AlertDialogBody
              py={6}
              px={6}
              fontSize="md"
            >
              You have unsaved changes in your raid roster. Would you like to save them?
            </AlertDialogBody>

            <AlertDialogFooter
              px={6}
              py={4}
              borderTop="1px solid"
              borderColor="gray.700"
            >
              <Button 
                ref={cancelRef} 
                onClick={closeWithoutSaving}
                variant="ghost"
                color="red.400"
                _hover={{ bg: 'red.900', color: 'red.300' }}
                _active={{ bg: 'red.800' }}
                size="md"
                fontWeight="medium"
              >
                Exit without saving
              </Button>
              <Button 
                onClick={saveAndClose}
                bg="blue.500"
                color="white"
                _hover={{ bg: 'blue.600' }}
                _active={{ bg: 'blue.700' }}
                ml={3}
                size="md"
                fontWeight="medium"
              >
                Exit & Save Changes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default RosterModal; 