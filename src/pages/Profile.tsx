import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Heading,
  Container,
  InputLeftElement,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, EditIcon, LockIcon, AtSignIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import Breadcrumbs from '../components/Breadcrumbs';

const Profile = () => {
  const { user } = useUser();
  const toast = useToast();
  const { currentTheme } = useTheme();
  const isNeonTheme = currentTheme === 'neon';

  // Username state
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a new username',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdatingUsername(true);
    try {
      // Add your username update logic here
      toast({
        title: 'Success',
        description: 'Username updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewUsername('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update username',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Add your password update logic here
      toast({
        title: 'Success',
        description: 'Password updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Box 
      minH="calc(100vh - 4rem)"
      bgGradient="linear(to-br, background.primary, background.secondary)"
      py={8}
      pt="80px"
    >
      <Container maxW="7xl">
        <Breadcrumbs />
        <VStack spacing={8} align="stretch" maxW="600px" mx="auto">
          <Heading
            fontSize="2xl"
            color="text.primary"
            textShadow={isNeonTheme ? "0 0 10px currentColor" : "none"}
          >
            Konto inställningar
          </Heading>

          <Box
            bg="background.secondary"
            p={6}
            borderRadius="lg"
            boxShadow="xl"
            border="1px solid"
            borderColor="border.primary"
          >
            <VStack spacing={6} align="stretch">
              <Box>
                <Text mb={2} color="text.primary">Byt användarnamn</Text>
                <Text fontSize="sm" color="text.secondary" mb={4}>
                  Nuvarande: {user?.username}
                </Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <AtSignIcon 
                      color={isNeonTheme ? "primary.400" : "white"} 
                      boxSize={5}
                      opacity={0.8}
                    />
                  </InputLeftElement>
                  <Input
                    placeholder="Nytt användarnamn"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    bg="whiteAlpha.50"
                    pl={10}
                  />
                </InputGroup>
                <Button
                  mt={4}
                  w="full"
                  leftIcon={<EditIcon boxSize={5} />}
                  onClick={handleUsernameUpdate}
                  isLoading={isUpdatingUsername}
                  loadingText="Uppdaterar..."
                  bg={isNeonTheme ? "primary.500" : "blue.500"}
                  color="white"
                  _hover={{
                    bg: isNeonTheme ? "primary.600" : "blue.600",
                    transform: "translateY(-2px)",
                    boxShadow: "lg"
                  }}
                >
                  Uppdatera användarnamn
                </Button>
              </Box>

              <Box mt={8}>
                <Text mb={4} color="text.primary">Byt lösenord</Text>
                <VStack spacing={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <LockIcon 
                        color={isNeonTheme ? "primary.400" : "white"} 
                        boxSize={5}
                        opacity={0.8}
                      />
                    </InputLeftElement>
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Nuvarande lösenord"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      bg="whiteAlpha.50"
                      pl={10}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        icon={showCurrentPassword ? 
                          <ViewOffIcon color={isNeonTheme ? "primary.400" : "white"} boxSize={5} /> : 
                          <ViewIcon color={isNeonTheme ? "primary.400" : "white"} boxSize={5} />
                        }
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        variant="ghost"
                        size="sm"
                        opacity={0.8}
                        _hover={{ opacity: 1 }}
                      />
                    </InputRightElement>
                  </InputGroup>

                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <LockIcon 
                        color={isNeonTheme ? "primary.400" : "white"} 
                        boxSize={5}
                        opacity={0.8}
                      />
                    </InputLeftElement>
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Nytt lösenord"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      bg="whiteAlpha.50"
                      pl={10}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        icon={showNewPassword ? 
                          <ViewOffIcon color={isNeonTheme ? "primary.400" : "white"} boxSize={5} /> : 
                          <ViewIcon color={isNeonTheme ? "primary.400" : "white"} boxSize={5} />
                        }
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        variant="ghost"
                        size="sm"
                        opacity={0.8}
                        _hover={{ opacity: 1 }}
                      />
                    </InputRightElement>
                  </InputGroup>

                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <LockIcon 
                        color={isNeonTheme ? "primary.400" : "white"} 
                        boxSize={5}
                        opacity={0.8}
                      />
                    </InputLeftElement>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Bekräfta nytt lösenord"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      bg="whiteAlpha.50"
                      pl={10}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        icon={showConfirmPassword ? 
                          <ViewOffIcon color={isNeonTheme ? "primary.400" : "white"} boxSize={5} /> : 
                          <ViewIcon color={isNeonTheme ? "primary.400" : "white"} boxSize={5} />
                        }
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        variant="ghost"
                        size="sm"
                        opacity={0.8}
                        _hover={{ opacity: 1 }}
                      />
                    </InputRightElement>
                  </InputGroup>

                  <Button
                    w="full"
                    leftIcon={<LockIcon boxSize={5} />}
                    onClick={handlePasswordUpdate}
                    isLoading={isUpdatingPassword}
                    loadingText="Uppdaterar..."
                    bg={isNeonTheme ? "primary.500" : "blue.500"}
                    color="white"
                    _hover={{
                      bg: isNeonTheme ? "primary.600" : "blue.600",
                      transform: "translateY(-2px)",
                      boxShadow: "lg"
                    }}
                  >
                    Uppdatera lösenord
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Profile; 