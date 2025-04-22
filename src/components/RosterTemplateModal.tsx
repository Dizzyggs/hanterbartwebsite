import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Input,
  Heading,
  Box,
  Text,
  Select,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { RosterTemplateGroup, RosterTemplate, RosterTemplatePlayer } from '../types/firebase';
import { CLASS_COLORS, ClassIconType, CLASS_ICONS } from '../utils/classIcons';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface RosterTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSave?: (template: RosterTemplate) => void;
  initialTemplateName?: string;
  initialTemplate?: RosterTemplate;
}

const RosterTemplateModal: React.FC<RosterTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateSave,
  initialTemplateName = '',
  initialTemplate
}) => {
  const [groups, setGroups] = useState<RosterTemplateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Initialize groups from template or create empty groups
  useEffect(() => {
    if (!isOpen) return;
    
    if (initialTemplate) {
      setGroups(initialTemplate.groupData);
      setTemplateName(initialTemplate.name);
    } else {
      const initialGroups: RosterTemplateGroup[] = Array.from({ length: 8 }, (_, i) => ({
        id: `group-${i + 1}`,
        name: `Group ${i + 1}`,
        players: Array.from({ length: 5 }, () => ({
          name: '',
          class: '',
          role: ''
        }))
      }));
      setGroups(initialGroups);
      setTemplateName(initialTemplateName);
    }
  }, [isOpen]); // Only run when modal opens

  const handleSave = () => {
    if (onTemplateSave) {
      const template: RosterTemplate = {
        id: initialTemplate?.id || '', // Preserve ID if editing
        name: templateName,
        groupData: groups,
        createdAt: initialTemplate?.createdAt || null as any,
        updatedAt: null as any, // This will be set by Firebase
        createdBy: initialTemplate?.createdBy || '' // Preserve creator if editing
      };
      onTemplateSave(template);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent bg="background.secondary">
        <ModalHeader color="white">
          <HStack justify="space-between">
            <Text>{initialTemplate ? 'Edit' : 'Create'} Roster Template</Text>
              <Input
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              width="300px"
                bg="background.tertiary"
                color="white"
              _placeholder={{ color: 'whiteAlpha.500' }}
              />
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <SimpleGrid columns={4} spacing={4}>
          {groups.map((group, groupIndex) => (
              <Box key={group.id}>
                <Heading size="sm" color="white" mb={3}>
                  {group.name}
                </Heading>
                <VStack spacing={2} align="stretch">
                {group.players.map((player, playerIndex) => (
                  <Box
                    key={playerIndex}
                    p={2}
                    bg="background.tertiary"
                    borderRadius="md"
                    borderWidth="1px"
                      borderColor="border.primary"
                    >
                      <Input
                        placeholder="Player name"
                        size="sm"
                        mb={2}
                        value={player.name}
                        onChange={(e) => {
                          const newGroups = [...groups];
                          newGroups[groupIndex].players[playerIndex] = {
                            ...player,
                            name: e.target.value
                          };
                          setGroups(newGroups);
                        }}
                        bg="whiteAlpha.50"
                        color={player.class ? CLASS_COLORS[player.class.toUpperCase() as ClassIconType] : 'white'}
                        _placeholder={{ color: 'whiteAlpha.500' }}
                      />
                      <HStack spacing={2}>
                        <Select
                          size="sm"
                          value={player.role}
                          onChange={(e) => {
                            const newGroups = [...groups];
                            newGroups[groupIndex].players[playerIndex] = {
                              ...player,
                              role: e.target.value
                            };
                            setGroups(newGroups);
                          }}
                          bg="transparent"
                          color="whiteAlpha.600"
                          _hover={{ borderColor: 'whiteAlpha.200' }}
                          borderColor="transparent"
                          _focus={{ borderColor: 'whiteAlpha.300' }}
                          fontSize="xs"
                          sx={{
                            option: {
                              bg: 'background.secondary !important',
                              color: 'white !important'
                            },
                            '&[data-hover]': {
                              bg: 'background.tertiary'
                            }
                          }}
                        >
                          <option value="">Role</option>
                          <option value="Tank">Tank</option>
                          <option value="Healer">Healer</option>
                          <option value="DPS">DPS</option>
                        </Select>
                        <Menu>
                          <MenuButton
                            as={Button}
                            size="sm"
                            rightIcon={<ChevronDownIcon />}
                            bg="transparent"
                            color="whiteAlpha.600"
                            _hover={{ bg: 'whiteAlpha.50' }}
                            _active={{ bg: 'whiteAlpha.100' }}
                            fontSize="xs"
                            h="32px"
                            minW="120px"
                            textAlign="left"
                          >
                            {player.class ? (
                              <HStack spacing={2}>
                                <Image 
                                  src={CLASS_ICONS[player.class.toUpperCase() as ClassIconType]} 
                                  boxSize="16px"
                                  objectFit="contain"
                                />
                                <Text>{player.class}</Text>
                              </HStack>
                            ) : (
                              'Class'
                            )}
                          </MenuButton>
                          <MenuList
                            bg="background.secondary"
                            borderColor="whiteAlpha.200"
                            minW="120px"
                          >
                            {Object.entries(CLASS_ICONS).map(([className, iconPath]) => (
                              <MenuItem
                                key={className}
                                onClick={() => {
                                  const newGroups = [...groups];
                                  newGroups[groupIndex].players[playerIndex] = {
                                    ...player,
                                    class: className.toLowerCase()
                                  };
                                  setGroups(newGroups);
                                }}
                                bg="background.secondary"
                                color="white"
                                _hover={{
                                  bg: 'whiteAlpha.200',
                                }}
                                _focus={{
                                  bg: 'whiteAlpha.200',
                                }}
                                _active={{
                                  bg: 'whiteAlpha.300',
                                }}
                              >
                                <HStack spacing={2}>
                                  <Image 
                                    src={iconPath} 
                                    boxSize="16px"
                                    objectFit="contain"
                                  />
                                  <Text>{className.charAt(0) + className.slice(1).toLowerCase()}</Text>
                    </HStack>
                              </MenuItem>
                ))}
                          </MenuList>
                        </Menu>
                      </HStack>
            </Box>
          ))}
                </VStack>
                  </Box>
                ))}
              </SimpleGrid>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} color="white">
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={isLoading}>
            {initialTemplate ? 'Save Changes' : 'Save Template'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RosterTemplateModal; 