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
} from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
import { Event } from '../types/firebase';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult, DroppableStateSnapshot } from 'react-beautiful-dnd';
import { useState, useEffect, memo, ReactElement, useMemo } from 'react';
import { CheckIcon, TimeIcon, InfoIcon } from '@chakra-ui/icons';
import { doc, updateDoc } from 'firebase/firestore';
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

const CLASS_ICONS = {
  WARRIOR: warriorIcon,
  MAGE: mageIcon,
  PRIEST: priestIcon,
  WARLOCK: warlockIcon,
  HUNTER: hunterIcon,
  PALADIN: paladinIcon,
  DRUID: druidIcon,
  ROGUE: rogueIcon,
};

type SignupPlayer = {
  userId: string;
  username: string;
  characterId: string;
  characterName: string;
  characterClass: string;
  characterRole: string;
};

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
  const { user } = useUser();

  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  // Initialize raid groups and players when event changes
  useEffect(() => {
    console.log('RosterModal useEffect - event:', event);
    console.log('RosterModal useEffect - event.signups:', event.signups);
    
    if (!event?.signups) {
      console.log('No signups found');
      setUnassignedPlayers([]);
      setAssignedPlayers(new Set());
      setRaidGroups(prev => prev.map(group => ({ ...group, players: [] })));
      return;
    }

    // Initialize unassigned players with all signups (excluding null values)
    const validSignups = Object.values(event.signups).filter(signup => signup !== null);
    console.log('Valid signups:', validSignups);
    
    setUnassignedPlayers(validSignups);
    setAssignedPlayers(new Set());

    // Initialize raid groups
    const initialGroups = [
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
    ];

    // If there's a saved raid composition, load it
    if (event.raidComposition) {
      console.log('Loading saved raid composition:', event.raidComposition);
      const savedGroups = event.raidComposition.groups;
      const assignedPlayerIds = new Set<string>();

      // Update groups with saved players
      const updatedGroups = initialGroups.map(group => {
        const savedGroup = savedGroups.find(g => g.id === group.id);
        if (savedGroup) {
          // Map saved players to signup format
          const players = savedGroup.players
            .map(savedPlayer => {
              const signup = Object.values(event.signups).find(s => s?.characterId === savedPlayer.characterId);
              if (signup) {
                assignedPlayerIds.add(signup.characterId);
                return signup;
              }
              return null;
            })
            .filter(Boolean) as SignupPlayer[];

          return { ...group, players };
        }
        return group;
      });

      setRaidGroups(updatedGroups);
      setAssignedPlayers(assignedPlayerIds);

      // Update unassigned players by removing those that are assigned
      const unassigned = validSignups.filter(signup => !assignedPlayerIds.has(signup.characterId));
      setUnassignedPlayers(unassigned);
    } else {
      console.log('No saved raid composition found');
      setRaidGroups(initialGroups);
    }
  }, [event?.id, event?.signups, event?.raidComposition]); // Only re-run if these specific event properties change

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
    const isAssigned = assignedPlayers.has(player.characterId);
    const assignedGroup = raidGroups.find(g => g.players.some(p => p.characterId === player.characterId));
    const classColor = getClassColor(player.characterClass || '');
    const classIcon = player.characterClass ? 
      CLASS_ICONS[player.characterClass.toUpperCase() as keyof typeof CLASS_ICONS] || CLASS_ICONS.WARRIOR 
      : CLASS_ICONS.WARRIOR;
    const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

    const draggableId = player.characterId;

    return (
      <Draggable 
        draggableId={draggableId} 
        index={index}
        key={draggableId}
        isDragDisabled={!isAdmin}
      >
        {(provided: DraggableProvided, snapshot) => (
          <Menu isOpen={isMenuOpen} onClose={onMenuClose}>
            <MenuButton
              as={Box}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              bg="background.tertiary"
              p={2}
              borderRadius="md"
              cursor={isAdmin ? "grab" : "default"}
              border="1px solid"
              borderColor="border.primary"
              _hover={{
                borderColor: "primary.400",
                bg: "background.secondary"
              }}
              onClick={isAdmin ? onMenuOpen : undefined}
              position="relative"
              style={{
                ...provided.draggableProps.style,
                transform: snapshot.isDragging ? provided.draggableProps.style?.transform : "none",
              }}
            >
              <Flex align="center" gap={2}>
                <Image
                  src={classIcon}
                  alt={player.characterClass}
                  boxSize="24px"
                  objectFit="cover"
                />
                <Text color="text.primary" fontSize="sm" fontWeight="medium">
                  {player.characterName}
                </Text>
                <Badge
                  colorScheme={
                    player.characterRole === 'Tank' ? 'red' :
                    player.characterRole === 'Healer' ? 'green' : 'blue'
                  }
                  fontSize="xs"
                >
                  {player.characterRole}
                </Badge>
              </Flex>
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
      minH="240px"
      maxH="240px"
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
            minH="205px"
            maxH="205px"
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

  const handleSaveRaidComp = async () => {
    if (!isAdmin || !user) return;
    
    setIsSaving(true);
    try {
      // Filter out empty groups
      const nonEmptyGroups = raidGroups
        .filter(group => group.players.length > 0)
        .map(group => ({
          id: group.id,
          name: group.name,
          players: group.players.map(player => ({
            userId: player.userId,
            username: player.username,
            characterId: player.characterId,
            characterName: player.characterName,
            characterClass: player.characterClass,
            characterRole: player.characterRole
          }))
        }));

      const raidComposition = {
        lastUpdated: new Date(),
        updatedBy: {
          userId: user.username,
          username: user.username
        },
        groups: nonEmptyGroups
      };

      // Save to Firebase
      await updateDoc(doc(db, 'events', event.id), {
        raidComposition
      });

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

  // Find user's character group
  const getUserCharacterGroup = () => {
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

  const getRaidPlayerCount = (startGroup: number, endGroup: number) => {
    return raidGroups
      .slice(startGroup, endGroup)
      .reduce((total, group) => total + group.players.length, 0);
  };

  const userCharacterInfo = getUserCharacterGroup();

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
      <Modal isOpen={isOpen} onClose={onClose} size="full" blockScrollOnMount={false}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent 
          bg="background.secondary"
          margin={0}
          height="100vh"
          overflow="hidden"
        >
          <ModalCloseButton color="text.primary" size="lg" top={4} right={4} />
          <ModalHeader color="text.primary" fontSize="2xl" pt={8} px={8} display="flex" flexDirection="column" gap={4}>
            <Flex justify="space-between" alignItems="center">
              <Text>Slutgiltig Roster - {event.title}</Text>
              {isAdmin && signupEntries.length > 0 && (
                <Button
                  leftIcon={<CheckIcon />}
                  colorScheme="primary"
                  variant="solid"
                  size="md"
                  onClick={handleSaveRaidComp}
                  isLoading={isSaving}
                  loadingText="Sparar..."
                  style={{ marginTop: '2rem' }}
                >
                  Spara Raid Comp
                </Button>
              )}
            </Flex>

            {userCharacterInfo && (
              <VStack align="start" spacing={2}>
                <Box 
                  bg="background.tertiary"
                  p={3}
                  borderRadius="md"
                  width="fit-content"
                  borderLeft="4px solid"
                  borderLeftColor="primary.400"
                >
                  <HStack spacing={2}>
                    <Icon 
                      as={InfoIcon}
                      color="primary.400"
                    />
                    <Text color="text.primary" fontSize="sm">
                      Din karaktär {userCharacterInfo.character?.characterName} är placerad i {userCharacterInfo.group?.name}
                    </Text>
                  </HStack>
                </Box>

                {userCharacterInfo.group && (
                  <Box 
                    bg="background.tertiary"
                    p={3}
                    borderRadius="md"
                    width="fit-content"
                    borderLeft="4px solid"
                    borderLeftColor="primary.400"
                  >
                    <HStack spacing={2}>
                      <Icon 
                        as={CheckIcon}
                        color="primary.400"
                      />
                      <Text color="text.primary" fontSize="sm">
                        Du kommer att raida i {getRaidName(userCharacterInfo.group.id)}
                      </Text>
                    </HStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalHeader>

          <ModalBody p={8} overflowY="auto" height="calc(100vh - 200px)">
            <DragDropContext onDragEnd={handleDragEnd}>
              <HStack align="start" spacing={8} height="100%">
                <Box flex="1" overflowY="auto" height="100%">
                  <VStack align="stretch" spacing={4}>
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
                            maxH="calc(100vh - 400px)"
                            overflowY="auto"
                            bg={snapshot.isDraggingOver ? "background.secondary" : "transparent"}
                            borderRadius="md"
                            p={2}
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

                <Box flex="3" overflowY="auto" height="100%">
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
                          Raid 1-8 [{getRaidPlayerCount(0, 8)}/40]
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
                          Raid 11-18 [{getRaidPlayerCount(8, 16)}/40]
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
                          Raid 21-28 [{getRaidPlayerCount(16, 24)}/40]
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
        </ModalContent>
      </Modal>
    </>
  );
};

export default RosterModal; 