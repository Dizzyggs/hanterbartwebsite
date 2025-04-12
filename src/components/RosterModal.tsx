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
} from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
import { Event, RaidHelperSignup as RaidHelperSignupType } from '../types/firebase';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { useState, useEffect, memo, ReactElement, useMemo, useRef } from 'react';
import { CheckIcon, TimeIcon, InfoIcon, DownloadIcon } from '@chakra-ui/icons';
import { doc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';

// Suppress defaultProps warning from react-beautiful-dnd
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('defaultProps will be removed')) {
    return;
  }
  originalError.call(console, ...args);
};

// Import class icons
import warriorIcon from '../assets/classes/warrior.png';
import mageIcon from '../assets/classes/mage.png';
import priestIcon from '../assets/classes/priest.png';
import warlockIcon from '../assets/classes/warlock.png';
import hunterIcon from '../assets/classes/hunter.png';
import paladinIcon from '../assets/classes/paladin.png';
import druidIcon from '../assets/classes/druid.png';
import rogueIcon from '../assets/classes/rogue.png';
import protIcon from '../assets/classes/prot.png';
import furyIcon from '../assets/classes/fury.png';
const CLASS_COLORS = {
  WARRIOR: '#C79C6E', // light brown
  MAGE: '#69CCF0',    // light blue
  PRIEST: '#FFFFFF',  // white
  WARLOCK: '#9482C9', // purple
  HUNTER: '#ABD473',  // light green
  PALADIN: '#F58CBA', // pink
  DRUID: '#FF7D0A',   // orange
  ROGUE: '#FFF569',
};

type ClassIconType = 'WARRIOR' | 'MAGE' | 'PRIEST' | 'WARLOCK' | 'HUNTER' | 'PALADIN' | 'DRUID' | 'ROGUE' | 'TANK' | 'FURY';

const CLASS_ICONS: Record<ClassIconType, string> = {
  WARRIOR: warriorIcon,
  MAGE: mageIcon,
  PRIEST: priestIcon,
  WARLOCK: warlockIcon,
  HUNTER: hunterIcon,
  PALADIN: paladinIcon,
  DRUID: druidIcon,
  ROGUE: rogueIcon,
  TANK: protIcon,
  FURY: furyIcon
};

interface SignupPlayer {
  userId: string;
  username: string;
  characterId: string;
  characterName: string;
  characterClass: string;
  characterRole: string;
  originalDiscordName?: string;
  discordNickname?: string;
  spec?: string;
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

// Add ClassViewModal component
const ClassViewModal = ({ isOpen, onClose, allPlayers, raidGroups }: {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: SignupPlayer[];
  raidGroups: RaidGroup[];
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const getPlayerGroup = (player: SignupPlayer) => {
    for (const group of raidGroups) {
      if (group.players.some(p => p.userId === player.userId)) {
        return group.name;
      }
    }
    return 'Unassigned';
  };

  const getDisplayName = (player: SignupPlayer) => {
    return player.discordNickname || player.originalDiscordName || player.characterName;
  };

  const filteredPlayers = selectedClass
    ? allPlayers.filter(player => player.characterClass.toUpperCase() === selectedClass)
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader color="white">View Classes</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<Icon as={InfoIcon} />}
                bg="gray.700"
                color="white"
                width="100%"
                textAlign="left"
                _hover={{ bg: 'gray.600' }}
                _active={{ bg: 'gray.600' }}
              >
                {selectedClass || 'Select a class'}
              </MenuButton>
              <MenuList bg="gray.700" borderColor="gray.600">
                <MenuItem
                  onClick={() => setSelectedClass('')}
                  bg="gray.700"
                  _hover={{ bg: 'gray.600' }}
                  color="white"
                >
                  Select a class
                </MenuItem>
                <MenuDivider />
                {Object.keys(CLASS_COLORS).map(className => (
                  <MenuItem
                    key={className}
                    onClick={() => setSelectedClass(className)}
                    bg="gray.700"
                    _hover={{ bg: 'gray.600' }}
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
              </MenuList>
            </Menu>

            {selectedClass && (
              <VStack
                spacing={2}
                align="stretch"
                maxH="400px"
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'gray.700',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'gray.600',
                    borderRadius: '4px',
                  },
                }}
              >
                {filteredPlayers.map((player) => (
                  <HStack
                    key={player.userId}
                    bg="gray.700"
                    p={3}
                    borderRadius="md"
                    justify="space-between"
                  >
                    <HStack>
                      <Image
                        src={CLASS_ICONS[player.characterClass.toUpperCase() as keyof typeof CLASS_ICONS]}
                        boxSize="24px"
                        alt={player.characterClass}
                      />
                      <Text color="white">{getDisplayName(player)}</Text>
                    </HStack>
                    <Badge
                      colorScheme={getPlayerGroup(player) === 'Unassigned' ? 'red' : 'green'}
                    >
                      {getPlayerGroup(player)}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const RosterModal = ({ isOpen, onClose, event, isAdmin }: RosterModalProps) => {
  // Group signups by role
  const signupEntries = Object.values(event.signups || {}).filter(signup => signup !== null);
  const tanks = signupEntries.filter(signup => signup?.characterRole === 'Tank');
  const healers = signupEntries.filter(signup => signup?.characterRole === 'Healer');
  const dps = signupEntries.filter(signup => signup?.characterRole === 'DPS');

  const [raidGroups, setRaidGroups] = useState<RaidGroup[]>([
    { id: 'group1', name: 'Group 1', players: [] },
    { id: 'group2', name: 'Group 2', players: [] },
    { id: 'group3', name: 'Group 3', players: [] },
    { id: 'group4', name: 'Group 4', players: [] },
    { id: 'group5', name: 'Group 5', players: [] },
    { id: 'group6', name: 'Group 6', players: [] },
    { id: 'group7', name: 'Group 7', players: [] },
    { id: 'group8', name: 'Group 8', players: [] },
    { id: 'group11', name: 'Group 11', players: [] },
    { id: 'group12', name: 'Group 12', players: [] },
    { id: 'group13', name: 'Group 13', players: [] },
    { id: 'group14', name: 'Group 14', players: [] },
    { id: 'group15', name: 'Group 15', players: [] },
    { id: 'group16', name: 'Group 16', players: [] },
    { id: 'group17', name: 'Group 17', players: [] },
    { id: 'group18', name: 'Group 18', players: [] },
    { id: 'group21', name: 'Group 21', players: [] },
    { id: 'group22', name: 'Group 22', players: [] },
    { id: 'group23', name: 'Group 23', players: [] },
    { id: 'group24', name: 'Group 24', players: [] },
    { id: 'group25', name: 'Group 25', players: [] },
    { id: 'group26', name: 'Group 26', players: [] },
    { id: 'group27', name: 'Group 27', players: [] },
    { id: 'group28', name: 'Group 28', players: [] },
  ]);

  const [unassignedPlayers, setUnassignedPlayers] = useState<SignupPlayer[]>([]);
  const [assignedPlayers, setAssignedPlayers] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<'Tank' | 'Healer' | 'DPS' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState<'1-8' | '11-18' | '21-28' | null>(null);
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
      setInitialState(createCleanState());
      setHasUnsavedChanges(false);
    }
  }, [isOpen]);

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

    const currentState = createCleanState();

    // Compare groups that have players
    const currentActiveGroups = currentState.groups.filter(g => g.players.length > 0);
    const initialActiveGroups = initialState.groups.filter(g => g.players.length > 0);

    const hasGroupChanges = 
      currentActiveGroups.length !== initialActiveGroups.length ||
      currentActiveGroups.some((group, index) => !areGroupsEqual(group, initialActiveGroups[index]));

    // Compare unassigned players
    const hasUnassignedChanges = 
      currentState.unassigned.length !== initialState.unassigned.length ||
      !currentState.unassigned.every(player => 
        initialState.unassigned.some(p => arePlayersEqual(player, p))
      );

    setHasUnsavedChanges(hasGroupChanges || hasUnassignedChanges);
  }, [raidGroups, unassignedPlayers, initialState, isAdmin]);

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
            const cleanPlayer = {
              userId: player.userId,
              username: player.username,
              characterId: player.characterId,
              characterName: player.characterName,
              characterClass: player.characterClass || 'Unknown',
              characterRole: player.characterRole || 'DPS',
              spec: player.spec
            };

            if (event.signupType === 'raidhelper') {
              return {
                ...cleanPlayer,
                originalDiscordName: player.originalDiscordName || player.username,
                discordNickname: player.discordNickname || null,
                isDiscordSignup: true,
                spec: player.spec
              };
            }

            return cleanPlayer;
          })
        }));

      const raidComposition = {
        lastUpdated: new Date(),
        updatedBy: {
          userId: user.username,
          username: user.username
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
      toast({
        title: "Error saving raid composition",
        description: "There was an error saving the raid composition. Please try again.",
        status: "error",
        duration: 3000,
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

  const getRaidName = (groupId: string) => {
    const groupNumber = parseInt(groupId.replace('group', ''));
    if (groupNumber >= 1 && groupNumber <= 8) return 'Raid 1-8';
    if (groupNumber >= 11 && groupNumber <= 18) return 'Raid 11-18';
    if (groupNumber >= 21 && groupNumber <= 28) return 'Raid 21-28';
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
      // Only initialize if we haven't already or if the modal is newly opened
      if (!hasInitialized && isOpen) {
        console.log('Initializing raid roster with complete event data:', {
          eventId: event.id,
          title: event.title,
          signupType: event.signupType,
          raidHelperSignups: event.raidHelperSignups,
          manualSignups: event.signups,
          raidComposition: event.raidComposition
        });

        if (event.signupType === 'raidhelper' && event.raidHelperSignups?.signUps) {
          console.log('RaidHelper Signups Detail:', event.raidHelperSignups.signUps.map(signup => ({
            id: signup.id,
            userId: signup.userId,
            name: signup.name,
            className: signup.className,
            role: signup.role,
            status: signup.status,
            specName: signup.specName,
            tentative: signup.tentative,
            timestamp: signup.timestamp,
            // Log all other properties
            allProperties: { ...signup }
          })));
        }
        
    if (event.raidComposition) {
      console.log('Loading saved raid composition:', event.raidComposition);
      const savedGroups = event.raidComposition.groups;
      const assignedPlayerIds = new Set<string>();

          // Get all users for Discord nickname mapping
          let firebaseUsers = new Map();
          if (event.signupType === 'raidhelper') {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            firebaseUsers = new Map(
              usersSnapshot.docs.map(doc => [doc.data().discordId, { ...doc.data(), id: doc.id }])
            );
          }

      // Update groups with saved players
          const updatedGroups = raidGroups.map(group => {
            const savedGroup = savedGroups.find((g: { id: string }) => g.id === group.id);
        if (savedGroup) {
          const players = savedGroup.players
                .map((savedPlayer: SignupPlayer) => {
                  if (event.signupType === 'raidhelper' && event.raidHelperSignups?.signUps) {
                    const raidHelperSignup = event.raidHelperSignups.signUps
                      .find((s: RaidHelperSignupType) => 
                        (savedPlayer.userId && s.userId === savedPlayer.userId) || 
                        (s.name === savedPlayer.username && s.status === "primary")
                      );
                    
                    if (raidHelperSignup) {
                      const matchingUser = firebaseUsers.get(raidHelperSignup.userId);
                      return {
                        userId: raidHelperSignup.userId || raidHelperSignup.name,
                        username: raidHelperSignup.name,
                        characterId: raidHelperSignup.id.toString(),
                        characterName: raidHelperSignup.name,
                        characterClass: raidHelperSignup.className || 'Unknown',
                        characterRole: raidHelperSignup.role || 'DPS',
                        originalDiscordName: raidHelperSignup.name,
                        discordNickname: matchingUser?.discordSignupNickname,
                        spec: raidHelperSignup.specName || undefined
                      };
              }
              return null;
                  }
                  return event.signups?.[savedPlayer.userId] || null;
            })
                .filter(isSignupPlayer);

              players.forEach(player => assignedPlayerIds.add(player.characterId));
          return { ...group, players };
        }
        return group;
      });

      setRaidGroups(updatedGroups);
      setAssignedPlayers(assignedPlayerIds);

          // Handle unassigned players
          if (event.signupType === 'raidhelper' && event.raidHelperSignups?.signUps) {
            const unassigned = await matchDiscordSignupsWithUsers(
              event.raidHelperSignups.signUps.filter(
                signup => signup.status === "primary" && !assignedPlayerIds.has(signup.id.toString())
              )
            );
      setUnassignedPlayers(unassigned);
          } else if (event.signups) {
            const unassigned = Object.entries(event.signups)
              .filter(([_, signup]) => signup !== null)
              .map(([_, signup]) => signup as SignupPlayer)
              .filter(isSignupPlayer)
              .filter(signup => !assignedPlayerIds.has(signup.characterId));
            
            setUnassignedPlayers(unassigned);
          }
    } else {
          // No saved composition, initialize fresh state
          if (event.signupType === 'raidhelper' && event.raidHelperSignups?.signUps) {
            const matchedSignups = await matchDiscordSignupsWithUsers(event.raidHelperSignups.signUps);
            setUnassignedPlayers(matchedSignups);
            setAssignedPlayers(new Set());
            setRaidGroups(raidGroups);
          } else if (event.signups) {
            console.log('Processing manual signups:', event.signups);
            const validSignups = Object.entries(event.signups)
              .filter(([_, signup]) => signup !== null)
              .map(([_, signup]) => ({
                userId: signup!.userId,
                username: signup!.username,
                characterId: signup!.characterId,
                characterName: signup!.characterName,
                characterClass: signup!.characterClass,
                characterRole: signup!.characterRole
              }))
              .filter(isSignupPlayer);
            
            setUnassignedPlayers(validSignups);
            setAssignedPlayers(new Set());
            setRaidGroups(raidGroups);
          } else {
            console.log('No signups found');
            setUnassignedPlayers([]);
            setAssignedPlayers(new Set());
            setRaidGroups(raidGroups);
          }
        }

        setHasInitialized(true);
      }
    };

    initializeSignups();
  }, [isOpen, event.id]); // Only depend on isOpen and event.id

  // Reset initialization state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen]);

  // Update the useEffect to fetch Discord nicknames when component mounts
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
      if (destGroup.players.length >= 5 && source.droppableId !== destination.droppableId) {
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

  const getClassColor = (className: string) => {
    if (!className) return '#FFFFFF';
    const normalizedClass = className.toUpperCase();
    return CLASS_COLORS[normalizedClass as keyof typeof CLASS_COLORS] || '#FFFFFF';
  };

  const assignPlayerToGroup = (player: SignupPlayer, groupId: string) => {
    const targetGroup = raidGroups.find(g => g.id === groupId);
    if (!targetGroup || targetGroup.players.length >= 5) return;

    // Remove from current group if assigned
    const newGroups = raidGroups.map(group => {
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
    });

    setRaidGroups(newGroups);
    setAssignedPlayers(prev => new Set([...prev, player.characterId]));
    
    // Remove from unassigned if present
    setUnassignedPlayers(prev => 
      prev.filter(p => p.characterId !== player.characterId)
    );
  };

  const unassignPlayer = (player: SignupPlayer) => {
    // Remove from groups
    const newGroups = raidGroups.map(group => ({
      ...group,
      players: group.players.filter(p => p.characterId !== player.characterId)
    }));

    setRaidGroups(newGroups);
    setAssignedPlayers(prev => {
      const next = new Set(prev);
      next.delete(player.characterId);
      return next;
    });

    // Add to unassigned if not already there
    if (!unassignedPlayers.some(p => p.characterId === player.characterId)) {
      setUnassignedPlayers(prev => [...prev, player]);
    }
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

  const PlayerCard = ({ player, index = 0 }: { player: SignupPlayer; index: number }) => {
    console.log(player);
    const isAssigned = assignedPlayers.has(player.characterId);
    const classColor = getClassColor(player.characterClass || '');
    const getPlayerIcon = () => {
      if (player.characterRole === 'Tank') {
        return CLASS_ICONS.TANK;
      }
      if (player.spec === 'Fury') {
        return CLASS_ICONS.FURY;
      }
      return CLASS_ICONS[(player.characterClass || 'WARRIOR').toUpperCase() as ClassIconType];
    };
    const classIcon = getPlayerIcon();
    const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

    // Get gradient colors based on class
    const getClassGradient = (className: string) => {
      const baseColor = CLASS_COLORS[className.toUpperCase() as keyof typeof CLASS_COLORS];
      switch (className.toUpperCase()) {
        case 'WARRIOR':
          return `linear-gradient(45deg, ${baseColor}, #8B733E)`;
        case 'MAGE':
          return `linear-gradient(45deg, ${baseColor}, #4A8DB0)`;
        case 'PRIEST':
          return `linear-gradient(45deg, ${baseColor}, #C0C0C0)`;
        case 'WARLOCK':
          return `linear-gradient(45deg, ${baseColor}, #6A5A9C)`;
        case 'HUNTER':
          return `linear-gradient(45deg, ${baseColor}, #8BC34A)`;
        case 'PALADIN':
          return `linear-gradient(45deg, ${baseColor}, #BE5E89)`;
        case 'DRUID':
          return `linear-gradient(45deg, ${baseColor}, #CC5A0A)`;
        case 'ROGUE':
          return `linear-gradient(45deg, ${baseColor}, #C0B04A)`;
        default:
          return `linear-gradient(45deg, #FFFFFF, #808080)`;
      }
    };

    const getDisplayName = () => {
      if (event.signupType === 'raidhelper') {
        return player.discordNickname || player.originalDiscordName || player.username;
      }
      return player.characterName;
    };

    return (
      <Draggable 
        draggableId={player.characterId} 
        index={index}
        key={player.characterId}
      >
        {(provided: DraggableProvided, snapshot) => (
          <Menu isOpen={isMenuOpen} onClose={onMenuClose}>
            <MenuButton
              as={Box}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              bg="rgba(44, 49, 60, 0.95)"
              p={3}
              borderRadius="md"
              _hover={{
                bg: "rgba(52, 58, 70, 0.95)",
                cursor: isAdmin ? "grab" : "default"
              }}
              onClick={onMenuOpen}
            >
              <HStack spacing={3} justify="space-between" width="100%">
                <HStack spacing={3}>
                  <Box
              position="relative"
                    padding="2px"
                    borderRadius="full"
                    background={getClassGradient(player.characterClass)}
                  >
                <Image
                  src={classIcon}
                  alt={player.characterClass}
                  boxSize="24px"
                  objectFit="cover"
                      borderRadius="full"
                    />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {getDisplayName()}
                </Text>
                    <Text color={classColor} fontSize="xs" textTransform="uppercase">
                      {player.characterClass}
                    </Text>
                  </VStack>
                </HStack>
                <Badge
                  bg="rgba(30, 34, 42, 0.95)"
                  color="white"
                  px={2}
                  py={1}
                  borderRadius="sm"
                  fontSize="xs"
                  textTransform="uppercase"
                >
                  {player.characterRole}
                </Badge>
              </HStack>
            </MenuButton>

            {isAdmin && (
              <Portal>
                <MenuList 
                  bg="background.secondary" 
                  borderColor="border.primary"
                  zIndex={2000}
                  position="relative"
                  py={1}
                  boxShadow="dark-lg"
                >
                  <MenuItem
                    _hover={{ bg: 'background.tertiary' }}
                    _focus={{ bg: 'background.tertiary' }}
                    color="red.400"
                    bg="background.secondary"
                    onClick={() => {
                      unassignPlayer(player);
                      onMenuClose();
                    }}
                  >
                    Unassign
                  </MenuItem>
                  <MenuDivider borderColor="border.primary" />
                  <SubMenu label="Raid 1-8">
                    {raidGroups.slice(0, 8).map((group) => (
                      <MenuItem
                        key={group.id}
                        _hover={{ bg: 'background.tertiary' }}
                        _focus={{ bg: 'background.tertiary' }}
                        color="text.primary"
                        bg="background.secondary"
                        onClick={() => {
                          assignPlayerToGroup(player, group.id);
                          onMenuClose();
                        }}
                      >
                        {group.name} ({group.players.length}/5)
                      </MenuItem>
                    ))}
                  </SubMenu>
                  <SubMenu label="Raid 11-18">
                    {raidGroups.slice(8, 16).map((group) => (
                      <MenuItem
                        key={group.id}
                        _hover={{ bg: 'background.tertiary' }}
                        _focus={{ bg: 'background.tertiary' }}
                        color="text.primary"
                        bg="background.secondary"
                        onClick={() => {
                          assignPlayerToGroup(player, group.id);
                          onMenuClose();
                        }}
                      >
                        {group.name} ({group.players.length}/5)
                      </MenuItem>
                    ))}
                  </SubMenu>
                  <SubMenu label="Raid 21-28">
                    {raidGroups.slice(16, 24).map((group) => (
                      <MenuItem
                        key={group.id}
                        _hover={{ bg: 'background.tertiary' }}
                        _focus={{ bg: 'background.tertiary' }}
                        color="text.primary"
                        bg="background.secondary"
                        onClick={() => {
                          assignPlayerToGroup(player, group.id);
                          onMenuClose();
                        }}
                      >
                        {group.name} ({group.players.length}/5)
                      </MenuItem>
                    ))}
                  </SubMenu>
                </MenuList>
              </Portal>
            )}
          </Menu>
        )}
      </Draggable>
    );
  };

  const RaidGroup = ({ group }: { group: RaidGroup }) => (
    <Box
      bg="background.secondary"
      p={2}
      borderRadius="md"
      border="1px solid"
      borderColor="border.primary"
      minH="330px"
      maxH="330px"
      position="relative"
      sx={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '::-webkit-scrollbar': { 
          display: 'none'
        }
      }}
      _hover={{
        borderColor: "primary.400",
        boxShadow: "0 0 0 1px var(--chakra-colors-primary-400)"
      }}
    >
      <Text color="text.primary" fontSize="sm" mb={1} fontWeight="bold">{group.name}</Text>
      <StableDroppable id={group.id}>
        {(provided: DroppableProvided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            bg="background.tertiary"
            p={2}
            borderRadius="md"
            minH="290px"
            maxH="290px"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '0px',
                background: 'transparent'
              },
              'scrollbarWidth': 'none',
              '-ms-overflow-style': 'none'
            }}
            onClick={(e) => e.currentTarget.focus()}
            tabIndex={0}
            _hover={{
              borderColor: snapshot.isDraggingOver ? "primary.400" : undefined,
              bg: snapshot.isDraggingOver ? "background.secondary" : "background.tertiary"
            }}
          >
            <VStack align="stretch" spacing={1}>
              {group.players.map((player, index) => (
                <PlayerCard key={player.characterId} player={player} index={index} />
              ))}
            </VStack>
            {provided.placeholder}
          </Box>
        )}
      </StableDroppable>
    </Box>
  );

  // Sort unassigned players
  const sortedUnassignedPlayers = [...unassignedPlayers].sort((a, b) => {
    if (selectedRole) {
      // If role is selected, put matching roles first
      if (a.characterRole === selectedRole && b.characterRole !== selectedRole) return -1;
      if (a.characterRole !== selectedRole && b.characterRole === selectedRole) return 1;
    }
    // Then sort by role (Tank > Healer > DPS)
    if (a.characterRole !== b.characterRole) {
      const roleOrder: Record<'Tank' | 'Healer' | 'DPS', number> = { Tank: 0, Healer: 1, DPS: 2 };
      return roleOrder[a.characterRole as keyof typeof roleOrder] - roleOrder[b.characterRole as keyof typeof roleOrder];
    }
    // Finally sort alphabetically by name within each role group
    return a.characterName.localeCompare(b.characterName);
  });

  const userCharacterInfo = getUserCharacterGroup(user, event, raidGroups);

  // Get all players (both assigned and unassigned)
  const allPlayers = useMemo(() => {
    return [...unassignedPlayers, ...raidGroups.flatMap(group => group.players)];
  }, [unassignedPlayers, raidGroups]);

  // Add this function to handle exports for specific raid ranges
  const exportRaidGroup = (startIndex: number, endIndex: number) => {
    // Process groups in pairs
    const groupPairs = [];
    for (let i = startIndex; i < endIndex; i += 2) {
      const group1 = raidGroups[i];
      const group2 = raidGroups[i + 1];
      
      // Create the paired output for 5 player slots
      const pairedLines = [];
      for (let slot = 0; slot < 5; slot++) {
        const player1 = group1?.players[slot];
        const player2 = group2?.players[slot];
        
        const name1 = player1 ? (player1.discordNickname || player1.characterName) : "-";
        const name2 = player2 ? (player2.discordNickname || player2.characterName) : "-";
        
        pairedLines.push(`${name1}    ${name2}`);
      }
      groupPairs.push(pairedLines.join('\n'));
    }

    const outputString = groupPairs.join('\n\n');

    if (!outputString) {
      toast({
        title: "No players in this raid range",
        description: "There are no players in this raid to export",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // Create and trigger download
    const blob = new Blob([outputString], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}_MRT.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Also copy to clipboard for easy pasting
    navigator.clipboard.writeText(outputString).then(() => {
      toast({
        title: "MRT format copied to clipboard",
        description: "Player list has been copied in MRT format to your clipboard",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    });
  };

  // Add these functions back
  const fetchDiscordNicknames = async (signups: SignupPlayer[]) => {
    try {
      console.log('Fetching Discord nicknames for signups:', signups);
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
      const firebaseUsers = new Map<string, FirebaseUser>(
        usersSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const discordId = data.discordId;
            if (discordId) {
              return [discordId, { id: doc.id, ...data } as FirebaseUser];
            }
            return null;
          })
          .filter((entry): entry is [string, FirebaseUser] => entry !== null)
      );

      const validSignups = discordSignups
        .filter((signup: RaidHelperSignupType) => signup.status === "primary")
        .map((signup: RaidHelperSignupType): SignupPlayer => {
          const matchingUser = signup.userId ? firebaseUsers.get(signup.userId) : undefined;
    return {
            userId: signup.userId || signup.name,
            username: signup.name,
            characterId: signup.id.toString(),
            characterName: signup.name,
            characterClass: signup.className || 'Unknown',
            characterRole: signup.role || 'DPS',
            originalDiscordName: signup.name,
            discordNickname: matchingUser?.discordSignupNickname,
            spec: signup.specName || undefined
          };
        });

      return validSignups;
    } catch (error) {
      console.error('Error matching Discord signups with users:', error);
      return [];
    }
  };

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
      <Modal isOpen={isOpen} onClose={handleModalClose} size="full" blockScrollOnMount={false}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent 
          bg="background.secondary"
          margin={0}
          height="100vh"
          maxHeight="100vh"
          overflow="hidden"
        >
          <ModalCloseButton color="text.primary" size="lg" top={4} right={4} />
          <ModalHeader color="text.primary" fontSize="2xl" pt={8} px={8} display="flex" flexDirection="column" gap={4}>
            <Flex justify="space-between" alignItems="center">
              <Text>Slutgiltig Roster - {event.title}</Text>
              {isAdmin && unassignedPlayers.length + raidGroups.reduce((total, group) => total + group.players.length, 0) > 0 && (
                <HStack spacing={2} mr={"3rem"}>
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
                        onClick={() => exportRaidGroup(0, 8)}
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
                        Raid 1-8
                      </MenuItem>
                      <MenuItem
                        onClick={() => exportRaidGroup(8, 16)}
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
                        Raid 11-18
                      </MenuItem>
                      <MenuItem
                        onClick={() => exportRaidGroup(16, 24)}
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
                        Raid 21-28
                      </MenuItem>
                      <MenuDivider borderColor="gray.700" my={2} />
                      <MenuItem
                        onClick={() => exportRaidGroup(0, 24)}
                        bg="transparent"
                        _hover={{ bg: 'gray.700' }}
                        _focus={{ bg: 'gray.700' }}
                        color="white"
                        borderRadius="md"
                        p={2}
                        fontSize="sm"
                        fontWeight="medium"
                      >
                        All Raids
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
              <VStack align="start" spacing={2}>
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
                  {userCharacterInfo.character.characterName} is in {userCharacterInfo.group ? userCharacterInfo.group.name : 'an unassigned group'}
                </Text>
              </VStack>
            )}
          </ModalHeader>
          <ModalBody 
            p={8} 
            overflowY="auto" 
            height="calc(100vh - 250px)"
            onWheel={(e) => {
              e.currentTarget.scrollTop += e.deltaY;
            }}
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'var(--chakra-colors-background-tertiary)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-border-primary)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'var(--chakra-colors-primary-400)',
                },
              },
            }}
          >
            <DragDropContext onDragEnd={handleDragEnd}>
              <HStack align="start" spacing={8} height="100%">
                <Box flex="1" height="100%">
                  <VStack align="stretch" spacing={4}>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={onClassViewOpen}
                      leftIcon={<Icon as={InfoIcon} />}
                      width="fit-content"
                      mt={"6rem"}
                    >
                      View Classes
                    </Button>
                    <Box
                      bg="background.tertiary"
                      p={4}
                      borderRadius="lg"
                      borderLeft="4px solid"
                      borderLeftColor="primary.400"
                    >
                      <Heading size="sm" color="text.primary" mb={3}>
                        Unassigned Players ({unassignedPlayers.length})
                      </Heading>
                      <StableDroppable id="unassigned">
                        {(provided: DroppableProvided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            minH="100px"
                            maxH="calc(100vh - 450px)"
                            overflowY="auto"
                            onWheel={(e) => {
                              if (e.currentTarget.scrollHeight > e.currentTarget.clientHeight) {
                                e.stopPropagation();
                                e.currentTarget.scrollTop += e.deltaY;
                              }
                            }}
                            bg={snapshot.isDraggingOver ? "background.secondary" : "transparent"}
                            borderRadius="md"
                            p={2}
                            sx={{
                              '&::-webkit-scrollbar': { 
                                display: 'none'
                              },
                              'scrollbarWidth': 'none',
                              '-ms-overflow-style': 'none'
                            }}
                          >
                            <VStack align="stretch" spacing={2}>
                              {unassignedPlayers.map((player, index) => (
                                <PlayerCard key={player.characterId} player={player} index={index} />
                              ))}
                            </VStack>
                            {provided.placeholder}
                          </Box>
                        )}
                      </StableDroppable>
                    </Box>
                  </VStack>
                </Box>

                <Box flex="3" height="100%">
                  <VStack align="stretch" spacing={4}>
                    <ButtonGroup isAttached variant="outline" alignSelf="flex-end">
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
                      <Button
                        onClick={() => setSelectedRaid('21-28')}
                        colorScheme={selectedRaid === '21-28' ? "primary" : "gray"}
                        size="sm"
                        color="text.primary"
                      >
                        Raid 21-28
                      </Button>
                    </ButtonGroup>

                    {(!selectedRaid || selectedRaid === '1-8') && (
                      <>
                        <Heading size="sm" color="text.primary" mb={4}>
                          Raid 1-8 [{getRaidPlayerCount(raidGroups, 0, 8)}/40]
                        </Heading>
                        <SimpleGrid columns={4} spacing={4}>
                          {raidGroups.slice(0, 8).map((group) => (
                            <RaidGroup key={group.id} group={group} />
                          ))}
                        </SimpleGrid>
                      </>
                    )}

                    {(!selectedRaid || selectedRaid === '11-18') && (
                      <>
                        <Heading size="sm" color="text.primary" mb={4}>
                          Raid 11-18 [{getRaidPlayerCount(raidGroups, 8, 16)}/40]
                        </Heading>
                        <SimpleGrid columns={4} spacing={4}>
                          {raidGroups.slice(8, 16).map((group) => (
                            <RaidGroup key={group.id} group={group} />
                          ))}
                        </SimpleGrid>
                      </>
                    )}

                    {(!selectedRaid || selectedRaid === '21-28') && (
                      <>
                        <Heading size="sm" color="text.primary" mb={4}>
                          Raid 21-28 [{getRaidPlayerCount(raidGroups, 16, 24)}/40]
                        </Heading>
                        <SimpleGrid columns={4} spacing={4}>
                          {raidGroups.slice(16, 24).map((group) => (
                            <RaidGroup key={group.id} group={group} />
                          ))}
                        </SimpleGrid>
                      </>
                    )}
                  </VStack>
                </Box>
              </HStack>
            </DragDropContext>
          </ModalBody>

          <ClassViewModal
            isOpen={isClassViewOpen}
            onClose={onClassViewClose}
            allPlayers={allPlayers}
            raidGroups={raidGroups}
          />
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