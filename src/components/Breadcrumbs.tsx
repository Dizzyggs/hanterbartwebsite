import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useTheme } from '../context/ThemeContext';

interface BreadcrumbsProps {
  items?: { label: string; path: string }[];
}

const routeLabels: { [key: string]: string } = {
  '/profile': 'Profile',
  '/calendar': 'Raids',
  '/media': 'Media',
  '/admin/users': 'Manage users',
  '/admin/audit-logs': 'Logs',
};

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const { currentTheme } = useTheme();
  const isNeonTheme = currentTheme === 'neon';

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') return null;

  // Use provided items or generate from current path
  const breadcrumbItems = items || pathSegments.reduce((acc, segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    
    // Skip the 'admin' segment in the breadcrumb display
    if (segment === 'admin') {
      return acc;
    }
    
    return [...acc, {
      label: routeLabels[path] || segment,
      path: path,
    }];
  }, [] as { label: string; path: string }[]);

  return (
    <Breadcrumb
      spacing='8px'
      separator={<ChevronRightIcon color={isNeonTheme ? "primary.400" : "white"} />}
      mb={8}
      color={isNeonTheme ? "primary.400" : "white"}
      fontSize="md"
      fontFamily={"Satoshi"} fontWeight={"300"}
      position="relative"
      zIndex={2}
      textShadow={isNeonTheme ? "0 0 10px currentColor" : "none"}
    >
      <BreadcrumbItem>
        <BreadcrumbLink
          as={RouterLink}
          to="/"
          color={isNeonTheme ? "primary.400" : "white"}
          _hover={{
            textDecoration: 'none',
            opacity: 0.8,
            textShadow: isNeonTheme ? "0 0 15px currentColor" : "none"
          }}
        >
          Home
        </BreadcrumbLink>
      </BreadcrumbItem>
      {breadcrumbItems.map((item, index) => (
        <BreadcrumbItem key={item.path} isCurrentPage={index === breadcrumbItems.length - 1}>
          {index === breadcrumbItems.length - 1 ? (
            <Text 
              color={isNeonTheme ? "primary.400" : "white"} 
              opacity={0.8}
              textShadow={isNeonTheme ? "0 0 10px currentColor" : "none"}
            >
              {item.label}
            </Text>
          ) : (
            <BreadcrumbLink
              as={RouterLink}
              to={item.path}
              color={isNeonTheme ? "primary.400" : "white"}
              _hover={{
                textDecoration: 'none',
                opacity: 0.8,
                textShadow: isNeonTheme ? "0 0 15px currentColor" : "none"
              }}
            >
              {item.label}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};

export default Breadcrumbs; 