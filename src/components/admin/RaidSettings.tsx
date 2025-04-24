import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Button,
  Icon,
  HStack,
  Divider,
  FormControl,
  FormLabel,
  Switch,
  Input,
  Select,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useUser } from '../../context/UserContext';
import Breadcrumbs from '../Breadcrumbs';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { RaidTemplate, RosterTemplate } from '../../types/firebase';
import { getAuth } from 'firebase/auth';
import RosterTemplateModal from '../RosterTemplateModal';

type TemplateType = 'raid' | 'roster';
type Template = RaidTemplate | RosterTemplate;

const RaidSettings = () => {
  const { user } = useUser();
  const toast = useToast();
  const { isOpen: isRaidTemplateOpen, onOpen: onRaidTemplateOpen, onClose: onRaidTemplateClose } = useDisclosure();
  const { isOpen: isRosterTemplateOpen, onOpen: onRosterTemplateOpen, onClose: onRosterTemplateClose } = useDisclosure();
  const { isOpen: isRaidOpen, onOpen: onRaidOpen, onClose: onRaidClose } = useDisclosure();
  const { isOpen: isRosterOpen, onOpen: onRosterOpen, onClose: onRosterClose } = useDisclosure();
  const auth = getAuth();
  const authUser = auth.currentUser;

  const [raidTemplates, setRaidTemplates] = useState<RaidTemplate[]>([]);
  const [rosterTemplates, setRosterTemplates] = useState<RosterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RosterTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [defaultRaidTime, setDefaultRaidTime] = useState("19:30");
  const [defaultReoccurrence, setDefaultReoccurrence] = useState("1");
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  // Form states
  const [newRaidTemplate, setNewRaidTemplate] = useState<RaidTemplate>({
    id: '',
    name: '',
    size: 25,
    duration: 180,
    roles: { tank: 2, healer: 5, dps: 18 },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: '',
  });
  
  const [newRosterTemplate, setNewRosterTemplate] = useState<RosterTemplate>({
    id: '',
    name: '',
    groupData: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: '',
  });

  // Load both settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'raid'));
        const settings = settingsDoc.data();
        if (settings?.defaultRaidTime) {
          setDefaultRaidTime(settings.defaultRaidTime);
        }
        if (settings?.defaultReoccurrence) {
          setDefaultReoccurrence(settings.defaultReoccurrence);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save all settings
  const handleSaveSettings = async () => {
    setIsSettingsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'raid'), {
        defaultRaidTime,
        defaultReoccurrence
      }, { merge: true });

      toast({
        title: 'Settings saved',
        description: 'Raid settings have been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // Load raid templates
      const raidSnap = await getDocs(collection(db, 'raidTemplates'));
      const raidData = raidSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as RaidTemplate));
      setRaidTemplates(raidData);

      // Load roster templates
      const rosterSnap = await getDocs(collection(db, 'rosterTemplates'));
      const rosterData = rosterSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as RosterTemplate));
      setRosterTemplates(rosterData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateRaidTemplate = async () => {
    try {
      setIsLoading(true);
      await addDoc(collection(db, 'raidTemplates'), {
        ...newRaidTemplate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: authUser?.uid || '',
      });
      toast({
        title: 'Success',
        description: 'Raid template created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onRaidClose();
      setNewRaidTemplate({
        id: '',
        name: '',
        size: 25,
        duration: 180,
        roles: { tank: 2, healer: 5, dps: 18 },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: '',
      });
      await loadTemplates();
    } catch (error) {
      console.error('Error creating raid template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create raid template',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = (template: RosterTemplate) => {
    setSelectedTemplate(template);
    setIsRosterModalOpen(true);
  };

  const handleCreateRosterTemplate = async (template: RosterTemplate) => {
    try {
      setIsLoading(true);
      
      if (selectedTemplate) {
        // Update existing template
        await updateDoc(doc(db, 'rosterTemplates', selectedTemplate.id), {
          name: template.name,
          groupData: template.groupData,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Template updated',
          description: 'Successfully updated roster template',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new template
        await addDoc(collection(db, 'rosterTemplates'), {
          name: template.name,
          groupData: template.groupData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: authUser?.uid || ''
        });

        toast({
          title: 'Template created',
          description: 'Successfully created new roster template',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onRosterClose();
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (error) {
      console.error('Error saving roster template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save roster template',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setIsRosterModalOpen(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, type: TemplateType) => {
    try {
      await deleteDoc(doc(db, `${type}Templates`, templateId));
      toast({
        title: 'Template deleted',
        description: 'Successfully deleted template',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Breadcrumbs />
      <Box
        bg="background.secondary"
        borderRadius="lg"
        p={6}
        boxShadow="xl"
      >
        <VStack spacing={6} align="stretch">
          <Heading size="lg" color="white">
            Raid Settings
          </Heading>
          
          <Tabs variant="unstyled">
            <TabList borderBottom="2px solid" borderColor="border.primary">
              <Tab 
                color="text.secondary"
                px={4}
                py={2}
                _focus={{ 
                  boxShadow: 'none',
                  outline: 'none'
                }}
                _selected={{ 
                  color: 'white',
                  position: 'relative',
                  fontWeight: 'semibold',
                  _after: {
                    content: '""',
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    bgGradient: 'linear(to-r, blue.400, purple.400)',
                    borderRadius: '1px'
                  }
                }}
                _hover={{
                  color: 'text.primary'
                }}
              >
                Roster Templates
              </Tab>
              <Tab 
                color="text.secondary"
                px={4}
                py={2}
                _focus={{ 
                  boxShadow: 'none',
                  outline: 'none'
                }}
                _selected={{ 
                  color: 'white',
                  position: 'relative',
                  fontWeight: 'semibold',
                  _after: {
                    content: '""',
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    bgGradient: 'linear(to-r, blue.400, purple.400)',
                    borderRadius: '1px'
                  }
                }}
                _hover={{
                  color: 'text.primary'
                }}
              >
                Misc Settings
              </Tab>
            </TabList>

            <TabPanels>
              

              {/* Roster Templates Tab */}
              <TabPanel pt={6}>
                <VStack spacing={6} align="stretch">
                  <HStack justify="space-between" mb={2}>
                    <Heading size="md" color="white">
                      Roster Templates
                    </Heading>
                    <Button
                      leftIcon={<AddIcon />}
                      bgGradient="linear(to-r, blue.400, purple.400)"
                      color="white"
                      _hover={{
                        bgGradient: "linear(to-r, blue.500, purple.500)",
                      }}
                      _active={{
                        bgGradient: "linear(to-r, blue.600, purple.600)",
                      }}
                      onClick={onRosterOpen}
                    >
                      New Template
                    </Button>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {rosterTemplates?.map((template: RosterTemplate) => (
                      <Card 
                        key={template.id} 
                        bg="background.tertiary"
                        borderRadius="xl"
                        overflow="hidden"
                        position="relative"
                        _before={{
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          bgGradient: 'linear(to-r, blue.400, purple.400)'
                        }}
                      >
                        <CardHeader>
                          <HStack justify="space-between">
                            <Heading size="sm" color="white">{template.name}</Heading>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit template"
                                icon={<EditIcon />}
                                size="sm"
                                variant="ghost"
                                color="blue.400"
                                _hover={{ 
                                  bg: 'whiteAlpha.200',
                                  color: 'blue.300'
                                }}
                                onClick={() => handleEditTemplate(template)}
                              />
                              <IconButton
                                aria-label="Delete template"
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                color="red.400"
                                _hover={{ 
                                  bg: 'whiteAlpha.200',
                                  color: 'red.300'
                                }}
                                onClick={() => handleDeleteTemplate(template.id, 'roster')}
                              />
                            </HStack>
                          </HStack>
                        </CardHeader>
                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between" bg="whiteAlpha.50" p={2} borderRadius="md">
                              <Text fontSize="sm" color="text.secondary">Groups</Text>
                              <Text fontSize="sm" color="white">{template.groupData?.length || 0}</Text>
                            </HStack>
                            <HStack justify="space-between" bg="whiteAlpha.50" p={2} borderRadius="md">
                              <Text fontSize="sm" color="text.secondary">Total Players</Text>
                              <Text fontSize="sm" color="white">{template.groupData?.reduce((acc, group) => acc + group.players.length, 0) || 0}</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </VStack>
              </TabPanel>

              {/* Misc Settings Tab */}
              <TabPanel pt={6}>
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color="white">
                    Misc Settings
                  </Heading>
                  
                  <Card 
                    bg="background.tertiary"
                    borderRadius="xl"
                    overflow="hidden"
                    position="relative"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      bgGradient: 'linear(to-r, blue.400, purple.400)'
                    }}
                  >
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel color="text.secondary" fontSize="sm">Default raid time</FormLabel>
                          <Input
                            type="time"
                            value={defaultRaidTime}
                            onChange={(e) => setDefaultRaidTime(e.target.value)}
                            bg="background.tertiary"
                            color="text.primary"
                            _hover={{ borderColor: 'border.active' }}
                            sx={{
                              '&::-webkit-calendar-picker-indicator': {
                                filter: 'invert(1)',
                                cursor: 'pointer'
                              }
                            }}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel color="text.secondary" fontSize="sm">Default reoccurrence (weeks)</FormLabel>
                          <Select 
                            bg="whiteAlpha.50"
                            color="white"
                            borderColor="transparent"
                            _hover={{
                              borderColor: "whiteAlpha.300"
                            }}
                            _focus={{
                              borderColor: "blue.400",
                              boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)"
                            }}
                            value={defaultReoccurrence}
                            onChange={(e) => setDefaultReoccurrence(e.target.value)}
                            sx={{
                              option: {
                                bg: "background.secondary !important",
                                color: "white !important",
                                _hover: {
                                  bg: "whiteAlpha.200 !important"
                                }
                              }
                            }}
                          >
                            <option value="1" style={{ backgroundColor: "var(--chakra-colors-background-secondary)" }}>1 week</option>
                            <option value="2" style={{ backgroundColor: "var(--chakra-colors-background-secondary)" }}>2 weeks</option>
                            <option value="3" style={{ backgroundColor: "var(--chakra-colors-background-secondary)" }}>3 weeks</option>
                            <option value="4" style={{ backgroundColor: "var(--chakra-colors-background-secondary)" }}>4 weeks</option>
                          </Select>
                        </FormControl>

                        <Button
                          colorScheme="blue"
                          onClick={handleSaveSettings}
                          isLoading={isSettingsSaving}
                          bgGradient="linear(to-r, blue.400, purple.400)"
                          _hover={{
                            bgGradient: "linear(to-r, blue.500, purple.500)",
                          }}
                          _active={{
                            bgGradient: "linear(to-r, blue.600, purple.600)",
                          }}
                        >
                          Save Settings
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>

      {/* Raid Template Modal */}
      <Modal isOpen={isRaidOpen} onClose={onRaidClose}>
        <ModalOverlay />
        <ModalContent bg="background.secondary" color="white">
          <ModalHeader>Create Raid Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Template Name</FormLabel>
                <Input
                  value={newRaidTemplate.name}
                  onChange={(e) => setNewRaidTemplate({...newRaidTemplate, name: e.target.value})}
                  bg="background.tertiary"
                  borderColor="blue.500"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Raid Size</FormLabel>
                <NumberInput
                  value={newRaidTemplate.size}
                  onChange={(_, value) => setNewRaidTemplate({...newRaidTemplate, size: value})}
                  min={10}
                  max={40}
                >
                  <NumberInputField bg="background.tertiary" borderColor="blue.500" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Duration (minutes)</FormLabel>
                <NumberInput
                  value={newRaidTemplate.duration}
                  onChange={(_, value) => setNewRaidTemplate({...newRaidTemplate, duration: value})}
                  min={1}
                  max={8}
                >
                  <NumberInputField bg="background.tertiary" borderColor="blue.500" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Tanks</FormLabel>
                <NumberInput
                  value={newRaidTemplate.roles?.tank}
                  onChange={(_, value) => setNewRaidTemplate({
                    ...newRaidTemplate,
                    roles: {...newRaidTemplate.roles, tank: value}
                  })}
                  min={1}
                  max={4}
                >
                  <NumberInputField bg="background.tertiary" borderColor="blue.500" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Healers</FormLabel>
                <NumberInput
                  value={newRaidTemplate.roles?.healer}
                  onChange={(_, value) => setNewRaidTemplate({
                    ...newRaidTemplate,
                    roles: {...newRaidTemplate.roles, healer: value}
                  })}
                  min={1}
                  max={10}
                >
                  <NumberInputField bg="background.tertiary" borderColor="blue.500" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>DPS</FormLabel>
                <NumberInput
                  value={newRaidTemplate.roles?.dps}
                  onChange={(_, value) => setNewRaidTemplate({
                    ...newRaidTemplate,
                    roles: {...newRaidTemplate.roles, dps: value}
                  })}
                  min={1}
                  max={30}
                >
                  <NumberInputField bg="background.tertiary" borderColor="blue.500" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRaidClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateRaidTemplate}
              isLoading={isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Roster Template Modal */}
      <Modal isOpen={isRosterOpen} onClose={onRosterClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="background.secondary" color="white">
          <ModalHeader>Create Roster Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Template Name</FormLabel>
                <Input
                  value={newRosterTemplate.name}
                  onChange={(e) => setNewRosterTemplate({...newRosterTemplate, name: e.target.value})}
                  bg="background.tertiary"
                  borderColor="blue.500"
                />
              </FormControl>
              {/* Additional fields for roster template will be added here */}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRosterClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                const templateName = newRosterTemplate.name;
                setIsRosterModalOpen(true);
                onRosterClose();
                setNewRosterTemplate(prev => ({
                  ...prev,
                  name: templateName
                }));
              }}
              isLoading={isLoading}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Roster Template Modal */}
      <RosterTemplateModal
        isOpen={isRosterModalOpen}
        onClose={() => {
          setIsRosterModalOpen(false);
          setSelectedTemplate(null);
          setNewRosterTemplate({
            id: '',
            name: '',
            groupData: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            createdBy: '',
          });
        }}
        onTemplateSave={handleCreateRosterTemplate}
        initialTemplate={selectedTemplate || undefined}
        initialTemplateName={selectedTemplate?.name || newRosterTemplate.name || ''}
      />
    </Container>
  );
};

export default RaidSettings; 