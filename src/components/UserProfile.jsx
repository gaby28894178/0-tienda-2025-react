import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Heart, ShoppingBag, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../config/firebaseConfig';
import './UserProfile.css';

const UserProfile = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { favorites, orders: userOrders } = useCart();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [loadingAllOrders, setLoadingAllOrders] = useState(false);
  
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (currentUser && isOpen) {
      loadUserData();
      // Si es admin y está en la pestaña de todos los pedidos, cargar todos los pedidos
      if ((userProfile?.role === 'admin' || currentUser?.role === 'admin') && activeTab === 'allOrders') {
        loadAllOrders();
      }
    }
  }, [currentUser, isOpen, activeTab, userProfile?.role]);

  const loadAllOrders = async () => {
    if (userProfile?.role !== 'admin' && currentUser?.role !== 'admin') return;
    
    setLoadingAllOrders(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      
      // Cargar todos los pedidos de la base de datos
      const ordersCollection = collection(db, 'orders');
      const ordersQuery = query(ordersCollection, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Enriquecer con información del usuario
      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          try {
            const usersCollection = collection(db, 'users');
            const { where } = await import('firebase/firestore');
            const userQuery = query(usersCollection, where('email', '==', order.userEmail));
            const userSnapshot = await getDocs(userQuery);
            
            let userData = { displayName: 'Usuario desconocido', phone: '', address: '' };
            if (!userSnapshot.empty) {
              userData = userSnapshot.docs[0].data();
            }
            
            return {
              ...order,
              userData
            };
          } catch (error) {
            console.error('Error al obtener datos del usuario:', error);
            return {
              ...order,
              userData: { displayName: 'Usuario desconocido', phone: '', address: '' }
            };
          }
        })
      );

      setAllOrders(enrichedOrders);
      console.log(`✅ ${enrichedOrders.length} pedidos de usuarios cargados`);
    } catch (error) {
      console.error('❌ Error al cargar todos los pedidos:', error);
      setAllOrders([]);
    } finally {
      setLoadingAllOrders(false);
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Cargar datos del perfil para edición usando la sintaxis moderna de Firebase v9
      const { doc, getDoc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setEditData({
          firstName: userData.firstName || userProfile?.firstName || '',
          lastName: userData.lastName || userProfile?.lastName || '',
          phone: userData.phone || '',
          address: userData.address || ''
        });
      } else {
        // Si no existe el documento, usar datos del perfil
        setEditData({
          firstName: userProfile?.firstName || '',
          lastName: userProfile?.lastName || '',
          phone: '',
          address: ''
        });
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      // Fallback a datos del perfil
      setEditData({
        firstName: userProfile?.firstName || '',
        lastName: userProfile?.lastName || '',
        phone: '',
        address: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Actualizar perfil usando la sintaxis moderna de Firebase v9
      const { doc, updateDoc } = await import('firebase/firestore');
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userDocRef, {
        firstName: editData.firstName,
        lastName: editData.lastName,
        phone: editData.phone,
        address: editData.address,
        updatedAt: new Date().toISOString()
      });
      
      // Actualizar también el perfil en el contexto de autenticación
      await updateUserProfile({
        firstName: editData.firstName,
        lastName: editData.lastName,
        displayName: `${editData.firstName} ${editData.lastName}`.trim()
      });
      
      setIsEditing(false);
      console.log('✅ Perfil actualizado correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(price);
  };

  const getRoleDisplay = (role) => {
    const roles = {
      admin: { label: 'Administrador', color: '#ff6b35' },
      customer: { label: 'Cliente', color: '#2d5016' }
    };
    return roles[role] || { label: 'Usuario', color: '#666' };
  };

  if (!isOpen || !currentUser) return null;

  return (
    <motion.div
      className="profile-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="profile-modal-content"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={userProfile?.avatar} alt="Avatar" />
          </div>
          <div className="profile-info">
            <h2>{userProfile?.firstName} {userProfile?.lastName}</h2>
            <p className="profile-email">{currentUser.email}</p>
            <div className="profile-role" style={{ color: getRoleDisplay(userProfile?.role || currentUser?.role).color }}>
              <Shield size={16} />
              {getRoleDisplay(userProfile?.role || currentUser?.role).label}
            </div>
          </div>
          <button className="profile-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Perfil
          </button>
          <button
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={18} />
            Favoritos ({favorites.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} />
            {(userProfile?.role === 'admin' || currentUser?.role === 'admin') ? 'Mis Pedidos' : 'Pedidos'} ({userOrders.length})
          </button>
          {(userProfile?.role === 'admin' || currentUser?.role === 'admin') && (
            <button
              className={`tab-btn ${activeTab === 'allOrders' ? 'active' : ''}`}
              onClick={() => setActiveTab('allOrders')}
            >
              <Calendar size={18} />
              Pedidos de Usuarios
            </button>
          )}
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <div className="profile-section">
                <div className="section-header">
                  <h3>Información Personal</h3>
                  <button
                    className="edit-btn"
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    disabled={loading}
                  >
                    {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                    {isEditing ? 'Guardar' : 'Editar'}
                  </button>
                </div>

                <div className="profile-fields">
                  <div className="field-group">
                    <label>Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.firstName}
                        onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                        placeholder="Tu nombre"
                      />
                    ) : (
                      <div className="field-value">{editData.firstName || 'No especificado'}</div>
                    )}
                  </div>

                  <div className="field-group">
                    <label>Apellido</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.lastName}
                        onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                        placeholder="Tu apellido"
                      />
                    ) : (
                      <div className="field-value">{editData.lastName || 'No especificado'}</div>
                    )}
                  </div>

                  <div className="field-group">
                    <label>Email</label>
                    <div className="field-value">
                      <Mail size={16} />
                      {currentUser.email}
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Teléfono</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        placeholder="Tu teléfono"
                      />
                    ) : (
                      <div className="field-value">{editData.phone || 'No especificado'}</div>
                    )}
                  </div>

                  <div className="field-group">
                    <label>Dirección</label>
                    {isEditing ? (
                      <textarea
                        value={editData.address}
                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                        placeholder="Tu dirección"
                        rows="3"
                      />
                    ) : (
                      <div className="field-value">{editData.address || 'No especificado'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="favorites-tab">
              {favorites.length === 0 ? (
                <div className="empty-state">
                  <Heart size={64} />
                  <h3>No tienes favoritos</h3>
                  <p>Agrega productos a tus favoritos para verlos aquí</p>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favorites.map((product) => (
                    <div key={product.id} className="favorite-item">
                      <img src={product.image} alt={product.name} />
                      <div className="favorite-info">
                        <h4>{product.name}</h4>
                        <p className="favorite-price">{formatPrice(product.price)}</p>
                        <p className="favorite-category">{product.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-tab">
              {userOrders.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={64} />
                  <h3>No tienes pedidos</h3>
                  <p>Tus pedidos aparecerán aquí una vez que realices una compra</p>
                </div>
              ) : (
                <div className="orders-list">
                  {userOrders.map((order) => (
                    <div key={order.id} className="order-item">
                      <div className="order-header">
                        <div className="order-id">Pedido #{order.id.slice(-8)}</div>
                        <div className="order-date">{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="order-details">
                        <div className="order-items">
                          {order.items?.map((item, index) => (
                            <span key={index}>
                              {item.name} x{item.quantity}
                              {index < order.items.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                        <div className="order-total">{formatPrice(order.total)}</div>
                      </div>
                      <div className="order-status">
                        <span className={`status-badge ${order.status}`}>
                          {order.status === 'pending' && 'Pendiente'}
                          {order.status === 'processing' && 'Procesando'}
                          {order.status === 'shipped' && 'Enviado'}
                          {order.status === 'delivered' && 'Entregado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'allOrders' && (userProfile?.role === 'admin' || currentUser?.role === 'admin') && (
            <div className="all-orders-tab">
              <div className="section-header">
                <h3>Pedidos de Todos los Usuarios</h3>
                <button
                  className="refresh-btn"
                  onClick={loadAllOrders}
                  disabled={loadingAllOrders}
                >
                  {loadingAllOrders ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>

              {loadingAllOrders ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Cargando pedidos de usuarios...</p>
                </div>
              ) : allOrders.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={64} />
                  <h3>No hay pedidos de usuarios</h3>
                  <p>Los pedidos de los usuarios aparecerán aquí cuando realicen compras</p>
                </div>
              ) : (
                <div className="all-orders-list">
                  {allOrders.map((order) => (
                    <div key={order.id} className="admin-order-item">
                      <div className="admin-order-header">
                        <div className="order-info">
                          <div className="order-id">Pedido #{order.id.slice(-8)}</div>
                          <div className="customer-info">
                            <User size={16} />
                            <span>{order.userData?.displayName || 'Usuario desconocido'}</span>
                            <span className="customer-email">({order.userEmail})</span>
                          </div>
                        </div>
                        <div className="order-date">{formatDate(order.createdAt)}</div>
                      </div>
                      
                      <div className="admin-order-details">
                        <div className="order-items-section">
                          <h4>Productos:</h4>
                          <div className="order-items-list">
                            {order.items?.map((item, index) => (
                              <div key={index} className="order-item-detail">
                                <img 
                                  src={item.image || 'https://via.placeholder.com/40x40?text=Producto'} 
                                  alt={item.name}
                                  className="item-image"
                                />
                                <div className="item-info">
                                  <span className="item-name">{item.name}</span>
                                  <span className="item-quantity">Cantidad: {item.quantity}</span>
                                  <span className="item-price">{formatPrice(item.price)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="order-summary">
                          <div className="customer-details">
                            <h4>Información del Cliente:</h4>
                            <p><strong>Nombre:</strong> {order.userData?.displayName || 'No especificado'}</p>
                            <p><strong>Email:</strong> {order.userEmail}</p>
                            <p><strong>Teléfono:</strong> {order.userData?.phone || 'No especificado'}</p>
                            <p><strong>Dirección:</strong> {order.userData?.address || 'No especificada'}</p>
                          </div>
                          
                          <div className="order-total-section">
                            <div className="order-total-amount">
                              <strong>Total: {formatPrice(order.total || 0)}</strong>
                            </div>
                            <div className="order-status">
                              <span className={`status-badge ${order.status}`}>
                                {order.status === 'pending' && 'Pendiente'}
                                {order.status === 'processing' && 'Procesando'}
                                {order.status === 'shipped' && 'Enviado'}
                                {order.status === 'delivered' && 'Entregado'}
                                {order.status === 'cancelled' && 'Cancelado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfile;