import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import { createStyledToast } from '../utils/toast';

interface RaiderRouteProps {
  children: ReactNode;
}

const RaiderRoute = ({ children }: RaiderRouteProps) => {
  const { user, isLoading } = useUser();
  const toast = useToast();

  if (isLoading) {
    // Return null or a loading spinner while checking auth state
    return null;
  }

  if (!user) {
    toast(createStyledToast({
      title: 'Access Denied',
      description: 'Please log in to access this page',
      status: 'error'
    }));
    return <Navigate to="/login" replace />;
  }

  if (!user.confirmedRaider) {
    toast(createStyledToast({
      title: 'Access Denied',
      description: 'Only confirmed raiders can access this page',
      status: 'warning'
    }));
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RaiderRoute; 