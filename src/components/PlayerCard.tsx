import { Box, HStack, VStack, Text, Badge, Image, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Portal, useDisclosure, Tooltip, IconButton } from '@chakra-ui/react';
import { Draggable, DraggableProvided } from 'react-beautiful-dnd';
import { SignupPlayer } from '../types/firebase';
import { CLASS_ICONS, CLASS_COLORS, ClassIconType } from '../utils/classIcons';
import { SubMenu } from './SubMenu';
import { memo } from 'react';
import { CheckIcon, WarningIcon, ChevronDownIcon, ArrowForwardIcon } from '@chakra-ui/icons';

interface PlayerCardProps {
  player: SignupPlayer;
  index: number;
  isMobile: boolean;
  isAdmin: boolean;
  event: any;
  raidGroups: any[];
  assignedPlayers: Set<string>;
  assignPlayerToGroup: (player: SignupPlayer, groupId: string, targetIndex?: number) => void;
  unassignPlayer: (player: SignupPlayer) => void;
  isInRaidGroup: boolean;
  groupId?: string;
  groupIndex?: number;
}

// Comparison function for React.memo
const arePropsEqual = (prevProps: PlayerCardProps, nextProps: PlayerCardProps) => {
  return (
    prevProps.player.characterId === nextProps.player.characterId &&
    prevProps.player.characterName === nextProps.player.characterName &&
    prevProps.player.characterClass === nextProps.player.characterClass &&
    prevProps.player.characterRole === nextProps.player.characterRole &&
    prevProps.player.discordNickname === nextProps.player.discordNickname &&
    prevProps.index === nextProps.index &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.assignedPlayers.has(prevProps.player.characterId) === nextProps.assignedPlayers.has(nextProps.player.characterId)
  );
};

const getClassColor = (className: string) => {
  return CLASS_COLORS[className.toUpperCase() as keyof typeof CLASS_COLORS] || '#FFFFFF';
};

const PlayerCardComponent = ({ 
  player, 
  index, 
  isMobile, 
  isAdmin, 
  event, 
  raidGroups, 
  assignedPlayers, 
  assignPlayerToGroup, 
  unassignPlayer,
  isInRaidGroup,
  groupId,
  groupIndex
}: PlayerCardProps) => {
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const classColor = CLASS_COLORS[player.characterClass.toUpperCase() as keyof typeof CLASS_COLORS] || '#ffffff';
  const classIcon = player.spec == "Fury" ? CLASS_ICONS.FURY : CLASS_ICONS[player.characterClass.toUpperCase() as ClassIconType] || CLASS_ICONS.WARRIOR;
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
    const name = isInRaidGroup && player.isPreview
      ? player.characterName || player.username
      : player.discordNickname || player.username || player.characterName;
    
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
  };

  const isDragDisabled = !isAdmin || (player.isPreview && !isInRaidGroup);

  const cardBgColor = player.isPreview 
    ? isInRaidGroup 
      ? 'gray.700' 
      : 'transparent'
    : 'gray.700';

  const cardOpacity = player.isPreview && !isInRaidGroup ? 0.7 : 1;

  return (
    <Draggable 
      draggableId={player.characterId} 
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided: DraggableProvided, snapshot) => (
        <Box position="relative">
          <Menu isOpen={isMenuOpen && (!isInRaidGroup || !player.isPreview)} onOpen={onMenuOpen} onClose={onMenuClose}>
            <MenuButton
              as={Box}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              bg={cardBgColor}
              p={2}
              borderRadius="md"
              border="1.5px solid"
              borderColor={player.isPreview 
                ? (player.matchedPlayerId ? "green.500" : "gray.500") 
                : `${classColor}30`}
              opacity={cardOpacity}
              _hover={{
                bg: snapshot.isDragging ? "rgba(44, 49, 60, 0.95)" : "rgba(52, 58, 70, 0.95)",
                cursor: isAdmin && (!player.isPreview) ? "grab" : "default",
                boxShadow: snapshot.isDragging ? "none" : `0 0 10px ${classColor}20`,
                borderColor: player.isPreview 
                  ? (player.matchedPlayerId ? "green.400" : "gray.400") 
                  : `${classColor}50`,
                transform: snapshot.isDragging ? "scale(1)" : "translateY(-1px)"
              }}
              transition={snapshot.isDragging ? "none" : "all 0.2s ease"}
            >
              <HStack spacing={2} justify="space-between" width="100%">
                <HStack spacing={2}>
                  {player.characterClass && player.characterClass !== 'Absence' && player.characterClass !== 'Tentative' && (
                    <Box
                      position="relative"
                      padding="1px"
                      borderRadius="full"
                      background={getClassGradient(player.characterClass)}
                      boxShadow={snapshot.isDragging ? "none" : `0 0 8px ${classColor}80`}
                      transition="all 0.2s ease"
                    >
                      <Image
                        src={classIcon}
                        alt={player.characterClass}
                        boxSize="20px"
                        objectFit="cover"
                        borderRadius="full"
                        bg={classColor}
                      />
                    </Box>
                  )}
                  <Text 
                    color={isInRaidGroup && player.isPreview 
                      ? (player.matchedPlayerId ? "green.300" : "red.300")
                      : "white"
                    }
                    fontSize="sm" 
                    fontWeight="medium"
                    textShadow={snapshot.isDragging ? "none" : `0 0 8px ${classColor}80`}
                  >
                    {getDisplayName()}
                  </Text>
                </HStack>
                {player.characterClass === 'Tentative' ? (
                  <Text 
                    color="#FFDBBB"
                    fontSize="xs" 
                    textTransform="uppercase"
                  >
                    Tentative
                  </Text>
                ) : player.characterClass !== 'Absence' && (
                  <Text 
                    color={classColor}
                    fontSize="xs" 
                    textTransform="uppercase"
                    textShadow={snapshot.isDragging ? "none" : `0 0 8px ${classColor}80`}
                  >
                    {player.characterClass}
                  </Text>
                )}
              </HStack>
            </MenuButton>

            {isAdmin && (!isInRaidGroup || !player.isPreview) && (
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
                    {raidGroups.slice(0, 8).map(group => (
                      <MenuItem
                        key={group.id}
                        onClick={() => {
                          assignPlayerToGroup(player, group.id);
                          onMenuClose();
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
                        {group.name}
                      </MenuItem>
                    ))}
                  </SubMenu>
                  <SubMenu label="Raid 11-18">
                    {raidGroups.slice(8, 16).map(group => (
                      <MenuItem
                        key={group.id}
                        onClick={() => {
                          assignPlayerToGroup(player, group.id);
                          onMenuClose();
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
                        {group.name}
                      </MenuItem>
                    ))}
                  </SubMenu>
                </MenuList>
              </Portal>
            )}
          </Menu>

          {isInRaidGroup && player.isPreview && player.matchedPlayerId && (
            <Box 
              position="absolute"
              right="8px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={2000}
            >
              <Tooltip label="Click to assign player to this position" placement="top">
                <IconButton
                  icon={<ArrowForwardIcon />}
                  aria-label="Assign player"
                  size="xs"
                  variant="ghost"
                  color="green.500"
                  _hover={{ color: "green.400", transform: "scale(1.1)" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (player.matchedPlayerId && groupId && !assignedPlayers.has(player.matchedPlayerId)) {
                      // Only assign if the player is not already assigned somewhere
                      const playerToAssign = {
                        ...player,
                        characterId: player.matchedPlayerId,
                        isPreview: false
                      };
                      assignPlayerToGroup(playerToAssign, groupId, groupIndex);
                    } else {
                      console.log("Conditions not met:", {
                        hasMatchedId: !!player.matchedPlayerId,
                        hasGroupId: !!groupId,
                        isNotAssigned: !assignedPlayers.has(player.matchedPlayerId || '')
                      });
                    }
                  }}
                />
              </Tooltip>
            </Box>
          )}
        </Box>
      )}
    </Draggable>
  );
};

export const PlayerCard = memo(PlayerCardComponent, arePropsEqual); 