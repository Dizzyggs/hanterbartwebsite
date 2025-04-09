import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';

const CharacterCreation = () => {
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Firebase character creation
    toast({
      title: 'Character creation coming soon',
      status: 'info',
    });
  };

  return (
    <Container maxW="md" py={8}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="md">
        <Stack spacing={4} as="form" onSubmit={handleSubmit}>
          <Heading size="lg" textAlign="center" fontFamily="Cinzel">
            Create Character
          </Heading>

          <FormControl isRequired>
            <FormLabel>Character Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter character name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Class</FormLabel>
            <Select
              value={characterClass}
              onChange={(e) => setCharacterClass(e.target.value)}
              placeholder="Select class"
            >
              <option value="Warrior">Warrior</option>
              <option value="Paladin">Paladin</option>
              <option value="Hunter">Hunter</option>
              <option value="Rogue">Rogue</option>
              <option value="Priest">Priest</option>
              <option value="Mage">Mage</option>
              <option value="Warlock">Warlock</option>
              <option value="Druid">Druid</option>
            </Select>
          </FormControl>

          <Button type="submit" colorScheme="blue">
            Create Character
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default CharacterCreation; 