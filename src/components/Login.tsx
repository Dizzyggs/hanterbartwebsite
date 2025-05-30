import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  FormErrorMessage,
  useDisclosure,
  ScaleFade,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import type { User } from '../types/firebase';
import { ViewIcon, ViewOffIcon, LockIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { createStyledToast } from '../utils/toast';

const MotionBox = motion(Box);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');

    // Validate input
    if (!username.trim()) {
      setUsernameError('Username required');
      return;
    }
    if (!password) {
      setPasswordError('Password required');
      return;
    }

    setIsLoading(true);

    try {
      const userRef = doc(db, 'users', username.toLowerCase());
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setUsernameError('User not found');
        return;
      }

      const userData = userDoc.data() as User;
      if (userData.password !== password) {
        setPasswordError('Incorrect password');
        return;
      }

      // Login successful
      login(userData);
      
      toast(createStyledToast({
        title: 'Login successful!',
        description: 'Welcome back ' + userData.username,
        status: 'success'
      }));
      navigate('/profile');
    } catch (error: any) {
      toast(createStyledToast({
        title: 'Login failed',
        description: error.message,
        status: 'error'
      }));
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
                  <LockIcon w={6} h={6} color="white" />
                </Box>
                <Heading
                  as="h1"
                  size="xl"
                  textAlign="center"
                  fontFamily="Poppins"
                  fontWeight="600"
                  color="white"
                  bgGradient="linear(to-r, blue.400, purple.400)"
                  bgClip="text"
                >
                  Login
                </Heading>
                <Text
                  textAlign="center"
                  color="gray.400"
                  fontSize="md"
                >
                  Login to access your guild profile
                </Text>
              </VStack>

              <form onSubmit={handleLogin}>
                <Stack spacing={4}>
                  <FormControl isInvalid={!!usernameError}>
                    <FormLabel color="gray.300">Username</FormLabel>
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
                        boxShadow: "0 0 0 1px #4299E1"
                      }}
                      _placeholder={{ color: "gray.500" }}
                      fontSize="md"
                      h="50px"
                      transition="all 0.2s"
                      pattern="[a-zA-Z0-9]+"
                      title="Username can only contain letters and numbers" 
                    />
                    <FormErrorMessage>{usernameError}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!passwordError}>
                    <FormLabel color="gray.300">Password</FormLabel>
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
                          boxShadow: "0 0 0 1px #4299E1"
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

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    fontSize="md"
                    w="100%"
                    h="50px"
                    isLoading={isLoading}
                    loadingText="Loggar in..."
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg",
                    }}
                    transition="all 0.2s"
                  >
                    Login
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    fontSize="md"
                    w="100%"
                    h="50px"
                    onClick={() => navigate('/register')}
                    color="gray.400"
                    _hover={{
                      bg: "whiteAlpha.100",
                      transform: "translateY(-2px)",
                    }}
                    transition="all 0.2s"
                  >
                   Create Account
                  </Button>
                </Stack>
              </form>
            </Stack>
          </MotionBox>
        </ScaleFade>
      </Container>
    </Box>
  );
};

export default Login; 