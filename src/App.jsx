import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import ChatBot from './components/ChatBot';
import AuthModal from './components/AuthModal';
import CartModal from './components/CartModal';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import './App.css';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const handleAuthModalOpen = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
  };

  const handleCartModalOpen = () => {
    setIsCartModalOpen(true);
  };

  const handleCartModalClose = () => {
    setIsCartModalOpen(false);
  };

  const handleProfileOpen = () => {
    setIsProfileOpen(true);
  };

  const handleProfileClose = () => {
    setIsProfileOpen(false);
  };

  const handleAdminPanelOpen = () => {
    setIsAdminPanelOpen(true);
  };

  const handleAdminPanelClose = () => {
    setIsAdminPanelOpen(false);
  };

  const handleAuthRequired = () => {
    handleAuthModalOpen('login');
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="App">
          <Navbar 
            onAuthModalOpen={handleAuthModalOpen}
            onCartModalOpen={handleCartModalOpen}
            onProfileOpen={handleProfileOpen}
            onAdminPanelOpen={handleAdminPanelOpen}
          />
          <Header />
          <ProductGrid onAuthRequired={handleAuthRequired} />
          <ChatBot />
          
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={handleAuthModalClose}
            initialMode={authModalMode}
          />
          
          <CartModal
            isOpen={isCartModalOpen}
            onClose={handleCartModalClose}
          />

          <UserProfile
            isOpen={isProfileOpen}
            onClose={handleProfileClose}
          />

          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={handleAdminPanelClose}
          />

          <Toast />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;