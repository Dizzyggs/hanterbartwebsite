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
  Badge,
  Avatar,
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
  StarIcon,
} from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FaDiscord, FaHome, FaImage, FaUserCircle } from 'react-icons/fa';
import { raidHelperService } from '../services/raidhelper';
import { useNavbarVisibility } from '../context/NavbarVisibilityContext';

const discordInviteLink = 'https://discord.gg/rBNWd8zM';

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { setNavbarVisible, setInstantHide } = useNavbarVisibility();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const ModernNavLink = ({ children, to, onClick, isActive = false }: any) => (
    <Box
      as={RouterLink}
      to={to}
      onClick={onClick}
      px={4}
      py={2}
      borderRadius="lg"
      position="relative"
      transition="all 0.2s ease"
      cursor="pointer"
      fontFamily="Inter, system-ui"
      fontWeight="500"
      color={isActive ? "white" : "rgba(255, 255, 255, 0.8)"}
      fontSize="sm"
    >
      <HStack spacing={2} align="center">
        {children}
        {isActive && (
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg="green.400"
            _dark={{
              bg: "green.400"
            }}
            _light={{
              bg: "blue.500"
            }}
            flexShrink={0}
          />
        )}
      </HStack>
    </Box>
  );

  const ModernExternalLink = ({ children, href }: any) => (
    <Box
      as={ChakraLink}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      px={4}
      py={2}
      borderRadius="lg"
      transition="all 0.2s ease"
      cursor="pointer"
      fontFamily="Inter, system-ui"
      fontWeight="500"
      color="rgba(255, 255, 255, 0.8)"
      fontSize="sm"
    >
      {children}
    </Box>
  );

  const MobileNavItems = () => (
    <VStack spacing={1} align="stretch" >
      
      <ModernNavLink to="/media" onClick={onClose}>
        <HStack spacing={3}>
          <Box color="blue.500">
            <FaImage size={18} />
          </Box>
          <Text>Media</Text>
        </HStack>
      </ModernNavLink>

      {!user && (
        <ModernNavLink to="/login" onClick={onClose}>
          <HStack spacing={3}>
            <Box color="green.500">
              <ViewIcon />
            </Box>
            <Text>Login</Text>
          </HStack>
        </ModernNavLink>
      )}

      {user && user.confirmedRaider && (
        <ModernNavLink to="/calendar" onClick={onClose}>
          <HStack spacing={3}>
            <Box color="orange.500">
              <CalendarIcon />
            </Box>
            <Text>Raids</Text>
          </HStack>
        </ModernNavLink>
      )}

      {user && (
        <ModernNavLink to="/profile" onClick={onClose}>
          <HStack spacing={3}>
            <Box color="purple.500">
              <FaUserCircle size={18} />
            </Box>
            <Text>Profile</Text>
          </HStack>
        </ModernNavLink>
      )}

      {user && (
        <>
          <ModernNavLink to="/settings" onClick={onClose}>
            <HStack spacing={3}>
              <Box color="gray.500">
                <SettingsIcon />
              </Box>
              <Text>Settings</Text>
            </HStack>
          </ModernNavLink>

          <Box
            px={4}
            py={2}
            borderRadius="lg"
            transition="all 0.2s ease"
            cursor="pointer"
            fontFamily="Inter, system-ui"
            fontWeight="500"
            fontSize="sm"
            color="red.300"
            onClick={() => {
              handleLogout();
              onClose();
            }}
          >
            <HStack spacing={3}>
              <Box color="red.400">
                <ViewIcon />
              </Box>
              <Text>Logout</Text>
            </HStack>
          </Box>

          {user.role === 'admin' && (
            <>
              <Divider my={4} borderColor="rgba(255, 255, 255, 0.1)" />
              <Text 
                color="gray.400" 
                fontSize="xs" 
                fontWeight="600" 
                textTransform="uppercase" 
                letterSpacing="wider" 
                px={4}
              >
                Admin
              </Text>
              
              <ModernNavLink to="/admin/users" onClick={onClose}>
                <HStack spacing={3}>
                  <Box color="red.500">
                    <LockIcon />
                  </Box>
                  <Text>Manage Users</Text>
                </HStack>
              </ModernNavLink>

              <ModernNavLink to="/admin/audit-logs" onClick={onClose}>
                <HStack spacing={3}>
                  <Box color="indigo.500">
                    <TimeIcon />
                  </Box>
                  <Text>Audit Logs</Text>
                </HStack>
              </ModernNavLink>

              <ModernNavLink to="/admin/raid-settings" onClick={onClose}>
                <HStack spacing={3}>
                  <Box color="yellow.500">
                    <StarIcon />
                  </Box>
                  <Text>Raid Settings</Text>
                </HStack>
              </ModernNavLink>
            </>
          )}
        </>
      )}

      <Divider my={4} borderColor="gray.600" />
      
      <ModernExternalLink href={discordInviteLink}>
        <HStack spacing={3}>
          <Box color="#5865f2">
            <FaDiscord size={18} />
          </Box>
          <Text>Join Discord</Text>
        </HStack>
      </ModernExternalLink>
    </VStack>
  );

  const DesktopNavItems = () => (
    <HStack spacing={1}>

    <ModernNavLink to="/" isActive={location.pathname === '/'}>
      <HStack spacing={2}>
        <FaHome />
        <Text>Home</Text>
      </HStack>
    </ModernNavLink>

      {user && user.confirmedRaider && (
        <ModernNavLink to="/calendar" isActive={location.pathname === '/calendar'}>
          <HStack spacing={2}>
            <CalendarIcon />
            <Text>Raids</Text>
          </HStack>
        </ModernNavLink>
      )}
      
      <ModernNavLink to="/media" isActive={location.pathname === '/media'}>
        <HStack spacing={2}>
          <FaImage />
          <Text>Media</Text>
        </HStack>
      </ModernNavLink>

      {!user && (
        <ModernNavLink to="/login" isActive={location.pathname === '/login'}>
          <HStack spacing={2}>
            <ViewIcon />
            <Text>Login</Text>
          </HStack>
        </ModernNavLink>
      )}
      
      {user && (
        <ModernNavLink to="/profile" isActive={location.pathname === '/profile'}>
          <HStack spacing={2}>
            <FaUserCircle />
            <Text>Profile</Text>
          </HStack>
        </ModernNavLink>
      )}


    </HStack>
  );

  return (
    <Box 
      position="fixed" 
      top={4}
      left="50%"
      transform="translateX(-50%)"
      zIndex={1000}
      bg="rgba(0, 0, 0, 0.6)"
      width="fit-content"
      px={6}
      py={3}
      borderRadius="full"
      backdropFilter="blur(20px) saturate(180%)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
      boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "full",
        padding: "1px",
        background: "rgba(11, 11, 13, 0.75)",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "xor",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        pointerEvents: "none",
      }}
    >
      <Flex h={10} alignItems="center" justifyContent="center" gap={6}>
        {isMobile ? (
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            variant="ghost"
            size="sm"
            color="white"
          />
        ) : (
          <>
            {/* Desktop navigation items */}
            <DesktopNavItems />
            
            {/* User menu */}
            {user && (
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  variant="ghost"
                  size="sm"
                  fontFamily="Inter, system-ui" 
                  fontWeight="500"
                  color="white"
                  ml={2}
                >
                  <HStack spacing={2}>
                    <Avatar size="xs" name={user.username} />
                    <Text>{user.username}</Text>
                  </HStack>
                </MenuButton>
                <MenuList 
                  bg="rgba(20, 20, 25, 0.95)"
                  backdropFilter="blur(20px)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  borderRadius="lg"
                  boxShadow="0 8px 32px rgba(0, 0, 0, 0.5)"
                >
                  <RouterLink to="/settings">
                    <MenuItem
                      fontFamily="Inter, system-ui"
                      color="white"
                      bg="transparent"
                    >
                      <HStack spacing={3}>
                        <SettingsIcon color="gray.400" />
                        <Text>Settings</Text>
                      </HStack>
                    </MenuItem>
                  </RouterLink>
                  
                  <MenuItem
                    onClick={handleLogout}
                    fontFamily="Inter, system-ui"
                    color="red.300"
                    bg="transparent"
                  >
                    <HStack spacing={3}>
                      <ViewIcon />
                      <Text>Logout</Text>
                    </HStack>
                  </MenuItem>

                  {user.role === 'admin' && (
                    <>
                      <MenuDivider borderColor="rgba(255, 255, 255, 0.1)" />
                      <Text color="gray.400" fontSize="xs" px={3} py={1} fontWeight="600" textTransform="uppercase" letterSpacing="wider">
                        Admin
                      </Text>
                      
                      <RouterLink to="/admin/users">
                        <MenuItem
                          fontFamily="Inter, system-ui"
                          color="white"
                          bg="transparent"
                        >
                          <HStack spacing={3}>
                            <LockIcon color="red.400" />
                            <Text>Manage Users</Text>
                          </HStack>
                        </MenuItem>
                      </RouterLink>
                      
                      <RouterLink to="/admin/audit-logs">
                        <MenuItem
                          fontFamily="Inter, system-ui"
                          color="white"
                          bg="transparent"
                        >
                          <HStack spacing={3}>
                            <TimeIcon color="indigo.400" />
                            <Text>Audit Logs</Text>
                          </HStack>
                        </MenuItem>
                      </RouterLink>
                      
                      <RouterLink to="/admin/raid-settings">
                        <MenuItem
                          fontFamily="Inter, system-ui"
                          color="white"
                          bg="transparent"
                        >
                          <HStack spacing={3}>
                            <StarIcon color="yellow.400" />
                            <Text>Raid Settings</Text>
                          </HStack>
                        </MenuItem>
                      </RouterLink>
                    </>
                  )}
                </MenuList>
              </Menu>
            )}
          </>
        )}
        
        <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent 
            bg="rgba(0, 0, 0, 0.9)"
            backdropFilter="blur(20px)"
          >
            <DrawerCloseButton color="white" />
            <DrawerHeader 
              borderBottomWidth="1px" 
              borderColor="rgba(255, 255, 255, 0.1)"
              fontFamily="Inter, system-ui"
              fontWeight="600"
              color="white"
            >
              Navigation
            </DrawerHeader>
            <DrawerBody py={4}>
              <MobileNavItems />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Box>
  );
};

export default Navbar; 