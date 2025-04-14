import {
  Box,
  Flex,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Text,
  MenuDivider,
  Link as ChakraLink,
  HStack,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useBreakpointValue,
  Divider,
} from '@chakra-ui/react';
import { 
  HamburgerIcon, 
  CalendarIcon, 
  SettingsIcon,
  InfoIcon,
  ViewIcon,
  TimeIcon,
  LockIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FaDiscord, FaImage, FaUserCircle } from 'react-icons/fa';
import { raidHelperService } from '../services/raidhelper';

const discordInviteLink = 'https://discord.gg/rBNWd8zM';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const testRaidHelper = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const testEvent = {
        title: "Test Raid Event",
        description: "This is a test raid event created via API",
        date: tomorrow.toISOString().split('T')[0],
        time: "20:00",
        leaderId: "184485021719986176",
        templateId: "wowclassic",
        size: 25,
        roles: {
          tank: 2,
          healer: 5,
          dps: 18
        }
      };

      const result = await raidHelperService.createEvent(testEvent);
      console.log('Event created:', result);
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const MobileNavItems = () => (
    <>
      <RouterLink to="/media" onClick={onClose}>
        <HStack spacing={2} className="nav-link">
          <FaImage />
          <Text>Media</Text>
        </HStack>
      </RouterLink>

      {!user && (
        <RouterLink to="/login" onClick={onClose}>
          <HStack spacing={2} className="nav-link">
            <ViewIcon />
            <Text>Logga in</Text>
          </HStack>
        </RouterLink>
      )}

      {user && user.confirmedRaider && (
        <RouterLink to="/calendar" onClick={onClose}>
          <HStack spacing={2} className="nav-link">
            <CalendarIcon />
            <Text>Raids</Text>
          </HStack>
        </RouterLink>
      )}

      {user && (
        <RouterLink to="/profile" onClick={onClose}>
          <HStack spacing={2} className="nav-link">
            <FaUserCircle />
            <Text>Profil</Text>
          </HStack>
        </RouterLink>
      )}

      {user && (
        <>
          <RouterLink to="/settings" onClick={onClose}>
            <HStack spacing={2} className="nav-link">
              <SettingsIcon />
              <Text>Inställningar</Text>
            </HStack>
          </RouterLink>

          <HStack 
            spacing={2} 
            className="nav-link"
            cursor="pointer"
            onClick={() => {
              handleLogout();
              onClose();
            }}
          >
            <ViewIcon />
            <Text>Logga ut</Text>
          </HStack>

          {user.role === 'admin' && (
            <>
              <Divider borderColor="border.primary" my={4} />
              <Text color="text.secondary" fontSize="sm">Admin Tools</Text>
              
              <RouterLink to="/admin/users" onClick={onClose}>
                <HStack spacing={2} className="nav-link">
                  <LockIcon />
                  <Text>Manage Users</Text>
                </HStack>
              </RouterLink>

              <RouterLink to="/admin/audit-logs" onClick={onClose}>
                <HStack spacing={2} className="nav-link">
                  <TimeIcon />
                  <Text>Audit Logs</Text>
                </HStack>
              </RouterLink>
            </>
          )}
        </>
      )}

      <IconButton
        as={ChakraLink}
        href={discordInviteLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join Discord Server"
        icon={<FaDiscord />}
        colorScheme="blue"
        variant="ghost"
        fontSize="20px"
        className="nav-link"
      />
    </>
  );

  const DesktopNavItems = () => (
    <>
      {user && user.confirmedRaider && (
        <RouterLink to="/calendar">
          <HStack spacing={2} className="nav-link">
            <CalendarIcon />
            <Text>Raids</Text>
          </HStack>
        </RouterLink>
      )}
      
      <RouterLink to="/media">
        <HStack spacing={2} className="nav-link">
          <FaImage />
          <Text>Media</Text>
        </HStack>
      </RouterLink>

      {!user && (
        <RouterLink to="/login">
          <HStack spacing={2} className="nav-link">
            <ViewIcon />
            <Text>Logga in</Text>
          </HStack>
        </RouterLink>
      )}
      
      {user && (
        <RouterLink to="/profile">
          <HStack spacing={2} className="nav-link">
            <FaUserCircle />
            <Text>Profile</Text>
          </HStack>
        </RouterLink>
      )}
      


      <IconButton
        as={ChakraLink}
        href={discordInviteLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join Discord Server"
        icon={<FaDiscord />}
        colorScheme="blue"
        variant="ghost"
        fontSize="20px"
        className="nav-link"
      />
    </>
  );

  return (
    <Box bg="background.primary" px={4} position="sticky" top={0} zIndex={100}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={8} alignItems="center">
          <ChakraLink as={RouterLink} to="/" className="nav-link">
            <Text fontSize="xl" fontWeight="bold">
              Hanterbart
            </Text>
          </ChakraLink>
        </HStack>

        {isMobile ? (
          <>
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              onClick={onOpen}
              variant="ghost"
              color="text.primary"
            />
            <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
              <DrawerOverlay backdropFilter="blur(10px)" />
              <DrawerContent bg="background.secondary">
                <DrawerCloseButton color="text.primary" />
                <DrawerHeader borderBottomWidth="1px" borderColor="border.primary">
                  Menu
                </DrawerHeader>
                <DrawerBody>
                  <VStack align="stretch" spacing={4} mt={4}>
                    <MobileNavItems />
                  </VStack>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <Flex alignItems="center" gap={4}>
            <DesktopNavItems />
            {user && (
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  variant="ghost"
                  color="text.primary"
                >
                  {user.username}
                </MenuButton>
                <MenuList bg="background.secondary" borderColor="border.primary">
                  <RouterLink to="/settings">
                    <MenuItem
                      _hover={{ bg: 'background.tertiary' }}
                      bg="background.secondary"
                      color="text.primary"
                    >
                      <HStack>
                        <SettingsIcon />
                        <Text>Settings</Text>
                      </HStack>
                    </MenuItem>
                  </RouterLink>
                  <MenuItem
                    icon={<ViewIcon color="primary.400" />}
                    onClick={handleLogout}
                    _hover={{ bg: 'background.tertiary' }}
                    bg="background.secondary"
                    color="white"
                  >
                    Logout
                  </MenuItem>

                  {user.role === 'admin' && (
                    <>
                      <MenuDivider borderColor="border.primary" my={2} />
                      <Text color="text.secondary" fontSize="sm" px={3} py={2}>Admin Tools</Text>
                      
                      <RouterLink to="/admin/users">
                        <MenuItem
                          icon={<LockIcon color="primary.400" />}
                          _hover={{ bg: 'background.tertiary' }}
                          bg="background.secondary"
                          color="white"
                        >
                          Manage Users
                        </MenuItem>
                      </RouterLink>
                      <RouterLink to="/admin/audit-logs">
                        <MenuItem
                          icon={<TimeIcon color="primary.400" />}
                          _hover={{ bg: 'background.tertiary' }}
                          bg="background.secondary"
                          color="white"
                        >
                          Audit Logs
                        </MenuItem>
                      </RouterLink>
                      <MenuItem
                        _hover={{ bg: 'background.tertiary' }}
                        bg="background.secondary"
                        color="text.primary"
                        onClick={testRaidHelper}
                      >
                      </MenuItem>
                    </>
                  )}
                </MenuList>
              </Menu>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default Navbar; 