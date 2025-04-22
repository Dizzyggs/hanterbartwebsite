import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Calendar from './components/Calendar';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Media from './components/Media';
import { Box, Flex } from '@chakra-ui/react';
import { UserProvider, useUser } from './context/UserContext';
import AuditLogs from './components/admin/AuditLogs';
import ManageUsers from './components/admin/ManageUsers';
import RaidSettings from './components/admin/RaidSettings';
import { ThemeProvider } from './context/ThemeContext';
import RaiderRoute from './components/RaiderRoute';

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useUser();
  
  if (isLoading) {
    // Return null or a loading spinner while checking auth state
    return null;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin route wrapper component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useUser();
  
  if (isLoading) {
    // Return null or a loading spinner while checking auth state
    return null;
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <Flex direction="column" minH="100vh" bg="background.primary">
            <Navbar />
            <Box flex="1" bg="background.primary">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route 
                  path="/calendar" 
                  element={
                    <RaiderRoute>
                      <Calendar />
                    </RaiderRoute>
                  } 
                />
                <Route 
                  path="/media" 
                  element={<Media />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/admin">
                  <Route 
                    path="audit-logs" 
                    element={
                      <AdminRoute>
                        <AuditLogs />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="users" 
                    element={
                      <AdminRoute>
                        <ManageUsers />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="raid-settings" 
                    element={
                      <AdminRoute>
                        <RaidSettings />
                      </AdminRoute>
                    } 
                  />
                </Route>
              </Routes>
            </Box>
          </Flex>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
