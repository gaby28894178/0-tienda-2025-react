import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, Heart, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = ({ onAuthModalOpen, onCartModalOpen, onProfileOpen, onAdminPanelOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const { getCartItemsCount, favorites } = useCart();
  
  // Variable para verificar si el usuario está autenticado
  const isAuthenticated = !!currentUser;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      onAuthModalOpen();
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>Mi Sitio</h2>
        </div>
        
        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <a href="#inicio" className="navbar-link">Inicio</a>
          <a href="#productos" className="navbar-link">Productos</a>
          <a href="#servicios" className="navbar-link">Servicios</a>
          <a href="#contacto" className="navbar-link">Contacto</a>
        </div>

        <div className="navbar-actions">
          {isAuthenticated && (
            <button className="navbar-icon favorites-btn">
              <Heart size={20} />
              {favorites.length > 0 && (
                <span className="badge">{favorites.length}</span>
              )}
            </button>
          )}
          
          <button className="navbar-icon cart-btn" onClick={onCartModalOpen}>
            <ShoppingCart size={20} />
            {getCartItemsCount() > 0 && (
              <span className="badge">{getCartItemsCount()}</span>
            )}
          </button>
          
          <div className="user-menu-container">
            <button className="navbar-icon user-btn" onClick={handleAuthClick}>
              <User size={20} />
            </button>
            
            {showUserMenu && isAuthenticated && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-avatar">
                    <img 
                      src={userProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || currentUser?.email || 'Usuario')}&background=ff6b35&color=fff&size=128`} 
                      alt="Avatar" 
                    />
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {userProfile?.displayName || 
                       `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 
                       currentUser?.displayName || 
                       currentUser?.email?.split('@')[0] || 
                       'Usuario'}
                    </div>
                    <div className="user-email">{currentUser?.email || userProfile?.email || 'Sin email'}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => {
                  onProfileOpen();
                  setShowUserMenu(false);
                }}>
                  <User size={16} />
                  Mi Perfil
                </button>
                <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <Heart size={16} />
                  Favoritos ({favorites.length})
                </button>
                <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                  <ShoppingCart size={16} />
                  Mis Pedidos
                </button>
                {(currentUser?.role === 'admin' || userProfile?.role === 'admin') && (
                  <>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item admin-item" onClick={() => {
                      onAdminPanelOpen();
                      setShowUserMenu(false);
                    }}>
                      <Settings size={16} />
                      Panel de Admin
                    </button>
                  </>
                )}
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        <button className="navbar-toggle" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;