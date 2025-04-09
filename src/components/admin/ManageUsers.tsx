import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
  VStack,
  Flex,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChevronDownIcon, SearchIcon, DeleteIcon, TriangleDownIcon } from '@chakra-ui/icons';
import type { User as FirebaseUser } from '../../types/firebase';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { logAdminAction } from '../../utils/auditLogger';

// Import class icons
import warriorIcon from '../../assets/classes/warrior.png';
import mageIcon from '../../assets/classes/mage.png';
import priestIcon from '../../assets/classes/priest.png';
import warlockIcon from '../../assets/classes/warlock.png';
import hunterIcon from '../../assets/classes/hunter.png';
import paladinIcon from '../../assets/classes/paladin.png';
import druidIcon from '../../assets/classes/druid.png';
import rogueIcon from '../../assets/classes/rogue.png';

const CLASS_ICONS = {
  Warrior: warriorIcon,
  Mage: mageIcon,
  Priest: priestIcon,
  Warlock: warlockIcon,
  Hunter: hunterIcon,
  Paladin: paladinIcon,
  Druid: druidIcon,
  Rogue: rogueIcon,
};

const CLASS_COLORS = {
  Warrior: '#C79C6E',
  Mage: '#69CCF0',
  Priest: '#FFFFFF',
  Warlock: '#9482C9',
  Hunter: '#ABD473',
  Paladin: '#F58CBA',
  Druid: '#FF7D0A',
  Rogue: '#FFF569',
};

interface User extends Omit<FirebaseUser, 'createdAt'> {
  createdAt: Date;
}

type SortField = 'username' | 'role' | 'joined';

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortField, setSortField] = useState<SortField>('username');
  const deleteDialog = useDisclosure();
  const charactersModal = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { user: currentUser, logout } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const newUsers: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newUsers.push({
          id: doc.id,
          username: data.username,
          email: data.email,
          role: data.role || 'member', // Default to member if role is undefined
          characters: data.characters,
          createdAt: data.createdAt?.toDate() || new Date(),
          password: data.password,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
          avatarUrl: data.avatarUrl,
        });
      });
      setUsers(newUsers);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, username: string, newRole: 'admin' | 'officer' | 'member') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole
      });

      // Log the admin action
      if (currentUser && currentUser.role === 'admin') {
        await logAdminAction(
          currentUser.username,
          currentUser.username,
          'update',
          'role',
          userId,
          username,
          `Changed role of user account **${username}** to **${newRole}**`
        );
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );

      toast({
        title: 'Role Updated',
        description: `${username}'s role has been updated to ${newRole}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);

      // Log the admin action
      if (currentUser && currentUser.role === 'admin') {
        await logAdminAction(
          currentUser.username,
          currentUser.username,
          'delete',
          'user',
          userId,
          username,
          `User account **${username}** Deleted`
        );
      }

      // If deleting own account
      if (currentUser && currentUser.username === userId) {
        localStorage.clear();
        logout();
        navigate('/');
      }

      // Update local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      
      toast({
        title: 'User Deleted',
        description: `${username} has been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleShowCharacters = (user: User) => {
    setSelectedUser(user);
    charactersModal.onOpen();
  };

  const handleDeleteCharacter = async (userId: string, characterId: string, characterName: string) => {
    try {
      // Get the current user document
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error('User data not found');
      }
      
      // Filter out the character to delete
      const updatedCharacters = userData.characters.filter(
        (char: { id: string }) => char.id !== characterId
      );

      // Update the user document with the new characters array
      await updateDoc(userRef, {
        characters: updatedCharacters
      });

      // Log the admin action
      if (currentUser && currentUser.role === 'admin') {
        await logAdminAction(
          currentUser.username,
          currentUser.username,
          'delete',
          'character',
          characterId,
          characterName,
          `Character **${characterName}** deleted from user **${userData.username}**`
        );
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, characters: updatedCharacters }
            : user
        )
      );

      // Update selected user state to reflect the change immediately
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? {
          ...prev,
          characters: updatedCharacters
        } : null);
      }

      toast({
        title: 'Character Deleted',
        description: `${characterName} has been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete character',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const sortUsers = (users: User[]) => {
    return [...users].sort((a, b) => {
      switch (sortField) {
        case 'username':
          return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase());
        case 'role': {
          const roleOrder: Record<'admin' | 'officer' | 'member', number> = { 
            admin: 0, 
            officer: 1, 
            member: 2 
          };
          // Roles are already lowercase in our data
          const aRole = roleOrder[a.role as 'admin' | 'officer' | 'member'] ?? 2;
          const bRole = roleOrder[b.role as 'admin' | 'officer' | 'member'] ?? 2;
          return aRole - bRole;
        }
        case 'joined':
          return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
        default:
          return 0;
      }
    });
  };

  const filteredUsers = sortUsers(users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (user.username?.toLowerCase() || '').includes(searchTermLower)
    );
  }));

  const getRoleBadgeColor = (role: string = 'member') => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'red';
      case 'officer':
        return 'purple';
      case 'member':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Box minH="calc(100vh - 4rem)" bg="background.primary" py={8}>
      <Container maxW="container.xl">
        <HStack justify="space-between" mb={8}>
          <Heading
            color="text.primary"
            fontSize="2xl"
            bgGradient="linear(to-r, primary.400, primary.600)"
            bgClip="text"
          >
            Manage Users
          </Heading>
          <HStack spacing={8}>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<TriangleDownIcon boxSize={3} />}
                bg="background.secondary"
                color="text.primary"
                _hover={{ bg: 'background.tertiary' }}
                _active={{ bg: 'background.tertiary' }}
                size="md"
                minW="200px"
                h="40px"
                px={4}
              >
                Sort by: {sortField.charAt(0).toUpperCase() + sortField.slice(1)}
              </MenuButton>
              <MenuList bg="background.tertiary" borderColor="border.primary" boxShadow="dark-lg">
                <MenuItem
                  onClick={() => setSortField('username')}
                  bg="background.tertiary"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  color="text.primary"
                >
                  Username
                </MenuItem>
                <MenuItem
                  onClick={() => setSortField('role')}
                  bg="background.tertiary"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  color="text.primary"
                >
                  Role
                </MenuItem>
                <MenuItem
                  onClick={() => setSortField('joined')}
                  bg="background.tertiary"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  color="text.primary"
                >
                  Joined
                </MenuItem>
              </MenuList>
            </Menu>
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="text.secondary" />
              </InputLeftElement>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="background.secondary"
                border="1px solid"
                borderColor="border.primary"
                color="text.primary"
                _placeholder={{ color: 'text.secondary' }}
                _hover={{ borderColor: 'border.secondary' }}
                _focus={{ borderColor: 'primary.400', boxShadow: 'outline' }}
              />
            </InputGroup>
          </HStack>
        </HStack>

        <Box
          bg="background.secondary"
          borderRadius="lg"
          p={6}
          overflowX="auto"
          boxShadow="xl"
          maxH={{ base: "calc(100vh - 12rem)", md: "auto" }}
          display="flex"
          flexDirection="column"
          borderColor="border.primary"
          borderWidth="1px"
        >
          {/* Desktop View */}
          <Box display={{ base: "none", md: "block" }}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="text.secondary">Username</Th>
                  <Th color="text.secondary">Role</Th>
                  <Th color="text.secondary">Characters</Th>
                  <Th color="text.secondary">Joined</Th>
                  <Th color="text.secondary" textAlign="center">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map((user) => (
                  <Tr key={user.id}>
                    <Td color="text.primary">{user.username}</Td>
                    <Td>
                      <Badge colorScheme={getRoleBadgeColor(user.role)}>
                        {user.role || 'member'}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        variant="link"
                        color="primary.400"
                        onClick={() => handleShowCharacters(user)}
                        _hover={{ color: 'primary.300', textShadow: 'defaultHover' }}
                      >
                        {user.characters?.length || 0} characters
                      </Button>
                    </Td>
                    <Td color="text.primary">
                      {user.createdAt.toLocaleDateString()}
                    </Td>
                    <Td>
                      <HStack spacing={2} justify="center">
                        <Menu>
                          <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            size="sm"
                            bg="background.tertiary"
                            color="text.primary"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            _active={{ bg: 'whiteAlpha.200' }}
                            isDisabled={isUpdating}
                          >
                            Change Role
                          </MenuButton>
                          <MenuList
                            bg="background.tertiary"
                            borderColor="border.primary"
                            boxShadow="dark-lg"
                          >
                            <MenuItem
                              onClick={() => handleRoleChange(user.id, user.username, 'admin')}
                              bg="background.tertiary"
                              _hover={{ bg: 'whiteAlpha.200' }}
                              color="text.primary"
                            >
                              Admin
                            </MenuItem>
                            <MenuItem
                              onClick={() => handleRoleChange(user.id, user.username, 'officer')}
                              bg="background.tertiary"
                              _hover={{ bg: 'whiteAlpha.200' }}
                              color="text.primary"
                            >
                              Officer
                            </MenuItem>
                            <MenuItem
                              onClick={() => handleRoleChange(user.id, user.username, 'member')}
                              bg="background.tertiary"
                              _hover={{ bg: 'whiteAlpha.200' }}
                              color="text.primary"
                            >
                              Member
                            </MenuItem>
                          </MenuList>
                        </Menu>
                        <IconButton
                          aria-label="Delete user"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            deleteDialog.onOpen();
                          }}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {filteredUsers.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign="center" color="text.secondary">
                      No users found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>

          {/* Mobile View */}
          <Box 
            display={{ base: "block", md: "none" }} 
            overflowY="auto" 
            flex={1}
            sx={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
                background: 'background.tertiary',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'border.secondary',
                borderRadius: '24px',
              },
            }}
          >
            <VStack spacing={4} align="stretch">
              {filteredUsers.map((user) => (
                <Box
                  key={user.id}
                  bg="background.tertiary"
                  p={4}
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderColor={user.role === 'admin' ? 'red.500' : user.role === 'officer' ? 'purple.500' : 'green.500'}
                >
                  <VStack align="stretch" spacing={3}>
                    <Flex justify="space-between" align="center">
                      <Text color="text.primary" fontWeight="bold">{user.username}</Text>
                      <Badge colorScheme={getRoleBadgeColor(user.role)}>
                        {user.role || 'member'}
                      </Badge>
                    </Flex>
                    
                    <Flex justify="space-between" align="center">
                      <Button
                        variant="link"
                        color="primary.400"
                        onClick={() => handleShowCharacters(user)}
                        size="sm"
                        _hover={{ color: 'primary.300', textShadow: 'defaultHover' }}
                      >
                        {user.characters?.length || 0} characters
                      </Button>
                      <Text color="text.secondary" fontSize="sm">
                        Joined: {user.createdAt.toLocaleDateString()}
                      </Text>
                    </Flex>

                    <Flex justify="space-between" gap={2} mt={2}>
                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          size="sm"
                          bg="background.secondary"
                          color="text.primary"
                          _hover={{ bg: 'background.tertiary' }}
                          _active={{ bg: 'background.tertiary' }}
                          isDisabled={isUpdating}
                          flex={1}
                        >
                          Change Role
                        </MenuButton>
                        <MenuList
                          bg="background.tertiary"
                          borderColor="border.primary"
                          boxShadow="dark-lg"
                        >
                          <MenuItem
                            onClick={() => handleRoleChange(user.id, user.username, 'admin')}
                            bg="background.tertiary"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            color="text.primary"
                          >
                            Admin
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleRoleChange(user.id, user.username, 'officer')}
                            bg="background.tertiary"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            color="text.primary"
                          >
                            Officer
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleRoleChange(user.id, user.username, 'member')}
                            bg="background.tertiary"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            color="text.primary"
                          >
                            Member
                          </MenuItem>
                        </MenuList>
                      </Menu>
                      <IconButton
                        aria-label="Delete user"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUserToDelete(user);
                          deleteDialog.onOpen();
                        }}
                      />
                    </Flex>
                  </VStack>
                </Box>
              ))}
              {filteredUsers.length === 0 && (
                <Box textAlign="center" color="text.secondary" py={4}>
                  No users found
                </Box>
              )}
            </VStack>
          </Box>
        </Box>
      </Container>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="background.secondary" borderColor="border.primary" borderWidth={1}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="text.primary">
              Delete User Account
            </AlertDialogHeader>

            <AlertDialogBody color="text.secondary">
              Are you sure you want to delete {userToDelete?.username}'s account? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteDialog.onClose} variant="ghost" color="text.primary">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={() => {
                if (userToDelete) {
                  handleDeleteUser(userToDelete.id, userToDelete.username);
                }
                deleteDialog.onClose();
              }} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal isOpen={charactersModal.isOpen} onClose={charactersModal.onClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="background.secondary" borderColor="border.primary" borderWidth={1}>
          <ModalHeader color="text.primary" borderBottom="1px solid" borderColor="border.primary">
            {selectedUser?.username}'s Characters
          </ModalHeader>
          <ModalCloseButton color="text.primary" />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              {selectedUser?.characters?.map((character) => (
                <Box
                  key={character.id}
                  bg="background.tertiary"
                  p={4}
                  borderRadius="md"
                  borderLeft="4px solid"
                  borderLeftColor={CLASS_COLORS[character.class as keyof typeof CLASS_COLORS]}
                >
                  <Flex align="center" justify="space-between">
                    <Flex align="center" gap={4}>
                      <Image
                        src={CLASS_ICONS[character.class as keyof typeof CLASS_ICONS]}
                        alt={character.class}
                        boxSize="32px"
                      />
                      <VStack align="flex-start" spacing={1}>
                        <Text color="text.primary" fontWeight="bold">
                          {character.name}
                          {character.isMain && (
                            <Badge ml={2} colorScheme="green">Main</Badge>
                          )}
                        </Text>
                        <HStack spacing={2}>
                          <Text color="text.secondary" fontSize="sm">{character.race}</Text>
                          <Text color="text.secondary" fontSize="sm">•</Text>
                          <Text 
                            color={CLASS_COLORS[character.class as keyof typeof CLASS_COLORS]} 
                            fontSize="sm"
                          >
                            {character.class}
                          </Text>
                          <Text color="text.secondary" fontSize="sm">•</Text>
                          <Badge
                            colorScheme={
                              character.role === 'Tank' ? 'red' :
                              character.role === 'Healer' ? 'green' : 'blue'
                            }
                          >
                            {character.role}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Flex>
                    <IconButton
                      aria-label="Delete character"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedUser) {
                          handleDeleteCharacter(
                            selectedUser.id,
                            character.id,
                            character.name
                          );
                        }
                      }}
                    />
                  </Flex>
                </Box>
              ))}
              {(!selectedUser?.characters || selectedUser.characters.length === 0) && (
                <Text color="text.secondary" textAlign="center">
                  This user has no characters
                </Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageUsers; 