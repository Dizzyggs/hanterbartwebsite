import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
  Text,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Icon,
  Input,
  Select,
  useToast,
  Image,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { CheckIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import warriorIcon from '../assets/classes/warrior.png';
import paladinIcon from '../assets/classes/paladin.png';
import hunterIcon from '../assets/classes/hunter.png';
import rogueIcon from '../assets/classes/rogue.png';
import priestIcon from '../assets/classes/priest.png';
import mageIcon from '../assets/classes/mage.png';
import warlockIcon from '../assets/classes/warlock.png';
import druidIcon from '../assets/classes/druid.png';

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: () => Promise<void>;
}

const CharacterCreationModal = ({ isOpen, onClose, onCharacterCreated }: CharacterCreationModalProps) => {
  const { user } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [isMain, setIsMain] = useState('false');
  const [characterName, setCharacterName] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedRole, setSelectedRole] = useState('Tank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  const races = [
    'Human',
    'Gnome',
    'Dwarf',
    'Night Elf',
  ];

  const classes = [
    'Druid',
    'Hunter',
    'Mage',
    'Paladin',
    'Priest',
    'Rogue',
    'Warlock',
    'Warrior',
  ];

  const steps = [
    { title: 'Name', description: 'Step 1' },
    { title: 'Main', description: 'Step 2' },
    { title: 'Race', description: 'Step 3' },
    { title: 'Class', description: 'Step 4' },
    { title: 'Finish', description: 'Step 5' }
  ];

  const CLASS_ICONS: { [key: string]: string } = {
    'Warrior': warriorIcon,
    'Paladin': paladinIcon,
    'Hunter': hunterIcon,
    'Rogue': rogueIcon,
    'Priest': priestIcon,
    'Mage': mageIcon,
    'Warlock': warlockIcon,
    'Druid': druidIcon,
  };

  const handleCreateCharacter = async () => {
    console.log('Creating character...');
    
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to create a character.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.username);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const existingCharacters = userData.characters || [];
      
      // Check if trying to create a main character when one already exists
      if (isMain === 'true' && existingCharacters.some((char: any) => char.isMain)) {
        toast({
          title: 'Main Character Error',
          description: 'You already have a main character. Please unset your current main character before setting a new one.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsSubmitting(false);
        return;
      }

      const newCharacter = {
        id: `${user.username}-${characterName}-${Date.now()}`,
        name: characterName,
        isMain: isMain === 'true',
        race: selectedRace,
        class: selectedClass,
        level: 60,
        role: selectedRole,
        createdAt: new Date()
      };

      // If this is a main character, update existing main character
      if (isMain === 'true') {
        const updatedCharacters = existingCharacters.map((char: any) => ({
          ...char,
          isMain: false
        }));
        await updateDoc(userRef, {
          characters: [...updatedCharacters, newCharacter]
        });
      } else {
        // Add the new character to the array
        await updateDoc(userRef, {
          characters: arrayUnion(newCharacter)
        });
      }

      // Call the callback to refresh the character list
      await onCharacterCreated();

      toast({
        title: 'Character created!',
        description: `${characterName} has been added to your roster.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form and close modal
      setCharacterName('');
      setIsMain('false');
      setSelectedRace('');
      setSelectedClass('');
      setSelectedRole('Tank');
      setActiveStep(0);
      onClose();
    } catch (error) {
      console.error('Error creating character:', error);
      toast({
        title: 'Error creating character',
        description: 'There was an error creating your character. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleFromClass = (className: string): string => {
    const tankClasses = ['Warrior', 'Paladin', 'Death Knight'];
    const healerClasses = ['Priest', 'Paladin', 'Druid'];
    
    if (tankClasses.includes(className)) return 'Tank';
    if (healerClasses.includes(className)) return 'Healer';
    return 'DPS';
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleCreateCharacter();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const checkDuplicateName = async (name: string) => {
    if (!user) return false;
    
    try {
      const userRef = doc(db, 'users', user.username);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return false;

      const characters = userDoc.data().characters || [];
      return characters.some((char: any) => 
        char.name.toLowerCase() === name.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking duplicate name:', error);
      return false;
    }
  };

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCharacterName(newName);
    setNameError('');

    if (newName.length >= 2) {
      const isDuplicate = await checkDuplicateName(newName);
      if (isDuplicate) {
        setNameError('A character with this name already exists');
      }
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return characterName.length >= 2 && !nameError;
      case 1:
        return isMain === 'true' || isMain === 'false';
      case 2:
        return selectedRace !== '';
      case 3:
        return selectedClass !== '';
      case 4:
        return selectedRole !== '';
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <FormControl isRequired isInvalid={!!nameError}>
            <FormLabel color="#E2E8F0" fontSize="lg" mb={4}>
              Karaktärsnamn
            </FormLabel>
            <Input
              value={characterName}
              onChange={handleNameChange}
              placeholder="Ange karaktärsnamn"
              minLength={2}
              size="lg"
              bg="#1A202C"
              border="1px solid"
              borderColor="#4A5568"
              color="#E2E8F0"
              _placeholder={{ color: '#4A5568' }}
              _hover={{ borderColor: '#63B3ED' }}
              _focus={{ 
                borderColor: '#63B3ED',
                boxShadow: '0 0 0 1px #63B3ED'
              }}
            />
            {nameError && (
              <Text color="red.500" fontSize="sm" mt={2}>
                {nameError}
              </Text>
            )}
          </FormControl>
        );
      case 1:
        return (
          <FormControl>
            <FormLabel color="#E2E8F0" fontSize="lg" mb={4}>
              Är detta din huvudkaraktär?
            </FormLabel>
            <RadioGroup value={isMain} onChange={setIsMain}>
              <Stack direction="row" spacing={8}>
                <Radio 
                  value="true" 
                  colorScheme="blue"
                  size="lg"
                  _checked={{
                    bg: 'blue.500',
                    borderColor: 'blue.500'
                  }}
                >
                  <Text color="#E2E8F0" fontSize="md">Ja</Text>
                </Radio>
                <Radio 
                  value="false" 
                  colorScheme="blue"
                  size="lg"
                  _checked={{
                    bg: 'blue.500',
                    borderColor: 'blue.500'
                  }}
                >
                  <Text color="#E2E8F0" fontSize="md">Nej</Text>
                </Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        );
      case 2:
        return (
          <FormControl>
            <FormLabel color="#E2E8F0" fontSize="lg" mb={4}>
              Välj din karaktärs race
            </FormLabel>
            <Select
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              placeholder="Välj en race"
              size="lg"
              bg="#1A202C"
              border="1px solid"
              borderColor="#4A5568"
              color="#E2E8F0"
              _placeholder={{ color: '#4A5568' }}
              _hover={{ borderColor: '#63B3ED' }}
              _focus={{ 
                borderColor: '#63B3ED',
                boxShadow: '0 0 0 1px #63B3ED'
              }}
            >
              {races.map((race) => (
                <option key={race} value={race} style={{ backgroundColor: '#1A202C' }}>
                  {race}
                </option>
              ))}
            </Select>
          </FormControl>
        );
      case 3:
        return (
          <FormControl>
            <FormLabel color="#E2E8F0" fontSize="lg" mb={4}>
              Välj din karaktärs klass
            </FormLabel>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                w="100%"
                size="lg"
                bg="#1A202C"
                border="1px solid"
                borderColor="#4A5568"
                color={selectedClass ? "#E2E8F0" : "#4A5568"}
                _hover={{ borderColor: '#63B3ED' }}
                _expanded={{ borderColor: '#63B3ED', boxShadow: '0 0 0 1px #63B3ED' }}
                mb={6}
              >
                <Flex align="center">
                  {selectedClass && (
                    <Image
                      src={CLASS_ICONS[selectedClass]}
                      alt={selectedClass}
                      boxSize="24px"
                      objectFit="contain"
                      mr={2}
                    />
                  )}
                  {selectedClass || "Välj en klass"}
                </Flex>
              </MenuButton>
              <MenuList bg="#1A202C" borderColor="#4A5568">
                {classes.map((className) => (
                  <MenuItem
                    key={className}
                    onClick={() => setSelectedClass(className)}
                    bg="#1A202C"
                    _hover={{ bg: '#2D3748' }}
                  >
                    <Flex align="center">
                      <Image
                        src={CLASS_ICONS[className]}
                        alt={className}
                        boxSize="24px"
                        objectFit="contain"
                        mr={2}
                      />
                      <Text color="#E2E8F0">{className}</Text>
                    </Flex>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </FormControl>
        );
      case 4:
        return (
          <FormControl>
            <FormLabel color="#E2E8F0" fontSize="lg" mb={4}>
              Välj din roll
            </FormLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              placeholder="Välj en roll"
              size="lg"
              bg="#1A202C"
              border="1px solid"
              borderColor="#4A5568"
              color="#E2E8F0"
              _placeholder={{ color: '#4A5568' }}
              _hover={{ borderColor: '#63B3ED' }}
              _focus={{ 
                borderColor: '#63B3ED',
                boxShadow: '0 0 0 1px #63B3ED'
              }}
            >
              <option value="Tank" style={{ backgroundColor: '#1A202C' }}>Tank</option>
              <option value="Healer" style={{ backgroundColor: '#1A202C' }}>Healer</option>
              <option value="DPS" style={{ backgroundColor: '#1A202C' }}>DPS</option>
            </Select>
          </FormControl>
        );
      case 5:
        return (
          <Box>
            <Text color="#E2E8F0" fontSize="lg" mb={4}>Granska din karaktär</Text>
            <Stack spacing={3}>
              <Text color="#E2E8F0">Namn: {characterName}</Text>
              <Text color="#E2E8F0">Huvudkaraktär: {isMain === 'true' ? 'Ja' : 'Nej'}</Text>
              <Text color="#E2E8F0">Ras: {selectedRace}</Text>
              <Text color="#E2E8F0">Klass: {selectedClass}</Text>
              <Text color="#E2E8F0">Roll: {selectedRole}</Text>
            </Stack>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="#1A202C" maxW="800px">
        <ModalCloseButton color="#E2E8F0" />
        <ModalHeader color="#E2E8F0" fontSize="2xl" pb={6}>Create New Character</ModalHeader>
        <ModalBody>
          <Box mb={8}>
            <Stepper 
              index={activeStep} 
              colorScheme="blue" 
              gap={0}
              size="lg"
              width="100%"
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator
                    boxSize={8}
                    bg={activeStep > index ? 'blue.500' : activeStep === index ? 'blue.500' : '#2D3748'}
                  >
                    <StepStatus
                      complete={<Icon as={CheckIcon} boxSize={5} color="white" />}
                      incomplete={<StepNumber fontSize="lg" />}
                      active={<StepNumber fontSize="lg" />}
                    />
                  </StepIndicator>

                  <Box flexShrink={0} minW="120px">
                    <StepTitle
                      color="#E2E8F0"
                      fontSize="md"
                      fontWeight="semibold"
                      whiteSpace="nowrap"
                    >
                      {step.title}
                    </StepTitle>
                    <StepDescription
                      color="#A0AEC0"
                      fontSize="xs"
                      whiteSpace="nowrap"
                    >
                      {step.description}
                    </StepDescription>
                  </Box>

                  <StepSeparator 
                    bg={activeStep >= index ? 'blue.500' : '#2D3748'} 
                    _horizontal={{ ml: 0 }}
                  />
                </Step>
              ))}
            </Stepper>
          </Box>

          <Box p={4} bg="#2D3748" borderRadius="md">
            {renderStepContent()}
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleBack}
            isDisabled={activeStep === 0 || isSubmitting}
            color="#E2E8F0"
            _hover={{ bg: '#2D3748' }}
            size="lg"
          >
            Back
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleNext}
            isDisabled={!isStepValid() || isSubmitting}
            size="lg"
            isLoading={isSubmitting && activeStep === steps.length - 1}
          >
            {activeStep === steps.length - 1 ? 'Create Character' : 'Next'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CharacterCreationModal; 
