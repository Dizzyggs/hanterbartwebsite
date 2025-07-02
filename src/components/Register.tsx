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
  Tooltip,
  HStack,
  Icon,
  Image,
  Link,
  Divider,
  Progress,
} from '@chakra-ui/react';
import { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import type { User } from '../types/firebase';
import { useUser } from '../context/UserContext';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { FaUser, FaDiscord, FaLock, FaCheck, FaGamepad, FaShieldAlt, FaUserPlus } from 'react-icons/fa';
import { keyframes } from '@emotion/react';

const MotionBox = motion(Box);

// Floating animation for decorative elements
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(66, 153, 225, 0.3); }
  50% { box-shadow: 0 0 40px rgba(66, 153, 225, 0.6), 0 0 60px rgba(66, 153, 225, 0.4); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [discordSignupNickname, setDiscordSignupNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [discordSignupNicknameError, setDiscordSignupNicknameError] = useState('');
  
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });
  const navigate = useNavigate();
  const { login } = useUser();

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'red.400';
    if (passwordStrength < 50) return 'orange.400';
    if (passwordStrength < 75) return 'yellow.400';
    return 'green.400';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const validateForm = () => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setDiscordSignupNicknameError('');

    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (username.length > 20) {
      setUsernameError('Username cannot be longer than 20 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setUsernameError('Username can only contain letters and numbers');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Confirm password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!discordSignupNickname.trim()) {
      setDiscordSignupNicknameError('Discord signup nickname is required');
      isValid = false;
    } else if (discordSignupNickname.length < 2) {
      setDiscordSignupNicknameError('Discord signup nickname must be at least 2 characters');
      isValid = false;
    } else if (discordSignupNickname.length > 32) {
      setDiscordSignupNicknameError('Discord signup nickname cannot be longer than 32 characters');
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
        setUsernameError('Username is already taken');
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
        lastLogin: new Date(),
        confirmedRaider: false,
        discordSignupNickname: discordSignupNickname.trim()
      };

      await setDoc(doc(usersRef, username.toLowerCase()), newUser);
      
      // Log in the user after successful registration
      login(newUser);

      toast({
        title: 'Account created!',
        description: 'Welcome to Hanterbart!',
        status: 'success',
      });
      navigate('/profile');
    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 25%, #16213e 50%, #0e2954 75%, #2d1b69 100%)"
      position="relative"
      overflow="hidden"
    >
      {/* Subtle gradient overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bgGradient="radial(circle at 30% 20%, rgba(159, 122, 234, 0.03) 0%, transparent 50%), radial(circle at 70% 80%, rgba(66, 153, 225, 0.03) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Container maxW="xl" minH="100vh" display="flex" alignItems="center" justifyContent="center" py={8}>
        <MotionBox
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          w="full"
          maxW="600px"
        >
          {/* Main Card */}
          <Box
            bg="rgba(26, 32, 44, 0.85)"
            backdropFilter="blur(20px)"
            borderRadius="3xl"
            p={10}
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            position="relative"
            overflow="hidden"
          >
            {/* Inner glow effect */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgGradient="linear(45deg, rgba(159, 122, 234, 0.05) 0%, transparent 50%, rgba(66, 153, 225, 0.05) 100%)"
              borderRadius="3xl"
              pointerEvents="none"
            />

            <VStack spacing={8} position="relative" zIndex={1}>
              {/* Logo and Header */}
              <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <VStack spacing={6}>
                  {/* Logo */}
                  <Image
                    src="/HANTERBART.png"
                    alt="Hanterbart Logo"
                    maxH="100px"
                    maxW="180px"
                    objectFit="contain"
                  />

                  <VStack spacing={2}>
                    <Heading
                      fontSize="3xl"
                      fontWeight="700"
                      color="white"
                      textAlign="center"
                      letterSpacing="tight"
                    >
                      Join the Guild
                    </Heading>
                    <Text
                      color="gray.400"
                      fontSize="lg"
                      textAlign="center"
                      fontWeight="500"
                    >
                      Create your Hanterbart account
                    </Text>
                  </VStack>
                </VStack>
              </MotionBox>

              {/* Registration Form */}
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                w="full"
              >
                <form onSubmit={handleRegister}>
                  <VStack spacing={6}>
                    {/* Username Field */}
                    <FormControl isInvalid={!!usernameError}>
                      <FormLabel 
                        color="gray.300" 
                        fontSize="sm" 
                        fontWeight="600"
                        mb={3}
                      >
                        <HStack spacing={2}>
                          <Icon as={FaUser} color="purple.400" />
                          <Text>Username</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setUsernameError('');
                        }}
                        placeholder="Choose a unique username"
                        bg="rgba(45, 55, 72, 0.6)"
                        border="2px solid transparent"
                        borderRadius="xl"
                        color="white"
                        fontSize="md"
                        h="56px"
                        _hover={{
                          bg: "rgba(45, 55, 72, 0.8)",
                          borderColor: "purple.400"
                        }}
                        _focus={{
                          bg: "rgba(45, 55, 72, 0.9)",
                          borderColor: "purple.400",
                          boxShadow: "0 0 0 3px rgba(159, 122, 234, 0.1)"
                        }}
                        _placeholder={{ color: "gray.500" }}
                        transition="all 0.3s ease"
                      />
                      <FormErrorMessage fontSize="sm" mt={2}>
                        {usernameError}
                      </FormErrorMessage>
                    </FormControl>

                    {/* Discord Nickname Field */}
                    <FormControl isInvalid={!!discordSignupNicknameError}>
                      <FormLabel 
                        color="gray.300" 
                        fontSize="sm" 
                        fontWeight="600"
                        mb={3}
                      >
                        <HStack spacing={2}>
                          <Icon as={FaDiscord} color="purple.400" />
                          <Text>Discord Signup Nickname</Text>
                          <Tooltip
                            label="This is the name you'll use when signing up for raids through Discord"
                            placement="top"
                            bg="gray.700"
                            color="white"
                            fontSize="sm"
                            borderRadius="md"
                          >
                            <Box color="gray.400" cursor="help">
                              <Icon as={FaCheck} boxSize={3} />
                            </Box>
                          </Tooltip>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="text"
                        value={discordSignupNickname}
                        onChange={(e) => {
                          setDiscordSignupNickname(e.target.value);
                          setDiscordSignupNicknameError('');
                        }}
                        placeholder="Your Discord display name"
                        bg="rgba(45, 55, 72, 0.6)"
                        border="2px solid transparent"
                        borderRadius="xl"
                        color="white"
                        fontSize="md"
                        h="56px"
                        _hover={{
                          bg: "rgba(45, 55, 72, 0.8)",
                          borderColor: "purple.400"
                        }}
                        _focus={{
                          bg: "rgba(45, 55, 72, 0.9)",
                          borderColor: "purple.400",
                          boxShadow: "0 0 0 3px rgba(159, 122, 234, 0.1)"
                        }}
                        _placeholder={{ color: "gray.500" }}
                        transition="all 0.3s ease"
                      />
                      <FormErrorMessage fontSize="sm" mt={2}>
                        {discordSignupNicknameError}
                      </FormErrorMessage>
                    </FormControl>

                    {/* Password Field */}
                    <FormControl isInvalid={!!passwordError}>
                      <FormLabel 
                        color="gray.300" 
                        fontSize="sm" 
                        fontWeight="600"
                        mb={3}
                      >
                        <HStack spacing={2}>
                          <Icon as={FaLock} color="purple.400" />
                          <Text>Password</Text>
                        </HStack>
                      </FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError('');
                          }}
                          placeholder="Create a strong password"
                          bg="rgba(45, 55, 72, 0.6)"
                          border="2px solid transparent"
                          borderRadius="xl"
                          color="white"
                          fontSize="md"
                          h="56px"
                          pr={12}
                          _hover={{
                            bg: "rgba(45, 55, 72, 0.8)",
                            borderColor: "purple.400"
                          }}
                          _focus={{
                            bg: "rgba(45, 55, 72, 0.9)",
                            borderColor: "purple.400",
                            boxShadow: "0 0 0 3px rgba(159, 122, 234, 0.1)"
                          }}
                          _placeholder={{ color: "gray.500" }}
                          transition="all 0.3s ease"
                        />
                        <InputRightElement h="56px" pr={4}>
                          <IconButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => setShowPassword(!showPassword)}
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "purple.400" }}
                            size="sm"
                          />
                        </InputRightElement>
                      </InputGroup>
                      
                      {/* Password Strength Indicator */}
                      {password && (
                        <VStack spacing={2} mt={3} align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="gray.400">
                              Password strength:
                            </Text>
                            <Text fontSize="xs" color={getPasswordStrengthColor()} fontWeight="600">
                              {getPasswordStrengthText()}
                            </Text>
                          </HStack>
                          <Progress
                            value={passwordStrength}
                            size="sm"
                            colorScheme={passwordStrength < 50 ? 'red' : passwordStrength < 75 ? 'yellow' : 'green'}
                            bg="gray.700"
                            borderRadius="full"
                          />
                        </VStack>
                      )}
                      
                      <FormErrorMessage fontSize="sm" mt={2}>
                        {passwordError}
                      </FormErrorMessage>
                    </FormControl>

                    {/* Confirm Password Field */}
                    <FormControl isInvalid={!!confirmPasswordError}>
                      <FormLabel 
                        color="gray.300" 
                        fontSize="sm" 
                        fontWeight="600"
                        mb={3}
                      >
                        <HStack spacing={2}>
                          <Icon as={FaShieldAlt} color="purple.400" />
                          <Text>Confirm Password</Text>
                        </HStack>
                      </FormLabel>
                      <InputGroup>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setConfirmPasswordError('');
                          }}
                          placeholder="Confirm your password"
                          bg="rgba(45, 55, 72, 0.6)"
                          border="2px solid transparent"
                          borderRadius="xl"
                          color="white"
                          fontSize="md"
                          h="56px"
                          pr={12}
                          _hover={{
                            bg: "rgba(45, 55, 72, 0.8)",
                            borderColor: "purple.400"
                          }}
                          _focus={{
                            bg: "rgba(45, 55, 72, 0.9)",
                            borderColor: "purple.400",
                            boxShadow: "0 0 0 3px rgba(159, 122, 234, 0.1)"
                          }}
                          _placeholder={{ color: "gray.500" }}
                          transition="all 0.3s ease"
                        />
                        <InputRightElement h="56px" pr={4}>
                          <IconButton
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: "purple.400" }}
                            size="sm"
                          />
                        </InputRightElement>
                      </InputGroup>
                      <FormErrorMessage fontSize="sm" mt={2}>
                        {confirmPasswordError}
                      </FormErrorMessage>
                    </FormControl>

                    {/* Register Button */}
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      loadingText="Creating account..."
                      w="full"
                      h="56px"
                      fontSize="md"
                      fontWeight="700"
                      bgGradient="linear(to-r, #9F7AEA, #4299E1)"
                      color="white"
                      borderRadius="xl"
                      _hover={{
                        bgGradient: "linear(to-r, #805AD5, #3182CE)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 25px rgba(159, 122, 234, 0.4)"
                      }}
                      _active={{
                        transform: "translateY(0px)"
                      }}
                      transition="all 0.3s ease"
                      leftIcon={<Icon as={FaUserPlus} />}
                    >
                      Create Account
                    </Button>
                  </VStack>
                </form>
              </MotionBox>

              {/* Divider */}
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                w="full"
              >
                <HStack spacing={4}>
                  <Divider borderColor="gray.600" />
                  <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
                    Already have an account?
                  </Text>
                  <Divider borderColor="gray.600" />
                </HStack>
              </MotionBox>

              {/* Login Link */}
              <MotionBox
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Link
                  as={RouterLink}
                  to="/login"
                  fontSize="md"
                  fontWeight="600"
                  color="purple.400"
                  _hover={{
                    color: "purple.300",
                    textDecoration: "none"
                  }}
                  transition="color 0.2s ease"
                >
                  <HStack spacing={2}>
                    <Icon as={FaGamepad} />
                    <Text>Sign in to your account</Text>
                  </HStack>
                </Link>
              </MotionBox>
            </VStack>
          </Box>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default Register; 