import { Box, HStack, Icon } from '@chakra-ui/react';
import { InfoIcon, CheckIcon, WarningIcon, LockIcon } from '@chakra-ui/icons';
import { UseToastOptions } from '@chakra-ui/react';

interface CustomToastProps {
  title: string;
  description?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
}

const getStatusIcon = (status: 'info' | 'success' | 'warning' | 'error') => {
  switch (status) {
    case 'success':
      return { icon: CheckIcon, color: 'green.400' };
    case 'error':
      return { icon: LockIcon, color: 'red.400' };
    case 'warning':
      return { icon: WarningIcon, color: 'orange.400' };
    case 'info':
    default:
      return { icon: InfoIcon, color: 'blue.400' };
  }
};

export const createStyledToast = ({ title, description, status = 'info' }: CustomToastProps): UseToastOptions => {
  const { icon: StatusIcon, color } = getStatusIcon(status);

  return {
    position: 'top',
    duration: 4000,
    render: () => (
      <Box
        color='text.primary'
        p={4}
        bg='background.tertiary'
        borderRadius='xl'
        boxShadow='dark-lg'
        border='1px solid'
        borderColor='border.secondary'
        mx="auto"
        maxW="md"
      >
        <HStack spacing={3}>
          <Icon as={StatusIcon} w={5} h={5} color={color} />
          <Box>
            <Box fontWeight='bold' mb={0.5}>{title}</Box>
            {description && (
              <Box fontSize='sm' color='text.secondary'>{description}</Box>
            )}
          </Box>
        </HStack>
      </Box>
    )
  };
};

// Helper function to migrate existing toasts
export const migrateExistingToast = (options: UseToastOptions): UseToastOptions => {
  return createStyledToast({
    title: typeof options.title === 'string' ? options.title : 'Notification',
    description: typeof options.description === 'string' ? options.description : undefined,
    status: (options.status || 'info') as 'info' | 'success' | 'warning' | 'error'
  });
}; 