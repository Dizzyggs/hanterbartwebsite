import {
  Box,
  Container,
  Heading,
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
  Select,
  useMediaQuery,
  FormControl,
  FormLabel,
  ModalFooter,
  Badge,
  Avatar,
  Grid,
  GridItem,
  Skeleton,
  SkeletonCircle,
  SimpleGrid,
  Spinner,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Stack,
  Wrap,
  WrapItem,
  Center,
  useColorModeValue,
  AvatarBadge,
  CardFooter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChevronDownIcon, SearchIcon, DeleteIcon, TriangleDownIcon, EditIcon, StarIcon, CalendarIcon, TimeIcon, ViewIcon, SettingsIcon, EmailIcon, ChevronLeftIcon, ChevronRightIcon, ArrowBackIcon } from '@chakra-ui/icons';
import type { User as FirebaseUser } from '../../types/firebase';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { logAdminAction } from '../../utils/auditLogger';
import Breadcrumbs from '../Breadcrumbs';
import { createStyledToast } from '../../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import defaultAvatar from '../../assets/avatar.jpg';

// Import class icons
import warriorIcon from '../../assets/classes/warrior.png';
import mageIcon from '../../assets/classes/mage.png';
import priestIcon from '../../assets/classes/priest.png';
import warlockIcon from '../../assets/classes/warlock.png';
import hunterIcon from '../../assets/classes/hunter.png';
import paladinIcon from '../../assets/classes/paladin.png';
import druidIcon from '../../assets/classes/druid.png';
import rogueIcon from '../../assets/classes/rogue.png';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

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
  confirmedRaider?: boolean;
  discordSignupNickname?: string;
}

type SortField = 'username' | 'role' | 'joined' | 'confirmedRaider';

const USERS_PER_PAGE = 12; // 4 rows × 3 users per row

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortAscending, setSortAscending] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const deleteDialog = useDisclosure();
  const charactersModal = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { user: currentUser, logout } = useUser();
  const navigate = useNavigate();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [selectedUserForNickname, setSelectedUserForNickname] = useState<User | null>(null);
  const [newNickname, setNewNickname] = useState("");
  const nicknameModal = useDisclosure();
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const editModal = useDisclosure();
  const [editModalView, setEditModalView] = useState<'edit' | 'characters'>('edit');

  // Dynamic users per page based on screen size
  const usersPerPage = isMobile ? 6 : 12;

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
          role: data.role || 'member',
          characters: data.characters,
          createdAt: data.createdAt?.toDate() || new Date(),
          password: data.password,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
          avatarUrl: data.avatarUrl,
          confirmedRaider: data.confirmedRaider,
          discordSignupNickname: data.discordSignupNickname,
        });
      });
      setUsers(newUsers);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, username: string, newRole: 'admin' | 'officer' | 'member') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole
      });

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

      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );

      // Update selectedUserForEdit if it's the same user
      if (selectedUserForEdit && selectedUserForEdit.id === userId) {
        setSelectedUserForEdit(prev => prev ? { ...prev, role: newRole } : null);
      }

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

  const handleConfirmedRaiderToggle = async (userId: string, username: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        confirmedRaider: !currentStatus
      });

      if (currentUser && currentUser.role === 'admin') {
        await logAdminAction(
          currentUser.username,
          currentUser.username,
          'update',
          'confirmedRaider',
          userId,
          username,
          `Changed confirmed raider status of user account **${username}** to **${!currentStatus ? 'confirmed' : 'unconfirmed'}**`
        );
      }

      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, confirmedRaider: !currentStatus } : u
        )
      );

      // Update selectedUserForEdit if it's the same user
      if (selectedUserForEdit && selectedUserForEdit.id === userId) {
        setSelectedUserForEdit(prev => prev ? { ...prev, confirmedRaider: !currentStatus } : null);
      }

      toast({
        title: 'Raider Status Updated',
        description: `${username} is now ${!currentStatus ? 'confirmed' : 'unconfirmed'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('Error updating raider status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update raider status',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      if (currentUser && currentUser.role === 'admin') {
        await logAdminAction(
          currentUser.username,
          currentUser.username,
          'delete',
          'user',
          userId,
          username,
          `Deleted user account **${username}**`
        );
      }

      await deleteDoc(doc(db, 'users', userId));
      
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));

      toast({
        title: 'User Deleted',
        description: `${username} has been successfully deleted`,
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
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const updatedCharacters = userData.characters?.filter((char: any) => char.id !== characterId) || [];

      await updateDoc(userRef, {
        characters: updatedCharacters
      });

      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);

      const eventUpdates = eventsSnapshot.docs.map(async (eventDoc: any) => {
        const eventData = eventDoc.data();
        let needsUpdate = false;
        let updatedData: any = {};

        if (eventData.signups) {
          const signupEntries = Object.entries(eventData.signups);
          const hasCharacterSignup = signupEntries.some(([_, signup]: [string, any]) => 
            signup && signup.characterId === characterId
          );
          
          if (hasCharacterSignup) {
            needsUpdate = true;
            updatedData.signups = Object.fromEntries(
              signupEntries.filter(([_, signup]: [string, any]) => 
                signup && signup.characterId !== characterId
              )
            );
          }
        }

        if (eventData.raidComposition?.groups) {
          const updatedGroups = eventData.raidComposition.groups.map((group: any) => ({
            ...group,
            players: group.players.filter((player: any) => player.characterId !== characterId)
          }));

          if (JSON.stringify(updatedGroups) !== JSON.stringify(eventData.raidComposition.groups)) {
            needsUpdate = true;
            updatedData.raidComposition = {
              ...eventData.raidComposition,
              groups: updatedGroups
            };
          }
        }

        if (needsUpdate) {
          return updateDoc(doc(db, 'events', eventDoc.id), updatedData);
        }
      });

      await Promise.all(eventUpdates.filter(Boolean));

      if (selectedUser) {
        const updatedUser = { ...selectedUser, characters: updatedCharacters };
        setSelectedUser(updatedUser);
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? updatedUser : u
          )
        );
      }

      toast({
        title: 'Character Deleted',
        description: `${characterName} has been deleted successfully`,
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
    return users.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'role':
          const roleOrder = { admin: 3, officer: 2, member: 1 };
          aValue = roleOrder[a.role as keyof typeof roleOrder] || 0;
          bValue = roleOrder[b.role as keyof typeof roleOrder] || 0;
          break;
        case 'joined':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'confirmedRaider':
          aValue = a.confirmedRaider ? 1 : 0;
          bValue = b.confirmedRaider ? 1 : 0;
          break;
        default:
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
      }

      if (aValue < bValue) return sortAscending ? -1 : 1;
      if (aValue > bValue) return sortAscending ? 1 : -1;
      return 0;
    });
  };

  const handleSortChange = (newSortField: SortField) => {
    if (sortField === newSortField) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(newSortField);
      setSortAscending(true);
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getRoleBadgeColor = (role: string = 'member') => {
    switch (role) {
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

  const handleEditDiscordNickname = (user: User) => {
    setSelectedUserForEdit(user);
    setNewNickname(user.discordSignupNickname || "");
    editModal.onOpen();
  };

  const handleSaveDiscordNickname = async () => {
    if (!selectedUserForNickname) return;
    
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', selectedUserForNickname.id);
      await updateDoc(userRef, {
        discordSignupNickname: newNickname.trim()
      });

      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === selectedUserForNickname.id 
            ? { ...u, discordSignupNickname: newNickname.trim() }
            : u
        )
      );

      if (selectedUser?.id === selectedUserForNickname.id) {
        setSelectedUser(prev => 
          prev ? { ...prev, discordSignupNickname: newNickname.trim() } : null
        );
      }

      toast(createStyledToast({
        title: 'Calendar Nickname Updated',
        description: 'User\'s calendar nickname has been updated successfully',
        status: 'success'
      }));

      nicknameModal.onClose();
    } catch (error) {
      console.error('Error updating Calendar nickname:', error);
      toast(createStyledToast({
        title: 'Error',
        description: 'Failed to update Calendar nickname',
        status: 'error'
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = sortUsers(
    users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.discordSignupNickname && user.discordSignupNickname.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Populate nickname when edit modal opens
  useEffect(() => {
    if (selectedUserForEdit && editModal.isOpen) {
      setNewNickname(selectedUserForEdit.discordSignupNickname || "");
      setEditModalView('edit'); // Reset to edit view when modal opens
    }
  }, [selectedUserForEdit, editModal.isOpen]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const UserCard = ({ user, index }: { user: User; index: number }) => (
    <MotionCard
      key={user.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      bg="rgba(255, 255, 255, 0.02)"
      backdropFilter="blur(20px)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.05)"
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
      overflow="hidden"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          {/* User Header */}
          <HStack spacing={3} align="center">
            <Avatar
              size="md"
              name={user.username}
              src={user.avatarUrl || defaultAvatar}
              border="2px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
            >
              <AvatarBadge
                boxSize="1.2em"
                bg={user.role === 'admin' ? 'red.500' : user.role === 'officer' ? 'purple.500' : 'green.500'}
                border="2px solid"
                borderColor="background.primary"
              >
                <StarIcon color="white" boxSize="0.5em" />
              </AvatarBadge>
            </Avatar>
            
            <VStack align="flex-start" spacing={0} flex={1}>
              <HStack spacing={2} align="center">
                <Text color="white" fontWeight="600" fontSize="lg" noOfLines={1}>
                  {user.username}
                </Text>
                <Badge
                  colorScheme={getRoleBadgeColor(user.role)}
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="600"
                >
                  {user.role || 'member'}
                </Badge>
              </HStack>
              <Text color="rgba(255, 255, 255, 0.6)" fontSize="sm" noOfLines={1}>
                {user.email}
              </Text>
            </VStack>
          </HStack>

          {/* Status Info */}
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between" align="center">
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                Raider Status:
              </Text>
              <HStack spacing={1}>
                {user.confirmedRaider ? (
                  <>
                    <Box color="green.400">✓</Box>
                    <Text color="green.400" fontSize="sm" fontWeight="600">
                      Confirmed
                    </Text>
                  </>
                ) : (
                  <>
                    <Box color="orange.400">✗</Box>
                    <Text color="orange.400" fontSize="sm" fontWeight="600">
                      Pending
                    </Text>
                  </>
                )}
              </HStack>
            </HStack>

            <HStack justify="space-between" align="center">
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                Characters:
              </Text>
              <Text color="white" fontSize="sm" fontWeight="600">
                {user.characters?.length || 0}
              </Text>
            </HStack>

            <HStack justify="space-between" align="center">
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
                Calendar Nickname:
              </Text>
              <Text color="primary.300" fontSize="sm" fontWeight="500" noOfLines={1}>
                {user.discordSignupNickname || "Not set"}
              </Text>
            </HStack>
          </VStack>

          {/* Actions */}
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={2} pt={2}>
            <Button
              leftIcon={<EditIcon />}
              size="xs"
              variant="outline"
              onClick={() => {
                setSelectedUserForEdit(user);
                editModal.onOpen();
              }}
              borderColor="rgba(255, 255, 255, 0.1)"
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
              borderRadius="lg"
              fontSize="xs"
              flex={1}
            >
              Edit
            </Button>

            <HStack spacing={2} justify={{ base: 'center', sm: 'flex-start' }}>
              <IconButton
                aria-label="View characters"
                icon={<ViewIcon />}
                size="xs"
                variant="outline"
                onClick={() => handleShowCharacters(user)}
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                borderRadius="lg"
              />

              <IconButton
                aria-label="Delete user"
                icon={<DeleteIcon />}
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => {
                  setUserToDelete(user);
                  deleteDialog.onOpen();
                }}
                borderRadius="lg"
              />
            </HStack>
          </Stack>
        </VStack>
      </CardBody>
    </MotionCard>
  );

  return (
    <Box minH="100vh" bg="background.primary">
      <Container maxW="7xl" px={{ base: 4, md: 8 }} py={8}>
        <Breadcrumbs />
        
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          mb={6}
        >
          <VStack spacing={4}>
            <VStack spacing={2} textAlign="center" mt={!isMobile ? 50 : 0}>
              <Heading
                size="2xl"
                bgGradient="linear(to-r, primary.200, purple.200, primary.300)"
                bgClip="text"
                fontWeight="700"
              >
                User Management
              </Heading>
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="md">
                Manage user roles, permissions, and account information
              </Text>
            </VStack>
            
            {/* Controls */}
            <Box
              w="full"
              bg="rgba(255, 255, 255, 0.02)"
              backdropFilter="blur(20px)"
              borderRadius="xl"
              p={4}
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.05)"
            >
              <Stack 
                direction={{ base: 'column', md: 'row' }}
                spacing={4}
                align="center"
                justify="space-between"
              >
                <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} flex={1} w={{ base: 'full', md: 'auto' }}>
                  <Select
                    value={sortField}
                    onChange={(e) => handleSortChange(e.target.value as SortField)}
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    borderRadius="lg"
                    _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    _focus={{ borderColor: 'primary.400' }}
                    maxW={{ base: 'full', sm: '180px' }}
                    size="sm"
                  >
                    <option value="username">Username</option>
                    <option value="role">Role</option>
                    <option value="joined">Join Date</option>
                    <option value="confirmedRaider">Raider Status</option>
                  </Select>
                  
                  <InputGroup maxW={{ base: 'full', sm: '300px' }}>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="rgba(255, 255, 255, 0.5)" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      color="white"
                      borderRadius="lg"
                      _placeholder={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                      _focus={{ borderColor: 'primary.400' }}
                      size="sm"
                    />
                  </InputGroup>
                </Stack>
                
                <VStack spacing={1} align={{ base: 'center', md: 'flex-end' }}>
                  <Badge
                    colorScheme="primary"
                    px={3}
                    py={1}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="600"
                  >
                    {filteredUsers.length} Total Users
                  </Badge>
                  {totalPages > 1 && (
                    <Text color="rgba(255, 255, 255, 0.6)" fontSize="xs">
                      Page {currentPage} of {totalPages}
                    </Text>
                  )}
                </VStack>
              </Stack>
            </Box>
          </VStack>
        </MotionBox>

        {/* Users Grid - Fixed 3 columns */}
        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[...Array(isMobile ? 6 : 12)].map((_, i) => (
              <Card key={i} bg="rgba(255, 255, 255, 0.02)" borderRadius="2xl" p={4}>
                <VStack spacing={3}>
                  <HStack spacing={3} w="full">
                    <SkeletonCircle size="12" />
                    <VStack align="flex-start" spacing={1} flex={1}>
                      <Skeleton height="16px" width="70%" />
                      <Skeleton height="12px" width="50%" />
                    </VStack>
                  </HStack>
                  <Skeleton height="40px" width="100%" />
                  <Skeleton height="32px" width="100%" />
                </VStack>
              </Card>
            ))}
          </SimpleGrid>
        ) : filteredUsers.length === 0 ? (
          <Center py={16}>
            <VStack spacing={4}>
              <Box
                w="80px"
                h="80px"
                bg="rgba(255, 255, 255, 0.02)"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <SearchIcon boxSize={8} color="rgba(255, 255, 255, 0.3)" />
              </Box>
              <VStack spacing={1}>
                <Text color="rgba(255, 255, 255, 0.8)" fontSize="lg" fontWeight="600">
                  No users found
                </Text>
                <Text color="rgba(255, 255, 255, 0.5)" fontSize="sm">
                  Try adjusting your search criteria
                </Text>
              </VStack>
            </VStack>
          </Center>
        ) : (
          <VStack spacing={6}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
              <AnimatePresence>
                {currentUsers.map((user, index) => (
                  <UserCard key={user.id} user={user} index={index} />
                ))}
              </AnimatePresence>
            </SimpleGrid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box
                bg="rgba(255, 255, 255, 0.02)"
                backdropFilter="blur(20px)"
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.05)"
              >
                <HStack spacing={2} justify="center" flexWrap="wrap">
                  <IconButton
                    aria-label="Previous page"
                    icon={<ChevronLeftIcon />}
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                    _disabled={{ opacity: 0.4 }}
                  />
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={currentPage === page ? "solid" : "outline"}
                      colorScheme={currentPage === page ? "primary" : undefined}
                      onClick={() => handlePageChange(page)}
                      borderColor="rgba(255, 255, 255, 0.1)"
                      color="white"
                      _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                      minW="8"
                      display={{ base: Math.abs(page - currentPage) <= 2 ? 'flex' : 'none', md: 'flex' }}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <IconButton
                    aria-label="Next page"
                    icon={<ChevronRightIcon />}
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                    _disabled={{ opacity: 0.4 }}
                  />
                </HStack>
              </Box>
            )}
          </VStack>
        )}
      </Container>

      {/* Delete User Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent 
            bg="rgba(255, 255, 255, 0.02)"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="2xl"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete User Account
            </AlertDialogHeader>
            <AlertDialogBody color="text.secondary">
              Are you sure you want to delete {userToDelete?.username}'s account? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={deleteDialog.onClose} 
                variant="ghost" 
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                borderRadius="xl"
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => {
                  if (userToDelete) {
                    handleDeleteUser(userToDelete.id, userToDelete.username);
                  }
                  deleteDialog.onClose();
                }} 
                ml={3}
                borderRadius="xl"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Characters Modal */}
      <Modal isOpen={charactersModal.isOpen} onClose={charactersModal.onClose} size={{ base: 'full', md: 'xl' }} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent 
          bg="rgba(255, 255, 255, 0.02)"
          backdropFilter="blur(20px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderRadius="2xl"
          mx={{ base: 4, md: 0 }}
          my={{ base: 4, md: 0 }}
        >
          <ModalHeader color="white" fontWeight="700">
            {selectedUser?.username}'s Characters
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              {selectedUser?.characters?.map((character) => (
                <Box
                  key={character.id}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  borderRadius="xl"
                  p={4}
                  borderLeftWidth="4px"
                  borderLeftColor={CLASS_COLORS[character.class as keyof typeof CLASS_COLORS]}
                >
                  <Flex align="center" justify="space-between" direction={{ base: 'column', sm: 'row' }} gap={4}>
                    <HStack spacing={4} flex={1} w="full">
                      <Box position="relative">
                        <Image
                          src={CLASS_ICONS[character.class as keyof typeof CLASS_ICONS]}
                          alt={character.class}
                          boxSize="40px"
                          borderRadius="lg"
                          border="2px solid"
                          borderColor="rgba(255, 255, 255, 0.1)"
                        />
                      </Box>
                      <VStack align="flex-start" spacing={1} flex={1}>
                        <HStack spacing={2} flexWrap="wrap">
                          <Text color="white" fontWeight="bold" fontSize="lg">
                            {character.name}
                          </Text>
                          {character.isMain && (
                            <Badge 
                              colorScheme="green" 
                              fontSize="2xs"
                              borderRadius="sm"
                              px={1.5}
                              py={0.5}
                              fontWeight="600"
                              textTransform="uppercase"
                              letterSpacing="0.5px"
                            >
                              Main
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={2} flexWrap="wrap">
                          <Text color="text.secondary" fontSize="sm">{character.race}</Text>
                          <Text color="text.secondary" fontSize="sm">•</Text>
                          <Text 
                            color={CLASS_COLORS[character.class as keyof typeof CLASS_COLORS]} 
                            fontSize="sm"
                            fontWeight="600"
                          >
                            {character.class}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
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
                      borderRadius="lg"
                      _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
                      alignSelf={{ base: 'flex-end', sm: 'center' }}
                    />
                  </Flex>
                </Box>
              ))}
              {(!selectedUser?.characters || selectedUser.characters.length === 0) && (
                <Box textAlign="center" py={8}>
                  <Text color="text.secondary">
                    This user has no characters
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Nickname Edit Modal */}
      <Modal isOpen={nicknameModal.isOpen} onClose={nicknameModal.onClose} size={{ base: 'full', md: 'md' }} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent 
          bg="rgba(255, 255, 255, 0.02)"
          backdropFilter="blur(20px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderRadius="2xl"
          mx={{ base: 4, md: 0 }}
          my={{ base: 4, md: 0 }}
        >
          <ModalHeader color="white" fontWeight="700">
            {selectedUserForNickname?.discordSignupNickname
              ? "Edit Calendar Nickname"
              : "Set Calendar Nickname"}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            <FormControl>
              <FormLabel color="white" fontWeight="600">Calendar Nickname</FormLabel>
              <Input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Enter Calendar nickname"
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.1)"
                color="white"
                borderRadius="xl"
                _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                _focus={{ 
                  borderColor: 'primary.400',
                  boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.4)'
                }}
                fontWeight="500"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={nicknameModal.onClose}
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              borderRadius="xl"
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveDiscordNickname}
              isLoading={isUpdating}
              isDisabled={!newNickname.trim()}
              borderRadius="xl"
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Comprehensive Edit Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size={{ base: 'full', md: 'lg' }} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent 
          bg="rgba(255, 255, 255, 0.02)"
          backdropFilter="blur(20px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          borderRadius="2xl"
          mx={{ base: 4, md: 0 }}
          my={{ base: 4, md: 0 }}
        >
          <ModalHeader color="white" fontWeight="700">
            <HStack spacing={3} align="center">
              {editModalView === 'characters' && (
                <IconButton
                  aria-label="Back to edit"
                  icon={<ArrowBackIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditModalView('edit')}
                  color="white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                />
              )}
              <Text>
                {editModalView === 'edit' 
                  ? `Edit User: ${selectedUserForEdit?.username}`
                  : `${selectedUserForEdit?.username}'s Characters`
                }
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {editModalView === 'edit' ? (
              // Edit Form View
              <VStack spacing={6} align="stretch">
                {/* User Role */}
                <FormControl>
                  <FormLabel color="white" fontWeight="600">User Role</FormLabel>
                  <Select
                    value={selectedUserForEdit?.role || 'member'}
                    onChange={(e) => {
                      if (selectedUserForEdit) {
                        handleRoleChange(selectedUserForEdit.id, selectedUserForEdit.username, e.target.value as 'admin' | 'officer' | 'member');
                      }
                    }}
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    borderRadius="xl"
                    _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    _focus={{ borderColor: 'primary.400' }}
                  >
                    <option value="member">👤 Member</option>
                    <option value="officer">⚔️ Officer</option>
                    <option value="admin">🛡️ Admin</option>
                  </Select>
                </FormControl>

                {/* Raider Status */}
                <FormControl>
                  <FormLabel color="white" fontWeight="600">Raider Status</FormLabel>
                  <HStack spacing={4}>
                    <Button
                      colorScheme={selectedUserForEdit?.confirmedRaider ? "green" : "gray"}
                      variant={selectedUserForEdit?.confirmedRaider ? "solid" : "outline"}
                      onClick={() => {
                        if (selectedUserForEdit) {
                          handleConfirmedRaiderToggle(selectedUserForEdit.id, selectedUserForEdit.username, selectedUserForEdit.confirmedRaider || false);
                        }
                      }}
                      borderRadius="xl"
                      size="sm"
                      flex={1}
                    >
                      {selectedUserForEdit?.confirmedRaider ? "✓ Confirmed Raider" : "⏳ Pending Approval"}
                    </Button>
                  </HStack>
                </FormControl>

                {/* Calendar Nickname */}
                <FormControl>
                  <FormLabel color="white" fontWeight="600">Calendar Nickname</FormLabel>
                  <Input
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Enter Calendar nickname"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    borderRadius="xl"
                    _hover={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    _focus={{ 
                      borderColor: 'primary.400',
                      boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.4)'
                    }}
                    fontWeight="500"
                  />
                  <Text color="rgba(255, 255, 255, 0.6)" fontSize="sm" mt={2}>
                    Current: {selectedUserForEdit?.discordSignupNickname || "Not set"}
                  </Text>
                </FormControl>

                {/* Avatar Management */}
                <FormControl>
                  <FormLabel color="white" fontWeight="600">Avatar</FormLabel>
                  <VStack spacing={3}>
                    <Avatar
                      size="lg"
                      name={selectedUserForEdit?.username}
                      src={selectedUserForEdit?.avatarUrl || defaultAvatar}
                      border="2px solid"
                      borderColor="rgba(255, 255, 255, 0.1)"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => {
                        if (selectedUserForEdit && selectedUserForEdit.avatarUrl) {
                          // Handle avatar removal
                          const userRef = doc(db, 'users', selectedUserForEdit.id);
                          updateDoc(userRef, {
                            avatarUrl: null
                          }).then(() => {
                            setUsers(prevUsers =>
                              prevUsers.map(u =>
                                u.id === selectedUserForEdit.id ? { ...u, avatarUrl: undefined } : u
                              )
                            );
                            if (selectedUserForEdit) {
                              setSelectedUserForEdit(prev => prev ? { ...prev, avatarUrl: undefined } : null);
                            }
                            toast({
                              title: 'Avatar Removed',
                              description: 'User avatar has been removed successfully',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                              position: 'top',
                            });
                          });
                        }
                      }}
                      isDisabled={!selectedUserForEdit?.avatarUrl}
                      borderRadius="lg"
                    >
                      Remove Avatar
                    </Button>
                  </VStack>
                </FormControl>

                {/* Characters Quick Access */}
                <FormControl>
                  <FormLabel color="white" fontWeight="600">Characters</FormLabel>
                  <Button
                    leftIcon={<ViewIcon />}
                    size="sm"
                    variant="outline"
                    onClick={() => setEditModalView('characters')}
                    borderColor="rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
                    borderRadius="xl"
                    w="full"
                  >
                    View & Manage Characters ({selectedUserForEdit?.characters?.length || 0})
                  </Button>
                </FormControl>

                {/* User Stats */}
                <Box
                  bg="rgba(255, 255, 255, 0.02)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.05)"
                  borderRadius="xl"
                  p={4}
                >
                  <Text color="white" fontWeight="600" mb={3}>User Information</Text>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">Email:</Text>
                      <Text color="white" fontSize="sm">{selectedUserForEdit?.email}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">Joined:</Text>
                      <Text color="white" fontSize="sm">{selectedUserForEdit?.createdAt.toLocaleDateString()}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">Characters:</Text>
                      <Text color="white" fontSize="sm">{selectedUserForEdit?.characters?.length || 0}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            ) : (
              // Characters View
              <VStack spacing={4} align="stretch">
                {selectedUserForEdit?.characters?.map((character) => (
                  <Box
                    key={character.id}
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    borderRadius="xl"
                    p={4}
                    borderLeftWidth="4px"
                    borderLeftColor={CLASS_COLORS[character.class as keyof typeof CLASS_COLORS]}
                  >
                    <Flex align="center" justify="space-between" direction={{ base: 'column', sm: 'row' }} gap={4}>
                      <HStack spacing={4} flex={1} w="full">
                        <Box position="relative">
                          <Image
                            src={CLASS_ICONS[character.class as keyof typeof CLASS_ICONS]}
                            alt={character.class}
                            boxSize="40px"
                            borderRadius="lg"
                            border="2px solid"
                            borderColor="rgba(255, 255, 255, 0.1)"
                          />
                        </Box>
                        <VStack align="flex-start" spacing={1} flex={1}>
                          <HStack spacing={2} flexWrap="wrap">
                            <Text color="white" fontWeight="bold" fontSize="lg">
                              {character.name}
                            </Text>
                            {character.isMain && (
                              <Badge 
                                colorScheme="green" 
                                fontSize="2xs"
                                borderRadius="sm"
                                px={1.5}
                                py={0.5}
                                fontWeight="600"
                                textTransform="uppercase"
                                letterSpacing="0.5px"
                              >
                                Main
                              </Badge>
                            )}
                          </HStack>
                          <HStack spacing={2} flexWrap="wrap">
                            <Text color="text.secondary" fontSize="sm">{character.race}</Text>
                            <Text color="text.secondary" fontSize="sm">•</Text>
                            <Text 
                              color={CLASS_COLORS[character.class as keyof typeof CLASS_COLORS]} 
                              fontSize="sm"
                              fontWeight="600"
                            >
                              {character.class}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      <IconButton
                        aria-label="Delete character"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedUserForEdit) {
                            handleDeleteCharacter(
                              selectedUserForEdit.id,
                              character.id,
                              character.name
                            );
                          }
                        }}
                        borderRadius="lg"
                        _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
                      />
                    </Flex>
                  </Box>
                ))}
                {(!selectedUserForEdit?.characters || selectedUserForEdit.characters.length === 0) && (
                  <Box textAlign="center" py={8}>
                    <Text color="text.secondary">
                      This user has no characters
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                editModal.onClose();
                setNewNickname("");
                setEditModalView('edit');
              }}
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
              borderRadius="xl"
            >
              Close
            </Button>
            {editModalView === 'edit' && (
              <Button
                colorScheme="blue"
                onClick={() => {
                  if (selectedUserForEdit && newNickname.trim() !== selectedUserForEdit.discordSignupNickname) {
                    const userRef = doc(db, 'users', selectedUserForEdit.id);
                    updateDoc(userRef, {
                      discordSignupNickname: newNickname.trim()
                    }).then(() => {
                      setUsers(prevUsers =>
                        prevUsers.map(u =>
                          u.id === selectedUserForEdit.id 
                            ? { ...u, discordSignupNickname: newNickname.trim() }
                            : u
                        )
                      );
                      if (selectedUserForEdit) {
                        setSelectedUserForEdit(prev => prev ? { ...prev, discordSignupNickname: newNickname.trim() } : null);
                      }
                      toast({
                        title: 'Calendar Nickname Updated',
                        description: 'User\'s calendar nickname has been updated successfully',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                        position: 'top',
                      });
                    });
                  }
                  editModal.onClose();
                  setNewNickname("");
                  setEditModalView('edit');
                }}
                isLoading={isUpdating}
                borderRadius="xl"
              >
                Save Changes
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageUsers; 