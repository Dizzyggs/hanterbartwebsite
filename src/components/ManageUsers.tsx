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
  useColorModeValue,
  IconButton,
  Input,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useToast
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  dateAdded: string;
  teams: string[];
  discordNickname?: string;
}

export const ManageUsers = () => {
  const borderColor = useColorModeValue("border.primary", "border.primary");
  const hoverBg = useColorModeValue("background.hover", "background.hover");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newNickname, setNewNickname] = useState("");
  const toast = useToast();

  // Example data - replace with your actual data
  const users: User[] = [
    {
      id: "1",
      name: "Olivia Rhye",
      email: "olivia@untitledui.com",
      dateAdded: "Feb 22, 2022",
      teams: ["Design", "Product", "Marketing"],
      discordNickname: "Olivia.R"
    },
    {
      id: "2",
      name: "Phoenix Baker",
      email: "phoenix@untitledui.com",
      dateAdded: "Feb 22, 2022",
      teams: ["Design", "Product", "Software Engineering"]
    }
  ];

  const handleEditNickname = (user: User) => {
    setSelectedUser(user);
    setNewNickname(user.discordNickname || "");
    onOpen();
  };

  const handleSaveNickname = async () => {
    if (!selectedUser) return;

    try {
      // TODO: Implement the actual API call to update the nickname
      // await updateUserDiscordNickname(selectedUser.id, newNickname);
      
      toast({
        title: "Nickname updated",
        description: "Calendar nickname has been successfully updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error updating nickname",
        description: "Failed to update Calendar nickname. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box overflowX="auto">
      <Table variant="unstyled">
        <Thead>
          <Tr>
            <Th px={4} py={3} width="40px">
              <Checkbox colorScheme="blue" />
            </Th>
            <Th px={4} py={3} color="text.secondary">Name</Th>
            <Th px={4} py={3} color="text.secondary">Calendar Nickname</Th>
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
              <Td px={4} py={3}>
                <HStack spacing={2}>
                  <Text color="text.primary">
                    {user.discordNickname || "Not set"}
                  </Text>
                  <IconButton
                    aria-label="Edit Calendar nickname"
                    icon={<EditIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditNickname(user)}
                  />
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

      {/* Edit Nickname Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="background.primary">
          <ModalHeader color="text.primary">
            {selectedUser?.discordNickname 
              ? "Edit Calendar Nickname" 
              : "Set Calendar Nickname"}
          </ModalHeader>
          <ModalBody>
            <Input
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="Enter calendar nickname"
              bg="background.secondary"
              border="1px solid"
              borderColor="border.primary"
              _hover={{ borderColor: "border.hover" }}
              color="text.primary"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSaveNickname}
              isDisabled={!newNickname.trim()}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 