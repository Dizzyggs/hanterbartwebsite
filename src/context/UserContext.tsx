import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from '../types/firebase';
import { useToast } from '@chakra-ui/react';
import defaultAvatar from '../assets/avatar.jpg';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrUser: string | User, password?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

// Helper function to preload avatar images
const preloadAvatar = (avatarUrl: string | undefined) => {
  if (avatarUrl) {
    const img = new Image();
    img.src = avatarUrl;
  }
  // Also preload the default avatar
  const defaultImg = new Image();
  defaultImg.src = defaultAvatar;
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUsername = localStorage.getItem('username');
        if (savedUsername) {
          const userDoc = await getDoc(doc(db, 'users', savedUsername));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            preloadAvatar(userData.avatarUrl);
            setUser(userData);
          } else {
            localStorage.removeItem('username');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        toast({
          title: 'Error loading user data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [toast]);

  const login = async (usernameOrUser: string | User, password?: string) => {
    setIsLoading(true);
    try {
      // Case 1: Login with User object
      if (typeof usernameOrUser !== 'string') {
        const userData = usernameOrUser;
        const now = new Date();
        
        // Update last login time
        await updateDoc(doc(db, 'users', userData.username), {
          lastLogin: now
        });

        // Set user in state with updated lastLogin
        const updatedUserData = {
          ...userData,
          lastLogin: now
        };
        
        preloadAvatar(updatedUserData.avatarUrl);
        setUser(updatedUserData);
        
        localStorage.setItem('username', userData.username);
        
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Case 2: Login with username and password
      if (!password) {
        throw new Error('Password is required for username login');
      }

      const username = usernameOrUser;
      const userDoc = await getDoc(doc(db, 'users', username));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as User;
      if (userData.password !== password) {
        throw new Error('Invalid password');
      }

      // Update last login time
      const now = new Date();
      await updateDoc(doc(db, 'users', username), {
        lastLogin: now
      });

      // Set user in state with updated lastLogin
      const updatedUserData = {
        ...userData,
        lastLogin: now
      };
      
      preloadAvatar(updatedUserData.avatarUrl);
      setUser(updatedUserData);
      
      localStorage.setItem('username', username);
      
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: error instanceof Error ? error.message : 'Login failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('username');
  };

  const updateUser = (updatedUser: User) => {
    preloadAvatar(updatedUser.avatarUrl);
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 