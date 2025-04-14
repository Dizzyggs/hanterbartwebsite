import { MenuItem, MenuList, Menu, MenuButton, Button } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface SubMenuProps {
  label: string;
  children: React.ReactNode;
}

export const SubMenu = ({ label, children }: SubMenuProps) => {
  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        size="sm"
        bg="background.secondary"
        color="text.primary"
        _hover={{ bg: 'background.tertiary' }}
        _active={{ bg: 'background.tertiary' }}
        width="100%"
        justifyContent="flex-start"
      >
        {label}
      </MenuButton>
      <MenuList
        bg="background.secondary"
        borderColor="border.primary"
        boxShadow="dark-lg"
      >
        {children}
      </MenuList>
    </Menu>
  );
}; 