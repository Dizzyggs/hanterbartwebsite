import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
  Flex,
  Checkbox,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import type { Character } from '../types/firebase';

interface CharacterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onCharacterUpdated: () => Promise<void>;
}

const CharacterEditModal = ({ isOpen, onClose, character, onCharacterUpdated }: CharacterEditModalProps) => {
  const { user, login } = useUser();
  const [characterName, setCharacterName] = useState(character.name);
  const [selectedClass, setSelectedClass] = useState(character.class);
  const [selectedRole, setSelectedRole] = useState(character.role);
  const [isMain, setIsMain] = useState(character.isMain);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  const classes = [
    'Warrior',
    'Paladin',
    'Hunter',
    'Rogue',
    'Priest',
    'Mage',
    'Warlock',
    'Druid',
  ];

  const handleUpdateCharacter = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.username);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      let updatedCharacters = userData.characters.map((char: Character) => {
        if (char.id === character.id) {
          return {
            ...char,
            name: characterName,
            class: selectedClass,
            role: selectedRole,
            isMain: isMain,
          };
        }
        // If this character is not being edited but the current character is being set as main,
        // ensure other characters are not main
        if (isMain) {
          return {
            ...char,
            isMain: false
          };
        }
        return char;
      });

      await updateDoc(userRef, {
        characters: updatedCharacters
      });

      // Update the user context
      if (user) {
        login({
          ...user,
          characters: updatedCharacters
        });
      }

      await onCharacterUpdated();

      toast({
        title: 'Character updated!',
        description: `${characterName} has been updated successfully.`,
        status: 'success',
      });

      onClose();
    } catch (error) {
      console.error('Error updating character:', error);
      toast({
        title: 'Error updating character',
        description: 'There was an error updating your character. Please try again.',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="#1A202C">
        <ModalHeader color="#E2E8F0">Edit Character</ModalHeader>
        <ModalCloseButton color="#E2E8F0" />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel color="#E2E8F0">Character Name</FormLabel>
              <Input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                bg="#2D3748"
                border="1px solid"
                borderColor="#4A5568"
                color="#E2E8F0"
                _hover={{ borderColor: "#63B3ED" }}
                _focus={{ 
                  borderColor: "#63B3ED",
                  boxShadow: "0 0 0 1px #63B3ED"
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="#E2E8F0">Class</FormLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                bg="#2D3748"
                border="1px solid"
                borderColor="#4A5568"
                color="#E2E8F0"
                _hover={{ borderColor: "#63B3ED" }}
                _focus={{ 
                  borderColor: "#63B3ED",
                  boxShadow: "0 0 0 1px #63B3ED"
                }}
              >
                {classes.map((className) => (
                  <option key={className} value={className} style={{ backgroundColor: '#2D3748' }}>
                    {className}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color="#E2E8F0">Role</FormLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'Tank' | 'Healer' | 'DPS')}
                bg="#2D3748"
                border="1px solid"
                borderColor="#4A5568"
                color="#E2E8F0"
                _hover={{ borderColor: "#63B3ED" }}
                _focus={{ 
                  borderColor: "#63B3ED",
                  boxShadow: "0 0 0 1px #63B3ED"
                }}
              >
                <option value="Tank" style={{ backgroundColor: '#2D3748' }}>Tank</option>
                <option value="Healer" style={{ backgroundColor: '#2D3748' }}>Healer</option>
                <option value="DPS" style={{ backgroundColor: '#2D3748' }}>DPS</option>
              </Select>
            </FormControl>

            <FormControl>
              <Flex align="center">
                <Checkbox
                  isChecked={isMain}
                  onChange={(e) => setIsMain(e.target.checked)}
                  colorScheme="blue"
                  size="lg"
                >
                  <Text color="#E2E8F0">Main Character</Text>
                </Checkbox>
              </Flex>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            color="#E2E8F0"
            _hover={{ bg: '#2D3748' }}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleUpdateCharacter}
            isLoading={isSubmitting}
            loadingText="Updating..."
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CharacterEditModal; 