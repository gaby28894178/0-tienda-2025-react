import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2, Save, Package, Users, ShoppingBag, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebaseConfig';
import { Product } from '../models/Product';
import AdminOrdersPanel from './AdminOrdersPanel';
import './AdminPanel.css';

const AdminPanel = ({ isOpen, onClose }) => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('ordersPanel');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    hoverImage: '',
    gallery: ['', '', '', '']
  });

  useEffect(() => {
    if (isOpen && currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [isOpen, currentUser]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Cargar productos
      const productsData = await Product.getAll();
      setProducts(productsData);

      // Cargar usuarios usando la sintaxis moderna de Firebase v9
      const { collection, getDocs } = await import('firebase/firestore');
      const usersCollectionRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Cargar órdenes usando la sintaxis moderna de Firebase v9
      const ordersCollectionRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersCollectionRef);
      
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    } catch (error) {
      console.error('Error al cargar datos de admin:', error);
      // Mostrar datos básicos si hay error
      setProducts([]);
      setUsers([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        gallery: productForm.gallery.filter(url => url.trim() !== ''),
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        // Actualizar producto existente
        await Product.update(editingProduct.id, productData);
        console.log('✅ Producto actualizado');
      } else {
        // Crear nuevo producto
        await Product.create(productData);
        console.log('✅ Producto creado');
      }

      // Resetear formulario
      resetProductForm();
      await loadAdminData();

    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al guardar el producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      hoverImage: '',
      gallery: ['', '', '', '']
    });
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      hoverImage: product.hoverImage || '',
      gallery: [...(product.gallery || []), '', '', '', ''].slice(0, 4)
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      await Product.delete(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      console.log('✅ Producto eliminado');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar el producto: ' + error.message);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Usar la sintaxis moderna de Firebase v9
      const { doc, updateDoc } = await import('firebase/firestore');
      const orderDocRef = doc(db, 'orders', orderId);
      
      await updateDoc(orderDocRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      console.log('✅ Estado de orden actualizado');
    } catch (error) {
      console.error('Error al actualizar orden:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || currentUser?.role !== 'admin') return null;

  return (
    <AnimatePresence>
      <motion.div
        className="admin-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="admin-modal-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="admin-header">
            <h2>Panel de Administración</h2>
            <button className="admin-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package size={18} />
              Productos ({products.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} />
              Usuarios ({users.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'ordersPanel' ? 'active' : ''}`}
              onClick={() => setActiveTab('ordersPanel')}
            >
              <ClipboardList size={18} />
              Pedidos Recibidos ({orders.length})
            </button>
            <button
              className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingBag size={18} />
              Resumen Rápido
            </button>
       
          </div>

          <div className="admin-content">
            {activeTab === 'products' && (
              <div className="products-admin">
                <div className="admin-section-header">
                  <h3>Gestión de Productos</h3>
                  <div className="header-actions">
                    <button
                      className="add-product-btn"
                      onClick={() => setShowProductForm(true)}
                    >
                      <Plus size={18} />
                      Subir Nuevo Producto
                    </button>
                    <button
                      className="refresh-btn"
                      onClick={loadAdminData}
                      disabled={loading}
                    >
                      {loading ? 'Cargando...' : 'Actualizar Lista'}
                    </button>
                  </div>
                </div>

                <div className="products-stats">
                  <div className="stat-card">
                    <div className="stat-number">{products.length}</div>
                    <div className="stat-label">Total Productos</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{products.filter(p => p.category === 'Premium').length}</div>
                    <div className="stat-label">Premium</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{products.filter(p => p.category === 'Especial').length}</div>
                    <div className="stat-label">Especial</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{products.filter(p => p.category === 'Exclusivo').length}</div>
                    <div className="stat-label">Exclusivo</div>
                  </div>
                </div>

                {showProductForm && (
                  <motion.div
                    className="product-form-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="product-form">
                      <div className="form-header">
                        <h4>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h4>
                        <button
                          className="form-close"
                          onClick={resetProductForm}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleProductSubmit}>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Nombre del Producto *</label>
                            <input
                              type="text"
                              value={productForm.name}
                              onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Precio *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={productForm.price}
                              onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                              required
                            />
                          </div>

                          <div className="form-group full-width">
                            <label>Descripción *</label>
                            <textarea
                              value={productForm.description}
                              onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                              rows="3"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Categoría *</label>
                            <select
                              value={productForm.category}
                              onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                              required
                            >
                              <option value="">Seleccionar categoría</option>
                              <option value="Premium">Premium</option>
                              <option value="Especial">Especial</option>
                              <option value="Exclusivo">Exclusivo</option>
                              <option value="Básico">Básico</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Imagen Principal *</label>
                            <input
                              type="url"
                              value={productForm.image}
                              onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                              placeholder="https://ejemplo.com/imagen.jpg"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Imagen Hover</label>
                            <input
                              type="url"
                              value={productForm.hoverImage}
                              onChange={(e) => setProductForm({...productForm, hoverImage: e.target.value})}
                              placeholder="https://ejemplo.com/imagen-hover.jpg"
                            />
                          </div>

                          <div className="form-group full-width">
                            <label>Galería de Imágenes</label>
                            {productForm.gallery.map((url, index) => (
                              <input
                                key={index}
                                type="url"
                                value={url}
                                onChange={(e) => {
                                  const newGallery = [...productForm.gallery];
                                  newGallery[index] = e.target.value;
                                  setProductForm({...productForm, gallery: newGallery});
                                }}
                                placeholder={`URL de imagen ${index + 1}`}
                                style={{ marginBottom: '0.5rem' }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="form-actions">
                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={resetProductForm}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="save-btn"
                            disabled={loading}
                          >
                            <Save size={18} />
                            {loading ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}

                <div className="products-table">
                  {products.map((product) => (
                    <div key={product.id} className="product-row">
                      <div className="product-image">
                        <img src={product.image} alt={product.name} />
                      </div>
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p>{product.category}</p>
                        <span className="product-price">{formatPrice(product.price)}</span>
                      </div>
                      <div className="product-actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="users-admin">
                <h3>Gestión de Usuarios</h3>
                <div className="users-table">
                  {users.map((user) => (
                    <div key={user.id} className="user-row">
                      <div className="user-info">
                        <h4>{user.displayName || user.email}</h4>
                        <p>{user.email}</p>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </div>
                      <div className="user-stats">
                        <div>Registro: {formatDate(user.createdAt)}</div>
                        {user.lastLogin && (
                          <div>Último acceso: {formatDate(user.lastLogin)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="orders-admin">
                <h3>Gestión de Órdenes</h3>
                <div className="orders-table">
                  {orders.map((order) => (
                    <div key={order.id} className="order-row">
                      <div className="order-info">
                        <h4>Orden #{order.id.slice(-8)}</h4>
                        <p>Cliente: {order.userEmail}</p>
                        <p>Fecha: {formatDate(order.createdAt)}</p>
                        <p>Total: {formatPrice(order.total)}</p>
                        <p>Items: {order.items?.length || 0} productos</p>
                      </div>
                      <div className="order-status-control">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`status-select ${order.status}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="processing">Procesando</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ordersPanel' && (
              <div className="orders-panel-container">
                <AdminOrdersPanel />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminPanel;