import { Box, HStack, VStack, Text, Badge, Image, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Portal, useDisclosure } from '@chakra-ui/react';
import { Draggable, DraggableProvided } from 'react-beautiful-dnd';
import { SignupPlayer } from '../types/event';
import { CLASS_ICONS, CLASS_COLORS, ClassIconType } from '../utils/classIcons';
import { SubMenu } from './SubMenu';
import { memo } from 'react';

interface PlayerCardProps {
  player: SignupPlayer;
  index: number;
  isMobile: boolean;
  isAdmin: boolean;
  event: any;
  raidGroups: any[];
  assignedPlayers: Set<string>;
  assignPlayerToGroup: (player: SignupPlayer, groupId: string) => void;
  unassignPlayer: (player: SignupPlayer) => void;
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
  unassignPlayer 
}: PlayerCardProps) => {


  const isAssigned = assignedPlayers.has(player.characterId);
  const classColor = getClassColor(player.characterClass || '');
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

  const getPlayerIcon = () => {
    console.log("xd", player);

    // Tank check
    if (player.characterRole === 'Tank') {
      return CLASS_ICONS.TANK;
    }

    // Fury Warrior check for Discord signups
    if (event.signupType === 'raidhelper' && player.spec === 'Fury') {
      console.log('Using Fury icon (Discord signup)');
      return CLASS_ICONS.FURY;
    }

    // Fury Warrior check for website signups
    if (player.characterClass === 'Warrior' && player.characterRole === 'DPS') {
      console.log('Using Fury icon (Website signup)');
      return CLASS_ICONS.FURY;
    }

    // Default class icon
    console.log('Using default class icon:', player.characterClass);
    return CLASS_ICONS[(player.characterClass || 'WARRIOR').toUpperCase() as ClassIconType];
  };

  const classIcon = getPlayerIcon();

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
      return player.discordNickname || player.characterName;
    }
    return player.characterName;
  };

  return (
    <Draggable 
      draggableId={player.characterId} 
      index={index}
      key={player.characterId}
      isDragDisabled={isMobile}
    >
      {(provided: DraggableProvided, snapshot) => (
        <Menu isOpen={isMenuOpen} onOpen={onMenuOpen} onClose={onMenuClose}>
          <MenuButton
            as={Box}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            bg="rgba(44, 49, 60, 0.95)"
            p={2}
            borderRadius="md"
            border="1px solid"
            borderColor={`${classColor}40`}
            _hover={{
              bg: snapshot.isDragging ? "rgba(44, 49, 60, 0.95)" : "rgba(52, 58, 70, 0.95)",
              cursor: isAdmin ? "grab" : "default",
              boxShadow: snapshot.isDragging ? "none" : `0 0 10px rgba(0, 0, 0, 0.3)`,
              borderColor: `${classColor}80`,
              transform: snapshot.isDragging ? "scale(1)" : "translateY(-1px)"
            }}
            transition={snapshot.isDragging ? "none" : "all 0.2s ease"}
            onClick={onMenuOpen}
            position="relative"
            _after={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "md",
              background: snapshot.isDragging ? "none" : `linear-gradient(45deg, ${classColor}22, transparent)`,
              pointerEvents: "none",
              opacity: 0.3,
              transition: "opacity 0.2s ease"
            }}
          >
            <HStack spacing={2} justify="space-between" width="100%">
              <HStack spacing={2}>
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
                  />
                </Box>
                <Text 
                  color="white" 
                  fontSize="sm" 
                  fontWeight="medium"
                  textShadow={snapshot.isDragging ? "none" : `0 0 8px ${classColor}80`}
                  transition="all 0.2s ease"
                >
                  {getDisplayName()}
                </Text>
              </HStack>
              <Text 
                color={classColor} 
                fontSize="xs" 
                textTransform="uppercase"
                textShadow={snapshot.isDragging ? "none" : `0 0 8px ${classColor}80`}
                transition="all 0.2s ease"
              >
                {player.characterClass}
              </Text>
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

export const PlayerCard = memo(PlayerCardComponent, arePropsEqual); 