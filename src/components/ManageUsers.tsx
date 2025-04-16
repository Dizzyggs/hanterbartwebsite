import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  HStack,
  Avatar,
  VStack,
  Text,
  Tag,
  useColorModeValue
} from "@chakra-ui/react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dateAdded: string;
  teams: string[];
}

export const ManageUsers = () => {
  const borderColor = useColorModeValue("border.primary", "border.primary");
  const hoverBg = useColorModeValue("background.hover", "background.hover");

  // Example data - replace with your actual data
  const users: User[] = [
    {
      id: "1",
      name: "Olivia Rhye",
      email: "olivia@untitledui.com",
      dateAdded: "Feb 22, 2022",
      teams: ["Design", "Product", "Marketing"]
    },
    {
      id: "2",
      name: "Phoenix Baker",
      email: "phoenix@untitledui.com",
      dateAdded: "Feb 22, 2022",
      teams: ["Design", "Product", "Software Engineering"]
    }
  ];

  return (
    <Box>
      <Box position="relative" maxH="20rem" overflowY="auto" overflowX="auto">
        <Table variant="unstyled" position="relative">
          <Thead position="sticky" top={0} zIndex={1} bg="background.primary">
            <Tr>
              <Th px={4} py={3} width="40px">
                <Checkbox colorScheme="blue" />
              </Th>
              <Th px={4} py={3} color="text.secondary">Name</Th>
              <Th px={4} py={3} color="text.secondary">Date added</Th>
              <Th px={4} py={3} color="text.secondary">Teams</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr
                key={user.id}
                _hover={{ bg: hoverBg }}
                transition="background-color 0.2s"
                borderBottom="1px solid"
                borderColor={borderColor}
              >
                <Td px={4} py={3} width="40px">
                  <Checkbox colorScheme="blue" />
                </Td>
                <Td px={4} py={3}>
                  <HStack spacing={3}>
                    <Avatar
                      size="sm"
                      name={user.name}
                      src={user.avatar}
                    />
                    <VStack spacing={0.5} align="flex-start">
                      <Text color="text.primary" fontWeight="medium">
                        {user.name}
                      </Text>
                      <Text color="text.secondary" fontSize="sm">
                        {user.email}
                      </Text>
                    </VStack>
                  </HStack>
                </Td>
                <Td px={4} py={3} color="text.secondary">
                  {user.dateAdded}
                </Td>
                <Td px={4} py={3}>
                  <HStack spacing={2}>
                    {user.teams.map((team) => (
                      <Tag
                        key={team}
                        size="sm"
                        borderRadius="md"
                        bg="background.secondary"
                        color="text.primary"
                        px={3}
                        py={1}
                      >
                        {team}
                      </Tag>
                    ))}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}; 