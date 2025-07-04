import { StarIcon, EditIcon, DeleteIcon, InfoIcon, LockIcon, CalendarIcon } from '@chakra-ui/icons';
import { Text } from '@chakra-ui/react';

export const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
      return 'green';
    case 'update':
      return 'blue';
    case 'delete':
      return 'red';
    default:
      return 'gray';
  }
};

export const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
      return <StarIcon />;
    case 'update':
      return <EditIcon />;
    case 'delete':
      return <DeleteIcon />;
    default:
      return <InfoIcon />;
  }
};

export const getTargetTypeIcon = (targetType: string) => {
  switch (targetType.toLowerCase()) {
    case 'user':
      return <LockIcon />;
    case 'event':
      return <CalendarIcon />;
    case 'character':
      return <StarIcon />;
    default:
      return <InfoIcon />;
  }
};

export const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

export const renderDetails = (details: string) => {
  if (!details) return null;
  
  const parts = details.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text as="span" fontWeight="bold" color="primary.300" key={index}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text as="span" key={index}>{part}</Text>;
  });
}; 