import { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Icon,
  HStack,
  useRadio,
  useRadioGroup,
  UseRadioProps,
  chakra,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, MoonIcon, SunIcon, StarIcon } from '@chakra-ui/icons';
import { FaLightbulb } from 'react-icons/fa';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ThemeName, themeNames } from '../theme';

interface ThemeCardProps extends UseRadioProps {
  themeName: ThemeName;
}

const ThemeCard = (props: ThemeCardProps) => {
  const { themeName, ...radioProps } = props;
  const { state, getInputProps, getRadioProps } = useRadio(radioProps);

  const themeIcons = {
    default: StarIcon,
    frost: MoonIcon,
    ember: SunIcon,
    neon: FaLightbulb,
  };

  const themeColors = {
    default: '#2196F3',
    frost: '#4C89FF',
    ember: '#FF7E2F',
    neon: '#00E050',
  };

  const ThemeIcon = themeIcons[themeName];
  const themeColor = themeColors[themeName];

  return (
    <chakra.label cursor="pointer" width="100%">
      <input {...getInputProps()} hidden />
      <Box
        {...getRadioProps()}
        bg={state.isChecked ? 'primary.500' : 'background.tertiary'}
        borderWidth="2px"
        borderColor={state.isChecked ? themeColor : 'border.primary'}
        borderRadius="lg"
        p={4}
        transition="all 0.3s"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: 'lg',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: themeColor,
          opacity: state.isChecked ? 0.8 : 0.3,
          transition: 'all 0.3s',
          boxShadow: `0 0 10px ${themeColor}, 0 0 20px ${themeColor}`,
          pointerEvents: 'none',
        }}
        _hover={{
          transform: 'translateY(-2px)',
          _before: {
            opacity: 0.8,
            boxShadow: `0 0 15px ${themeColor}, 0 0 30px ${themeColor}`,
          }
        }}
      >
        <VStack spacing={3} align="center">
          <Icon 
            as={ThemeIcon} 
            boxSize={6} 
            color={state.isChecked ? 'white' : themeColor}
            textShadow={state.isChecked ? `0 0 10px ${themeColor}` : 'none'}
            transition="all 0.3s"
          />
          <Text
            color={state.isChecked ? 'white' : 'text.primary'}
            fontWeight="medium"
            textTransform="capitalize"
            textShadow={state.isChecked ? `0 0 10px ${themeColor}` : 'none'}
            transition="all 0.3s"
          >
            {themeName}
          </Text>
        </VStack>
      </Box>
    </chakra.label>
  );
};

const Settings = () => {
  const { user, login } = useUser();
  const { currentTheme, setTheme } = useTheme();
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'theme',
    defaultValue: currentTheme,
    onChange: (value) => setTheme(value as ThemeName),
  });

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if new username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', newUsername.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: 'Användarnamnet är upptaget',
          description: 'Vänligen välj ett annat användarnamn.',
          status: 'error',
        });
        return;
      }

      // Get current user data
      const oldUserDoc = await getDoc(doc(db, 'users', user.username));
      if (!oldUserDoc.exists()) {
        throw new Error('Användaren dokumentet hittades inte');
      }

      const userData = oldUserDoc.data();

      // Create new document with new username
      await updateDoc(doc(db, 'users', newUsername.toLowerCase()), {
        ...userData,
        username: newUsername.toLowerCase(),
      });

      // Delete old document
      await updateDoc(doc(db, 'users', user.username), {
        username: newUsername.toLowerCase(),
      });

      // Update local storage and context
      const updatedUser = {
        ...user,
        username: newUsername.toLowerCase(),
      };
      login(updatedUser);

      toast({
        title: 'Username updated',
        description: 'Your username has been successfully changed.',
        status: 'success',
      });

      setNewUsername('');
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: 'Error updating username',
        description: 'There was an error updating your username. Please try again.',
        status: 'error',
      });
    }
    setIsLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (currentPassword !== user.password) {
      toast({
        title: 'Incorrect password',
        description: 'Current password is incorrect.',
        status: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation do not match.',
        status: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.username), {
        password: newPassword,
      });

      // Update local context
      const updatedUser = {
        ...user,
        password: newPassword,
      };
      login(updatedUser);

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
        status: 'success',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error updating password',
        description: 'There was an error updating your password. Please try again.',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Container maxW="container.lg" py={10}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {/* Account Settings Section */}
        <Card bg="background.secondary" borderColor="border.primary" borderWidth={1}>
          <CardHeader>
            <Heading 
              size="lg" 
              color="text.primary"
              bgGradient="linear(to-r, primary.400, primary.600)"
              bgClip="text"
              letterSpacing="tight"
            >
              Konto inställningar
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Username Section */}
              <Box>
                <Heading 
                  size="md" 
                  color="primary.400"
                  mb={1}
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  Byt användarnamn
                </Heading>
                <Text fontSize="sm" color="text.secondary" mb={4}>
                  Nuvarande: {user?.username}
                </Text>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel color="text.primary">Nytt användarnamn</FormLabel>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Ange nytt användarnamn"
                      bg="background.tertiary"
                      border="1px solid"
                      borderColor="border.primary"
                      _hover={{ borderColor: 'primary.400' }}
                      _focus={{ borderColor: 'primary.400', boxShadow: '0 0 0 1px var(--chakra-colors-primary-400)' }}
                      color="text.primary"
                    />
                  </FormControl>
                  <Button
                    onClick={handleUsernameChange}
                    colorScheme="blue"
                    isLoading={isLoading}
                    w="full"
                    size="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Uppdatera användarnamn
                  </Button>
                </VStack>
              </Box>

              <Divider borderColor="border.primary" />

              {/* Password Section */}
              <Box>
                <Heading size="md" color="primary.400" mb={4}>
                  Byt lösenord
                </Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel color="text.primary">Nuvarande lösenord</FormLabel>
                    <InputGroup>
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Ange nuvarande lösenord"
                        bg="background.tertiary"
                        border="1px solid"
                        borderColor="border.primary"
                        _hover={{ borderColor: 'primary.400' }}
                        _focus={{ borderColor: 'primary.400', boxShadow: '0 0 0 1px var(--chakra-colors-primary-400)' }}
                        color="text.primary"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showCurrentPassword ? 'Göm lösenord' : 'Visa lösenord'}
                          icon={showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          variant="ghost"
                          colorScheme="blue"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel color="text.primary">Nytt lösenord</FormLabel>
                    <InputGroup>
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ange nytt lösenord"
                        bg="background.tertiary"
                        border="1px solid"
                        borderColor="border.primary"
                        _hover={{ borderColor: 'primary.400' }}
                        _focus={{ borderColor: 'primary.400', boxShadow: '0 0 0 1px var(--chakra-colors-primary-400)' }}
                        color="text.primary"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showNewPassword ? 'Göm lösenord' : 'Visa lösenord'}
                          icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          variant="ghost"
                          colorScheme="blue"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel color="text.primary">Bekräfta nytt lösenord</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Bekräfta nytt lösenord"
                        bg="background.tertiary"
                        border="1px solid"
                        borderColor="border.primary"
                        _hover={{ borderColor: 'primary.400' }}
                        _focus={{ borderColor: 'primary.400', boxShadow: '0 0 0 1px var(--chakra-colors-primary-400)' }}
                        color="text.primary"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showConfirmPassword ? 'Göm lösenord' : 'Visa lösenord'}
                          icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          variant="ghost"
                          colorScheme="blue"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    onClick={handlePasswordChange}
                    colorScheme="blue"
                    isLoading={isLoading}
                    w="full"
                    size="lg"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Uppdatera lösenord
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Theme Settings Section */}
        <Card bg="background.secondary" borderColor="border.primary" borderWidth={1}>
          <CardHeader>
            <Heading 
              size="lg" 
              color="text.primary"
              bgGradient="linear(to-r, primary.400, primary.600)"
              bgClip="text"
              letterSpacing="tight"
            >
              Tema inställningar
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Text color="text.secondary" fontSize="sm">
                Välj ett tema som passar dig bäst. Temat kommer att appliceras på hela webbplatsen.
              </Text>
              <SimpleGrid columns={3} spacing={4} {...getRootProps()}>
                {themeNames.map((themeName) => (
                  <ThemeCard
                    key={themeName}
                    themeName={themeName}
                    {...getRadioProps({ value: themeName })}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Container>
  );
};

export default Settings; 