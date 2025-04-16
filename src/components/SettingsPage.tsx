import { Box, VStack, Heading, Text, Button, useColorModeValue, Container, Icon, HStack, Badge, Flex, Grid, Input, InputGroup, InputRightElement, IconButton, SimpleGrid } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaDiscord, FaShieldAlt, FaBell } from "react-icons/fa";
import { MdSettings, MdPerson, MdSecurity, MdNotifications, MdLink } from "react-icons/md";
import { IconType } from "react-icons";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { HiLightBulb } from "react-icons/hi";

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const SettingsPage = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const bgColor = useColorModeValue("background.primary", "background.primary");
  const borderColor = useColorModeValue("border.primary", "border.primary");
  const hoverBg = useColorModeValue("background.hover", "background.hover");

  return (
    <Box 
      minH="calc(100vh - 64px)" 
      bg="background.primary" 
      backgroundImage="radial-gradient(circle at 10% 20%, rgba(0, 0, 255, 0.05) 0%, transparent 40%)"
    >
      <Container maxW="container.xl" py={12}>
        {/* Header Section with Gradient */}
        <Box
          mb={12}
          p={8}
          borderRadius="2xl"
          bg="linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(146, 0, 255, 0.1) 100%)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(10px)"
        >
          <Flex direction={{ base: "column", md: "row" }} align="center" justify="space-between">
            <HStack spacing={4}>
              <Box
                p={3}
                borderRadius="full"
                bg="blue.500"
                color="white"
                animation={`${pulseAnimation} 2s infinite`}
              >
                <Icon as={MdSettings} boxSize={8} />
              </Box>
              <Box>
                <Heading size="xl" color="text.primary" mb={2}>Settings</Heading>
                <Text color="text.secondary" fontSize="lg">
                  Customize your raid management experience
                </Text>
              </Box>
            </HStack>
            <Button
              mt={{ base: 4, md: 0 }}
              size="lg"
              bg="transparent"
              border="2px solid"
              borderColor="blue.400"
              color="blue.400"
              _hover={{ bg: "blue.400", color: "white" }}
              leftIcon={<MdPerson />}
            >
              View Profile
            </Button>
          </Flex>
        </Box>

        {/* Main Content */}
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={8}
        >
          {/* Account Settings */}
          <Box>
            <Heading size="lg" color="blue.400" mb={8}>
              Account settings
            </Heading>

            {/* Change Username */}
            <Box mb={8}>
              <Heading size="md" color="text.primary" mb={4}>
                Change username
              </Heading>
              <Text color="text.secondary" mb={2}>
                Current: dizzy
              </Text>
              <Text color="text.primary" mb={2}>
                New username
              </Text>
              <Input
                placeholder="Enter new username"
                bg="background.secondary"
                border="1px solid"
                borderColor="border.primary"
                _hover={{ borderColor: "border.hover" }}
                mb={4}
              />
              <Button colorScheme="blue" width="100%">
                Update username
              </Button>
            </Box>

            {/* Change Password */}
            <Box>
              <Heading size="md" color="text.primary" mb={4}>
                Change password
              </Heading>
              <VStack spacing={4}>
                <Box width="100%">
                  <Text color="text.primary" mb={2}>
                    Current password
                  </Text>
                  <InputGroup>
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      bg="background.secondary"
                      border="1px solid"
                      borderColor="border.primary"
                      _hover={{ borderColor: "border.hover" }}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                        icon={showCurrentPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        color="text.secondary"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </Box>

                <Box width="100%">
                  <Text color="text.primary" mb={2}>
                    New password
                  </Text>
                  <InputGroup>
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      bg="background.secondary"
                      border="1px solid"
                      borderColor="border.primary"
                      _hover={{ borderColor: "border.hover" }}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                        icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        color="text.secondary"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </Box>

                <Box width="100%">
                  <Text color="text.primary" mb={2}>
                    Confirm new password
                  </Text>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      bg="background.secondary"
                      border="1px solid"
                      borderColor="border.primary"
                      _hover={{ borderColor: "border.hover" }}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        color="text.secondary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </Box>

                <Button colorScheme="blue" width="100%">
                  Update password
                </Button>
              </VStack>
            </Box>
          </Box>

          {/* Theme Settings */}
          <Box>
            <Heading size="lg" color="blue.400" mb={8}>
              Theme settings
            </Heading>
            <Text color="text.secondary" mb={6}>
              Select a theme that best suits you. The theme will be applied to the entire website.
            </Text>
            <SimpleGrid columns={2} spacing={4}>
              <ThemeOption
                name="Default"
                icon={FaSun}
                isSelected={true}
              />
              <ThemeOption
                name="Frost"
                icon={FaMoon}
                isSelected={false}
              />
              <ThemeOption
                name="Ember"
                icon={FaSun}
                isSelected={false}
              />
              <ThemeOption
                name="Neon"
                icon={HiLightBulb}
                isSelected={false}
              />
            </SimpleGrid>
          </Box>
        </Grid>
      </Container>
    </Box>
  );
};

interface StatusCardProps {
  icon: IconType;
  title: string;
  status: string;
  statusColor: string;
  metric: string;
}

const StatusCard = ({ icon, title, status, statusColor, metric }: StatusCardProps) => (
  <Box
    p={6}
    bg="background.secondary"
    borderRadius="xl"
    border="1px solid"
    borderColor="border.primary"
  >
    <HStack spacing={4} mb={4}>
      <Icon as={icon} boxSize={6} color={`${statusColor}.400`} />
      <Heading size="md" color="text.primary">{title}</Heading>
    </HStack>
    <VStack align="flex-start" spacing={2}>
      <Badge colorScheme={statusColor}>{status}</Badge>
      <Text color="text.secondary" fontSize="sm">{metric}</Text>
    </VStack>
  </Box>
);

interface ThemeOptionProps {
  name: string;
  icon: any;
  isSelected: boolean;
}

const ThemeOption = ({ name, icon: Icon, isSelected }: ThemeOptionProps) => (
  <Button
    height="100px"
    width="100%"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    gap={2}
    variant="outline"
    borderWidth={2}
    borderColor={isSelected ? "blue.400" : "border.primary"}
    bg="background.secondary"
    _hover={{ borderColor: "blue.400" }}
    transition="all 0.2s"
  >
    <Icon size={24} />
    <Text>{name}</Text>
  </Button>
); 