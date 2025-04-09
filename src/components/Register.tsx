import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  InputGroup,
  InputRightElement,
  IconButton,
  FormErrorMessage,
  Heading,
  Stack,
  ScaleFade,
} from '@chakra-ui/react';
import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/firebase';
import { useUser } from '../context/UserContext';
import { ViewIcon, ViewOffIcon, AddIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });
  const navigate = useNavigate();
  const { login } = useUser();

  const validateForm = () => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!username.trim()) {
      setUsernameError('Användarnamn krävs');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Användarnamnet måste vara minst 3 tecken');
      isValid = false;
    } else if (username.length > 20) {
      setUsernameError('Användarnamnet får inte vara längre än 20 tecken');
      isValid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setUsernameError('Användarnamnet kan bara innehålla bokstäver och siffror');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Lösenord krävs');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Lösenordet måste vara minst 6 tecken');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Bekräfta lösenordet');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Lösenorden matchar inte');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUsernameError('Användarnamnet är upptaget');
        setIsLoading(false);
        return;
      }

      // Create new user document
      const newUser: User = {
        id: username.toLowerCase(),
        username: username.toLowerCase(),
        email: '',
        password,
        role: 'member',
        characters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };

      await setDoc(doc(usersRef, username.toLowerCase()), newUser);
      
      // Log in the user after successful registration
      login(newUser);

      toast({
        title: 'Konto skapat!',
        description: 'Välkommen till Hanterbart!',
        status: 'success',
      });
      navigate('/profile');
    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: 'Registrering misslyckades',
        description: error instanceof Error ? error.message : 'Ett fel uppstod under registreringen',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      minH="calc(100vh - 4rem)" 
      bg="#171923" 
      pt={20}
      display="flex" 
      alignItems="flex-start"
      backgroundImage="radial-gradient(circle at center, #2D3748 0%, #171923 100%)"
    >
      <Container maxW="container.sm">
        <ScaleFade initialScale={0.9} in={true}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            bg="#1A202C"
            p={8}
            borderRadius="xl"
            boxShadow="dark-lg"
            border="1px solid"
            borderColor="whiteAlpha.200"
            position="relative"
            overflow="hidden"
          >
            {/* Decorative background elements */}
            <Box
              position="absolute"
              top="-20%"
              left="-20%"
              width="140%"
              height="140%"
              bg="blue.500"
              opacity={0.03}
              transform="rotate(-12deg)"
              zIndex={0}
            />

            <Stack spacing={6} position="relative" zIndex={1}>
              <VStack spacing={2} align="center" mb={4}>
                <Box
                  bg="blue.500"
                  p={3}
                  borderRadius="full"
                  mb={2}
                >
                  <AddIcon w={6} h={6} color="white" />
                </Box>
                <Heading
                  as="h1"
                  size="xl"
                  textAlign="center"
                  fontFamily="Poppins"
                  fontWeight="600"
                  color="white"
                  bgGradient="linear(to-r, blue.400, teal.400)"
                  bgClip="text"
                >
                  Skapa konto
                </Heading>
                <Text
                  textAlign="center"
                  color="gray.400"
                  fontSize="md"
                >
                  Registrera dig för att bli medlem i guilden
                </Text>
              </VStack>

              <form onSubmit={handleRegister}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!usernameError}>
                    <FormLabel color="gray.300">Användarnamn</FormLabel>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setUsernameError('');
                      }}
                      bg="#2D3748"
                      color="white"
                      border="2px solid"
                      borderColor={usernameError ? "red.500" : "transparent"}
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{ 
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #63B3ED"
                      }}
                      _placeholder={{ color: "gray.500" }}
                      fontSize="md"
                      h="50px"
                      transition="all 0.2s"
                    />
                    <FormErrorMessage>{usernameError}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!passwordError}>
                    <FormLabel color="gray.300">Lösenord</FormLabel>
                    <InputGroup size="md">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        bg="#2D3748"
                        color="white"
                        border="2px solid"
                        borderColor={passwordError ? "red.500" : "transparent"}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ 
                          borderColor: "blue.400",
                          boxShadow: "0 0 0 1px #63B3ED"
                        }}
                        _placeholder={{ color: "gray.500" }}
                        fontSize="md"
                        h="50px"
                        transition="all 0.2s"
                      />
                      <InputRightElement h="50px" w="50px">
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          colorScheme="blue"
                          _hover={{ bg: "whiteAlpha.200" }}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{passwordError}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!confirmPasswordError}>
                    <FormLabel color="gray.300">Bekräfta lösenord</FormLabel>
                    <InputGroup size="md">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setConfirmPasswordError('');
                        }}
                        bg="#2D3748"
                        color="white"
                        border="2px solid"
                        borderColor={confirmPasswordError ? "red.500" : "transparent"}
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ 
                          borderColor: "blue.400",
                          boxShadow: "0 0 0 1px #63B3ED"
                        }}
                        _placeholder={{ color: "gray.500" }}
                        fontSize="md"
                        h="50px"
                        transition="all 0.2s"
                      />
                      <InputRightElement h="50px" w="50px">
                        <IconButton
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          variant="ghost"
                          colorScheme="blue"
                          _hover={{ bg: "whiteAlpha.200" }}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    fontSize="md"
                    w="100%"
                    h="50px"
                    isLoading={isLoading}
                    loadingText="Skapar konto..."
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg",
                    }}
                    transition="all 0.2s"
                  >
                    Skapa konto
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    fontSize="md"
                    w="100%"
                    h="50px"
                    onClick={() => navigate('/login')}
                    color="gray.400"
                    _hover={{
                      bg: "whiteAlpha.100",
                      transform: "translateY(-2px)",
                    }}
                    transition="all 0.2s"
                  >
                    Tillbaka till login
                  </Button>
                </VStack>
              </form>
            </Stack>
          </MotionBox>
        </ScaleFade>
      </Container>
    </Box>
  );
};

export default Register; 