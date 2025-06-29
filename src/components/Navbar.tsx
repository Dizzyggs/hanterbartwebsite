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
  StarIcon,
} from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FaDiscord, FaImage, FaUserCircle } from 'react-icons/fa';
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

  const handleHanterbartClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    if (location.pathname !== '/') {
      setInstantHide(true); // Instantly hide navbar
      // Small delay to ensure navbar hides before navigation
      setTimeout(() => {
        navigate('/');
      }, 50);
    }
  };

  const MobileNavItems = () => (
    <>
      <RouterLink to="/media" onClick={onClose}>
        <HStack spacing={2} className="nav-link">
          <FaImage />
          <Text fontFamily={"Satoshi"} fontWeight={"300"}>Media</Text>
        </HStack>
      </RouterLink>

      {!user && (
        <RouterLink to="/login" onClick={onClose}>
          <HStack spacing={2} className="nav-link">
            <ViewIcon />
            <Text fontFamily={"Satoshi"} fontWeight={"300"}>Logga in</Text>
          </HStack>
        </RouterLink>
      )}

      {user && user.confirmedRaider && (
        <RouterLink to="/calendar" onClick={onClose}>
          <HStack spacing={2} className="nav-link">
            <CalendarIcon />
            <Text fontFamily={"Satoshi"} fontWeight={"300"}>Raids</Text>
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

              <RouterLink to="/admin/raid-settings" onClick={onClose}>
                <HStack spacing={2} className="nav-link">
                  <StarIcon />
                  <Text>Raid Settings</Text>
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
            <Text fontFamily={"Satoshi"} fontWeight={"300"}>Raids</Text>
          </HStack>
        </RouterLink>
      )}
      
      <RouterLink to="/media">
        <HStack spacing={2} className="nav-link">
          <FaImage />
          <Text fontFamily={"Satoshi"} fontWeight={"300"}>Media</Text>
        </HStack>
      </RouterLink>

      {!user && (
        <RouterLink to="/login">
          <HStack spacing={2} className="nav-link">
            <ViewIcon />
            <Text fontFamily={"Satoshi"} fontWeight={"300"}>Logga in</Text>
          </HStack>
        </RouterLink>
      )}
      
      {user && (
        <RouterLink to="/profile">
          <HStack spacing={2} className="nav-link">
            <FaUserCircle />
            <Text fontFamily={"Satoshi"} fontWeight={"300"}>Profile</Text>
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
          <ChakraLink className="nav-link hanterbart-glow" onClick={handleHanterbartClick} cursor="pointer">
            <Text 
              fontSize="xl" 
              fontWeight="bold"
              fontFamily="ClashDisplay"
              style={{ fontWeight: 'bold' }}
            >
              HANTERBART
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
                  fontFamily={"Satoshi"} fontWeight={"600"}
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
                        <Text fontFamily={"Satoshi"} fontWeight={"300"}>Settings</Text>
                      </HStack>
                    </MenuItem>
                  </RouterLink>
                  <MenuItem
                    icon={<ViewIcon color="primary.400" />}
                    onClick={handleLogout}
                    _hover={{ bg: 'background.tertiary' }}
                    bg="background.secondary"
                    color="white"
                    fontFamily={"Satoshi"} fontWeight={"300"}
                  >
                    Logout
                  </MenuItem>

                  {user.role === 'admin' && (
                    <>
                      <MenuDivider borderColor="border.primary" my={2} />
                      <Text color="text.secondary" fontSize="sm" px={3} py={2} >Admin Tools</Text>
                      
                      <RouterLink to="/admin/users">
                        <MenuItem
                          icon={<LockIcon color="primary.400" />}
                          _hover={{ bg: 'background.tertiary' }}
                          bg="background.secondary"
                          color="white"
                          fontFamily={"Satoshi"} fontWeight={"300"}
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
                      <RouterLink to="/admin/raid-settings">
                        <MenuItem
                          icon={<SettingsIcon color="primary.400" />}
                          _hover={{ bg: 'background.tertiary' }}
                          bg="background.secondary"
                          color="white"
                          fontFamily={"Satoshi"} fontWeight={"300"}
                        >
                          Raid Settings
                        </MenuItem>
                      </RouterLink>
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